import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Question, TimeChoice, UserPerformance, VoiceChoice } from '../types/chunkflow';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import {
  clearCustomQuestions,
  clearPerformanceRecords,
  computeCategoryStats,
  computeStats,
  loadCustomQuestions,
  loadPerformanceRecords,
  loadSubjectVerbDrill,
  saveCustomQuestions,
  savePerformanceRecord,
  saveSubjectVerbDrill,
} from '../utils/storage';
import { getQuestionCategory, selectNextQuestion } from '../utils/sampling';
import { useFocusFadeTimer } from './useFocusFadeTimer';

export function useChunkFlowGame(initialQuestions: Question[] = STARTER_QUESTIONS) {
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (typeof window !== 'undefined') {
      const custom = loadCustomQuestions();
      if (custom.length > 0) return custom;
    }
    return initialQuestions;
  });
  const [history, setHistory] = useState<UserPerformance[]>([]);
  const [practiceMode, setPracticeMode] = useState<'smart' | 'random'>('smart');

  // Load history & custom questions on mount
  useEffect(() => {
    const records = loadPerformanceRecords();
    setHistory(records);
    const custom = loadCustomQuestions();
    if (custom.length > 0) {
      setQuestions(custom);
      setCurrentQuestion(custom[0]);
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

  const [isSubjectVerbDrill, setIsSubjectVerbDrill] = useState<boolean>(() => {
    return loadSubjectVerbDrill();
  });
  const [roundStage, setRoundStage] = useState<'subject' | 'verb' | 'classify'>(() => {
    const drillEnabled = loadSubjectVerbDrill();
    const hasSubject = initialQuestions[0]?.chunks.some((c) => c.type === 'subject');
    return drillEnabled && hasSubject ? 'subject' : 'classify';
  });
  const [chunkMisfireIndex, setChunkMisfireIndex] = useState<number | null>(null);

  const { focusState, progressPercent, startTimer, stopTimer } = useFocusFadeTimer({
    isPaused: showFeedback,
  });

  // Derived stats
  const stats = useMemo(() => computeStats(history), [history]);
  const categoryStats = useMemo(() => computeCategoryStats(history), [history]);

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
    if (practiceMode === 'smart') {
      nextQ = selectNextQuestion(questions, history, currentQuestion.id);
    } else {
      const candidates = questions.filter((q) => q.id !== currentQuestion.id);
      nextQ = candidates[Math.floor(Math.random() * candidates.length)] || questions[0];
    }

    const hasSubject = nextQ.chunks.some((c) => c.type === 'subject');
    setRoundStage(isSubjectVerbDrill && hasSubject ? 'subject' : 'classify');

    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [practiceMode, questions, history, currentQuestion.id, isSubjectVerbDrill, startTimer]);

  const toggleSubjectVerbDrill = useCallback(() => {
    setIsSubjectVerbDrill((prev) => {
      const next = !prev;
      saveSubjectVerbDrill(next);
      const hasSubject = currentQuestion.chunks.some((c) => c.type === 'subject');
      setRoundStage(next && hasSubject ? 'subject' : 'classify');
      setChunkMisfireIndex(null);
      return next;
    });
  }, [currentQuestion]);

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

  const handleResetQuestions = useCallback(() => {
    clearCustomQuestions();
    setQuestions(initialQuestions);
    const firstQ = initialQuestions[0];
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
  }, [initialQuestions, isSubjectVerbDrill, startTimer]);

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
    history,
    practiceMode,
    isCustomBank,
    isSubjectVerbDrill,
    roundStage,
    chunkMisfireIndex,
    subjectMisfireIndex: chunkMisfireIndex,
    setPracticeMode,
    toggleSubjectVerbDrill,
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
