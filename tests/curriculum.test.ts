import { describe, it, expect } from 'vitest';
import {
  computeUnitStatus,
  getNextQuestionInUnit,
  getUnattemptedDeck,
  resolveProgressiveCurriculum,
} from '../app/utils/curriculum';
import { getQuestionCategory } from '../app/utils/sampling';
import { TOEIC_PART5_LEVEL1_QUESTIONS } from '../app/data/toeic-part5';
import type { Question, UserPerformance } from '../app/types/chunkflow';

describe('Progressive Curriculum Selection with Constrained Shuffle', () => {
  it('correctly reports unit status and unattempted questions', () => {
    const questions = TOEIC_PART5_LEVEL1_QUESTIONS.slice(0, 5);
    const history: UserPerformance[] = [];

    const status1 = computeUnitStatus(questions, history);
    expect(status1.status).toBe('not-started');
    expect(status1.attemptedCount).toBe(0);
    expect(status1.unattemptedQuestions).toHaveLength(5);

    // After 2 attempts
    history.push({
      questionId: questions[0].id,
      latencyMs: 1200,
      isCorrect: true,
      timestamp: Date.now(),
      targetCategory: getQuestionCategory(questions[0]),
    });
    history.push({
      questionId: questions[1].id,
      latencyMs: 1500,
      isCorrect: true,
      timestamp: Date.now(),
      targetCategory: getQuestionCategory(questions[1]),
    });

    const status2 = computeUnitStatus(questions, history);
    expect(status2.status).toBe('in-progress');
    expect(status2.attemptedCount).toBe(2);
    expect(status2.unattemptedQuestions).toHaveLength(3);
  });

  it('serves unattempted questions with zero adjacent category collisions throughout the 30-question unit', () => {
    const questions = TOEIC_PART5_LEVEL1_QUESTIONS;
    expect(questions).toHaveLength(30);

    const history: UserPerformance[] = [];
    const selectedOrder: Question[] = [];
    let prevQId: string | undefined;

    // Simulate stepping through all 30 questions in the unit
    for (let step = 0; step < 30; step++) {
      const nextQ = getNextQuestionInUnit(questions, history, prevQId);
      expect(nextQ).toBeDefined();

      selectedOrder.push(nextQ);
      prevQId = nextQ.id;

      // Record attempt
      history.push({
        questionId: nextQ.id,
        latencyMs: 1000,
        isCorrect: true,
        timestamp: Date.now() + step * 1000,
        targetCategory: getQuestionCategory(nextQ),
      });
    }

    // 1. All 30 unique questions were traversed
    expect(selectedOrder).toHaveLength(30);
    const uniqueIds = new Set(selectedOrder.map((q) => q.id));
    expect(uniqueIds.size).toBe(30);

    // 2. Zero adjacent category collisions in the sequence
    for (let i = 0; i < selectedOrder.length - 1; i++) {
      const catA = getQuestionCategory(selectedOrder[i]);
      const catB = getQuestionCategory(selectedOrder[i + 1]);
      expect(catA).not.toBe(catB);
    }

    // Unit is now completed
    const finalStatus = computeUnitStatus(questions, history);
    expect(finalStatus.status).toBe('completed');
  });

  it('resolves unattempted deck using getUnattemptedDeck', () => {
    const questions = TOEIC_PART5_LEVEL1_QUESTIONS;
    const deck = getUnattemptedDeck(questions, []);

    expect(deck).toHaveLength(30);
    for (let i = 0; i < deck.length - 1; i++) {
      expect(getQuestionCategory(deck[i])).not.toBe(getQuestionCategory(deck[i + 1]));
    }
  });

  it('selects error questions when all unit questions have been attempted', () => {
    const questions = TOEIC_PART5_LEVEL1_QUESTIONS.slice(0, 3);
    const history: UserPerformance[] = [
      {
        questionId: questions[0].id,
        latencyMs: 1000,
        isCorrect: true,
        timestamp: Date.now(),
        targetCategory: getQuestionCategory(questions[0]),
      },
      {
        questionId: questions[1].id,
        latencyMs: 1200,
        isCorrect: false, // error
        timestamp: Date.now() + 10,
        targetCategory: getQuestionCategory(questions[1]),
      },
      {
        questionId: questions[2].id,
        latencyMs: 1100,
        isCorrect: true,
        timestamp: Date.now() + 20,
        targetCategory: getQuestionCategory(questions[2]),
      },
    ];

    const nextQ = getNextQuestionInUnit(questions, history);
    expect(nextQ.id).toBe(questions[1].id);
  });
});
