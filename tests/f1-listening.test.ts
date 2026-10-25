import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  F1_LISTENING_BANK,
  F1_LISTENING_META,
  F1_LISTENING_UNITS,
  F1_LISTENING_QUESTIONS,
} from '../app/data/f1-listening';
import { getRegisteredBanks, getBankById, getBankQuestions } from '../app/data/banks';
import { useChunkFlowGame } from '../app/hooks/useChunkFlowGame';

describe('F1 Listening Bank Architecture', () => {
  it('defines exactly 4 sequential race progression units with proper metadata', () => {
    expect(F1_LISTENING_UNITS).toHaveLength(4);

    const expectedUnits = [
      {
        id: 'f1-01-grid-start',
        title: 'Starting Grid & Lights Out (起跑排位與起步爭奪)',
        unitNumber: 1,
      },
      {
        id: 'f1-02-team-radio',
        title: 'Team Radio & Strategy (車隊無線電與進站策略)',
        unitNumber: 2,
      },
      {
        id: 'f1-03-safety-car',
        title: 'Safety Car & Track Flags (安全車出動與賽道旗號)',
        unitNumber: 3,
      },
      {
        id: 'f1-04-wheel-to-wheel',
        title: 'Wheel-to-Wheel & Chequered Flag (輪對輪纏鬥與格子旗衝線)',
        unitNumber: 4,
      },
    ];

    expectedUnits.forEach((expected, idx) => {
      const unit = F1_LISTENING_UNITS[idx];
      expect(unit.trainingId).toBe(expected.id);
      expect(unit.title).toBe(expected.title);
      expect(unit.unitNumber).toBe(expected.unitNumber);
      expect(unit.difficulty).toBe('Easy');
      expect(unit.tags.length).toBeGreaterThan(0);
    });
  });

  it('contains exactly 40 valid questions (10 per unit) conforming to Question schema', () => {
    expect(F1_LISTENING_QUESTIONS).toHaveLength(40);

    const unitIds = [
      'f1-01-grid-start',
      'f1-02-team-radio',
      'f1-03-safety-car',
      'f1-04-wheel-to-wheel',
    ];

    for (const unitId of unitIds) {
      const questionsInUnit = F1_LISTENING_QUESTIONS.filter((q) => q.trainingId === unitId);
      expect(questionsInUnit).toHaveLength(10);
    }

    for (const q of F1_LISTENING_QUESTIONS) {
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

  it('enriches grammarNotes with in-depth motorsport terminology and cross-domain analogies', () => {
    const boxBoxQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('box box box'));
    expect(boxBoxQ).toBeDefined();
    expect(boxBoxQ?.grammarNote).toContain('box box box');

    const undercutQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('undercut'));
    expect(undercutQ).toBeDefined();
    expect(undercutQ?.grammarNote).toContain('undercut');

    const drsQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('DRS'));
    expect(drsQ).toBeDefined();
    expect(drsQ?.grammarNote).toContain('DRS');

    const slipstreamQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('slipstream'));
    expect(slipstreamQ).toBeDefined();
    expect(slipstreamQ?.grammarNote).toContain('slipstream');

    const apexQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('apex'));
    expect(apexQ).toBeDefined();
    expect(apexQ?.grammarNote).toContain('apex');

    const gravelTrapQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('gravel trap'));
    expect(gravelTrapQ).toBeDefined();
    expect(gravelTrapQ?.grammarNote).toContain('gravel trap');

    const fastestLapQ = F1_LISTENING_QUESTIONS.find((q) => q.sentence.includes('fastest lap'));
    expect(fastestLapQ).toBeDefined();
    expect(fastestLapQ?.grammarNote).toContain('fastest lap');

    // Verify presence of analogies in questions
    const analogyQuestions = F1_LISTENING_QUESTIONS.filter(
      (q) =>
        q.grammarNote.includes('NBA') ||
        q.grammarNote.includes('英雄聯盟') ||
        q.grammarNote.includes('比喻') ||
        q.grammarNote.includes('開車')
    );
    expect(analogyQuestions.length).toBeGreaterThanOrEqual(30);
  });

  it('registers f1-listening correctly in banks.ts', () => {
    const registered = getRegisteredBanks();
    const meta = registered.find((b) => b.id === 'f1-listening');
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('F1 賽車廣播聽力題庫');
    expect(meta?.category).toBe('Sports 體育賽事聽力');
    expect(meta?.totalQuestions).toBe(40);
    expect(meta?.totalTrainings).toBe(4);

    const bank = getBankById('f1-listening');
    expect(bank).toBeDefined();
    expect(bank?.id).toBe('f1-listening');
    expect(bank?.questions).toHaveLength(40);

    const questions = getBankQuestions('f1-listening');
    expect(questions).toHaveLength(40);
  });

  it('activates isListeningMode and blind mode when selecting f1-listening in useChunkFlowGame', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('f1-listening');
    });

    expect(result.current.isListeningMode).toBe(true);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.roundStage).toBe('classify');
    expect(result.current.currentQuestion.trainingId?.startsWith('f1-')).toBe(true);
  });
});
