import { describe, it, expect } from 'vitest';
import { constrainedShuffle, getQuestionCategory, shuffleArray } from '../app/utils/sampling';
import { TOEIC_PART5_LEVEL1_QUESTIONS } from '../app/data/toeic-part5';
import type { Question } from '../app/types/chunkflow';

describe('Constrained Shuffle Algorithm Specification', () => {
  it('handles edge cases gracefully (empty and single-element arrays)', () => {
    expect(constrainedShuffle([], (x) => x)).toEqual([]);
    expect(constrainedShuffle(['item1'], (x) => x)).toEqual(['item1']);
  });

  it('guarantees 100% item preservation and zero adjacent category collisions for balanced categories', () => {
    interface TestItem {
      id: string;
      category: string;
    }

    const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'];
    const items: TestItem[] = [];

    // Create 30 items: 6 categories x 5 items
    categories.forEach((cat) => {
      for (let i = 0; i < 5; i++) {
        items.push({ id: `${cat}-${i}`, category: cat });
      }
    });

    expect(items).toHaveLength(30);

    // Run 50 iterations to ensure stochastic consistency
    for (let run = 0; run < 50; run++) {
      const shuffled = constrainedShuffle(items, (item) => item.category);

      expect(shuffled).toHaveLength(30);

      // Verify all items are preserved
      const ids = new Set(shuffled.map((item) => item.id));
      expect(ids.size).toBe(30);

      // Verify zero adjacent category collisions
      for (let i = 0; i < shuffled.length - 1; i++) {
        expect(shuffled[i].category).not.toBe(shuffled[i + 1].category);
      }
    }
  });

  it('respects previousCategory constraint for the initial item', () => {
    const items = [
      { id: '1', category: 'A' },
      { id: '2', category: 'B' },
      { id: '3', category: 'C' },
    ];

    for (let run = 0; run < 20; run++) {
      const shuffled = constrainedShuffle(items, (i) => i.category, 'A');
      expect(shuffled[0].category).not.toBe('A');
    }
  });

  it('handles imbalanced categories without infinite loop or crashing', () => {
    const skewedItems = [
      { id: '1', category: 'A' },
      { id: '2', category: 'A' },
      { id: '3', category: 'A' },
      { id: '4', category: 'A' },
      { id: '5', category: 'B' },
    ];

    const result = constrainedShuffle(skewedItems, (i) => i.category);
    expect(result).toHaveLength(5);
    const ids = new Set(result.map((i) => i.id));
    expect(ids.size).toBe(5);
  });

  it('guarantees zero consecutive voice-time category collisions on actual TOEIC Part 5 banks', () => {
    expect(TOEIC_PART5_LEVEL1_QUESTIONS).toHaveLength(30);

    for (let run = 0; run < 30; run++) {
      const shuffled = constrainedShuffle(TOEIC_PART5_LEVEL1_QUESTIONS, (q) =>
        getQuestionCategory(q)
      );

      expect(shuffled).toHaveLength(30);

      // Verify all original questions are preserved
      const originalIds = new Set(TOEIC_PART5_LEVEL1_QUESTIONS.map((q) => q.id));
      const shuffledIds = new Set(shuffled.map((q) => q.id));
      expect(shuffledIds).toEqual(originalIds);

      // Verify zero consecutive category collisions across the entire deck
      for (let i = 0; i < shuffled.length - 1; i++) {
        const catA = getQuestionCategory(shuffled[i]);
        const catB = getQuestionCategory(shuffled[i + 1]);
        expect(catA).not.toBe(catB);
      }
    }
  });
});
