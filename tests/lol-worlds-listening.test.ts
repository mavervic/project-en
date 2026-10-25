import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  LOL_WORLDS_LISTENING_BANK,
  LOL_WORLDS_LISTENING_META,
  LOL_WORLDS_LISTENING_UNITS,
  LOL_WORLDS_LISTENING_QUESTIONS,
} from '../app/data/lol-worlds-listening';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';
import { useChunkFlowGame } from '../app/hooks/useChunkFlowGame';

describe('LOL Worlds Listening Bank Architecture', () => {
  it('defines exactly 4 sequential match units with proper metadata', () => {
    expect(LOL_WORLDS_LISTENING_UNITS).toHaveLength(4);

    const expectedUnits = [
      {
        id: 'lol-worlds-01-prematch',
        title: 'Pre-Match & Narrative (賽前看點與戰隊狀態)',
        unitNumber: 1,
      },
      {
        id: 'lol-worlds-02-draft',
        title: 'Draft Phase & Win Conditions (BP 選角與陣容分析)',
        unitNumber: 2,
      },
      {
        id: 'lol-worlds-03-macro',
        title: 'Early Game & Macro Objectives (前期對線、發育與地圖物件)',
        unitNumber: 3,
      },
      {
        id: 'lol-worlds-04-teamfights',
        title: 'Teamfights & Decisive Moments (關鍵團戰、巴龍與決勝時刻)',
        unitNumber: 4,
      },
    ];

    expectedUnits.forEach((expected, idx) => {
      const unit = LOL_WORLDS_LISTENING_UNITS[idx];
      expect(unit.trainingId).toBe(expected.id);
      expect(unit.title).toBe(expected.title);
      expect(unit.unitNumber).toBe(expected.unitNumber);
      expect(unit.difficulty).toBe('Easy');
      expect(unit.tags.length).toBeGreaterThan(0);
    });
  });

  it('contains exactly 40 valid questions (10 per unit) conforming to Question schema', () => {
    expect(LOL_WORLDS_LISTENING_QUESTIONS).toHaveLength(40);

    const unitIds = [
      'lol-worlds-01-prematch',
      'lol-worlds-02-draft',
      'lol-worlds-03-macro',
      'lol-worlds-04-teamfights',
    ];

    for (const unitId of unitIds) {
      const questionsInUnit = LOL_WORLDS_LISTENING_QUESTIONS.filter((q) => q.trainingId === unitId);
      expect(questionsInUnit).toHaveLength(10);
    }

    for (const q of LOL_WORLDS_LISTENING_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.sentence.trim().length).toBeGreaterThan(0);
      expect(q.translation).toBeDefined();
      expect(q.translation!.trim().length).toBeGreaterThan(0);
      expect(q.chunks.length).toBeGreaterThanOrEqual(3);
      expect(q.targetSlotIndex).toBeGreaterThanOrEqual(0);
      expect(q.targetSlotIndex).toBeLessThan(q.chunks.length);
      expect(q.chunks[q.targetSlotIndex].isTargetSlot).toBe(true);

      // Verify sentence reconstruction from chunks
      const reconstructed = q.chunks.map((c) => c.text).join(' ');
      expect(reconstructed).toBe(q.sentence);

      // Verify correct answers
      expect(['active', 'passive']).toContain(q.correctAnswers.voice);
      expect(['present', 'past', 'future']).toContain(q.correctAnswers.time);
      expect(['simple', 'continuous', 'perfect']).toContain(q.correctAnswers.aspect);

      // Verify grammar note presence and depth
      expect(q.grammarNote).toBeDefined();
      expect(q.grammarNote.length).toBeGreaterThan(30);
    }
  });

  it('enriches grammarNotes with cross-domain sports analogies (NBA, F1, etc.) and terminology breakdowns', () => {
    // Check specific terms requested by user
    const draftEngageQ = LOL_WORLDS_LISTENING_QUESTIONS.find((q) =>
      q.sentence.includes('engage tools')
    );
    expect(draftEngageQ).toBeDefined();
    expect(draftEngageQ?.grammarNote).toContain('engage tools');
    expect(draftEngageQ?.grammarNote).toContain('NBA');

    const baronPitQ = LOL_WORLDS_LISTENING_QUESTIONS.find((q) => q.sentence.includes('Baron pit'));
    expect(baronPitQ).toBeDefined();
    expect(baronPitQ?.grammarNote).toContain('Baron pit');
    expect(baronPitQ?.grammarNote).toContain('pit');
    expect(baronPitQ?.grammarNote).toContain('F1');

    // Every single question should contain sports or real-world analogies
    for (const q of LOL_WORLDS_LISTENING_QUESTIONS) {
      const note = q.grammarNote;
      const hasAnalogy =
        note.includes('NBA') ||
        note.includes('F1') ||
        note.includes('足球') ||
        note.includes('籃球') ||
        note.includes('拳擊') ||
        note.includes('棒球') ||
        note.includes('美式足球') ||
        note.includes('排球') ||
        note.includes('網球') ||
        note.includes('軍事');
      expect(hasAnalogy).toBe(true);
    }
  });

  it('registers lol-worlds-listening correctly in banks.ts', () => {
    const registered = getRegisteredBanks();
    const meta = registered.find((b) => b.id === 'lol-worlds-listening');
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('LOL 英雄聯盟世界賽聽力題庫');
    expect(meta?.category).toBe('Esports 賽事聽力題庫');
    expect(meta?.totalQuestions).toBe(40);
    expect(meta?.totalTrainings).toBe(4);

    const bank = getBankById('lol-worlds-listening');
    expect(bank).toBeDefined();
    expect(bank?.id).toBe('lol-worlds-listening');
    expect(bank?.questions).toHaveLength(40);

    const questions = getBankQuestions('lol-worlds-listening');
    expect(questions).toHaveLength(40);
  });

  it('activates isListeningMode and blind mode when selecting lol-worlds-listening in useChunkFlowGame', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('lol-worlds-listening');
    });

    expect(result.current.isListeningMode).toBe(true);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.roundStage).toBe('classify');
    expect(result.current.currentQuestion.trainingId?.startsWith('lol-worlds-')).toBe(true);
  });
});
