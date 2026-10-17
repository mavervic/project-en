import { describe, it, expect } from 'vitest';
import {
  TOEIC_PART5_LEVEL1_QUESTIONS,
  TOEIC_PART5_LEVEL1_T2_QUESTIONS,
  TOEIC_PART5_LEVEL1_T3_QUESTIONS,
  TOEIC_PART5_LEVEL1_T4_QUESTIONS,
  TOEIC_PART5_LEVEL1_T5_QUESTIONS,
  TOEIC_PART5_LEVEL2_QUESTIONS,
  TOEIC_PART5_LEVEL2_T2_QUESTIONS,
  TOEIC_PART5_LEVEL2_T3_QUESTIONS,
  TOEIC_PART5_LEVEL3_QUESTIONS,
  TOEIC_PART5_LEVEL3_T2_QUESTIONS,
  TOEIC_PART5_LEVEL3_T3_QUESTIONS,
  TOEIC_PART5_L1_META,
  TOEIC_PART5_L2_META,
  TOEIC_PART5_L3_META,
  TOEIC_PART5_BANKS,
  TOEIC_PART5_QUESTIONS_BY_UNIT,
} from '../app/data/toeic-part5';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';
import { computeTrainingTelemetry } from '../app/utils/storage';

describe('TOEIC Part 5 Question Banks', () => {
  const levels = [
    { name: 'Level 1 (Training 1)', questions: TOEIC_PART5_LEVEL1_QUESTIONS },
    { name: 'Level 1 (Training 2)', questions: TOEIC_PART5_LEVEL1_T2_QUESTIONS },
    { name: 'Level 1 (Training 3)', questions: TOEIC_PART5_LEVEL1_T3_QUESTIONS },
    { name: 'Level 1 (Training 4)', questions: TOEIC_PART5_LEVEL1_T4_QUESTIONS },
    { name: 'Level 1 (Training 5)', questions: TOEIC_PART5_LEVEL1_T5_QUESTIONS },
    { name: 'Level 2 (Training 1)', questions: TOEIC_PART5_LEVEL2_QUESTIONS },
    { name: 'Level 2 (Training 2)', questions: TOEIC_PART5_LEVEL2_T2_QUESTIONS },
    { name: 'Level 2 (Training 3)', questions: TOEIC_PART5_LEVEL2_T3_QUESTIONS },
    { name: 'Level 3 (Training 1)', questions: TOEIC_PART5_LEVEL3_QUESTIONS },
    { name: 'Level 3 (Training 2)', questions: TOEIC_PART5_LEVEL3_T2_QUESTIONS },
    { name: 'Level 3 (Training 3)', questions: TOEIC_PART5_LEVEL3_T3_QUESTIONS },
  ];

  describe('Question Bank Metadata', () => {
    it('configures Level 1 metadata with 150 questions across 5 training units', () => {
      expect(TOEIC_PART5_L1_META.totalQuestions).toBe(150);
      expect(TOEIC_PART5_L1_META.totalTrainings).toBe(5);
      expect(TOEIC_PART5_L1_META.category).toBe('TOEIC Part 5 文法句型');
    });

    it('configures Level 2 metadata with 90 questions across 3 training units', () => {
      expect(TOEIC_PART5_L2_META.totalQuestions).toBe(90);
      expect(TOEIC_PART5_L2_META.totalTrainings).toBe(3);
      expect(TOEIC_PART5_L2_META.category).toBe('TOEIC Part 5 文法句型');
    });

    it('configures Level 3 metadata with 90 questions across 3 training units', () => {
      expect(TOEIC_PART5_L3_META.totalQuestions).toBe(90);
      expect(TOEIC_PART5_L3_META.totalTrainings).toBe(3);
      expect(TOEIC_PART5_L3_META.category).toBe('TOEIC Part 5 文法句型');
    });
  });

  levels.forEach(({ name, questions }) => {
    describe(name, () => {
      it('has exactly 30 questions', () => {
        expect(questions).toHaveLength(30);
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

      if (name.startsWith('Level 1')) {
        it('has at least 4 chunks for every Level 1 question', () => {
          questions.forEach((q) => {
            expect(q.chunks.length).toBeGreaterThanOrEqual(4);
          });
        });
      }

      if (name.startsWith('Level 2')) {
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
      expect(l1Bank?.questions).toHaveLength(150);
      expect(l1Bank?.totalTrainings).toBe(5);

      const l2Questions = getBankQuestions('toeic-part5-l2');
      expect(l2Questions).toHaveLength(90);

      const parkerBank = getBankById('parker');
      expect(parkerBank?.category).toBe('TOEIC Listening 聽力題庫');
    });

    it('organizes Level 1 questions into 5 distinct training units with accurate telemetry', () => {
      const l1Questions = getBankQuestions('toeic-part5-l1');
      const telemetry = computeTrainingTelemetry([], l1Questions);
      const unitKeys = Object.keys(telemetry);

      expect(unitKeys).toEqual(['level1-01', 'level1-02', 'level1-03', 'level1-04', 'level1-05']);

      expect(telemetry['level1-01'].unitNumber).toBe(1);
      expect(telemetry['level1-01'].lessonName).toBe('第 01 課');
      expect(telemetry['level1-05'].unitNumber).toBe(5);
      expect(telemetry['level1-05'].lessonName).toBe('第 05 課');

      // Verify questions by unit map
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level1-01']).toHaveLength(30);
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level1-05']).toHaveLength(30);
    });

    it('organizes Level 2 questions into 3 distinct training units with accurate telemetry', () => {
      const l2Questions = getBankQuestions('toeic-part5-l2');
      const telemetry = computeTrainingTelemetry([], l2Questions);
      const unitKeys = Object.keys(telemetry);

      expect(unitKeys).toEqual(['level2-01', 'level2-02', 'level2-03']);

      expect(telemetry['level2-01'].unitNumber).toBe(1);
      expect(telemetry['level2-01'].lessonName).toBe('第 01 課');
      expect(telemetry['level2-02'].unitNumber).toBe(2);
      expect(telemetry['level2-02'].lessonName).toBe('第 02 課');
      expect(telemetry['level2-03'].unitNumber).toBe(3);
      expect(telemetry['level2-03'].lessonName).toBe('第 03 課');

      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level2-01']).toHaveLength(30);
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level2-03']).toHaveLength(30);
    });

    it('organizes Level 3 questions into 3 distinct training units with accurate telemetry', () => {
      const l3Questions = getBankQuestions('toeic-part5-l3');
      const telemetry = computeTrainingTelemetry([], l3Questions);
      const unitKeys = Object.keys(telemetry);

      expect(unitKeys).toEqual(['level3-01', 'level3-02', 'level3-03']);

      expect(telemetry['level3-01'].unitNumber).toBe(1);
      expect(telemetry['level3-01'].lessonName).toBe('第 01 課');
      expect(telemetry['level3-02'].unitNumber).toBe(2);
      expect(telemetry['level3-02'].lessonName).toBe('第 02 課');
      expect(telemetry['level3-03'].unitNumber).toBe(3);
      expect(telemetry['level3-03'].lessonName).toBe('第 03 課');

      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level3-01']).toHaveLength(30);
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level3-02']).toHaveLength(30);
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level3-03']).toHaveLength(30);
    });
  });
});
