import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TrainingMatrixDrawer } from '../app/components/chunkflow/TrainingMatrixDrawer';
import { TOEIC_LISTENING_META } from '../app/data/toeic-listening';
import type { TrainingUnitTelemetry } from '../app/types/chunkflow';

describe('TrainingMatrixDrawer - Listening Badges', () => {
  const mockTelemetry: Record<string, TrainingUnitTelemetry> = {};

  (TOEIC_LISTENING_META.groups ?? [])
    .flatMap((g) => g.units)
    .forEach((unit, idx) => {
      mockTelemetry[unit.trainingId] = {
        trainingId: unit.trainingId,
        lessonName: unit.title,
        unitNumber: idx + 1,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        avgLatencyMs: 0,
        bestStreak: 0,
        masteryTier: 0,
        isCompleted: false,
      };
    });

  it('renders marked chunk counter badges next to listening units with marked chunks', () => {
    const onSelectTraining = vi.fn();
    const markedMap = {
      'listening-01': 3,
      'listening-02': 1,
    };

    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={mockTelemetry}
        activeTrainingId={null}
        onSelectTraining={onSelectTraining}
        banks={[TOEIC_LISTENING_META]}
        activeBankId="toeic-listening"
        markedChunksCountMap={markedMap}
      />
    );

    // listening-01 should have badge "3 語塊"
    const travelBadge = screen.getByTestId('marked-chunk-badge-listening-01');
    expect(travelBadge).toBeDefined();
    expect(travelBadge.textContent).toContain('3 語塊');

    // listening-02 should have badge "1 語塊"
    const diningBadge = screen.getByTestId('marked-chunk-badge-listening-02');
    expect(diningBadge).toBeDefined();
    expect(diningBadge.textContent).toContain('1 語塊');

    // listening-03 has 0 marked chunks, so no badge
    expect(screen.queryByTestId('marked-chunk-badge-listening-03')).toBeNull();
  });

  it('renders 13 distinct business situation groups in the drawer without umbrella group', () => {
    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={mockTelemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        banks={[TOEIC_LISTENING_META]}
        activeBankId="toeic-listening"
      />
    );

    // No umbrella group
    expect(screen.queryByText(/TOEIC 13 大商務情境聽力訓練/)).toBeNull();

    // 13 distinct groups exist
    for (let i = 1; i <= 13; i++) {
      const groupId = `group-listening-${String(i).padStart(2, '0')}`;
      expect(screen.getByTestId(`training-group-${groupId}`)).toBeDefined();
    }
  });

  it('allows clicking a training unit row to select it', () => {
    const onSelectTraining = vi.fn();
    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={mockTelemetry}
        activeTrainingId={null}
        onSelectTraining={onSelectTraining}
        banks={[TOEIC_LISTENING_META]}
        activeBankId="toeic-listening"
        markedChunksCountMap={{ 'listening-01': 2 }}
      />
    );

    const travelRow = screen.getByTestId('training-row-listening-01');
    fireEvent.click(travelRow);
    expect(onSelectTraining).toHaveBeenCalledWith('listening-01');
  });

  it('renders marked chunk count in cluster tooltip and dot on cluster button when active bank has no groups', () => {
    const onSelectTraining = vi.fn();
    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={mockTelemetry}
        activeTrainingId={null}
        onSelectTraining={onSelectTraining}
        markedChunksCountMap={{ 'listening-01': 4 }}
      />
    );

    // Cluster view dot
    const dot = screen.getByTestId('cluster-marked-dot-listening-01');
    expect(dot).toBeDefined();

    // Tooltip badge
    const tooltipBadge = screen.getByTestId('cluster-marked-badge-listening-01');
    expect(tooltipBadge.textContent).toContain('4 個');
  });

  it('renders attempted/total question progress ratio under status tag when showTags is active', () => {
    const customTelemetry = {
      ...mockTelemetry,
      'listening-01': {
        ...mockTelemetry['listening-01'],
        totalQuestions: 3,
        attemptedQuestions: 2,
        isCompleted: false,
      },
    };

    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={customTelemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        banks={[TOEIC_LISTENING_META]}
        activeBankId="toeic-listening"
      />
    );

    const progressRatio = screen.getByTestId('unit-progress-listening-01');
    expect(progressRatio).toBeDefined();
    expect(progressRatio.textContent).toBe('2/3');
  });

  it('renders descriptive title tooltip confirming completion status on hover', () => {
    const customTelemetry = {
      ...mockTelemetry,
      'listening-02': {
        ...mockTelemetry['listening-02'],
        totalQuestions: 3,
        attemptedQuestions: 3,
        isCompleted: true,
      },
      'listening-01': {
        ...mockTelemetry['listening-01'],
        totalQuestions: 3,
        attemptedQuestions: 2,
        isCompleted: false,
      },
    };

    render(
      <TrainingMatrixDrawer
        isOpen={true}
        onClose={vi.fn()}
        telemetry={customTelemetry}
        activeTrainingId={null}
        onSelectTraining={vi.fn()}
        banks={[TOEIC_LISTENING_META]}
        activeBankId="toeic-listening"
      />
    );

    const completedRow = screen.getByTestId('training-row-listening-02') as HTMLButtonElement;
    expect(completedRow.title).toContain('3/3');
    expect(completedRow.title).toContain('已完成');

    const inProgressRow = screen.getByTestId('training-row-listening-01') as HTMLButtonElement;
    expect(inProgressRow.title).toContain('2/3');
  });
});
