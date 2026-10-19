import { describe, it, expect } from 'vitest';
import {
  PARKER_QUESTIONS,
  PARKER_BANK_META,
  PARKER_BANK,
  STARTER_BANK,
  getRegisteredBanks,
  getBankById,
  getBankQuestions,
} from '../app/data/banks';

describe('Structured 50-Unit Parker TOEIC Question Bank', () => {
  it('contains exactly 50 distinct training units', () => {
    const trainingUnits = new Set<string>();
    for (const q of PARKER_QUESTIONS) {
      if (q.trainingId) {
        trainingUnits.add(q.trainingId);
      }
    }
    expect(trainingUnits.size).toBe(50);

    for (let i = 1; i <= 50; i++) {
      const expectedId = `parker-${String(i).padStart(2, '0')}`;
      expect(trainingUnits.has(expectedId)).toBe(true);
    }
  });

  it('validates that every question has valid chunks, answers, and grammar notes', () => {
    expect(PARKER_QUESTIONS.length).toBeGreaterThan(500);

    for (const q of PARKER_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.sentence.trim().length).toBeGreaterThan(0);
      expect(q.trainingId).toMatch(/^parker-\d{2}$/);

      // Chunks
      expect(q.chunks.length).toBeGreaterThanOrEqual(2);
      const targetChunk = q.chunks[q.targetSlotIndex];
      expect(targetChunk).toBeDefined();
      expect(targetChunk.isTargetSlot).toBe(true);
      expect(targetChunk.type).toBe('verb');

      // Answers
      expect(['active', 'passive']).toContain(q.correctAnswers.voice);
      expect(['present', 'past', 'future']).toContain(q.correctAnswers.time);
      if (q.correctAnswers.aspect) {
        expect(['simple', 'continuous', 'perfect']).toContain(q.correctAnswers.aspect);
      }

      // Grammar note
      expect(q.grammarNote.trim().length).toBeGreaterThan(0);
    }
  });

  it('guarantees no chunks begin with or consist solely of isolated punctuation marks', () => {
    for (const q of PARKER_QUESTIONS) {
      for (const chunk of q.chunks) {
        expect(chunk.text.trim().length).toBeGreaterThan(0);
        expect(chunk.text.startsWith('.')).toBe(false);
        expect(['.', '?', '!', ',']).not.toContain(chunk.text.trim());
      }
    }
  });

  it('provides Parker bank metadata with 50 units organized into 5 comprehensive training clusters', () => {
    expect(PARKER_BANK_META.id).toBe('parker');
    expect(PARKER_BANK_META.name).toBe('怕渴題庫');
    expect(PARKER_BANK_META.totalTrainings).toBe(50);
    expect(PARKER_BANK_META.totalQuestions).toBe(PARKER_QUESTIONS.length);
    expect(PARKER_BANK_META.groups).toBeDefined();
    expect(PARKER_BANK_META.groups).toHaveLength(5);

    let totalUnitsInGroups = 0;
    PARKER_BANK_META.groups!.forEach((group, gIdx) => {
      expect(group.id).toBe(`group-parker-${String(gIdx + 1).padStart(2, '0')}`);
      expect(group.title).toBeDefined();
      expect(group.units).toHaveLength(10);
      group.units.forEach((unit) => {
        expect(unit.trainingId).toMatch(/^parker-\d{2}$/);
        expect(unit.title).toContain('Easy');
        expect(unit.difficulty).toBe('Easy');
        expect(unit.unitNumber).toBeGreaterThan(0);
        totalUnitsInGroups++;
      });
    });
    expect(totalUnitsInGroups).toBe(50);
  });

  it('provides 100% Traditional Chinese translation, ETS scenario topics, and clean auditory chunking for all 50 units (Units 01-50)', async () => {
    const { PARKER_QUESTIONS_BY_UNIT } = await import('../app/data/parker/index');
    const VALID_TOPICS = [
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

    for (let i = 1; i <= 50; i++) {
      const unitId = `parker-${String(i).padStart(2, '0')}`;
      const questions = PARKER_QUESTIONS_BY_UNIT[unitId];
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);

      for (const q of questions) {
        // Translation coverage
        expect(q.translation).toBeDefined();
        expect(typeof q.translation).toBe('string');
        expect(q.translation!.trim().length).toBeGreaterThan(0);

        // Topic coverage
        expect(q.topic).toBeDefined();
        expect(VALID_TOPICS).toContain(q.topic);

        // Prosodic auditory chunks
        expect(q.chunks.length).toBeGreaterThanOrEqual(2);
        expect(q.chunks.length).toBeLessThanOrEqual(4);

        // Single predicate verb target slot
        const targetChunks = q.chunks.filter((c) => c.isTargetSlot);
        expect(targetChunks).toHaveLength(1);
        expect(q.chunks[q.targetSlotIndex].isTargetSlot).toBe(true);
        expect(q.chunks[q.targetSlotIndex].type).toBe('verb');

        // Punctuation rules
        for (const chunk of q.chunks) {
          expect(chunk.text.startsWith('.')).toBe(false);
          expect(['.', '?', '!', ',']).not.toContain(chunk.text.trim());
        }
      }
    }
  });

  it('partitions questions across 50 dedicated unit JSON files', async () => {
    const { PARKER_QUESTIONS_BY_UNIT } = await import('../app/data/parker/index');
    expect(Object.keys(PARKER_QUESTIONS_BY_UNIT).length).toBe(50);

    let totalFromUnits = 0;
    for (let i = 1; i <= 50; i++) {
      const unitId = `parker-${String(i).padStart(2, '0')}`;
      const unitQs = PARKER_QUESTIONS_BY_UNIT[unitId];
      expect(unitQs).toBeDefined();
      expect(unitQs.length).toBeGreaterThan(0);
      for (const q of unitQs) {
        expect(q.trainingId).toBe(unitId);
      }
      totalFromUnits += unitQs.length;
    }
    expect(totalFromUnits).toBe(PARKER_QUESTIONS.length);
  });
});

describe('Modular Question Bank Switching and Registry', () => {
  it('lists all registered banks including starter and parker', () => {
    const banks = getRegisteredBanks();
    const ids = banks.map((b) => b.id);
    expect(ids).toContain('starter');
    expect(ids).toContain('parker');
  });

  it('retrieves banks by ID accurately', () => {
    const parker = getBankById('parker');
    expect(parker).toBeDefined();
    expect(parker?.id).toBe('parker');
    expect(parker?.questions.length).toBe(PARKER_QUESTIONS.length);

    const starter = getBankById('starter');
    expect(starter).toBeDefined();
    expect(starter?.id).toBe('starter');
    expect(starter?.questions.length).toBe(STARTER_BANK.questions.length);

    const invalid = getBankById('non-existent');
    expect(invalid).toBeUndefined();
  });

  it('supports dynamic question bank switching', () => {
    const parkerQuestions = getBankQuestions('parker');
    const starterQuestions = getBankQuestions('starter');

    expect(parkerQuestions).not.toEqual(starterQuestions);
    expect(parkerQuestions.length).toBe(PARKER_QUESTIONS.length);
    expect(starterQuestions.length).toBe(STARTER_BANK.questions.length);

    // Fallback on unknown ID
    const fallbackQuestions = getBankQuestions('unknown');
    expect(fallbackQuestions).toEqual(STARTER_BANK.questions);
  });
});
