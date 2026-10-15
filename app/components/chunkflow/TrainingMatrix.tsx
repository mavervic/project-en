import React, { useMemo } from 'react';
import type { TrainingUnitTelemetry } from '~/types/chunkflow';

export interface TrainingMatrixProps {
  telemetry: Record<string, TrainingUnitTelemetry>;
  activeTrainingId: string | null;
  onSelectTraining: (trainingId: string | null) => void;
  className?: string;
}

export const MASTERY_TIER_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400',
  1: 'bg-blue-950/60 border-blue-900/70 text-blue-300 hover:border-blue-700 hover:bg-blue-900/60',
  2: 'bg-blue-800/60 border-blue-600/70 text-blue-200 hover:border-blue-500 hover:bg-blue-700/70',
  3: 'bg-blue-600/80 border-cyan-400/70 text-cyan-100 shadow-sm hover:border-cyan-300 hover:bg-blue-500',
  4: 'bg-cyan-400 border-white/90 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:bg-cyan-300',
};

export const TrainingMatrix: React.FC<TrainingMatrixProps> = ({
  telemetry,
  activeTrainingId,
  onSelectTraining,
  className = '',
}) => {
  const units = useMemo(() => {
    const list = Object.values(telemetry);
    return [...list].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [telemetry]);

  // Group into clusters of 5
  const clusters = useMemo(() => {
    const res: TrainingUnitTelemetry[][] = [];
    for (let i = 0; i < units.length; i += 5) {
      res.push(units.slice(i, i + 5));
    }
    return res;
  }, [units]);

  return (
    <div
      data-testid="training-matrix"
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 backdrop-blur-md shadow-xl ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
            ▦
          </div>
          <span className="text-sm font-semibold tracking-wide text-zinc-200">
            訓練單元矩陣 ({units.length} 課)
          </span>
          {activeTrainingId && (
            <span
              data-testid="active-filter-indicator"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 animate-pulse"
            >
              鎖定訓練: {telemetry[activeTrainingId]?.lessonName ?? activeTrainingId}
              <button
                type="button"
                onClick={() => onSelectTraining(null)}
                className="ml-1 text-cyan-400 hover:text-white transition-colors"
                title="清除鎖定，練習全部"
                aria-label="清除鎖定"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="hidden sm:inline text-zinc-500">熟練度:</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-800"></span>
              <span className="hidden md:inline">未練</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-950 border border-blue-900"></span>
              <span className="hidden md:inline">&lt;60%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-800 border border-blue-600"></span>
              <span className="hidden md:inline">60-79%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 border border-cyan-400"></span>
              <span className="hidden md:inline">80-89%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
              <span className="hidden md:inline">≥90%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Clustered Contribution Grid */}
      <div
        data-testid="training-clusters-container"
        className="flex flex-wrap items-center justify-start gap-3.5"
      >
        {clusters.map((cluster, clusterIdx) => (
          <div
            key={`cluster-${clusterIdx}`}
            data-testid={`training-cluster-${clusterIdx}`}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800/60 shadow-inner"
          >
            {cluster.map((unit) => {
              const isSelected = activeTrainingId === unit.trainingId;
              const tierStyle = MASTERY_TIER_STYLES[unit.masteryTier];

              return (
                <div key={unit.trainingId} className="relative group">
                  <button
                    type="button"
                    data-testid={`training-block-${unit.trainingId}`}
                    onClick={() => onSelectTraining(isSelected ? null : unit.trainingId)}
                    aria-label={`${unit.lessonName}: 正確率 ${unit.accuracy}%, 嘗試 ${unit.totalAttempts} 次`}
                    className={`h-9 w-9 rounded-lg border text-xs font-mono transition-all duration-150 flex items-center justify-center cursor-pointer select-none ${tierStyle} ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950 scale-105 z-10'
                        : ''
                    }`}
                  >
                    {String(unit.unitNumber).padStart(2, '0')}
                  </button>

                  {/* Hover Tooltip Card */}
                  <div
                    data-testid={`training-tooltip-${unit.trainingId}`}
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 text-left text-xs text-zinc-100 shadow-2xl backdrop-blur-md opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                      <span className="font-bold text-cyan-300">{unit.lessonName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        Tier {unit.masteryTier}
                      </span>
                    </div>
                    <div className="space-y-1 text-zinc-300 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">練習次數:</span>
                        <span className="font-mono">{unit.totalAttempts} 次</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">平均正確率:</span>
                        <span
                          className={`font-mono font-semibold ${
                            unit.accuracy >= 80 ? 'text-cyan-400' : 'text-zinc-200'
                          }`}
                        >
                          {unit.accuracy}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">平均延遲:</span>
                        <span className="font-mono">{unit.avgLatencyMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">最佳連續:</span>
                        <span className="font-mono">{unit.bestStreak} 題</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-cyan-400/80 text-center border-t border-zinc-800/80 pt-1">
                      {isSelected ? '點擊取消鎖定' : '點擊單元開始練習'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
