import { describe, it, expect } from 'vitest';
import {
  TOEIC_LISTENING_BANK,
  TOEIC_LISTENING_META,
  TOEIC_LISTENING_UNITS,
  TOEIC_LISTENING_QUESTIONS,
} from '../app/data/toeic-listening';

describe('TOEIC Listening Bank Architecture', () => {
  const expectedBaseTitles = [
    'Travel',
    'Dining out',
    'Entertainment',
    'Housing',
    'Purchasing',
    'Personnel',
    'Offices',
    'Health',
    'General Business',
    'Manufacturing',
    'Corporate Development',
    'Technical areas',
    'Financing & Budgeting',
  ];

  it('defines exactly 26 business situational units (13 Easy, 13 Medium) with proper metadata', () => {
    expect(TOEIC_LISTENING_UNITS).toHaveLength(26);

    // Easy tier units (1-13)
    for (let idx = 0; idx < 13; idx++) {
      const unit = TOEIC_LISTENING_UNITS[idx];
      expect(unit.title).toBe(`${expectedBaseTitles[idx]} (Easy)`);
      expect(unit.trainingId).toBe(`listening-${String(idx + 1).padStart(2, '0')}-easy`);
      expect(unit.unitNumber).toBe(idx + 1);
      expect(unit.difficulty).toBe('Easy');
      expect(unit.tags.length).toBeGreaterThan(0);
    }

    // Medium tier units (14-26)
    for (let idx = 13; idx < 26; idx++) {
      const unit = TOEIC_LISTENING_UNITS[idx];
      expect(unit.title).toBe(`${expectedBaseTitles[idx - 13]} (Medium)`);
      expect(unit.trainingId).toBe(`listening-${String(idx - 12).padStart(2, '0')}-medium`);
      expect(unit.unitNumber).toBe(idx + 1);
      expect(unit.difficulty).toBe('Medium');
      expect(unit.tags.length).toBeGreaterThan(0);
    }
  });

  it('contains exactly 780 valid questions (30 per unit) with translations and chunks', () => {
    expect(TOEIC_LISTENING_QUESTIONS).toHaveLength(780);
    const unitsCovered = new Set(TOEIC_LISTENING_QUESTIONS.map((q) => q.trainingId));
    expect(unitsCovered.size).toBe(26);

    for (let idx = 1; idx <= 13; idx++) {
      const easyUnitId = `listening-${String(idx).padStart(2, '0')}-easy`;
      const mediumUnitId = `listening-${String(idx).padStart(2, '0')}-medium`;

      const easyQuestions = TOEIC_LISTENING_QUESTIONS.filter((q) => q.trainingId === easyUnitId);
      expect(easyQuestions).toHaveLength(30);

      const mediumQuestions = TOEIC_LISTENING_QUESTIONS.filter(
        (q) => q.trainingId === mediumUnitId
      );
      expect(mediumQuestions).toHaveLength(30);
    }

    for (const q of TOEIC_LISTENING_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.sentence.trim().length).toBeGreaterThan(0);
      expect(q.translation).toBeDefined();
      expect(q.translation!.trim().length).toBeGreaterThan(0);
      expect(q.chunks.length).toBeGreaterThanOrEqual(2);
      expect(q.targetSlotIndex).toBeGreaterThanOrEqual(0);
      expect(q.targetSlotIndex).toBeLessThan(q.chunks.length);
      expect(q.chunks[q.targetSlotIndex].isTargetSlot).toBe(true);

      for (const chunk of q.chunks) {
        expect(chunk.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('exposes bank metadata with category "TOEIC Listening 聽力題庫" and 13 situational groups', () => {
    expect(TOEIC_LISTENING_META.id).toBe('toeic-listening');
    expect(TOEIC_LISTENING_META.category).toBe('TOEIC Listening 聽力題庫');
    expect(TOEIC_LISTENING_META.groups).toHaveLength(13);
    expect(TOEIC_LISTENING_BANK.totalTrainings).toBe(26);
    expect(TOEIC_LISTENING_BANK.questions).toEqual(TOEIC_LISTENING_QUESTIONS);

    TOEIC_LISTENING_META.groups?.forEach((group, idx) => {
      expect(group.units).toHaveLength(2);
      expect(group.units[0].difficulty).toBe('Easy');
      expect(group.units[0].trainingId).toBe(`listening-${String(idx + 1).padStart(2, '0')}-easy`);
      expect(group.units[1].difficulty).toBe('Medium');
      expect(group.units[1].trainingId).toBe(
        `listening-${String(idx + 1).padStart(2, '0')}-medium`
      );
    });
  });

  it('is resolved correctly through banks.ts registry helpers', async () => {
    const { getRegisteredBanks, getBankById, getBankQuestions } = await import('../app/data/banks');
    const registered = getRegisteredBanks();
    expect(registered.some((b) => b.id === 'toeic-listening')).toBe(true);

    const bank = getBankById('toeic-listening');
    expect(bank).toBeDefined();
    expect(bank?.id).toBe('toeic-listening');
    expect(bank?.questions.length).toBe(780);

    const questions = getBankQuestions('toeic-listening');
    expect(questions.length).toBe(780);
  });
});
