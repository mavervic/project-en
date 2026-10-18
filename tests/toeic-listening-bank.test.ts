import { describe, it, expect } from 'vitest';
import {
  TOEIC_LISTENING_BANK,
  TOEIC_LISTENING_META,
  TOEIC_LISTENING_UNITS,
  TOEIC_LISTENING_QUESTIONS,
} from '../app/data/toeic-listening';

describe('TOEIC Listening Bank Architecture', () => {
  it('defines exactly 13 business situational units with proper metadata', () => {
    expect(TOEIC_LISTENING_UNITS).toHaveLength(13);
    const expectedTitles = [
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
    TOEIC_LISTENING_UNITS.forEach((unit, idx) => {
      expect(unit.title).toBe(expectedTitles[idx]);
      expect(unit.trainingId).toBe(`listening-${String(idx + 1).padStart(2, '0')}`);
      expect(unit.unitNumber).toBe(idx + 1);
      expect(['Easy', 'Medium', 'Hard']).toContain(unit.difficulty);
      expect(unit.tags.length).toBeGreaterThan(0);
    });
  });

  it('contains valid questions for all 13 units with translations and chunks', () => {
    expect(TOEIC_LISTENING_QUESTIONS.length).toBeGreaterThanOrEqual(13);
    const unitsCovered = new Set(TOEIC_LISTENING_QUESTIONS.map((q) => q.trainingId));
    expect(unitsCovered.size).toBe(13);

    for (const q of TOEIC_LISTENING_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.sentence.trim().length).toBeGreaterThan(0);
      expect(q.translation).toBeDefined();
      expect(q.translation!.trim().length).toBeGreaterThan(0);
      expect(q.chunks.length).toBeGreaterThanOrEqual(2);
      for (const chunk of q.chunks) {
        expect(chunk.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('exposes bank metadata with category "TOEIC Listening 聽力題庫" and 13 situational groups', () => {
    expect(TOEIC_LISTENING_META.id).toBe('toeic-listening');
    expect(TOEIC_LISTENING_META.category).toBe('TOEIC Listening 聽力題庫');
    expect(TOEIC_LISTENING_META.groups).toHaveLength(13);
    expect(TOEIC_LISTENING_BANK.totalTrainings).toBe(13);
    expect(TOEIC_LISTENING_BANK.questions).toEqual(TOEIC_LISTENING_QUESTIONS);
  });

  it('is resolved correctly through banks.ts registry helpers', async () => {
    const { getRegisteredBanks, getBankById, getBankQuestions } = await import('../app/data/banks');
    const registered = getRegisteredBanks();
    expect(registered.some((b) => b.id === 'toeic-listening')).toBe(true);

    const bank = getBankById('toeic-listening');
    expect(bank).toBeDefined();
    expect(bank?.id).toBe('toeic-listening');
    expect(bank?.questions.length).toBe(TOEIC_LISTENING_QUESTIONS.length);

    const questions = getBankQuestions('toeic-listening');
    expect(questions.length).toBe(TOEIC_LISTENING_QUESTIONS.length);
  });
});
