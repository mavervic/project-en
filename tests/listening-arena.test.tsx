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

  it('suppresses stats strip and renders listening audio progress bar in listening mode', () => {
    const dummyStats = {
      totalAttempts: 10,
      correctAttempts: 9,
      accuracy: 90,
      avgLatencyMs: 420,
      chunksPerMin: 120,
      currentStreak: 5,
      bestStreak: 8,
      recent: {
        sampleSize: 10,
        totalAttempts: 10,
        correctAttempts: 9,
        avgLatencyMs: 400,
        chunksPerMin: 125,
        accuracy: 90,
      },
      byCategory: {} as any,
    };

    // When isListeningMode is true: stats-strip is NOT rendered, listening-progress-bar is rendered
    const { rerender } = render(
      <ChunkFlowArena
        question={sampleQuestion}
        focusState="idle"
        progressPercent={50}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={true}
        isListeningMode={true}
        listeningProgressPercent={45}
        stats={dummyStats}
      />
    );

    expect(screen.queryByTestId('stats-strip')).toBeNull();
    const listeningBar = screen.getByTestId('listening-progress-bar');
    expect(listeningBar).toBeDefined();
    expect(listeningBar.style.width).toBe('45%');

    // When isListeningMode is false: stats-strip is rendered, focus-progress-bar is rendered
    rerender(
      <ChunkFlowArena
        question={sampleQuestion}
        focusState="focusing"
        progressPercent={75}
        lastEvaluation={null}
        showFeedback={false}
        blindModeEnabled={false}
        isListeningMode={false}
        stats={dummyStats}
      />
    );

    expect(screen.getByTestId('stats-strip')).toBeDefined();
    const focusBar = screen.getByTestId('focus-progress-bar');
    expect(focusBar).toBeDefined();
    expect(focusBar.style.width).toBe('75%');
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

  it('records completion record and resets to blind mode on advancing to next question in listening mode', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
      result.current.handleListeningNarrationComplete();
    });

    const completedQuestionId = result.current.currentQuestion.id;
    expect(result.current.showFeedback).toBe(true);
    expect(result.current.history.length).toBe(0);

    act(() => {
      result.current.advanceToNextQuestion();
    });

    expect(result.current.showFeedback).toBe(false);
    expect(result.current.blindModeEnabled).toBe(true);

    // Performance record is saved
    expect(result.current.history.length).toBe(1);
    const record = result.current.history[0];
    expect(record.questionId).toBe(completedQuestionId);
    expect(record.isCorrect).toBe(true);
    expect(record.latencyMs).toBeGreaterThanOrEqual(80);
  });

  it('resets showFeedback and restores blind mode without saving completion record on restartCurrentQuestion', () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.handleSelectBank('toeic-listening');
      result.current.handleListeningNarrationComplete();
    });

    const currentId = result.current.currentQuestion.id;
    expect(result.current.showFeedback).toBe(true);
    expect(result.current.history.length).toBe(0);

    act(() => {
      result.current.restartCurrentQuestion();
    });

    expect(result.current.currentQuestion.id).toBe(currentId);
    expect(result.current.showFeedback).toBe(false);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.history.length).toBe(0);
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
    window.localStorage.setItem('chunkflow_active_bank_v1', 'starter');
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
