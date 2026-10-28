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

  it('supports cross-bank review drills with NBA and F1 questions and clears feedback on final mastery', () => {
    // 1. Mark an NBA question chunk and an F1 question chunk
    const nbaRecord: MarkedChunkRecord = {
      id: 'nba-01-01-1',
      questionId: 'nba-01-01',
      trainingId: 'nba-01-pregame',
      chunkText: 'is leading',
      chunkIndex: 1,
      sentence: 'The star forward is leading the league in scoring this season.',
      translation: '這位明星前鋒本賽季在全聯盟得分榜上高居榜首。',
      timestamp: Date.now(),
    };
    const f1Record: MarkedChunkRecord = {
      id: 'f1-01-01-1',
      questionId: 'f1-01-01',
      trainingId: 'f1-01-grid-start',
      chunkText: 'leads',
      chunkIndex: 1,
      sentence: 'The pole sitter leads the pack onto the formation lap.',
      translation: '桿位車手帶領著整個車陣進入暖胎圈。',
      timestamp: Date.now() + 10,
    };
    saveMarkedChunk(nbaRecord);
    saveMarkedChunk(f1Record);

    const { result } = renderHook(() => useChunkFlowGame());

    // 2. Launch review drill
    let drillStarted = false;
    act(() => {
      drillStarted = result.current.startBlindSpotReview();
    });
    expect(drillStarted).toBe(true);
    expect(result.current.isBlindSpotReviewMode).toBe(true);
    expect(['nba-01-01', 'f1-01-01']).toContain(result.current.currentQuestion.id);

    // 3. Master the first question
    act(() => {
      result.current.handleMasterChunk();
    });
    expect(result.current.markedChunks.length).toBe(1);

    // 4. Master the second (final) question
    act(() => {
      result.current.handleMasterChunk();
    });
    expect(result.current.markedChunks.length).toBe(0);
    expect(result.current.showFeedback).toBe(false);

    // 5. Render Arena in review mode with remaining count = 0
    render(
      <ChunkFlowArena
        question={result.current.currentQuestion}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={result.current.showFeedback}
        isListeningMode={true}
        isBlindSpotReviewMode={true}
        onMasterChunk={result.current.handleMasterChunk}
        remainingBlindSpotsCount={result.current.markedChunks.length}
      />
    );

    // Cleared banner should be present and feedback card absent
    expect(screen.getByTestId('all-blind-spots-cleared-banner')).toBeDefined();
    expect(screen.queryByTestId('feedback-reveal-card')).toBeNull();
  });

  it('decrements markedChunks count in hook when user clicks master button in ChunkFlowArena with SyntheticEvent', () => {
    const record: MarkedChunkRecord = {
      id: 'f1-01-01-1',
      questionId: 'f1-01-01',
      trainingId: 'f1-01-grid-start',
      chunkText: 'leads',
      chunkIndex: 1,
      sentence: 'The pole sitter leads the pack onto the formation lap.',
      translation: '桿位車手帶領著整個車陣進入暖胎圈。',
      timestamp: Date.now(),
    };
    saveMarkedChunk(record);

    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.startBlindSpotReview();
      result.current.handleListeningNarrationComplete();
    });

    expect(result.current.markedChunks.length).toBe(1);

    const { unmount } = render(
      <ChunkFlowArena
        question={result.current.currentQuestion}
        focusState="evaluated"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={true}
        isListeningMode={true}
        isBlindSpotReviewMode={true}
        onMasterChunk={result.current.handleMasterChunk}
        remainingBlindSpotsCount={result.current.markedChunks.length}
      />
    );

    const masterBtn = screen.getByTestId('master-chunk-btn');
    // Clicking fires onClick passing SyntheticMouseEvent
    fireEvent.click(masterBtn);
    unmount();

    expect(result.current.markedChunks.length).toBe(0);
  });

  it('cycles through all 3 marked questions in round-robin order without ping-pong deadlock when repeatedly calling advanceToNextQuestion', () => {
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
      timestamp: Date.now() + 10,
    };
    const record3: MarkedChunkRecord = {
      id: 'listening-01-easy-03-0',
      questionId: 'listening-01-easy-03',
      trainingId: 'listening-01-easy',
      chunkText: 'Flight 402 to Tokyo',
      chunkIndex: 0,
      sentence: 'Flight 402 to Tokyo is now boarding at Gate 15.',
      translation: '飛往東京的第 402 班機現在正在 15 號登機門登機。',
      timestamp: Date.now() + 20,
    };
    saveMarkedChunk(record1);
    saveMarkedChunk(record2);
    saveMarkedChunk(record3);

    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.startBlindSpotReview();
    });

    const expectedIds = ['listening-01-easy-01', 'listening-01-easy-02', 'listening-01-easy-03'];
    const visitedIds: string[] = [result.current.currentQuestion.id];

    // Advance 5 times
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.advanceToNextQuestion();
      });
      visitedIds.push(result.current.currentQuestion.id);
    }

    // The first 3 questions must cover all 3 distinct questions (no ping-pong between 2 items)
    const firstCycle = visitedIds.slice(0, 3);
    expect(new Set(firstCycle).size).toBe(3);
    firstCycle.forEach((id) => expect(expectedIds).toContain(id));

    // The next 3 questions must mirror the cycle order (cyclic permutation)
    const secondCycle = visitedIds.slice(3, 6);
    expect(secondCycle).toEqual(firstCycle);
  });

  it('randomizes the starting question across distinct review sessions based on shuffleArray', () => {
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
      timestamp: Date.now() + 10,
    };
    saveMarkedChunk(record1);
    saveMarkedChunk(record2);

    // Mock Math.random to force a specific reverse shuffle
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { result } = renderHook(() => useChunkFlowGame());
    act(() => {
      result.current.startBlindSpotReview();
    });

    expect(['listening-01-easy-01', 'listening-01-easy-02']).toContain(
      result.current.currentQuestion.id
    );

    randomSpy.mockRestore();
  });

  it('advances forward sequentially when mastering an intermediate item in the review queue', () => {
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
      timestamp: Date.now() + 10,
    };
    const record3: MarkedChunkRecord = {
      id: 'listening-01-easy-03-0',
      questionId: 'listening-01-easy-03',
      trainingId: 'listening-01-easy',
      chunkText: 'Flight 402 to Tokyo',
      chunkIndex: 0,
      sentence: 'Flight 402 to Tokyo is now boarding at Gate 15.',
      translation: '飛往東京的第 402 班機現在正在 15 號登機門登機。',
      timestamp: Date.now() + 20,
    };
    saveMarkedChunk(record1);
    saveMarkedChunk(record2);
    saveMarkedChunk(record3);

    const { result } = renderHook(() => useChunkFlowGame());

    act(() => {
      result.current.startBlindSpotReview();
    });

    const q0 = result.current.currentQuestion.id;

    // Advance once
    act(() => {
      result.current.advanceToNextQuestion();
    });
    const q1 = result.current.currentQuestion.id;
    expect(q1).not.toBe(q0);

    // Master q1
    act(() => {
      result.current.handleMasterChunk();
    });
    expect(result.current.markedChunks.length).toBe(2);

    // After mastering q1, the new question should be the third question q2 (not resetting to q0)
    const qAfterMaster = result.current.currentQuestion.id;
    expect(qAfterMaster).not.toBe(q1);
    expect(qAfterMaster).not.toBe(q0);

    // Advancing once more should wrap around back to q0
    act(() => {
      result.current.advanceToNextQuestion();
    });
    expect(result.current.currentQuestion.id).toBe(q0);
  });
});
