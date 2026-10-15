import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChunkFlowArena } from '../app/components/chunkflow/ChunkFlowArena';
import type { Question } from '../app/types/chunkflow';

describe('ChunkFlowArena - Copy Button & Translation Display', () => {
  const mockQuestionWithTranslation: Question = {
    id: 'test-q1',
    sentence: 'The supervisor reviews daily attendance reports every morning.',
    translation: '主管每天早晨都會審核每日出勤報告。',
    chunks: [
      { text: 'The supervisor', isTargetSlot: false, type: 'subject' },
      { text: 'reviews', isTargetSlot: true, type: 'verb' },
      { text: 'daily attendance reports every morning.', isTargetSlot: false, type: 'object' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'present',
      aspect: 'simple',
    },
    grammarNote: '「reviews」為現在簡單式主動語態。',
  };

  const mockQuestionWithoutTranslation: Question = {
    ...mockQuestionWithTranslation,
    id: 'test-q2',
    translation: undefined,
  };

  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders copy button and copies question sentence to clipboard with transient feedback', async () => {
    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="idle"
        progressPercent={0}
        lastEvaluation={null}
        showFeedback={false}
      />
    );

    const copyBtn = screen.getByTestId('copy-sentence-btn');
    expect(copyBtn).toBeDefined();
    expect(copyBtn.textContent).toContain('複製');

    // Click copy
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      'The supervisor reviews daily attendance reports every morning.'
    );
    expect(copyBtn.textContent).toContain('已複製');

    // Fast-forward past 1500ms
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(copyBtn.textContent).toContain('複製');
  });

  it('renders Chinese translation with badge in evaluation card when translation is present', () => {
    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={{ isCorrect: true, latencyMs: 1200 }}
        showFeedback={true}
      />
    );

    const translationEl = screen.getByTestId('sentence-translation');
    expect(translationEl).toBeDefined();
    expect(translationEl.textContent).toContain('翻譯');
    expect(translationEl.textContent).toContain('主管每天早晨都會審核每日出勤報告。');
    expect(screen.getByText('「reviews」為現在簡單式主動語態。')).toBeDefined();
  });

  it('omits translation container when question does not have translation property', () => {
    render(
      <ChunkFlowArena
        question={mockQuestionWithoutTranslation}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={{ isCorrect: true, latencyMs: 1200 }}
        showFeedback={true}
      />
    );

    expect(screen.queryByTestId('sentence-translation')).toBeNull();
    expect(screen.getByText('「reviews」為現在簡單式主動語態。')).toBeDefined();
  });

  it('renders unified top utility bar and dedicated drill status pill to eliminate mobile collision', () => {
    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="idle"
        progressPercent={0}
        lastEvaluation={null}
        showFeedback={false}
        isSubjectVerbDrill={true}
        roundStage="classify"
      />
    );

    const card = screen.getByTestId('arena-card');
    expect(card).toBeDefined();

    const watermarkText = screen.getByText('Syntactic Focus Arena');
    expect(watermarkText.className).toContain('hidden sm:inline');

    const stageBadge = screen.getByText('✓ S+V Locked → 3. Classify Voice & Tense');
    expect(stageBadge).toBeDefined();
    expect(stageBadge.className).toContain('rounded-full');

    const copyBtn = screen.getByTestId('copy-sentence-btn');
    expect(copyBtn).toBeDefined();
  });
});
