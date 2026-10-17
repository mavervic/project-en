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
  TOEIC_PART5_META,
  TOEIC_PART5_BANK,
  TOEIC_PART5_GROUPS,
  ALL_TOEIC_PART5_QUESTIONS,
  ALL_TOEIC_PART5_LEVEL1_QUESTIONS,
  ALL_TOEIC_PART5_LEVEL2_QUESTIONS,
  ALL_TOEIC_PART5_LEVEL3_QUESTIONS,
  TOEIC_PART5_BANKS,
  TOEIC_PART5_QUESTIONS_BY_UNIT,
} from '../app/data/toeic-part5';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';
import { computeTrainingTelemetry, loadActiveBankId } from '../app/utils/storage';

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

    it('configures unified TOEIC Part 5 bank with 330 questions, 11 units, and 5 structured curriculum groups', () => {
      expect(TOEIC_PART5_META.id).toBe('toeic-part5');
      expect(TOEIC_PART5_META.totalQuestions).toBe(330);
      expect(TOEIC_PART5_META.totalTrainings).toBe(11);
      expect(TOEIC_PART5_META.category).toBe('TOEIC Part 5 文法句型');
      expect(ALL_TOEIC_PART5_QUESTIONS).toHaveLength(330);
      expect(TOEIC_PART5_BANK.questions).toHaveLength(330);

      // Verify the 5 curriculum groups
      expect(TOEIC_PART5_GROUPS).toHaveLength(5);

      const [group1, group2, group3, group4, group5] = TOEIC_PART5_GROUPS;

      // Group 1: Level 1
      expect(group1.id).toBe('group-part5-l1');
      expect(group1.title).toContain('Level 1');
      expect(group1.units).toHaveLength(5);
      group1.units.forEach((u) => {
        expect(u.difficulty).toBe('Easy');
        expect(u.tags.length).toBeGreaterThan(0);
      });

      // Group 2: Level 2
      expect(group2.id).toBe('group-part5-l2');
      expect(group2.title).toContain('Level 2');
      expect(group2.units).toHaveLength(3);
      group2.units.forEach((u) => {
        expect(u.difficulty).toBe('Medium');
        expect(u.tags.length).toBeGreaterThan(0);
      });

      // Group 3: Level 3 Participle
      expect(group3.id).toBe('group-part5-l3-participle');
      expect(group3.title).toContain('真假動詞陷阱');
      expect(group3.units).toHaveLength(1);
      expect(group3.units[0].trainingId).toBe('level3-01');
      expect(group3.units[0].difficulty).toBe('Hard');
      expect(group3.units[0].tags).toContain('真假動詞');

      // Group 4: Level 3 Modal Perfect
      expect(group4.id).toBe('group-part5-l3-modal');
      expect(group4.title).toContain('Modal Perfect');
      expect(group4.units).toHaveLength(1);
      expect(group4.units[0].trainingId).toBe('level3-02');
      expect(group4.units[0].difficulty).toBe('Hard');
      expect(group4.units[0].tags).toContain('Modal Perfect');

      // Group 5: Level 3 Subjunctive & Inversion
      expect(group5.id).toBe('group-part5-l3-subjunctive');
      expect(group5.title).toContain('倒裝');
      expect(group5.units).toHaveLength(1);
      expect(group5.units[0].trainingId).toBe('level3-03');
      expect(group5.units[0].difficulty).toBe('Hard');
      expect(group5.units[0].tags).toContain('假設語氣');
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
    it('registers unified toeic-part5 along with starter and parker banks', () => {
      const banks = getRegisteredBanks();
      expect(banks).toHaveLength(3);

      const bankIds = banks.map((b) => b.id);
      expect(bankIds).toEqual(['toeic-part5', 'starter', 'parker']);

      const part5Banks = banks.filter((b) => b.category === 'TOEIC Part 5 文法句型');
      const listeningBanks = banks.filter((b) => b.category === 'TOEIC Listening 聽力題庫');

      expect(part5Banks).toHaveLength(2);
      expect(part5Banks.map((b) => b.id)).toEqual(['toeic-part5', 'starter']);
      expect(listeningBanks).toHaveLength(1);
      expect(listeningBanks[0].id).toBe('parker');
    });

    it('retrieves unified bank and questions correctly by ID', () => {
      const part5Bank = getBankById('toeic-part5');
      expect(part5Bank).toBeDefined();
      expect(part5Bank?.name).toBe('TOEIC Part 5 核心文法題庫');
      expect(part5Bank?.questions).toHaveLength(330);
      expect(part5Bank?.totalTrainings).toBe(11);
      expect(part5Bank?.groups).toHaveLength(5);

      const part5Questions = getBankQuestions('toeic-part5');
      expect(part5Questions).toHaveLength(330);

      const parkerBank = getBankById('parker');
      expect(parkerBank?.category).toBe('TOEIC Listening 聽力題庫');
    });

    it('implements backward compatibility fallback resolving legacy IDs to unified toeic-part5', () => {
      // getBankById fallback
      const l1Bank = getBankById('toeic-part5-l1');
      expect(l1Bank).toBeDefined();
      expect(l1Bank?.id).toBe('toeic-part5');
      expect(l1Bank?.questions).toHaveLength(330);

      const l2Bank = getBankById('toeic-part5-l2');
      expect(l2Bank).toBeDefined();
      expect(l2Bank?.id).toBe('toeic-part5');

      const l3Bank = getBankById('toeic-part5-l3');
      expect(l3Bank).toBeDefined();
      expect(l3Bank?.id).toBe('toeic-part5');

      // getBankQuestions fallback
      expect(getBankQuestions('toeic-part5-l1')).toHaveLength(330);
      expect(getBankQuestions('toeic-part5-l2')).toHaveLength(330);
      expect(getBankQuestions('toeic-part5-l3')).toHaveLength(330);

      // loadActiveBankId fallback from localStorage
      window.localStorage.setItem('chunkflow_active_bank_v1', 'toeic-part5-l1');
      expect(loadActiveBankId()).toBe('toeic-part5');
      window.localStorage.setItem('chunkflow_active_bank_v1', 'toeic-part5-l2');
      expect(loadActiveBankId()).toBe('toeic-part5');
      window.localStorage.setItem('chunkflow_active_bank_v1', 'toeic-part5-l3');
      expect(loadActiveBankId()).toBe('toeic-part5');
      window.localStorage.removeItem('chunkflow_active_bank_v1');
    });

    it('organizes unified Part 5 questions into 11 distinct training units with accurate telemetry', () => {
      const allQuestions = getBankQuestions('toeic-part5');
      const telemetry = computeTrainingTelemetry([], allQuestions);
      const unitKeys = Object.keys(telemetry);

      expect(unitKeys).toHaveLength(11);
      expect(unitKeys).toEqual([
        'level1-01',
        'level1-02',
        'level1-03',
        'level1-04',
        'level1-05',
        'level2-01',
        'level2-02',
        'level2-03',
        'level3-01',
        'level3-02',
        'level3-03',
      ]);

      expect(telemetry['level1-01'].unitNumber).toBe(1);
      expect(telemetry['level1-01'].lessonName).toBe('第 01 課');
      expect(telemetry['level1-05'].unitNumber).toBe(5);
      expect(telemetry['level1-05'].lessonName).toBe('第 05 課');

      // Verify questions by unit map
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level1-01']).toHaveLength(30);
      expect(TOEIC_PART5_QUESTIONS_BY_UNIT['level1-05']).toHaveLength(30);
    });

    it('organizes Level 2 questions into 3 distinct training units with accurate telemetry', () => {
      const l2Questions = ALL_TOEIC_PART5_LEVEL2_QUESTIONS;
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
      const l3Questions = ALL_TOEIC_PART5_LEVEL3_QUESTIONS;
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
