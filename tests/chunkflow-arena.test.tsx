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

  it('does not render inline S and V badges when Subject and Verb are locked', () => {
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

    const subjectChunk = screen.getByText('The supervisor');
    expect(subjectChunk).toBeDefined();
    expect(screen.queryByText(/^S$/)).toBeNull();
    expect(screen.queryByText(/^V$/)).toBeNull();
  });

  it('triggers onSpeakChunk when a chunk is clicked in showFeedback state', () => {
    const onSpeakChunk = vi.fn();
    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={{ isCorrect: true, latencyMs: 1000 }}
        showFeedback={true}
        onSpeakChunk={onSpeakChunk}
      />
    );

    const chunk = screen.getByText('The supervisor');
    fireEvent.click(chunk);

    expect(onSpeakChunk).toHaveBeenCalledTimes(1);
    expect(onSpeakChunk).toHaveBeenCalledWith('The supervisor');
  });

  it('triggers onSpeakChunk via Enter or Space keydown in showFeedback state', () => {
    const onSpeakChunk = vi.fn();
    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={{ isCorrect: true, latencyMs: 1000 }}
        showFeedback={true}
        onSpeakChunk={onSpeakChunk}
      />
    );

    const chunk = screen.getByText('The supervisor');
    fireEvent.keyDown(chunk, { key: 'Enter' });
    expect(onSpeakChunk).toHaveBeenCalledWith('The supervisor');

    fireEvent.keyDown(chunk, { key: ' ' });
    expect(onSpeakChunk).toHaveBeenCalledTimes(2);
  });

  it('renders blind mode eye toggle button to the left of narration button and toggles blind mode', () => {
    const onToggleBlindMode = vi.fn();
    const onToggleNarration = vi.fn();

    render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="idle"
        progressPercent={0}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={false}
        onToggleBlindMode={onToggleBlindMode}
        narrationEnabled={false}
        onToggleNarration={onToggleNarration}
      />
    );

    const blindBtn = screen.getByTestId('blind-mode-toggle-btn');
    const narrationBtn = screen.getByTestId('narration-toggle-btn');
    expect(blindBtn).toBeDefined();
    expect(narrationBtn).toBeDefined();

    // Verify blind-mode-toggle-btn precedes narration-toggle-btn in DOM order
    expect(
      blindBtn.compareDocumentPosition(narrationBtn) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(blindBtn);
    expect(onToggleBlindMode).toHaveBeenCalledTimes(1);
  });

  it('applies text-transparent to chunks when blindModeEnabled is true and showFeedback is false, and reveals text when showFeedback becomes true', () => {
    const { rerender } = render(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="focusing"
        progressPercent={50}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={true}
        isSubjectVerbDrill={true}
        roundStage="classify"
      />
    );

    // Listening mode pill badge is displayed
    expect(screen.getByText('🎧 Listening Mode → Classify Voice & Tense')).toBeDefined();

    // All chunks have text-transparent and do not leak subject/verb borders
    const subjectChunk = screen.getByText('The supervisor');
    const verbChunk = screen.getByText('reviews');
    const objectChunk = screen.getByText('daily attendance reports every morning.');

    expect(subjectChunk.className).toContain('text-transparent');
    expect(subjectChunk.className).not.toContain('border-sky-500/60');
    expect(verbChunk.className).toContain('text-transparent');
    expect(verbChunk.className).not.toContain('border-cyan-400');
    expect(objectChunk.className).toContain('text-transparent');

    // Upon evaluation (showFeedback = true), text-transparent is removed and highlights are revealed
    rerender(
      <ChunkFlowArena
        question={mockQuestionWithTranslation}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={{ isCorrect: true, latencyMs: 950 }}
        showFeedback={true}
        blindModeEnabled={true}
        isSubjectVerbDrill={true}
        roundStage="classify"
      />
    );

    expect(subjectChunk.className).not.toContain('text-transparent');
    expect(subjectChunk.className).toContain('border-sky-500/60');
    expect(verbChunk.className).not.toContain('text-transparent');
    expect(verbChunk.className).toContain('border-cyan-400');
    expect(objectChunk.className).not.toContain('text-transparent');
  });
});
