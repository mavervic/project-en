import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Question, TimeChoice, UserPerformance, VoiceChoice } from '../types/chunkflow';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import { clearPerformanceRecords, computeCategoryStats, computeStats, loadPerformanceRecords, savePerformanceRecord } from '../utils/storage';
import { getQuestionCategory, selectNextQuestion } from '../utils/sampling';
import { useFocusFadeTimer } from './useFocusFadeTimer';

export function useChunkFlowGame(initialQuestions: Question[] = STARTER_QUESTIONS) {
  const [questions] = useState<Question[]>(initialQuestions);
  const [history, setHistory] = useState<UserPerformance[]>([]);
  const [practiceMode, setPracticeMode] = useState<'smart' | 'random'>('smart');

  // Load history on mount
  useEffect(() => {
    const records = loadPerformanceRecords();
    setHistory(records);
  }, []);

  // Pick initial question
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => {
    return questions[0];
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceChoice | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeChoice | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<{ isCorrect: boolean; latencyMs: number } | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Synchronous refs to prevent race conditions or stale closure issues during fast typing
  const selectedVoiceRef = useRef<VoiceChoice | null>(null);
  const selectedTimeRef = useRef<TimeChoice | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

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

    let nextQ: Question;
    if (practiceMode === 'smart') {
      nextQ = selectNextQuestion(questions, history, currentQuestion.id);
    } else {
      const candidates = questions.filter((q) => q.id !== currentQuestion.id);
      nextQ = candidates[Math.floor(Math.random() * candidates.length)] || questions[0];
    }

    setCurrentQuestion(nextQ);
    questionStartTimeRef.current = Date.now();
    startTimer();
  }, [practiceMode, questions, history, currentQuestion.id, startTimer]);

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
      if (showFeedback) return;
      selectedVoiceRef.current = voice;
      setSelectedVoice(voice);

      if (selectedTimeRef.current) {
        checkAnswer(voice, selectedTimeRef.current);
      }
    },
    [showFeedback, checkAnswer]
  );

  const handleSelectTime = useCallback(
    (time: TimeChoice) => {
      if (showFeedback) return;
      selectedTimeRef.current = time;
      setSelectedTime(time);

      if (selectedVoiceRef.current) {
        checkAnswer(selectedVoiceRef.current, time);
      }
    },
    [showFeedback, checkAnswer]
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

  return {
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
    setPracticeMode,
    handleSelectVoice,
    handleSelectTime,
    advanceToNextQuestion,
    handleResetHistory,
  };
}
