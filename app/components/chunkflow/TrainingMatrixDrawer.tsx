import React, { useMemo } from 'react';
import type { TrainingSortPolicy, TrainingUnitTelemetry } from '../../types/chunkflow';
import { MASTERY_TIER_STYLES } from './TrainingMatrix';

export interface TrainingMatrixDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: Record<string, TrainingUnitTelemetry>;
  activeTrainingId: string | null;
  onSelectTraining: (trainingId: string | null) => void;
  sortPolicy?: TrainingSortPolicy;
}

export const TrainingMatrixDrawer: React.FC<TrainingMatrixDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  activeTrainingId,
  onSelectTraining,
  sortPolicy = 'weakest',
}) => {
  const units = useMemo(() => {
    const list = Object.values(telemetry);

    if (sortPolicy === 'sequential') {
      return [...list].sort((a, b) => a.unitNumber - b.unitNumber);
    }

    // Weakest first: unattempted (0 attempts) or lowest accuracy first
    return [...list].sort((a, b) => {
      const aVal = a.totalAttempts === 0 ? -1 : a.accuracy;
      const bVal = b.totalAttempts === 0 ? -1 : b.accuracy;

      if (aVal !== bVal) {
        return aVal - bVal;
      }
      if (a.avgLatencyMs !== b.avgLatencyMs) {
        return b.avgLatencyMs - a.avgLatencyMs;
      }
      return a.unitNumber - b.unitNumber;
    });
  }, [telemetry, sortPolicy]);

  // Group into clusters of 5 units (1 cluster per row)
  const clusters = useMemo(() => {
    const res: TrainingUnitTelemetry[][] = [];
    for (let i = 0; i < units.length; i += 5) {
      res.push(units.slice(i, i + 5));
    }
    return res;
  }, [units]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          data-testid="drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Glassmorphic / Acrylic Drawer Sidebar */}
      <aside
        data-testid="training-matrix-drawer"
        aria-label="Training matrix drawer"
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col backdrop-blur-xl bg-zinc-950/85 border-r border-zinc-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
              ▦
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide text-zinc-100">訓練矩陣</span>
              <span className="ml-1.5 text-[11px] text-zinc-400 font-mono">
                ({units.length} 課)
              </span>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-drawer-btn"
            onClick={onClose}
            title="收合抽屜"
            aria-label="Close drawer"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Active Filter Pill */}
        {activeTrainingId && (
          <div className="px-4 py-2 border-b border-zinc-800/60 bg-cyan-500/5 flex items-center justify-between">
            <span
              data-testid="active-filter-indicator"
              className="text-xs font-medium text-cyan-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              鎖定: {telemetry[activeTrainingId]?.lessonName ?? activeTrainingId}
            </span>
            <button
              type="button"
              onClick={() => onSelectTraining(null)}
              className="text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-700/80 transition-colors"
              title="清除鎖定，練習全部"
              aria-label="清除鎖定"
            >
              ✕ 解鎖
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-950/20 flex items-center justify-between text-[10px] text-zinc-400">
          <span className="text-zinc-500 font-mono">熟練度</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-zinc-900 border border-zinc-800" />
              <span>未練</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-950 border border-blue-900" />
              <span>&lt;60%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-800 border border-blue-600" />
              <span>60%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-600 border border-cyan-400" />
              <span>80%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-cyan-400" />
              <span>≥90%</span>
            </span>
          </div>
        </div>

        {/* Clustered 5-Block Stack Body */}
        <div
          data-testid="training-clusters-container"
          className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 custom-scrollbar"
        >
          {clusters.map((cluster, clusterIdx) => (
            <div
              key={`cluster-${clusterIdx}`}
              data-testid={`training-cluster-${clusterIdx}`}
              className="flex items-center justify-between gap-1 p-1 rounded-xl bg-zinc-900/40 border border-zinc-800/60 shadow-inner"
            >
              {cluster.map((unit, colIdx) => {
                const isSelected = activeTrainingId === unit.trainingId;
                const tierStyle = MASTERY_TIER_STYLES[unit.masteryTier];

                // Dynamically align tooltip horizontally to stay safely within narrow drawer boundaries
                const tooltipAlignClass =
                  colIdx <= 1
                    ? 'left-0 translate-x-0'
                    : colIdx >= 3
                      ? 'right-0 translate-x-0'
                      : 'left-1/2 -translate-x-1/2';

                // Position tooltip above for lower clusters to prevent clipping at scroll bottom
                const tooltipVerticalClass =
                  clusterIdx >= clusters.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2';

                return (
                  <div key={unit.trainingId} className="relative group flex-1 flex justify-center">
                    <button
                      type="button"
                      data-testid={`training-block-${unit.trainingId}`}
                      onClick={() => onSelectTraining(isSelected ? null : unit.trainingId)}
                      aria-label={`${unit.lessonName}: 正確率 ${unit.accuracy}%, 嘗試 ${unit.totalAttempts} 次`}
                      className={`h-9 w-full max-w-[42px] rounded-lg border text-xs font-mono transition-all duration-150 flex items-center justify-center cursor-pointer select-none ${tierStyle} ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950 scale-105 z-10'
                          : ''
                      }`}
                    >
                      {String(unit.unitNumber).padStart(2, '0')}
                    </button>

                    {/* Hover Telemetry Tooltip */}
                    <div
                      data-testid={`training-tooltip-${unit.trainingId}`}
                      className={`pointer-events-none absolute ${tooltipAlignClass} ${tooltipVerticalClass} w-48 rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 backdrop-blur-md`}
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                        <span className="font-semibold text-xs text-zinc-100">
                          {unit.lessonName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          T{unit.masteryTier}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono text-zinc-300">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">嘗試題數:</span>
                          <span className="font-bold text-zinc-200">{unit.totalAttempts} 次</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">正確率:</span>
                          <span
                            className={`font-bold ${
                              unit.accuracy >= 80
                                ? 'text-emerald-400'
                                : unit.accuracy >= 60
                                  ? 'text-blue-400'
                                  : 'text-amber-400'
                            }`}
                          >
                            {unit.accuracy}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">平均延遲:</span>
                          <span className="text-zinc-200">
                            {unit.avgLatencyMs > 0 ? `${unit.avgLatencyMs} ms` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">最佳連擊:</span>
                          <span className="text-cyan-400">{unit.bestStreak} 題</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
