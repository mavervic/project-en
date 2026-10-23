import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  ListeningObstacle,
  MarkedChunkRecord,
  Question,
  TimeChoice,
  TrainingUnitTelemetry,
  UserPerformance,
  VoiceChoice,
} from '../types/chunkflow';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import { getBankQuestions } from '../data/banks';
import {
  clearCustomQuestions,
  clearMarkedChunks,
  clearPerformanceRecords,
  computeCategoryStats,
  computeStats,
  computeTrainingTelemetry,
  getMarkedChunksCountMap,
  loadActiveBankId,
  loadBlindModeEnabled,
  loadCustomQuestions,
  loadMarkedChunks,
  loadPerformanceRecords,
  removeMarkedChunk,
  saveActiveBankId,
  saveAllMarkedChunks,
  saveBlindModeEnabled,
  saveCustomQuestions,
  saveMarkedChunk,
  savePerformanceRecord,
} from '../utils/storage';
import { constrainedShuffle, getQuestionCategory, selectNextQuestion } from '../utils/sampling';
import {
  computeUnitStatus,
  getNextQuestionInUnit,
  resolveProgressiveCurriculum,
} from '../utils/curriculum';
import { useFocusFadeTimer } from './useFocusFadeTimer';

export function useChunkFlowGame(initialQuestions?: Question[]) {
  const [activeBankId, setActiveBankIdState] = useState<string>(() => loadActiveBankId());
  const [activeTrainingId, setActiveTrainingIdState] = useState<string | null>(null);
  const [blindModeEnabled, setBlindModeEnabledState] = useState<boolean>(() =>
    loadBlindModeEnabled()
  );
  const blindModeRef = useRef<boolean>(blindModeEnabled);
  const [isBlindSpotReviewMode, setIsBlindSpotReviewMode] = useState<boolean>(false);

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions;
    }
    if (typeof window !== 'undefined') {
      const custom = loadCustomQuestions();
      if (custom.length > 0) return custom;
      const bankId = loadActiveBankId();
      return getBankQuestions(bankId);
    }
    return getBankQuestions('parker');
  });
  const [history, setHistory] = useState<UserPerformance[]>([]);
  const [practiceMode, setPracticeMode] = useState<'smart' | 'random'>('smart');

  const isListeningBank = useCallback(
    (id?: string | null) => id === 'toeic-listening' || id === 'parker',
    []
  );

  // Load history & custom questions on mount, resolving progressive curriculum
  useEffect(() => {
    const records = loadPerformanceRecords();
    setHistory(records);
    const initialBankId = loadActiveBankId();
    const isListening = isListeningBank(initialBankId);
    const initialBlind = isListening ? true : loadBlindModeEnabled();
    blindModeRef.current = initialBlind;
    setBlindModeEnabledState(initialBlind);
    if (isListening) {
      saveBlindModeEnabled(true);
    }
    const custom = loadCustomQuestions();
    const activeQs = custom.length > 0 ? custom : questions;
    if (custom.length > 0) {
      setQuestions(custom);
    }
    try {
      const progressive = resolveProgressiveCurriculum(activeQs, records, activeTrainingId);
      setCurrentQuestion(progressive.question);
      const hasSubject = progressive.question?.chunks.some((c) => c.type === 'subject');
      setRoundStage(!initialBlind && hasSubject && !isListening ? 'subject' : 'classify');
      if (!activeTrainingId && progressive.trainingId) {
        setActiveTrainingIdState(progressive.trainingId);
      }
    } catch {
      // Fallback to first question
      if (activeQs[0]) {
        setCurrentQuestion(activeQs[0]);
        const hasSubject = activeQs[0]?.chunks.some((c) => c.type === 'subject');
        setRoundStage(!initialBlind && hasSubject && !isListening ? 'subject' : 'classify');
      }
    }
  }, []);

  // Pick initial question
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => {
    return questions[0];
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceChoice | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeChoice | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<{
    isCorrect: boolean;
    latencyMs: number;
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Synchronous refs to prevent race conditions or stale closure issues during fast typing
  const selectedVoiceRef = useRef<VoiceChoice | null>(null);
  const selectedTimeRef = useRef<TimeChoice | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const isSubjectVerbDrill = true;
  const [roundStage, setRoundStage] = useState<'subject' | 'verb' | 'classify'>(() => {
    if (loadBlindModeEnabled()) return 'classify';
    const hasSubject = questions[0]?.chunks.some((c) => c.type === 'subject');
    return hasSubject ? 'subject' : 'classify';
  });
  const [chunkMisfireIndex, setChunkMisfireIndex] = useState<number | null>(null);

  const { focusState, progressPercent, startTimer, stopTimer } = useFocusFadeTimer({
    isPaused: showFeedback,
  });

  const [markedChunkIndices, setMarkedChunkIndices] = useState<number[]>([]);
  const [markedChunks, setMarkedChunks] = useState<MarkedChunkRecord[]>(() => loadMarkedChunks());
  const [markedChunksCountMap, setMarkedChunksCountMap] = useState<Record<string, number>>(() =>
    getMarkedChunksCountMap()
  );
  const [currentQuestionObstacles, setCurrentQuestionObstacles] = useState<ListeningObstacle[]>([]);

  const refreshMarkedChunks = useCallback(() => {
    const list = loadMarkedChunks();
    setMarkedChunks(list);
    setMarkedChunksCountMap(getMarkedChunksCountMap());
    if (currentQuestion?.id) {
      const forThisQ = list.filter((m) => m.questionId === currentQuestion.id);
      setMarkedChunkIndices(forThisQ.map((m) => m.chunkIndex));
      const existingObstacles = forThisQ.find(
        (m) => m.obstacles && m.obstacles.length > 0
      )?.obstacles;
      if (existingObstacles) {
        setCurrentQuestionObstacles(existingObstacles);
      } else {
        setCurrentQuestionObstacles([]);
      }
    } else {
      setCurrentQuestionObstacles([]);
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    refreshMarkedChunks();
  }, [currentQuestion?.id, refreshMarkedChunks]);

  const handleToggleObstacle = useCallback(
    (obstacle: ListeningObstacle) => {
      setCurrentQuestionObstacles((prev) => {
        const next = prev.includes(obstacle)
          ? prev.filter((o) => o !== obstacle)
          : [...prev, obstacle];

        if (currentQuestion?.id) {
          const list = loadMarkedChunks();
          let changed = false;
          const updated = list.map((record) => {
            if (record.questionId === currentQuestion.id) {
              changed = true;
              return {
                ...record,
                obstacles: next.length > 0 ? next : undefined,
              };
            }
            return record;
          });
          if (changed) {
            saveAllMarkedChunks(updated);
            setMarkedChunks(updated);
          }
        }
        return next;
      });
    },
    [currentQuestion?.id]
  );

  const handleToggleMarkChunk = useCallback(
    (chunkIndex: number) => {
      if (!currentQuestion) return;
      const chunk = currentQuestion.chunks[chunkIndex];
      if (!chunk) return;

      const recordId = `${currentQuestion.id}-${chunkIndex}`;
      const isAlreadyMarked = markedChunkIndices.includes(chunkIndex);

      if (isAlreadyMarked) {
        removeMarkedChunk(recordId);
      } else {
        const newRecord: MarkedChunkRecord = {
          id: recordId,
          questionId: currentQuestion.id,
          trainingId: currentQuestion.trainingId || 'unknown',
          chunkText: chunk.text,
          chunkIndex,
          sentence: currentQuestion.sentence,
          translation: currentQuestion.translation,
          topic: currentQuestion.topic || currentQuestion.trainingId,
          obstacles:
            currentQuestionObstacles.length > 0 ? [...currentQuestionObstacles] : undefined,
          timestamp: Date.now(),
        };
        saveMarkedChunk(newRecord);
      }
      refreshMarkedChunks();
    },
    [currentQuestion, currentQuestionObstacles, markedChunkIndices, refreshMarkedChunks]
  );

  const handleRemoveMarkedChunk = useCallback(
    (id: string) => {
      removeMarkedChunk(id);
      refreshMarkedChunks();
    },
    [refreshMarkedChunks]
  );

  const handleClearMarkedChunks = useCallback(() => {
    clearMarkedChunks();
    refreshMarkedChunks();
  }, [refreshMarkedChunks]);

  // Derived stats
  const stats = useMemo(() => computeStats(history), [history]);
  const categoryStats = useMemo(() => computeCategoryStats(history), [history]);
  const trainingTelemetry = useMemo(
    () => computeTrainingTelemetry(history, questions),
    [history, questions]
  );

  const getAllListeningQuestions = useCallback((): Question[] => {
    const toeic = getBankQuestions('toeic-listening');
    const parker = getBankQuestions('parker');
    const map = new Map<string, Question>();
    for (const q of [...toeic, ...parker, ...questions]) {
      if (q && q.id && !map.has(q.id)) {
        map.set(q.id, q);
      }
    }
    return Array.from(map.values());
  }, [questions]);

  // Filter candidates by activeTrainingId or blind-spot review mode
  const activeQuestions = useMemo(() => {
    if (isBlindSpotReviewMode) {
      const markedQIds = new Set(markedChunks.map((m) => m.questionId));
      const pool = getAllListeningQuestions();
      const filtered = pool.filter((q) => markedQIds.has(q.id));
      if (filtered.length > 0) return filtered;
    }
    if (activeTrainingId) {
      const filtered = questions.filter((q) => q.trainingId === activeTrainingId);
      if (filtered.length > 0) return filtered;
    }
    return questions;
  }, [isBlindSpotReviewMode, markedChunks, getAllListeningQuestions, activeTrainingId, questions]);

  const toggleBlindMode = useCallback((): boolean => {
    const next = !blindModeRef.current;
    blindModeRef.current = next;
    setBlindModeEnabledState(next);
    saveBlindModeEnabled(next);
    setChunkMisfireIndex(null);
    if (!showFeedback) {
      const hasSubject = currentQuestion?.chunks.some((c) => c.type === 'subject');
      setRoundStage(!next && hasSubject ? 'subject' : 'classify');
    }
    return next;
  }, [showFeedback, currentQuestion]);

  // Advance to next question
  const advanceToNextQuestion = useCallback(() => {
    const isListening = isListeningBank(activeBankId) || isBlindSpotReviewMode;
    let currentHistory = history;

    if (isListening && showFeedback && currentQuestion?.id) {
      const endTime = Date.now();
      const latencyMs = Math.max(80, endTime - questionStartTimeRef.current);
      const record: UserPerformance = {
        questionId: currentQuestion.id,
        latencyMs,
        isCorrect: true,
        timestamp: endTime,
        targetCategory: getQuestionCategory(currentQuestion),
      };
      currentHistory = savePerformanceRecord(record);
      setHistory(currentHistory);
    }

    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);

    if (isListening) {
      blindModeRef.current = true;
      setBlindModeEnabledState(true);
      saveBlindModeEnabled(true);
    }

    let nextQ: Question;
    if (isBlindSpotReviewMode) {
      const markedQIds = new Set(markedChunks.map((m) => m.questionId));
      const pool = getAllListeningQuestions();
      const candidates = pool.filter((q) => markedQIds.has(q.id));
      const remaining = candidates.filter((q) => q.id !== currentQuestion.id);
      nextQ = remaining.length > 0 ? remaining[0] : candidates[0] || currentQuestion;
    } else {
      const { unattemptedQuestions } = computeUnitStatus(activeQuestions, currentHistory);
      const unattemptedRemaining = unattemptedQuestions.filter((q) => q.id !== currentQuestion.id);

      if (unattemptedRemaining.length > 0) {
        const prevCategory = getQuestionCategory(currentQuestion);
        const shuffled = constrainedShuffle(
          unattemptedRemaining,
          (q) => getQuestionCategory(q),
          prevCategory
        );
        nextQ = shuffled[0];
      } else if (practiceMode === 'smart') {
        nextQ = selectNextQuestion(activeQuestions, currentHistory, currentQuestion.id);
      } else {
        const candidates = activeQuestions.filter((q) => q.id !== currentQuestion.id);
        nextQ = candidates[Math.floor(Math.random() * candidates.length)] || activeQuestions[0];
      }
    }

    const hasSubject = nextQ.chunks.some((c) => c.type === 'subject');
    setRoundStage(!blindModeRef.current && hasSubject && !isListening ? 'subject' : 'classify');

    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [
    practiceMode,
    activeQuestions,
    history,
    currentQuestion,
    activeBankId,
    startTimer,
    showFeedback,
    isListeningBank,
    isBlindSpotReviewMode,
    markedChunks,
    getAllListeningQuestions,
  ]);

  // Restart / re-enter current question (re-doing the current question from initial blind state)
  const restartCurrentQuestion = useCallback(() => {
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);

    const isListening = isListeningBank(activeBankId);
    if (isListening) {
      blindModeRef.current = true;
      setBlindModeEnabledState(true);
      saveBlindModeEnabled(true);
    }

    const hasSubject = currentQuestion?.chunks.some((c) => c.type === 'subject');
    setRoundStage(!blindModeRef.current && hasSubject && !isListening ? 'subject' : 'classify');

    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [activeBankId, currentQuestion, startTimer]);

  const startBlindSpotReview = useCallback((): boolean => {
    const currentMarked = loadMarkedChunks();
    if (currentMarked.length === 0) {
      return false;
    }
    const markedQIds = new Set(currentMarked.map((m) => m.questionId));
    const pool = getAllListeningQuestions();
    const candidateQs = pool.filter((q) => markedQIds.has(q.id));
    if (candidateQs.length === 0) {
      return false;
    }

    setIsBlindSpotReviewMode(true);
    blindModeRef.current = true;
    setBlindModeEnabledState(true);
    saveBlindModeEnabled(true);

    const firstQ = candidateQs[0];
    setCurrentQuestion(firstQ);

    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);
    setRoundStage('classify');
    questionStartTimeRef.current = Date.now();
    startTimer();
    return true;
  }, [getAllListeningQuestions, startTimer]);

  const exitBlindSpotReview = useCallback(() => {
    setIsBlindSpotReviewMode(false);
    const bankQs = getBankQuestions(activeBankId);
    setQuestions(bankQs);
    const progressive = resolveProgressiveCurriculum(bankQs, history, activeTrainingId);
    const nextQ = progressive.question || bankQs[0];
    setCurrentQuestion(nextQ);

    const isListening = isListeningBank(activeBankId);
    const targetBlind = isListening ? true : loadBlindModeEnabled();
    blindModeRef.current = targetBlind;
    setBlindModeEnabledState(targetBlind);

    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);
    const hasSubject = nextQ?.chunks.some((c) => c.type === 'subject');
    setRoundStage(!targetBlind && hasSubject && !isListening ? 'subject' : 'classify');
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [activeBankId, activeTrainingId, history, isListeningBank, startTimer]);

  const handleMasterChunk = useCallback(
    (chunkId?: string) => {
      if (chunkId) {
        removeMarkedChunk(chunkId);
      } else if (currentQuestion?.id) {
        const list = loadMarkedChunks();
        const forThisQ = list.filter((m) => m.questionId === currentQuestion.id);
        forThisQ.forEach((m) => removeMarkedChunk(m.id));
      }

      const updatedMarked = loadMarkedChunks();
      setMarkedChunks(updatedMarked);
      setMarkedChunksCountMap(getMarkedChunksCountMap());

      if (isBlindSpotReviewMode) {
        const remainingQIds = new Set(updatedMarked.map((m) => m.questionId));
        if (remainingQIds.size === 0) {
          setMarkedChunkIndices([]);
          return;
        }

        const allListening = getAllListeningQuestions();
        const remainingQs = allListening.filter(
          (q) => remainingQIds.has(q.id) && q.id !== currentQuestion?.id
        );
        const nextQ =
          remainingQs.length > 0
            ? remainingQs[0]
            : allListening.find((q) => remainingQIds.has(q.id));

        if (nextQ) {
          setCurrentQuestion(nextQ);
          selectedVoiceRef.current = null;
          selectedTimeRef.current = null;
          setSelectedVoice(null);
          setSelectedTime(null);
          setLastEvaluation(null);
          setShowFeedback(false);
          setChunkMisfireIndex(null);
          blindModeRef.current = true;
          setBlindModeEnabledState(true);
          setRoundStage('classify');
          questionStartTimeRef.current = Date.now();
          startTimer();
        }
      } else {
        refreshMarkedChunks();
      }
    },
    [
      currentQuestion?.id,
      isBlindSpotReviewMode,
      getAllListeningQuestions,
      startTimer,
      refreshMarkedChunks,
    ]
  );

  const handleSelectChunk = useCallback(
    (chunkIndex: number) => {
      if (showFeedback || blindModeRef.current) return;
      const chunk = currentQuestion.chunks[chunkIndex];
      if (!chunk) return;

      if (roundStage === 'subject') {
        if (chunk.type === 'subject') {
          setChunkMisfireIndex(null);
          setRoundStage('verb');
        } else {
          setChunkMisfireIndex(chunkIndex);
          setTimeout(() => {
            setChunkMisfireIndex((curr) => (curr === chunkIndex ? null : curr));
          }, 800);
        }
      } else if (roundStage === 'verb') {
        if (chunk.isTargetSlot || chunk.type === 'verb') {
          setChunkMisfireIndex(null);
          setRoundStage('classify');
        } else {
          setChunkMisfireIndex(chunkIndex);
          setTimeout(() => {
            setChunkMisfireIndex((curr) => (curr === chunkIndex ? null : curr));
          }, 800);
        }
      }
    },
    [roundStage, showFeedback, currentQuestion]
  );

  const handleSelectSubjectChunk = handleSelectChunk;

  // Evaluation trigger when both voice and time are present
  const checkAnswer = useCallback(
    (voice: VoiceChoice, time: TimeChoice) => {
      stopTimer();
      const endTime = Date.now();
      const latencyMs = Math.max(80, endTime - questionStartTimeRef.current);
      const isCorrect =
        voice === currentQuestion.correctAnswers.voice &&
        time === currentQuestion.correctAnswers.time;

      const record: UserPerformance = {
        questionId: currentQuestion.id,
        latencyMs,
        isCorrect,
        timestamp: endTime,
        targetCategory: getQuestionCategory(currentQuestion),
      };

      const updatedHistory = savePerformanceRecord(record);
      setHistory(updatedHistory);
      setLastEvaluation({ isCorrect, latencyMs });
      setShowFeedback(true);
    },
    [currentQuestion, stopTimer]
  );

  const handleSelectVoice = useCallback(
    (voice: VoiceChoice) => {
      if (showFeedback || (isSubjectVerbDrill && roundStage !== 'classify')) return;
      selectedVoiceRef.current = voice;
      setSelectedVoice(voice);

      if (selectedTimeRef.current) {
        checkAnswer(voice, selectedTimeRef.current);
      }
    },
    [showFeedback, isSubjectVerbDrill, roundStage, checkAnswer]
  );

  const handleSelectTime = useCallback(
    (time: TimeChoice) => {
      if (showFeedback || (isSubjectVerbDrill && roundStage !== 'classify')) return;
      selectedTimeRef.current = time;
      setSelectedTime(time);

      if (selectedVoiceRef.current) {
        checkAnswer(selectedVoiceRef.current, time);
      }
    },
    [showFeedback, isSubjectVerbDrill, roundStage, checkAnswer]
  );

  const handleResetHistory = useCallback(() => {
    clearPerformanceRecords();
    setHistory([]);
    setLastEvaluation(null);
    setShowFeedback(false);
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [startTimer]);

  const handleImportQuestions = useCallback(
    (newQuestions: Question[], mode: 'append' | 'replace') => {
      let updated: Question[];
      if (mode === 'append') {
        const existingIds = new Set(questions.map((q) => q.id));
        const filtered = newQuestions.filter((q) => !existingIds.has(q.id));
        updated = [...questions, ...filtered];
      } else {
        updated = newQuestions;
      }
      saveCustomQuestions(updated);
      setQuestions(updated);
      const firstQ = updated[0];
      setCurrentQuestion(firstQ);

      // Reset turn state
      selectedVoiceRef.current = null;
      selectedTimeRef.current = null;
      setSelectedVoice(null);
      setSelectedTime(null);
      setLastEvaluation(null);
      setShowFeedback(false);
      setChunkMisfireIndex(null);
      const hasSubject = firstQ?.chunks.some((c) => c.type === 'subject');
      setRoundStage(
        !blindModeRef.current && isSubjectVerbDrill && hasSubject ? 'subject' : 'classify'
      );
      questionStartTimeRef.current = Date.now();
      startTimer();
    },
    [questions, isSubjectVerbDrill, startTimer]
  );

  const handleSelectBank = useCallback(
    (bankId: string) => {
      setIsBlindSpotReviewMode(false);
      setActiveBankIdState(bankId);
      saveActiveBankId(bankId);
      clearCustomQuestions();
      const bankQs = getBankQuestions(bankId);
      setQuestions(bankQs);
      const progressive = resolveProgressiveCurriculum(bankQs, history);
      const targetQ = progressive.question;
      setActiveTrainingIdState(progressive.trainingId);
      setCurrentQuestion(targetQ);

      const isListening = isListeningBank(bankId);
      if (isListening) {
        blindModeRef.current = true;
        setBlindModeEnabledState(true);
        saveBlindModeEnabled(true);
      }

      selectedVoiceRef.current = null;
      selectedTimeRef.current = null;
      setSelectedVoice(null);
      setSelectedTime(null);
      setLastEvaluation(null);
      setShowFeedback(false);
      setChunkMisfireIndex(null);
      const hasSubject = targetQ?.chunks.some((c) => c.type === 'subject');
      setRoundStage(!blindModeRef.current && hasSubject && !isListening ? 'subject' : 'classify');
      questionStartTimeRef.current = Date.now();
      startTimer();
    },
    [history, isListeningBank, startTimer]
  );

  const handleSelectTraining = useCallback(
    (trainingId: string | null) => {
      setIsBlindSpotReviewMode(false);
      setActiveTrainingIdState(trainingId);
      if (trainingId) {
        const filtered = questions.filter((q) => q.trainingId === trainingId);
        if (filtered.length > 0) {
          const nextQ = getNextQuestionInUnit(filtered, history);
          setCurrentQuestion(nextQ);

          const isListening = isListeningBank(activeBankId);
          if (isListening) {
            blindModeRef.current = true;
            setBlindModeEnabledState(true);
            saveBlindModeEnabled(true);
          }

          selectedVoiceRef.current = null;
          selectedTimeRef.current = null;
          setSelectedVoice(null);
          setSelectedTime(null);
          setLastEvaluation(null);
          setShowFeedback(false);
          setChunkMisfireIndex(null);
          const hasSubject = nextQ?.chunks.some((c) => c.type === 'subject');
          setRoundStage(
            !blindModeRef.current && hasSubject && !isListening ? 'subject' : 'classify'
          );
          questionStartTimeRef.current = Date.now();
          startTimer();
        }
      }
    },
    [questions, history, activeBankId, isListeningBank, startTimer]
  );

  const handleResetQuestions = useCallback(() => {
    clearCustomQuestions();
    const defaultQs =
      initialQuestions && initialQuestions.length > 0
        ? initialQuestions
        : getBankQuestions(activeBankId);
    setQuestions(defaultQs);
    const progressive = resolveProgressiveCurriculum(defaultQs, []);
    const firstQ = progressive.question || defaultQs[0];
    setCurrentQuestion(firstQ);

    // Reset turn state
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);
    const isListening = isListeningBank(activeBankId);
    if (isListening) {
      blindModeRef.current = true;
      setBlindModeEnabledState(true);
      saveBlindModeEnabled(true);
    }
    const hasSubject = firstQ?.chunks.some((c) => c.type === 'subject');
    setRoundStage(
      !blindModeRef.current && isSubjectVerbDrill && hasSubject && !isListening
        ? 'subject'
        : 'classify'
    );
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [activeBankId, initialQuestions, isListeningBank, isSubjectVerbDrill, startTimer]);

  const isCustomBank = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return loadCustomQuestions().length > 0;
  }, [questions]);

  const isListeningMode = isListeningBank(activeBankId) || isBlindSpotReviewMode;

  const handleListeningNarrationComplete = useCallback(() => {
    setShowFeedback(true);
  }, []);

  return {
    questions,
    currentQuestion,
    selectedVoice,
    selectedTime,
    lastEvaluation,
    showFeedback,
    focusState,
    progressPercent,
    stats,
    categoryStats,
    trainingTelemetry,
    history,
    practiceMode,
    isCustomBank,
    isSubjectVerbDrill,
    blindModeEnabled,
    roundStage,
    chunkMisfireIndex,
    subjectMisfireIndex: chunkMisfireIndex,
    activeBankId,
    activeTrainingId,
    isListeningMode,
    isBlindSpotReviewMode,
    markedChunkIndices,
    markedChunks,
    markedChunksCountMap,
    activeObstacles: currentQuestionObstacles,
    handleToggleObstacle,
    handleToggleMarkChunk,
    handleRemoveMarkedChunk,
    handleClearMarkedChunks,
    handleListeningNarrationComplete,
    setPracticeMode,
    toggleBlindMode,
    handleSelectBank,
    handleSelectTraining,
    handleSelectChunk,
    handleSelectSubjectChunk,
    handleSelectVoice,
    handleSelectTime,
    advanceToNextQuestion,
    restartCurrentQuestion,
    startBlindSpotReview,
    exitBlindSpotReview,
    handleMasterChunk,
    handleResetHistory,
    handleImportQuestions,
    handleResetQuestions,
  };
}
