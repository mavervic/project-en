import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { ChunkFlowArena } from '../app/components/chunkflow/ChunkFlowArena';
import { useChunkFlowGame } from '../app/hooks/useChunkFlowGame';
import { TOEIC_LISTENING_QUESTIONS } from '../app/data/toeic-listening';

describe('Listening Arena - Audio-First Blind Question Flow', () => {
  const sampleQuestion = TOEIC_LISTENING_QUESTIONS[0];

  it('renders status pill indicating listening mode and reveals translation card when feedback is shown', () => {
    const { rerender } = render(
      <ChunkFlowArena
        question={sampleQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={true}
        isListeningMode={true}
      />
    );

    expect(screen.getByText('🎧 聽音辨識中...')).toBeDefined();
    // Feedback reveal card should not be visible before narration completes
    expect(screen.queryByTestId('feedback-reveal-card')).toBeNull();

    // Rerender when narration finishes (showFeedback = true)
    rerender(
      <ChunkFlowArena
        question={sampleQuestion}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={true}
        blindModeEnabled={true}
        isListeningMode={true}
      />
    );

    expect(screen.getByText('✓ 聽力播放完成 → 點選下方語塊標記盲點')).toBeDefined();
    expect(screen.getByTestId('feedback-reveal-card')).toBeDefined();
    expect(screen.getByText('LISTEN & DECODE')).toBeDefined();
    expect(screen.getByTestId('sentence-translation')).toBeDefined();
    expect(screen.getByText(sampleQuestion.translation!)).toBeDefined();
    expect(screen.getByTestId('revealed-english-sentence')).toBeDefined();
  });

  it('auto-activates blind mode and sets classify round stage when switching to toeic-listening bank', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
    });

    expect(result.current.isListeningMode).toBe(true);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.roundStage).toBe('classify');
    expect(result.current.currentQuestion.trainingId?.startsWith('listening-')).toBe(true);
  });

  it('reveals translation card when handleListeningNarrationComplete is triggered', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
    });

    expect(result.current.showFeedback).toBe(false);

    act(() => {
      result.current.handleListeningNarrationComplete();
    });

    expect(result.current.showFeedback).toBe(true);
  });

  it('resets to blind mode on advancing to next question in listening mode', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
      result.current.handleListeningNarrationComplete();
    });

    expect(result.current.showFeedback).toBe(true);

    act(() => {
      result.current.advanceToNextQuestion();
    });

    expect(result.current.showFeedback).toBe(false);
    expect(result.current.blindModeEnabled).toBe(true);
  });

  it('resets showFeedback and restores blind mode on restartCurrentQuestion', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
      result.current.handleListeningNarrationComplete();
    });

    const currentId = result.current.currentQuestion.id;
    expect(result.current.showFeedback).toBe(true);

    act(() => {
      result.current.restartCurrentQuestion();
    });

    expect(result.current.currentQuestion.id).toBe(currentId);
    expect(result.current.showFeedback).toBe(false);
    expect(result.current.blindModeEnabled).toBe(true);
  });

  it('omits blind-mode-toggle-btn and narration-toggle-btn in listening mode while keeping replay button', () => {
    const onToggleBlindMode = vi.fn();
    const onToggleNarration = vi.fn();
    const onPlayAudio = vi.fn();

    render(
      <ChunkFlowArena
        question={sampleQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={true}
        onToggleBlindMode={onToggleBlindMode}
        narrationEnabled={true}
        onToggleNarration={onToggleNarration}
        onPlayAudio={onPlayAudio}
        isListeningMode={true}
      />
    );

    expect(screen.queryByTestId('blind-mode-toggle-btn')).toBeNull();
    expect(screen.queryByTestId('narration-toggle-btn')).toBeNull();
    expect(screen.getByTestId('replay-audio-btn')).toBeDefined();
    expect(screen.getByTestId('copy-sentence-btn')).toBeDefined();
  });

  it('enforces auto-unmute and enables narration when switching to toeic-listening bank in Home', async () => {
    window.localStorage.clear();
    window.localStorage.setItem('chunkflow_narration_enabled_v1', 'false');
    window.localStorage.setItem('chunkflow_active_bank_id_v1', 'starter');

    const mockSpeak = vi.fn();
    class MockSpeechSynthesisUtterance {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });

    const { default: Home } = await import('../app/routes/home');
    render(<Home />);

    // In starter bank, narration toggle button is visible and shows 靜音
    const narrationBtn = screen.getByTestId('narration-toggle-btn');
    expect(narrationBtn.textContent).toContain('靜音');

    // Open bank switcher and select toeic-listening
    const bankSwitcherBtn = screen.getByTestId('bank-switcher-btn');
    fireEvent.click(bankSwitcherBtn);

    const listeningBankBtn = screen.getByTestId('select-bank-toeic-listening');
    act(() => {
      fireEvent.click(listeningBankBtn);
    });

    // Narration must now be auto-enabled
    expect(window.localStorage.getItem('chunkflow_narration_enabled_v1')).toBe('true');
  });
});
