import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TrainingMatrix } from '../app/components/chunkflow/TrainingMatrix';
import { SettingsModal } from '../app/components/chunkflow/SettingsModal';
import type { Question, TrainingUnitTelemetry } from '../app/types/chunkflow';

function createMockTelemetry(count = 50): Record<string, TrainingUnitTelemetry> {
  const result: Record<string, TrainingUnitTelemetry> = {};
  for (let i = 1; i <= count; i++) {
    const id = `parker-${String(i).padStart(2, '0')}`;
    result[id] = {
      trainingId: id,
      lessonName: `第 ${String(i).padStart(2, '0')} 課`,
      unitNumber: i,
      totalAttempts: i === 3 ? 10 : 0,
      correctAttempts: i === 3 ? 9 : 0,
      accuracy: i === 3 ? 90 : 0,
      avgLatencyMs: i === 3 ? 1200 : 0,
      bestStreak: i === 3 ? 5 : 0,
      masteryTier: i === 3 ? 4 : 0,
    };
  }
  return result;
}

describe('TrainingMatrix Component', () => {
  it('renders 50 training units grouped into 10 distinct 5-unit clusters', () => {
    const telemetry = createMockTelemetry(50);
    const onSelect = vi.fn();

    render(
      <TrainingMatrix telemetry={telemetry} activeTrainingId={null} onSelectTraining={onSelect} />
    );

    // 10 clusters
    for (let c = 0; c < 10; c++) {
      expect(screen.getByTestId(`training-cluster-${c}`)).toBeDefined();
    }

    // 50 blocks
    for (let i = 1; i <= 50; i++) {
      const id = `parker-${String(i).padStart(2, '0')}`;
      expect(screen.getByTestId(`training-block-${id}`)).toBeDefined();
    }
  });

  it('renders mastery tier styling on blocks according to performance', () => {
    const telemetry = createMockTelemetry(5);
    // Unit 1: Tier 0 (unattempted)
    telemetry['parker-01'].masteryTier = 0;
    // Unit 2: Tier 1 (<60%)
    telemetry['parker-02'].masteryTier = 1;
    // Unit 3: Tier 4 (>=90%)
    telemetry['parker-03'].masteryTier = 4;

    render(
      <TrainingMatrix
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        sortPolicy="sequential"
      />
    );

    const block1 = screen.getByTestId('training-block-parker-01');
    const block2 = screen.getByTestId('training-block-parker-02');
    const block3 = screen.getByTestId('training-block-parker-03');

    expect(block1.className).toContain('bg-zinc-900');
    expect(block2.className).toContain('bg-blue-950');
    expect(block3.className).toContain('bg-cyan-400');
  });

  it('displays tooltip with lesson telemetry details', () => {
    const telemetry = createMockTelemetry(5);
    telemetry['parker-03'].totalAttempts = 15;
    telemetry['parker-03'].accuracy = 93;
    telemetry['parker-03'].avgLatencyMs = 1150;
    telemetry['parker-03'].bestStreak = 8;

    render(
      <TrainingMatrix telemetry={telemetry} activeTrainingId={null} onSelectTraining={vi.fn()} />
    );

    const tooltip = screen.getByTestId('training-tooltip-parker-03');
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toContain('第 03 課');
    expect(tooltip.textContent).toContain('15 次');
    expect(tooltip.textContent).toContain('93%');
    expect(tooltip.textContent).toContain('1150 ms');
    expect(tooltip.textContent).toContain('8 題');
  });

  it('handles clicking a training block to select and clicking again to deselect', () => {
    const telemetry = createMockTelemetry(5);
    const onSelect = vi.fn();

    const { rerender } = render(
      <TrainingMatrix telemetry={telemetry} activeTrainingId={null} onSelectTraining={onSelect} />
    );

    const block2 = screen.getByTestId('training-block-parker-02');
    fireEvent.click(block2);
    expect(onSelect).toHaveBeenCalledWith('parker-02');

    // Rerender with parker-02 active
    rerender(
      <TrainingMatrix
        telemetry={telemetry}
        activeTrainingId="parker-02"
        onSelectTraining={onSelect}
      />
    );

    expect(screen.getByTestId('active-filter-indicator')).toBeDefined();
    expect(block2.className).toContain('ring-2 ring-cyan-400');

    // Clicking again should toggle off (pass null)
    fireEvent.click(block2);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('orders units by sequential policy or weakest-first policy', () => {
    const telemetry = createMockTelemetry(3);
    // Unit 1: attempted, 80% accuracy
    telemetry['parker-01'].totalAttempts = 5;
    telemetry['parker-01'].accuracy = 80;

    // Unit 2: attempted, 40% accuracy (weakest)
    telemetry['parker-02'].totalAttempts = 5;
    telemetry['parker-02'].accuracy = 40;

    // Unit 3: unattempted (0 attempts -> priority practice)
    telemetry['parker-03'].totalAttempts = 0;
    telemetry['parker-03'].accuracy = 0;

    // 1. Sequential order: 1, 2, 3
    const { rerender } = render(
      <TrainingMatrix
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        sortPolicy="sequential"
      />
    );

    let blocks = screen.getAllByRole('button', { name: /課/ });
    expect(blocks[0].textContent).toBe('01');
    expect(blocks[1].textContent).toBe('02');
    expect(blocks[2].textContent).toBe('03');

    // 2. Weakest first: unattempted (-1) -> 03, then lowest accuracy -> 02, then 01
    rerender(
      <TrainingMatrix
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        sortPolicy="weakest"
      />
    );

    blocks = screen.getAllByRole('button', { name: /課/ });
    expect(blocks[0].textContent).toBe('03'); // unattempted first
    expect(blocks[1].textContent).toBe('02'); // 40% accuracy next
    expect(blocks[2].textContent).toBe('01'); // 80% accuracy last
  });
});

describe('SettingsModal Training Sort Policy Controls', () => {
  it('allows toggling between weakest-first and sequential sort order', () => {
    const onUpdate = vi.fn();

    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ showGuidance: false, trainingSortPolicy: 'weakest' }}
        onUpdateSettings={onUpdate}
      />
    );

    const seqBtn = screen.getByTestId('sort-policy-sequential');
    fireEvent.click(seqBtn);
    expect(onUpdate).toHaveBeenCalledWith({ trainingSortPolicy: 'sequential' });

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={{ showGuidance: false, trainingSortPolicy: 'sequential' }}
        onUpdateSettings={onUpdate}
      />
    );

    const weakBtn = screen.getByTestId('sort-policy-weakest');
    fireEvent.click(weakBtn);
    expect(onUpdate).toHaveBeenCalledWith({ trainingSortPolicy: 'weakest' });
  });
});

describe('Direct Training Navigation and Bank Switching in useChunkFlowGame', () => {
  it('restricts candidate questions exclusively to selected trainingId', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

    const customQuestions: Question[] = [
      {
        id: 'u1-q1',
        trainingId: 'parker-01',
        sentence: 'Unit 1 Sentence',
        chunks: [
          { text: 'Unit 1', isTargetSlot: false, type: 'subject' },
          { text: 'verb 1', isTargetSlot: true, type: 'verb' },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: 'note',
      },
      {
        id: 'u2-q1',
        trainingId: 'parker-02',
        sentence: 'Unit 2 Sentence',
        chunks: [
          { text: 'Unit 2', isTargetSlot: false, type: 'subject' },
          { text: 'verb 2', isTargetSlot: true, type: 'verb' },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: 'note',
      },
    ];

    const { result } = renderHook(() => useChunkFlowGame(customQuestions));

    // Initially auto-selected to first training per progressive curriculum
    expect(result.current.activeTrainingId).toBe('parker-01');

    // Select parker-02
    act(() => {
      result.current.handleSelectTraining('parker-02');
    });

    expect(result.current.activeTrainingId).toBe('parker-02');
    expect(result.current.currentQuestion.id).toBe('u2-q1');

    // Deselect (toggle off)
    act(() => {
      result.current.handleSelectTraining(null);
    });

    expect(result.current.activeTrainingId).toBeNull();
  });

  it('resumes in-progress lesson at the first unattempted question', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');
    const { savePerformanceRecord, clearPerformanceRecords } = await import('../app/utils/storage');

    clearPerformanceRecords();

    const mockQuestions: Question[] = [
      {
        id: 'u1-q1',
        trainingId: 'parker-01',
        sentence: 'Unit 1 Sentence 1',
        chunks: [
          { text: 'Unit 1', isTargetSlot: false, type: 'subject' },
          { text: 'verb 1', isTargetSlot: true, type: 'verb' },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: 'note',
      },
      {
        id: 'u1-q2',
        trainingId: 'parker-01',
        sentence: 'Unit 1 Sentence 2',
        chunks: [
          { text: 'Unit 1', isTargetSlot: false, type: 'subject' },
          { text: 'verb 2', isTargetSlot: true, type: 'verb' },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: 'note',
      },
      {
        id: 'u1-q3',
        trainingId: 'parker-01',
        sentence: 'Unit 1 Sentence 3',
        chunks: [
          { text: 'Unit 1', isTargetSlot: false, type: 'subject' },
          { text: 'verb 3', isTargetSlot: true, type: 'verb' },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: 'note',
      },
    ];

    // Record an attempt for u1-q1
    savePerformanceRecord({
      questionId: 'u1-q1',
      latencyMs: 1200,
      isCorrect: true,
      timestamp: Date.now(),
      targetCategory: 'active-present',
    });

    const { result } = renderHook(() => useChunkFlowGame(mockQuestions));

    // When selecting parker-01, it should skip u1-q1 and load u1-q2
    act(() => {
      result.current.handleSelectTraining('parker-01');
    });

    expect(result.current.currentQuestion.id).toBe('u1-q2');

    // Advancing should pick u1-q3
    act(() => {
      result.current.advanceToNextQuestion();
    });

    expect(result.current.currentQuestion.id).toBe('u1-q3');

    clearPerformanceRecords();
  });
});

describe('Progressive Curriculum Resolution Logic', () => {
  it('correctly categorizes unit states (not-started, in-progress, completed)', async () => {
    const { computeUnitStatus } = await import('../app/utils/curriculum');

    const unitQuestions: Question[] = [
      {
        id: 'q1',
        trainingId: 't1',
        sentence: 'S1',
        chunks: [],
        targetSlotIndex: 0,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: '',
      },
      {
        id: 'q2',
        trainingId: 't1',
        sentence: 'S2',
        chunks: [],
        targetSlotIndex: 0,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: '',
      },
    ];

    // Empty history -> not-started
    expect(computeUnitStatus(unitQuestions, []).status).toBe('not-started');

    // 1 attempt -> in-progress
    expect(
      computeUnitStatus(unitQuestions, [
        { questionId: 'q1', latencyMs: 1000, isCorrect: true, timestamp: 1, targetCategory: 'c' },
      ]).status
    ).toBe('in-progress');

    // 2 attempts -> completed
    expect(
      computeUnitStatus(unitQuestions, [
        { questionId: 'q1', latencyMs: 1000, isCorrect: true, timestamp: 1, targetCategory: 'c' },
        { questionId: 'q2', latencyMs: 1200, isCorrect: false, timestamp: 2, targetCategory: 'c' },
      ]).status
    ).toBe('completed');
  });

  it('selects weakest lesson when all lessons are completed', async () => {
    const { resolveProgressiveCurriculum } = await import('../app/utils/curriculum');

    const allQuestions: Question[] = [
      {
        id: 't1-q1',
        trainingId: 't1',
        sentence: 'S1',
        chunks: [],
        targetSlotIndex: 0,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: '',
      },
      {
        id: 't2-q1',
        trainingId: 't2',
        sentence: 'S2',
        chunks: [],
        targetSlotIndex: 0,
        correctAnswers: { voice: 'active', time: 'present' },
        grammarNote: '',
      },
    ];

    // t1 has 100% accuracy, t2 has 0% accuracy
    const history = [
      { questionId: 't1-q1', latencyMs: 1000, isCorrect: true, timestamp: 1, targetCategory: 'c' },
      { questionId: 't2-q1', latencyMs: 1500, isCorrect: false, timestamp: 2, targetCategory: 'c' },
    ];

    const result = resolveProgressiveCurriculum(allQuestions, history);
    expect(result.trainingId).toBe('t2');
    expect(result.status).toBe('completed');
  });
});

describe('TrainingMatrixDrawer Component', () => {
  it('renders drawer with glassmorphic styling and handles close button and backdrop click', async () => {
    const { TrainingMatrixDrawer } =
      await import('../app/components/chunkflow/TrainingMatrixDrawer');
    const telemetry = createMockTelemetry(10);
    const onClose = vi.fn();
    const onSelect = vi.fn();

    const { rerender } = render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={onClose}
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={onSelect}
      />
    );

    const drawer = screen.getByTestId('training-matrix-drawer');
    expect(drawer).toBeDefined();
    expect(drawer.className).toContain('backdrop-blur-xl');
    expect(drawer.className).toContain('bg-zinc-950/85');
    expect(drawer.className).toContain('translate-x-0');

    // Backdrop rendered when open
    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Close button
    const closeBtn = screen.getByTestId('close-drawer-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    // When closed
    rerender(
      <TrainingMatrixDrawer
        isOpen={false}
        onClose={onClose}
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={onSelect}
      />
    );

    expect(drawer.className).toContain('-translate-x-full');
    expect(screen.queryByTestId('drawer-backdrop')).toBeNull();
  });

  it('allows clicking training block to select and unselect', async () => {
    const { TrainingMatrixDrawer } =
      await import('../app/components/chunkflow/TrainingMatrixDrawer');
    const telemetry = createMockTelemetry(10);
    const onSelect = vi.fn();

    const { rerender } = render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={telemetry}
        activeTrainingId={null}
        onSelectTraining={onSelect}
      />
    );

    const block = screen.getByTestId('training-block-parker-02');
    fireEvent.click(block);
    expect(onSelect).toHaveBeenCalledWith('parker-02');

    // Rerender with active training
    rerender(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={telemetry}
        activeTrainingId="parker-02"
        onSelectTraining={onSelect}
      />
    );

    expect(screen.getByTestId('active-filter-indicator')).toBeDefined();
    // Clicking selected block deselects
    fireEvent.click(block);
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
