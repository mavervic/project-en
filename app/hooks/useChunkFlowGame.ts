import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
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
  clearPerformanceRecords,
  computeCategoryStats,
  computeStats,
  computeTrainingTelemetry,
  loadActiveBankId,
  loadCustomQuestions,
  loadPerformanceRecords,
  saveActiveBankId,
  saveCustomQuestions,
  savePerformanceRecord,
} from '../utils/storage';
import { getQuestionCategory, selectNextQuestion } from '../utils/sampling';
import {
  computeUnitStatus,
  getNextQuestionInUnit,
  resolveProgressiveCurriculum,
} from '../utils/curriculum';
import { useFocusFadeTimer } from './useFocusFadeTimer';

export function useChunkFlowGame(initialQuestions?: Question[]) {
  const [activeBankId, setActiveBankIdState] = useState<string>(() => loadActiveBankId());
  const [activeTrainingId, setActiveTrainingIdState] = useState<string | null>(null);

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
    const custom = loadCustomQuestions();
    const activeQs = custom.length > 0 ? custom : questions;
    if (custom.length > 0) {
      setQuestions(custom);
    }
    try {
      const progressive = resolveProgressiveCurriculum(activeQs, records, activeTrainingId);
      setCurrentQuestion(progressive.question);
      if (!activeTrainingId && progressive.trainingId) {
        setActiveTrainingIdState(progressive.trainingId);
      }
    } catch {
      // Fallback to first question
      if (activeQs[0]) {
        setCurrentQuestion(activeQs[0]);
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
    const hasSubject = questions[0]?.chunks.some((c) => c.type === 'subject');
    return hasSubject ? 'subject' : 'classify';
  });
  const [chunkMisfireIndex, setChunkMisfireIndex] = useState<number | null>(null);

  const { focusState, progressPercent, startTimer, stopTimer } = useFocusFadeTimer({
    isPaused: showFeedback,
  });

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

  // Advance to next question
  const advanceToNextQuestion = useCallback(() => {
    selectedVoiceRef.current = null;
    selectedTimeRef.current = null;
    setSelectedVoice(null);
    setSelectedTime(null);
    setLastEvaluation(null);
    setShowFeedback(false);
    setChunkMisfireIndex(null);

    let nextQ: Question;
    const { unattemptedQuestions } = computeUnitStatus(activeQuestions, history);
    const unattemptedRemaining = unattemptedQuestions.filter((q) => q.id !== currentQuestion.id);

    if (unattemptedRemaining.length > 0) {
      nextQ = unattemptedRemaining[0];
    } else if (practiceMode === 'smart') {
      nextQ = selectNextQuestion(activeQuestions, history, currentQuestion.id);
    } else {
      const candidates = activeQuestions.filter((q) => q.id !== currentQuestion.id);
      nextQ = candidates[Math.floor(Math.random() * candidates.length)] || activeQuestions[0];
    }

    const hasSubject = nextQ.chunks.some((c) => c.type === 'subject');
    setRoundStage(hasSubject ? 'subject' : 'classify');

    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [practiceMode, activeQuestions, history, currentQuestion.id, startTimer]);

  const handleSelectChunk = useCallback(
    (chunkIndex: number) => {
      if (showFeedback) return;
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
      setRoundStage(isSubjectVerbDrill && hasSubject ? 'subject' : 'classify');
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

      selectedVoiceRef.current = null;
      selectedTimeRef.current = null;
      setSelectedVoice(null);
      setSelectedTime(null);
      setLastEvaluation(null);
      setShowFeedback(false);
      setChunkMisfireIndex(null);
      const hasSubject = targetQ?.chunks.some((c) => c.type === 'subject');
      setRoundStage(hasSubject ? 'subject' : 'classify');
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
          selectedVoiceRef.current = null;
          selectedTimeRef.current = null;
          setSelectedVoice(null);
          setSelectedTime(null);
          setLastEvaluation(null);
          setShowFeedback(false);
          setChunkMisfireIndex(null);
          const hasSubject = nextQ?.chunks.some((c) => c.type === 'subject');
          setRoundStage(hasSubject ? 'subject' : 'classify');
          questionStartTimeRef.current = Date.now();
          startTimer();
        }
      }
    },
    [questions, history, startTimer]
  );

  const handleResetQuestions = useCallback(() => {
    clearCustomQuestions();
    const defaultQs =
      initialQuestions && initialQuestions.length > 0
        ? initialQuestions
        : getBankQuestions(activeBankId);
    setQuestions(defaultQs);
    const firstQ = defaultQs[0];
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
    setRoundStage(isSubjectVerbDrill && hasSubject ? 'subject' : 'classify');
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [activeBankId, initialQuestions, isSubjectVerbDrill, startTimer]);

  const isCustomBank = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return loadCustomQuestions().length > 0;
  }, [questions]);

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
    roundStage,
    chunkMisfireIndex,
    subjectMisfireIndex: chunkMisfireIndex,
    activeBankId,
    activeTrainingId,
    setPracticeMode,
    handleSelectBank,
    handleSelectTraining,
    handleSelectChunk,
    handleSelectSubjectChunk,
    handleSelectVoice,
    handleSelectTime,
    advanceToNextQuestion,
    handleResetHistory,
    handleImportQuestions,
    handleResetQuestions,
  };
}
