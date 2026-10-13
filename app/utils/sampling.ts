import type { Question, UserPerformance } from '../types/chunkflow';

export function getQuestionCategory(question: Question): string {
  return `${question.correctAnswers.time}-${question.correctAnswers.voice}`;
}

/**
 * Weakness-weighted dynamic question selection algorithm.
 * Higher sampling probability is assigned to categories with:
 * 1. Lower accuracy percentage
 * 2. Higher reaction latency
 * 3. Unpracticed categories receive a balanced exploratory weight.
 */
export function selectNextQuestion(
  questions: Question[],
  records: UserPerformance[],
  currentQuestionId?: string
): Question {
  if (questions.length === 0) {
    throw new Error('Question bank is empty');
  }

  // Filter out current question if possible to prevent immediate repetition
  const pool =
    questions.length > 1 && currentQuestionId
      ? questions.filter((q) => q.id !== currentQuestionId)
      : questions;

  if (pool.length === 1) {
    return pool[0];
  }

  // Pre-calculate per-category performance
  const categoryStats = new Map<string, { total: number; correct: number; avgLatency: number }>();

  for (const r of records) {
    const existing = categoryStats.get(r.targetCategory) || { total: 0, correct: 0, avgLatency: 0 };
    existing.total += 1;
    if (r.isCorrect) existing.correct += 1;
    existing.avgLatency += r.latencyMs;
    categoryStats.set(r.targetCategory, existing);
  }

  for (const [, stat] of categoryStats.entries()) {
    stat.avgLatency = stat.total > 0 ? stat.avgLatency / stat.total : 0;
  }

  // Calculate sampling weight for each candidate question
  const weights = pool.map((q) => {
    const cat = getQuestionCategory(q);
    const stat = categoryStats.get(cat);

    if (!stat || stat.total === 0) {
      // Unpracticed categories get exploratory priority
      return 1.0;
    }

    const accuracy = stat.correct / stat.total; // 0.0 - 1.0
    // Normalize latency: 1000ms -> 0, 5000ms+ -> 1
    const normalizedLatency = Math.min(Math.max((stat.avgLatency - 1000) / 4000, 0), 1);

    // Weight formula: heavier for low accuracy & high latency
    const weight = (1 - accuracy) * 0.7 + normalizedLatency * 0.3 + 0.15;
    return Math.max(weight, 0.05);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return pool[i];
    }
  }

  return pool[pool.length - 1];
}
