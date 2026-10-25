import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  NBA_LISTENING_BANK,
  NBA_LISTENING_META,
  NBA_LISTENING_UNITS,
  NBA_LISTENING_QUESTIONS,
} from '../app/data/nba-listening';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';
import { useChunkFlowGame } from '../app/hooks/useChunkFlowGame';

describe('NBA Listening Bank Architecture', () => {
  it('defines exactly 4 sequential match units with proper metadata', () => {
    expect(NBA_LISTENING_UNITS).toHaveLength(4);

    const expectedUnits = [
      {
        id: 'nba-01-pregame',
        title: 'Pre-Game & Matchups (賽前看點與陣容對位)',
        unitNumber: 1,
      },
      {
        id: 'nba-02-halfcourt',
        title: 'Half-Court Sets & Ball Movement (陣地進攻與戰術體系)',
        unitNumber: 2,
      },
      {
        id: 'nba-03-defense',
        title: 'Defense & Fast Breaks (防守壓迫與轉換快攻)',
        unitNumber: 3,
      },
      {
        id: 'nba-04-clutch',
        title: 'Clutch Time & Buzzer Beaters (決勝關鍵與壓哨絕殺)',
        unitNumber: 4,
      },
    ];

    expectedUnits.forEach((expected, idx) => {
      const unit = NBA_LISTENING_UNITS[idx];
      expect(unit.trainingId).toBe(expected.id);
      expect(unit.title).toBe(expected.title);
      expect(unit.unitNumber).toBe(expected.unitNumber);
      expect(unit.difficulty).toBe('Easy');
      expect(unit.tags.length).toBeGreaterThan(0);
    });
  });

  it('contains exactly 40 valid questions (10 per unit) conforming to Question schema', () => {
    expect(NBA_LISTENING_QUESTIONS).toHaveLength(40);

    const unitIds = ['nba-01-pregame', 'nba-02-halfcourt', 'nba-03-defense', 'nba-04-clutch'];

    for (const unitId of unitIds) {
      const questionsInUnit = NBA_LISTENING_QUESTIONS.filter((q) => q.trainingId === unitId);
      expect(questionsInUnit).toHaveLength(10);
    }

    for (const q of NBA_LISTENING_QUESTIONS) {
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
      expect(q.grammarNote.length).toBeGreaterThan(25);
    }
  });

  it('enriches grammarNotes with in-depth basketball broadcast terminology breakdowns', () => {
    // Check specific terms defined in requirements
    const pickAndRollQ = NBA_LISTENING_QUESTIONS.find((q) => q.sentence.includes('pick-and-roll'));
    expect(pickAndRollQ).toBeDefined();
    expect(pickAndRollQ?.grammarNote).toContain('pick-and-roll');

    const stepBackThreeQ = NBA_LISTENING_QUESTIONS.find((q) =>
      q.sentence.includes('step-back three')
    );
    expect(stepBackThreeQ).toBeDefined();
    expect(stepBackThreeQ?.grammarNote).toContain('step-back three');

    const looseBallQ = NBA_LISTENING_QUESTIONS.find((q) => q.sentence.includes('loose ball'));
    expect(looseBallQ).toBeDefined();
    expect(looseBallQ?.grammarNote).toContain('loose ball');

    const buzzerBeaterQ = NBA_LISTENING_QUESTIONS.find((q) => q.sentence.includes('buzzer beater'));
    expect(buzzerBeaterQ).toBeDefined();
    expect(buzzerBeaterQ?.grammarNote).toContain('buzzer beater');

    const paintQ = NBA_LISTENING_QUESTIONS.find((q) => q.sentence.includes('in the paint'));
    expect(paintQ).toBeDefined();
    expect(paintQ?.grammarNote).toContain('in the paint');

    const transitionDunkQ = NBA_LISTENING_QUESTIONS.find((q) =>
      q.sentence.includes('transition dunk')
    );
    expect(transitionDunkQ).toBeDefined();
    expect(transitionDunkQ?.grammarNote).toContain('transition dunk');
  });

  it('registers nba-listening correctly in banks.ts', () => {
    const registered = getRegisteredBanks();
    const meta = registered.find((b) => b.id === 'nba-listening');
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('NBA 職業籃球賽事聽力題庫');
    expect(meta?.category).toBe('Sports 體育賽事聽力');
    expect(meta?.totalQuestions).toBe(40);
    expect(meta?.totalTrainings).toBe(4);

    const bank = getBankById('nba-listening');
    expect(bank).toBeDefined();
    expect(bank?.id).toBe('nba-listening');
    expect(bank?.questions).toHaveLength(40);

    const questions = getBankQuestions('nba-listening');
    expect(questions).toHaveLength(40);
  });

  it('activates isListeningMode and blind mode when selecting nba-listening in useChunkFlowGame', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('nba-listening');
    });

    expect(result.current.isListeningMode).toBe(true);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.roundStage).toBe('classify');
    expect(result.current.currentQuestion.trainingId?.startsWith('nba-')).toBe(true);
  });
});
