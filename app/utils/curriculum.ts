import type { Question, UserPerformance } from '../types/chunkflow';

export type UnitCompletionStatus = 'not-started' | 'in-progress' | 'completed';

export interface UnitCurriculumInfo {
  trainingId: string;
  status: UnitCompletionStatus;
  totalQuestions: number;
  attemptedQuestions: number;
  accuracy: number;
  avgLatencyMs: number;
}

export function computeUnitStatus(
  unitQuestions: Question[],
  history: UserPerformance[]
): {
  status: UnitCompletionStatus;
  attemptedCount: number;
  unattemptedQuestions: Question[];
  accuracy: number;
  avgLatencyMs: number;
} {
  if (unitQuestions.length === 0) {
    return {
      status: 'not-started',
      attemptedCount: 0,
      unattemptedQuestions: [],
      accuracy: 0,
      avgLatencyMs: 0,
    };
  }

  const unitQIds = new Set(unitQuestions.map((q) => q.id));
  const unitHistory = history.filter((r) => unitQIds.has(r.questionId));

  const attemptedQIds = new Set(unitHistory.map((r) => r.questionId));
  const unattempted = unitQuestions.filter((q) => !attemptedQIds.has(q.id));

  let status: UnitCompletionStatus = 'not-started';
  if (attemptedQIds.size === 0) {
    status = 'not-started';
  } else if (attemptedQIds.size >= unitQuestions.length) {
    status = 'completed';
  } else {
    status = 'in-progress';
  }

  const totalAttempts = unitHistory.length;
  const correctAttempts = unitHistory.filter((r) => r.isCorrect).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const totalLatency = unitHistory.reduce((acc, r) => acc + r.latencyMs, 0);
  const avgLatencyMs = totalAttempts > 0 ? Math.round(totalLatency / totalAttempts) : 0;

  return {
    status,
    attemptedCount: attemptedQIds.size,
    unattemptedQuestions: unattempted,
    accuracy,
    avgLatencyMs,
  };
}

export function getNextQuestionInUnit(
  unitQuestions: Question[],
  history: UserPerformance[]
): Question {
  if (unitQuestions.length === 0) {
    throw new Error('Unit has no questions');
  }

  const { unattemptedQuestions } = computeUnitStatus(unitQuestions, history);

  // Resume with the first unattempted question in order
  if (unattemptedQuestions.length > 0) {
    return unattemptedQuestions[0];
  }

  // If all attempted, prioritize question with error or lowest accuracy
  const errorQuestions = unitQuestions.filter((q) => {
    const qAttempts = history.filter((r) => r.questionId === q.id);
    return qAttempts.length > 0 && !qAttempts[qAttempts.length - 1].isCorrect;
  });

  if (errorQuestions.length > 0) {
    return errorQuestions[0];
  }

  return unitQuestions[0];
}

export interface ProgressiveCurriculumResult {
  trainingId: string;
  question: Question;
  status: UnitCompletionStatus;
}

export function resolveProgressiveCurriculum(
  questions: Question[],
  history: UserPerformance[],
  manualTrainingId?: string | null
): ProgressiveCurriculumResult {
  if (questions.length === 0) {
    throw new Error('No questions available in question bank');
  }

  // Group questions by trainingId
  const unitMap = new Map<string, Question[]>();
  for (const q of questions) {
    const tid = q.trainingId || 'default';
    if (!unitMap.has(tid)) {
      unitMap.set(tid, []);
    }
    unitMap.get(tid)!.push(q);
  }

  // If manual training unit is chosen
  if (manualTrainingId && unitMap.has(manualTrainingId)) {
    const unitQs = unitMap.get(manualTrainingId)!;
    const { status } = computeUnitStatus(unitQs, history);
    const nextQ = getNextQuestionInUnit(unitQs, history);
    return {
      trainingId: manualTrainingId,
      question: nextQ,
      status,
    };
  }

  // Calculate status for all units in order
  const unitSummaries: {
    trainingId: string;
    questions: Question[];
    status: UnitCompletionStatus;
    accuracy: number;
    avgLatencyMs: number;
  }[] = [];

  for (const [tid, unitQs] of unitMap.entries()) {
    const info = computeUnitStatus(unitQs, history);
    unitSummaries.push({
      trainingId: tid,
      questions: unitQs,
      status: info.status,
      accuracy: info.accuracy,
      avgLatencyMs: info.avgLatencyMs,
    });
  }

  // Rule 1: If all units are not-started -> select first unit, first question
  const allNotStarted = unitSummaries.every((u) => u.status === 'not-started');
  if (allNotStarted) {
    const firstUnit = unitSummaries[0];
    return {
      trainingId: firstUnit.trainingId,
      question: firstUnit.questions[0],
      status: 'not-started',
    };
  }

  // Rule 2: If an in-progress unit exists -> resume first in-progress unit
  const inProgressUnit = unitSummaries.find((u) => u.status === 'in-progress');
  if (inProgressUnit) {
    const nextQ = getNextQuestionInUnit(inProgressUnit.questions, history);
    return {
      trainingId: inProgressUnit.trainingId,
      question: nextQ,
      status: 'in-progress',
    };
  }

  // Rule 3: If no in-progress unit, but unstarted units remain -> pick next unstarted unit
  const unstartedUnit = unitSummaries.find((u) => u.status === 'not-started');
  if (unstartedUnit) {
    return {
      trainingId: unstartedUnit.trainingId,
      question: unstartedUnit.questions[0],
      status: 'not-started',
    };
  }

  // Rule 4: If all units completed -> pick the weakest unit (lowest accuracy, highest latency)
  const sortedByWeakness = [...unitSummaries].sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    return b.avgLatencyMs - a.avgLatencyMs;
  });

  const weakestUnit = sortedByWeakness[0] || unitSummaries[0];
  const nextQ = getNextQuestionInUnit(weakestUnit.questions, history);

  return {
    trainingId: weakestUnit.trainingId,
    question: nextQ,
    status: 'completed',
  };
}
