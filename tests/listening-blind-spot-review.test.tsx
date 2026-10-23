import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useChunkFlowGame } from '../app/hooks/useChunkFlowGame';
import { ListeningNotebookModal } from '../app/components/chunkflow/ListeningNotebookModal';
import { ListeningChunkBar } from '../app/components/chunkflow/ListeningChunkBar';
import { ChunkFlowArena } from '../app/components/chunkflow/ChunkFlowArena';
import { saveMarkedChunk } from '../app/utils/storage';
import type { MarkedChunkRecord } from '../app/types/chunkflow';

describe('Listening Blind-Spot Review Drill Mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('startBlindSpotReview returns false and does not activate review mode when there are no marked chunks', () => {
    const { result } = renderHook(() => useChunkFlowGame());

    let started = false;
    act(() => {
      started = result.current.startBlindSpotReview();
    });

    expect(started).toBe(false);
    expect(result.current.isBlindSpotReviewMode).toBe(false);
  });

  it('filters questions to marked chunks when startBlindSpotReview is called', () => {
    // Pre-populate marked chunks for specific questions in parker / toeic-listening
    const record1: MarkedChunkRecord = {
      id: 'listening-01-easy-01-0',
      questionId: 'listening-01-easy-01',
      trainingId: 'listening-01-easy',
      chunkText: 'The departure gate',
      chunkIndex: 0,
      sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
      translation: '由於預定的維護工程，登機門已移至第二航廈。',
      timestamp: Date.now(),
    };
    saveMarkedChunk(record1);

    const { result } = renderHook(() => useChunkFlowGame());

    let started = false;
    act(() => {
      started = result.current.startBlindSpotReview();
    });

    expect(started).toBe(true);
    expect(result.current.isBlindSpotReviewMode).toBe(true);
    expect(result.current.isListeningMode).toBe(true);
    expect(result.current.blindModeEnabled).toBe(true);
    expect(result.current.currentQuestion.id).toBe('listening-01-easy-01');
  });

  it('handleMasterChunk removes the marked chunk and updates marked chunks count', () => {
    const record1: MarkedChunkRecord = {
      id: 'listening-01-easy-01-0',
      questionId: 'listening-01-easy-01',
      trainingId: 'listening-01-easy',
      chunkText: 'The departure gate',
      chunkIndex: 0,
      sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
      translation: '由於預定的維護工程，登機門已移至第二航廈。',
      timestamp: Date.now(),
    };
    const record2: MarkedChunkRecord = {
      id: 'listening-01-easy-02-1',
      questionId: 'listening-01-easy-02',
      trainingId: 'listening-01-easy',
      chunkText: 'present their boarding passes',
      chunkIndex: 1,
      sentence: 'Passengers must present their boarding passes before entering the boarding area.',
      translation: '乘客在進入登機區前必須出示登機證。',
      timestamp: Date.now(),
    };
    saveMarkedChunk(record1);
    saveMarkedChunk(record2);

    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.startBlindSpotReview();
    });

    expect(result.current.isBlindSpotReviewMode).toBe(true);
    expect(result.current.markedChunks.length).toBe(2);

    // Call handleMasterChunk on record 1
    act(() => {
      result.current.handleMasterChunk('listening-01-easy-01-0');
    });

    expect(result.current.markedChunks.length).toBe(1);
    expect(result.current.markedChunks[0].id).toBe('listening-01-easy-02-1');
  });

  it('exitBlindSpotReview returns to standard question pool and exits review mode', () => {
    const record1: MarkedChunkRecord = {
      id: 'listening-01-easy-01-0',
      questionId: 'listening-01-easy-01',
      trainingId: 'listening-01-easy',
      chunkText: 'The departure gate',
      chunkIndex: 0,
      sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
      translation: '由於預定的維護工程，登機門已移至第二航廈。',
      timestamp: Date.now(),
    };
    saveMarkedChunk(record1);

    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.startBlindSpotReview();
    });
    expect(result.current.isBlindSpotReviewMode).toBe(true);

    act(() => {
      result.current.exitBlindSpotReview();
    });
    expect(result.current.isBlindSpotReviewMode).toBe(false);
  });

  it('renders Start Blind-Spot Drill button in ListeningNotebookModal and triggers onStartReviewDrill and onClose', () => {
    const onStartReviewDrill = vi.fn();
    const onClose = vi.fn();
    const sampleRecord: MarkedChunkRecord = {
      id: 'listening-01-easy-01-0',
      questionId: 'listening-01-easy-01',
      trainingId: 'listening-01-easy',
      chunkText: 'The departure gate',
      chunkIndex: 0,
      sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
      translation: '由於預定的維護工程，登機門已移至第二航廈。',
      timestamp: Date.now(),
    };

    render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={onClose}
        markedChunks={[sampleRecord]}
        onStartReviewDrill={onStartReviewDrill}
      />
    );

    const drillBtn = screen.getByTestId('start-review-drill-btn');
    expect(drillBtn).toBeDefined();
    expect(drillBtn.textContent).toContain('開始盲點特訓');
    expect(drillBtn.textContent).toContain('1');

    fireEvent.click(drillBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onStartReviewDrill).toHaveBeenCalledTimes(1);
  });

  it('renders status pill and Mastered button in ChunkFlowArena during blind-spot review mode', () => {
    const onMasterChunk = vi.fn();
    const onExitReview = vi.fn();
    const mockQuestion = {
      id: 'listening-01-easy-01',
      trainingId: 'listening-01-easy',
      sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
      translation: '由於預定的維護工程，登機門已移至第二航廈。',
      chunks: [
        { text: 'The departure gate', isTargetSlot: false, type: 'subject' as const },
        { text: 'has been moved', isTargetSlot: true, type: 'verb' as const },
      ],
      targetSlotIndex: 1,
      correctAnswers: { voice: 'passive' as const, time: 'present' as const },
      grammarNote: '現在完成被動態 (has been moved)。',
    };

    render(
      <ChunkFlowArena
        question={mockQuestion}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={true}
        isListeningMode={true}
        isBlindSpotReviewMode={true}
        onMasterChunk={onMasterChunk}
        onExitReview={onExitReview}
        remainingBlindSpotsCount={3}
      />
    );

    // Status pill displays blind-spot drill mode
    expect(screen.getByText('🎯 盲點專項特訓')).toBeDefined();

    // Mastered button is rendered in feedback card
    const masterBtn = screen.getByTestId('master-chunk-btn');
    expect(masterBtn).toBeDefined();
    expect(masterBtn.textContent).toContain('✓ 已掌握');

    fireEvent.click(masterBtn);
    expect(onMasterChunk).toHaveBeenCalledTimes(1);

    // Remaining count indicator
    expect(screen.getByText('剩餘 3 個盲點語塊')).toBeDefined();
  });

  it('displays triumphant banner when all blind spots are cleared in review mode', () => {
    const onExitReview = vi.fn();
    const mockQuestion = {
      id: 'listening-01-easy-01',
      sentence: 'The departure gate has been moved to Terminal 2.',
      translation: '登機門已更換至第二航廈。',
      chunks: [{ text: 'The departure gate', isTargetSlot: false }],
      targetSlotIndex: 0,
      correctAnswers: { voice: 'passive' as const, time: 'present' as const },
      grammarNote: '現在完成被動態 (has been moved)。',
    };

    render(
      <ChunkFlowArena
        question={mockQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        isListeningMode={true}
        isBlindSpotReviewMode={true}
        remainingBlindSpotsCount={0}
        onExitReview={onExitReview}
      />
    );

    const banner = screen.getByTestId('all-blind-spots-cleared-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('所有聽力盲點皆已掌握！');

    const exitBtn = screen.getByTestId('exit-review-drill-btn');
    fireEvent.click(exitBtn);
    expect(onExitReview).toHaveBeenCalledTimes(1);
  });

  it('runs complete end-to-end review drill loop: mark, audition, drill, master, and clear', () => {
    const playAudioMock = vi.fn();
    const { result } = renderHook(() => useChunkFlowGame());

    // 1. Select listening bank
    act(() => {
      result.current.handleSelectBank('toeic-listening');
    });
    expect(result.current.isListeningMode).toBe(true);

    // 2. Mark chunk 0 on current question
    act(() => {
      result.current.handleToggleMarkChunk(0);
    });
    expect(result.current.markedChunks.length).toBe(1);
    const marked = result.current.markedChunks[0];

    // 3. Audition in ListeningNotebookModal
    const { unmount: unmountModal } = render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={vi.fn()}
        markedChunks={result.current.markedChunks}
        onPlayAudio={playAudioMock}
      />
    );

    const playSentenceBtn = screen.getByTestId(`play-sentence-${marked.id}`);
    const playChunkBtn = screen.getByTestId(`play-chunk-${marked.id}`);
    fireEvent.click(playSentenceBtn);
    expect(playAudioMock).toHaveBeenCalledWith(marked.sentence);

    fireEvent.click(playChunkBtn);
    expect(playAudioMock).toHaveBeenCalledWith(marked.chunkText);
    unmountModal();

    // 4. Solo audition in ListeningChunkBar
    const onPlayChunkMock = vi.fn();
    const { unmount: unmountBar } = render(
      <ListeningChunkBar
        chunks={result.current.currentQuestion.chunks}
        markedChunkIndices={result.current.markedChunkIndices}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        onPlayChunk={onPlayChunkMock}
      />
    );

    const soloBtn = screen.getByTestId('chunk-audio-btn-0');
    fireEvent.click(soloBtn);
    expect(onPlayChunkMock).toHaveBeenCalledWith(result.current.currentQuestion.chunks[0].text);
    unmountBar();

    // 5. Launch blind-spot review drill
    let drillStarted = false;
    act(() => {
      drillStarted = result.current.startBlindSpotReview();
    });
    expect(drillStarted).toBe(true);
    expect(result.current.isBlindSpotReviewMode).toBe(true);
    expect(result.current.currentQuestion.id).toBe(marked.questionId);

    // 6. Complete listening and render feedback in arena
    act(() => {
      result.current.handleListeningNarrationComplete();
    });
    expect(result.current.showFeedback).toBe(true);

    const { unmount: unmountArena } = render(
      <ChunkFlowArena
        question={result.current.currentQuestion}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={true}
        isListeningMode={true}
        isBlindSpotReviewMode={true}
        onMasterChunk={() => result.current.handleMasterChunk(marked.id)}
        remainingBlindSpotsCount={result.current.markedChunks.length}
      />
    );

    const masterBtn = screen.getByTestId('master-chunk-btn');
    fireEvent.click(masterBtn);
    unmountArena();

    // 7. Marked chunk eliminated and all blind spots cleared
    expect(result.current.markedChunks.length).toBe(0);
  });
});
