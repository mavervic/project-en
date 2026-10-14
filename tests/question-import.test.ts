import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateQuestionsJson,
  loadCustomQuestions,
  saveCustomQuestions,
  clearCustomQuestions,
} from '../app/utils/storage';
import type { Question } from '../app/types/chunkflow';

describe('Question Import & Validation Specification Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('validateQuestionsJson', () => {
    it('successfully validates a single question object', () => {
      const raw = JSON.stringify({
        sentence: 'The contract was signed by the director.',
        chunks: [
          { text: 'The contract', isTargetSlot: false, type: 'subject' },
          { text: 'was signed', isTargetSlot: true, type: 'verb' },
          { text: 'by the director.', isTargetSlot: false },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'passive', time: 'past' },
        grammarNote: 'Past passive test',
      });

      const res = validateQuestionsJson(raw);
      expect(res.valid).toBe(true);
      expect(res.questions.length).toBe(1);
      expect(res.questions[0].sentence).toBe('The contract was signed by the director.');
      expect(res.questions[0].correctAnswers.voice).toBe('passive');
      expect(res.questions[0].correctAnswers.time).toBe('past');
      expect(res.questions[0].targetSlotIndex).toBe(1);
    });

    it('successfully validates an array of question objects', () => {
      const raw = JSON.stringify([
        {
          sentence: 'The director will sign the agreement tomorrow.',
          chunks: [
            { text: 'The director', isTargetSlot: false, type: 'subject' },
            { text: 'will sign', isTargetSlot: true, type: 'verb' },
            { text: 'the agreement tomorrow.', isTargetSlot: false },
          ],
          targetSlotIndex: 1,
          correctAnswers: { voice: 'active', time: 'future' },
          grammarNote: 'Future active',
        },
      ]);

      const res = validateQuestionsJson(raw);
      expect(res.valid).toBe(true);
      expect(res.questions.length).toBe(1);
      expect(res.questions[0].correctAnswers.voice).toBe('active');
    });

    it('rejects empty or whitespace input', () => {
      const res = validateQuestionsJson('   ');
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Input is empty');
    });

    it('rejects invalid JSON syntax', () => {
      const res = validateQuestionsJson('{ sentence: invalid }');
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Invalid JSON syntax');
    });

    it('rejects payload with missing voice or invalid voice', () => {
      const raw = JSON.stringify([
        {
          sentence: 'Sample sentence.',
          chunks: [{ text: 'Sample', isTargetSlot: true }],
          correctAnswers: { voice: 'neutral', time: 'past' },
        },
      ]);

      const res = validateQuestionsJson(raw);
      expect(res.valid).toBe(false);
      expect(
        res.errors.some((e) =>
          e.includes("'correctAnswers.voice' must be either 'active' or 'passive'")
        )
      ).toBe(true);
    });

    it('rejects chunks with no target slot or multiple target slots', () => {
      const noTarget = JSON.stringify([
        {
          sentence: 'Sample.',
          chunks: [{ text: 'Sample', isTargetSlot: false }],
          correctAnswers: { voice: 'active', time: 'past' },
        },
      ]);
      const res1 = validateQuestionsJson(noTarget);
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('Exactly one chunk must have'))).toBe(true);

      const multiTarget = JSON.stringify([
        {
          sentence: 'Sample.',
          chunks: [
            { text: 'A', isTargetSlot: true },
            { text: 'B', isTargetSlot: true },
          ],
          correctAnswers: { voice: 'active', time: 'past' },
        },
      ]);
      const res2 = validateQuestionsJson(multiTarget);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('Only one chunk can have'))).toBe(true);
    });
  });

  describe('Local Storage Persistence', () => {
    it('persists and restores custom questions', () => {
      const sampleQ: Question = {
        id: 'test-custom-1',
        sentence: 'We received your feedback.',
        chunks: [
          { text: 'We', isTargetSlot: false, type: 'subject' },
          { text: 'received', isTargetSlot: true, type: 'verb' },
          { text: 'your feedback.', isTargetSlot: false },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'past' },
        grammarNote: 'Test note',
      };

      saveCustomQuestions([sampleQ]);
      const loaded = loadCustomQuestions();
      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe('test-custom-1');

      clearCustomQuestions();
      const cleared = loadCustomQuestions();
      expect(cleared.length).toBe(0);
    });
  });
});
