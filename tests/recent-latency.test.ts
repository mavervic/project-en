import { describe, it, expect, beforeEach } from 'vitest';
import { computeStats, savePerformanceRecord, clearPerformanceRecords } from '../app/utils/storage';
import type { UserPerformance } from '../app/types/chunkflow';

describe('Recent-10 Rolling Telemetry and Lifetime Stats Specification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('computeStats', () => {
    it('returns zeroes / defaults when no records exist', () => {
      const stats = computeStats([]);
      expect(stats.totalAttempts).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.avgLatencyMs).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(0);

      expect(stats.recent.sampleSize).toBe(0);
      expect(stats.recent.accuracy).toBe(0);
      expect(stats.recent.avgLatencyMs).toBe(0);
      expect(stats.recent.chunksPerMin).toBe(0);
    });

    it('calculates recent-10 rolling stats independently from older history', () => {
      // 15 records:
      // First 5: latency 3000ms, incorrect (isCorrect: false)
      // Last 10: latency 1000ms, correct (isCorrect: true)
      const records: UserPerformance[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          questionId: `q-${i}`,
          latencyMs: 3000,
          isCorrect: false,
          timestamp: 1000 + i,
          targetCategory: 'past-passive',
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
          questionId: `q-${i + 5}`,
          latencyMs: 1000,
          isCorrect: true,
          timestamp: 2000 + i,
          targetCategory: 'present-active',
        })),
      ];

      const stats = computeStats(records);

      // Lifetime stats (15 items)
      expect(stats.totalAttempts).toBe(15);
      expect(stats.correctAttempts).toBe(10);
      expect(stats.accuracy).toBe(67); // 10/15 = 66.67% -> 67%
      expect(stats.avgLatencyMs).toBe(1667); // (5*3000 + 10*1000)/15 = 25000/15 = 1667ms

      // Recent-10 stats (only last 10 items)
      expect(stats.recent.sampleSize).toBe(10);
      expect(stats.recent.correctAttempts).toBe(10);
      expect(stats.recent.accuracy).toBe(100);
      expect(stats.recent.avgLatencyMs).toBe(1000);
      expect(stats.recent.chunksPerMin).toBe(60); // 60000 / 1000 = 60
    });

    it('handles fewer than 10 attempts by computing over available attempts', () => {
      const records: UserPerformance[] = [
        {
          questionId: 'q-1',
          latencyMs: 1200,
          isCorrect: true,
          timestamp: 1000,
          targetCategory: 'past-active',
        },
        {
          questionId: 'q-2',
          latencyMs: 800,
          isCorrect: true,
          timestamp: 2000,
          targetCategory: 'past-active',
        },
      ];

      const stats = computeStats(records);
      expect(stats.recent.sampleSize).toBe(2);
      expect(stats.recent.accuracy).toBe(100);
      expect(stats.recent.avgLatencyMs).toBe(1000);
    });

    it('tracks and preserves all-time best streak even when current streak resets to 0', () => {
      const records: UserPerformance[] = [
        // 5 consecutive correct answers
        ...Array.from({ length: 5 }, (_, i) => ({
          questionId: `q-${i}`,
          latencyMs: 1000,
          isCorrect: true,
          timestamp: 1000 + i,
          targetCategory: 'past-active',
        })),
        // Followed by 1 incorrect answer
        {
          questionId: 'q-fail',
          latencyMs: 2000,
          isCorrect: false,
          timestamp: 2000,
          targetCategory: 'past-active',
        },
        // Followed by 2 correct answers
        {
          questionId: 'q-next-1',
          latencyMs: 1000,
          isCorrect: true,
          timestamp: 3000,
          targetCategory: 'past-active',
        },
        {
          questionId: 'q-next-2',
          latencyMs: 1000,
          isCorrect: true,
          timestamp: 4000,
          targetCategory: 'past-active',
        },
      ];

      const stats = computeStats(records);
      // currentStreak is 2 (the last two correct)
      expect(stats.currentStreak).toBe(2);
      // bestStreak must be 5 (from the historical run of 5)
      expect(stats.bestStreak).toBe(5);
    });
  });
});
