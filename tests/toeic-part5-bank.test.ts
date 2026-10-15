import { describe, it, expect } from 'vitest';
import {
  TOEIC_PART5_LEVEL1_QUESTIONS,
  TOEIC_PART5_LEVEL2_QUESTIONS,
  TOEIC_PART5_LEVEL3_QUESTIONS,
  TOEIC_PART5_L1_META,
  TOEIC_PART5_L2_META,
  TOEIC_PART5_L3_META,
  TOEIC_PART5_BANKS,
} from '../app/data/toeic-part5';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';

describe('TOEIC Part 5 Question Banks', () => {
  const levels = [
    { name: 'Level 1', questions: TOEIC_PART5_LEVEL1_QUESTIONS, meta: TOEIC_PART5_L1_META },
    { name: 'Level 2', questions: TOEIC_PART5_LEVEL2_QUESTIONS, meta: TOEIC_PART5_L2_META },
    { name: 'Level 3', questions: TOEIC_PART5_LEVEL3_QUESTIONS, meta: TOEIC_PART5_L3_META },
  ];

  levels.forEach(({ name, questions, meta }) => {
    describe(name, () => {
      it('has exactly 30 questions', () => {
        expect(questions).toHaveLength(30);
        expect(meta.totalQuestions).toBe(30);
      });

      it('has category set to TOEIC Part 5 文法句型', () => {
        expect(meta.category).toBe('TOEIC Part 5 文法句型');
      });

      it('has valid structure and non-empty translation for every question', () => {
        questions.forEach((q) => {
          expect(q.id).toBeDefined();
          expect(q.sentence).toBeTruthy();
          expect(q.chunks.length).toBeGreaterThanOrEqual(2);
          const reconstructed = q.chunks.map((c) => c.text).join(' ');
          expect(reconstructed).toBe(q.sentence);
          expect(q.targetSlotIndex).toBeGreaterThanOrEqual(0);
          expect(q.targetSlotIndex).toBeLessThan(q.chunks.length);
          expect(q.chunks[q.targetSlotIndex].isTargetSlot).toBe(true);
          expect(['active', 'passive']).toContain(q.correctAnswers.voice);
          expect(['present', 'past', 'future']).toContain(q.correctAnswers.time);
          expect(q.grammarNote).toBeTruthy();
          expect(typeof q.translation).toBe('string');
          expect(q.translation!.trim().length).toBeGreaterThan(0);
        });
      });

      if (name === 'Level 1') {
        it('has at least 4 chunks for every Level 1 question', () => {
          questions.forEach((q) => {
            expect(q.chunks.length).toBeGreaterThanOrEqual(4);
          });
        });
      }

      if (name === 'Level 2') {
        it('has at least 5 chunks for every Level 2 question with isolated head subject and modifier', () => {
          questions.forEach((q) => {
            expect(q.chunks.length).toBeGreaterThanOrEqual(5);
            // Subject chunk must precede intervening clause/modifier chunk before targetSlot
            expect(q.chunks[0].type).toBe('subject');
            expect(q.targetSlotIndex).toBeGreaterThanOrEqual(2);
          });
        });
      }

      if (name === 'Level 3') {
        it('has at least 5 chunks for every Level 3 question isolating participle/relative clause modifiers', () => {
          questions.forEach((q) => {
            expect(q.chunks.length).toBeGreaterThanOrEqual(5);
            // Subject chunk is isolated from participle/clause distractor before targetSlot
            expect(q.chunks[0].type).toBe('subject');
            expect(q.targetSlotIndex).toBeGreaterThanOrEqual(2);
          });
        });
      }

      it('has 5 questions for each of the 6 voice and time combinations', () => {
        const combinations: Record<string, number> = {
          'active-present': 0,
          'active-past': 0,
          'active-future': 0,
          'passive-present': 0,
          'passive-past': 0,
          'passive-future': 0,
        };

        questions.forEach((q) => {
          const key = `${q.correctAnswers.voice}-${q.correctAnswers.time}`;
          combinations[key] = (combinations[key] || 0) + 1;
        });

        expect(combinations['active-present']).toBe(5);
        expect(combinations['active-past']).toBe(5);
        expect(combinations['active-future']).toBe(5);
        expect(combinations['passive-present']).toBe(5);
        expect(combinations['passive-past']).toBe(5);
        expect(combinations['passive-future']).toBe(5);
      });
    });
  });

  describe('Bank Registry Integration', () => {
    it('registers all 5 banks with appropriate categories', () => {
      const banks = getRegisteredBanks();
      expect(banks).toHaveLength(5);

      const bankIds = banks.map((b) => b.id);
      expect(bankIds).toEqual([
        'toeic-part5-l1',
        'toeic-part5-l2',
        'toeic-part5-l3',
        'starter',
        'parker',
      ]);

      const part5Banks = banks.filter((b) => b.category === 'TOEIC Part 5 文法句型');
      const listeningBanks = banks.filter((b) => b.category === 'TOEIC Listening 聽力題庫');

      expect(part5Banks).toHaveLength(4);
      expect(listeningBanks).toHaveLength(1);
      expect(listeningBanks[0].id).toBe('parker');
    });

    it('retrieves banks and questions correctly by ID', () => {
      const l1Bank = getBankById('toeic-part5-l1');
      expect(l1Bank).toBeDefined();
      expect(l1Bank?.name).toContain('Level 1');
      expect(l1Bank?.questions).toHaveLength(30);

      const l2Questions = getBankQuestions('toeic-part5-l2');
      expect(l2Questions).toHaveLength(30);

      const parkerBank = getBankById('parker');
      expect(parkerBank?.category).toBe('TOEIC Listening 聽力題庫');
    });
  });
});
