import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeMasteryTier,
  computeTrainingTelemetry,
  loadTrainingSortPolicy,
  saveTrainingSortPolicy,
  loadNarrationEnabled,
  saveNarrationEnabled,
  loadSpeechAccent,
  saveSpeechAccent,
  loadActiveBankId,
  saveActiveBankId,
} from '../app/utils/storage';
import type { Question, UserPerformance } from '../app/types/chunkflow';

describe('Blue Mastery Heatmap Gradient Scale', () => {
  it('maps attempts and accuracy to 5-tier mastery gradient', () => {
    // Tier 0: 0 attempts
    expect(computeMasteryTier(0, 0)).toBe(0);
    expect(computeMasteryTier(0, 100)).toBe(0);

    // Tier 1: < 60% accuracy
    expect(computeMasteryTier(5, 59)).toBe(1);
    expect(computeMasteryTier(10, 40)).toBe(1);

    // Tier 2: 60% - 79% accuracy
    expect(computeMasteryTier(5, 60)).toBe(2);
    expect(computeMasteryTier(5, 79)).toBe(2);

    // Tier 3: 80% - 89% accuracy
    expect(computeMasteryTier(5, 80)).toBe(3);
    expect(computeMasteryTier(5, 89)).toBe(3);

    // Tier 4: >= 90% accuracy
    expect(computeMasteryTier(5, 90)).toBe(4);
    expect(computeMasteryTier(10, 100)).toBe(4);
  });
});

describe('Lesson-Scoped Performance Metric Aggregation', () => {
  const mockQuestions: Question[] = [
    {
      id: 'p1-q1',
      trainingId: 'parker-01',
      sentence: 'The director will sign.',
      chunks: [
        { text: 'The director', isTargetSlot: false, type: 'subject' },
        { text: 'will sign.', isTargetSlot: true, type: 'verb' },
      ],
      targetSlotIndex: 1,
      correctAnswers: { voice: 'active', time: 'future', aspect: 'simple' },
      grammarNote: 'note',
    },
    {
      id: 'p1-q2',
      trainingId: 'parker-01',
      sentence: 'The contract was signed.',
      chunks: [
        { text: 'The contract', isTargetSlot: false, type: 'subject' },
        { text: 'was signed.', isTargetSlot: true, type: 'verb' },
      ],
      targetSlotIndex: 1,
      correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
      grammarNote: 'note',
    },
    {
      id: 'p2-q1',
      trainingId: 'parker-02',
      sentence: 'A shipment has arrived.',
      chunks: [
        { text: 'A shipment', isTargetSlot: false, type: 'subject' },
        { text: 'has arrived.', isTargetSlot: true, type: 'verb' },
      ],
      targetSlotIndex: 1,
      correctAnswers: { voice: 'active', time: 'present', aspect: 'perfect' },
      grammarNote: 'note',
    },
  ];

  it('aggregates telemetry per training unit accurately', () => {
    const history: UserPerformance[] = [
      {
        questionId: 'p1-q1',
        isCorrect: true,
        latencyMs: 1200,
        timestamp: 1000,
        targetCategory: 'future-active',
      },
      {
        questionId: 'p1-q2',
        isCorrect: false,
        latencyMs: 1800,
        timestamp: 2000,
        targetCategory: 'past-passive',
      },
      {
        questionId: 'p1-q1',
        isCorrect: true,
        latencyMs: 1000,
        timestamp: 3000,
        targetCategory: 'future-active',
      },
      {
        questionId: 'p1-q2',
        isCorrect: true,
        latencyMs: 1400,
        timestamp: 4000,
        targetCategory: 'past-passive',
      },
    ];

    const telemetry = computeTrainingTelemetry(history, mockQuestions);

    expect(telemetry['parker-01']).toBeDefined();
    expect(telemetry['parker-01'].totalAttempts).toBe(4);
    expect(telemetry['parker-01'].correctAttempts).toBe(3);
    expect(telemetry['parker-01'].accuracy).toBe(75); // 3/4 = 75%
    expect(telemetry['parker-01'].avgLatencyMs).toBe(1350); // (1200+1800+1000+1400)/4 = 1350
    expect(telemetry['parker-01'].bestStreak).toBe(2); // record 3 & 4
    expect(telemetry['parker-01'].masteryTier).toBe(2); // 75% -> Tier 2
    expect(telemetry['parker-01'].lessonName).toBe('第 01 課');
    expect(telemetry['parker-01'].unitNumber).toBe(1);

    // Unattempted unit parker-02
    expect(telemetry['parker-02']).toBeDefined();
    expect(telemetry['parker-02'].totalAttempts).toBe(0);
    expect(telemetry['parker-02'].correctAttempts).toBe(0);
    expect(telemetry['parker-02'].accuracy).toBe(0);
    expect(telemetry['parker-02'].avgLatencyMs).toBe(0);
    expect(telemetry['parker-02'].bestStreak).toBe(0);
    expect(telemetry['parker-02'].masteryTier).toBe(0);
  });
});

describe('Settings and Preferences Persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and loads training sort policy with default weakest', () => {
    expect(loadTrainingSortPolicy()).toBe('weakest');
    saveTrainingSortPolicy('sequential');
    expect(loadTrainingSortPolicy()).toBe('sequential');
    saveTrainingSortPolicy('weakest');
    expect(loadTrainingSortPolicy()).toBe('weakest');
  });

  it('persists and loads sentence narration toggle with default false', () => {
    expect(loadNarrationEnabled()).toBe(false);
    saveNarrationEnabled(true);
    expect(loadNarrationEnabled()).toBe(true);
    saveNarrationEnabled(false);
    expect(loadNarrationEnabled()).toBe(false);
  });

  it('persists and loads speech accent with default US', () => {
    expect(loadSpeechAccent()).toBe('US');
    saveSpeechAccent('AU');
    expect(loadSpeechAccent()).toBe('AU');
    saveSpeechAccent('GB');
    expect(loadSpeechAccent()).toBe('GB');
  });

  it('persists and loads active question bank ID with default parker', () => {
    expect(loadActiveBankId()).toBe('parker');
    saveActiveBankId('starter');
    expect(loadActiveBankId()).toBe('starter');
  });
});
