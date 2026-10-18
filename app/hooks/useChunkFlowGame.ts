import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
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

  // Load history & custom questions on mount, resolving progressive curriculum
  useEffect(() => {
    const records = loadPerformanceRecords();
    setHistory(records);
    const initialBankId = loadActiveBankId();
    const isListening = initialBankId === 'toeic-listening';
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

  const refreshMarkedChunks = useCallback(() => {
    const list = loadMarkedChunks();
    setMarkedChunks(list);
    setMarkedChunksCountMap(getMarkedChunksCountMap());
    if (currentQuestion?.id) {
      const forThisQ = list
        .filter((m) => m.questionId === currentQuestion.id)
        .map((m) => m.chunkIndex);
      setMarkedChunkIndices(forThisQ);
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    refreshMarkedChunks();
  }, [currentQuestion?.id, refreshMarkedChunks]);

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
          topic: currentQuestion.trainingId,
          timestamp: Date.now(),
        };
        saveMarkedChunk(newRecord);
      }
      refreshMarkedChunks();
    },
    [currentQuestion, markedChunkIndices, refreshMarkedChunks]
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

  // Filter candidates by activeTrainingId if set
  const activeQuestions = useMemo(() => {
    if (activeTrainingId) {
      const filtered = questions.filter((q) => q.trainingId === activeTrainingId);
      if (filtered.length > 0) return filtered;
    }
    return questions;
  }, [questions, activeTrainingId]);

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
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);

    const isListening = activeBankId === 'toeic-listening';
    if (isListening) {
      blindModeRef.current = true;
      setBlindModeEnabledState(true);
      saveBlindModeEnabled(true);
    }

    let nextQ: Question;
    const { unattemptedQuestions } = computeUnitStatus(activeQuestions, history);
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
      nextQ = selectNextQuestion(activeQuestions, history, currentQuestion.id);
    } else {
      const candidates = activeQuestions.filter((q) => q.id !== currentQuestion.id);
      nextQ = candidates[Math.floor(Math.random() * candidates.length)] || activeQuestions[0];
    }

    const hasSubject = nextQ.chunks.some((c) => c.type === 'subject');
    setRoundStage(!blindModeRef.current && hasSubject && !isListening ? 'subject' : 'classify');

    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [practiceMode, activeQuestions, history, currentQuestion.id, activeBankId, startTimer]);

  // Restart / re-enter current question (re-doing the current question from initial blind state)
  const restartCurrentQuestion = useCallback(() => {
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);

    const isListening = activeBankId === 'toeic-listening';
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
      setActiveBankIdState(bankId);
      saveActiveBankId(bankId);
      clearCustomQuestions();
      const bankQs = getBankQuestions(bankId);
      setQuestions(bankQs);
      const progressive = resolveProgressiveCurriculum(bankQs, history);
      const targetQ = progressive.question;
      setActiveTrainingIdState(progressive.trainingId);
      setCurrentQuestion(targetQ);

      const isListening = bankId === 'toeic-listening';
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
    [history, startTimer]
  );

  const handleSelectTraining = useCallback(
    (trainingId: string | null) => {
      setActiveTrainingIdState(trainingId);
      if (trainingId) {
        const filtered = questions.filter((q) => q.trainingId === trainingId);
        if (filtered.length > 0) {
          const nextQ = getNextQuestionInUnit(filtered, history);
          setCurrentQuestion(nextQ);

          const isListening = activeBankId === 'toeic-listening';
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
    [questions, history, activeBankId, startTimer]
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
    const isListening = activeBankId === 'toeic-listening';
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
  }, [activeBankId, initialQuestions, isSubjectVerbDrill, startTimer]);

  const isCustomBank = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return loadCustomQuestions().length > 0;
  }, [questions]);

  const isListeningMode = activeBankId === 'toeic-listening';

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
    markedChunkIndices,
    markedChunks,
    markedChunksCountMap,
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
    handleResetHistory,
    handleImportQuestions,
    handleResetQuestions,
  };
}
