import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { QuestionBankMeta, TrainingUnitTelemetry } from '../../types/chunkflow';
import { MASTERY_TIER_STYLES } from './TrainingMatrix';

export interface TrainingMatrixDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: Record<string, TrainingUnitTelemetry>;
  activeTrainingId: string | null;
  onSelectTraining: (trainingId: string | null) => void;
  banks?: QuestionBankMeta[];
  activeBankId?: string;
  onSelectBank?: (bankId: string) => void;
}

export const TrainingMatrixDrawer: React.FC<TrainingMatrixDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  activeTrainingId,
  onSelectTraining,
  banks = [],
  activeBankId,
  onSelectBank,
}) => {
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const bankMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bankMenuRef.current && !bankMenuRef.current.contains(e.target as Node)) {
        setIsBankMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close bank dropdown menu when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsBankMenuOpen(false);
    }
  }, [isOpen]);

  const activeBank = banks.find((b) => b.id === activeBankId);

  // Group banks by category
  const categorizedBanks = useMemo(() => {
    const groups: { category: string; banks: QuestionBankMeta[] }[] = [];
    const map = new Map<string, QuestionBankMeta[]>();

    for (const bank of banks) {
      const cat = bank.category || '其他題庫';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(bank);
    }

    for (const [category, groupBanks] of map.entries()) {
      groups.push({ category, banks: groupBanks });
    }
    return groups;
  }, [banks]);

  const units = useMemo(() => {
    const list = Object.values(telemetry);
    return [...list].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [telemetry]);

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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] flex flex-col backdrop-blur-xl bg-zinc-950/85 border-r border-zinc-800/80 shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full invisible pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-800/80 bg-zinc-950/40 min-w-0 w-full">
          {onSelectBank && banks.length > 0 ? (
            <div className="relative flex-1 min-w-0 mr-2" ref={bankMenuRef}>
              <button
                type="button"
                data-testid="bank-switcher-btn"
                onClick={() => setIsBankMenuOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-700/80 bg-zinc-900/90 hover:border-cyan-500/80 text-zinc-200 transition-all cursor-pointer shadow-sm min-w-0"
                title="切換題庫"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <svg
                    className="w-3.5 h-3.5 text-cyan-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span className="font-semibold text-cyan-300 truncate min-w-0">
                    {activeBank?.name ?? '題庫'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    ({units.length} 課)
                  </span>
                </div>
                <svg
                  className="w-3 h-3 text-zinc-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isBankMenuOpen && (
                <div
                  data-testid="bank-dropdown-menu"
                  className="absolute left-0 mt-2 w-full max-h-80 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-fadeIn custom-scrollbar"
                >
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800/80 mb-1">
                    選擇題庫
                  </div>
                  {categorizedBanks.map((group) => (
                    <div key={group.category} className="mb-2 last:mb-0">
                      <div
                        data-testid={`bank-category-header-${group.category}`}
                        className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider"
                      >
                        {group.category}
                      </div>
                      <div className="space-y-0.5">
                        {group.banks.map((bank) => {
                          const isCurrent = bank.id === activeBankId;
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              data-testid={`select-bank-${bank.id}`}
                              onClick={() => {
                                onSelectBank(bank.id);
                                setIsBankMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                isCurrent
                                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                              }`}
                            >
                              <div className="flex flex-col truncate pr-2 min-w-0 flex-1">
                                <span className="truncate">{bank.name}</span>
                                <span className="text-[10px] text-zinc-500 truncate">
                                  {bank.totalQuestions} 題
                                  {bank.totalTrainings > 1 ? ` · ${bank.totalTrainings} 訓練` : ''}
                                </span>
                              </div>
                              {isCurrent && <span className="text-cyan-400 shrink-0">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
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
          )}

          <button
            type="button"
            data-testid="close-drawer-btn"
            onClick={onClose}
            title="收合抽屜"
            aria-label="Close drawer"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
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
          <span className="text-zinc-500 font-mono">進度標示</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-800" />
              <span className="text-zinc-500">未完成一輪</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span className="text-zinc-300">已完成一輪</span>
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
              className="flex items-center justify-start gap-1.5 p-1 rounded-xl bg-zinc-900/30"
            >
              {cluster.map((unit, colIdx) => {
                const isSelected = activeTrainingId === unit.trainingId;
                const isCompleted = Boolean(unit.isCompleted);
                const completionStyle = isCompleted
                  ? 'bg-cyan-400 border-white/80 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:bg-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300';

                // Dynamically align tooltip horizontally to stay safely within narrow drawer boundaries
                const tooltipAlignClass =
                  colIdx <= 1
                    ? 'left-0 translate-x-0'
                    : colIdx >= 3
                      ? 'right-0 translate-x-0'
                      : 'left-1/2 -translate-x-1/2';

                // Position tooltip above for lower clusters to prevent clipping at scroll bottom (only when list is long enough)
                const tooltipVerticalClass =
                  clusters.length > 2 && clusterIdx >= clusters.length - 2
                    ? 'bottom-full mb-2'
                    : 'top-full mt-2';

                return (
                  <div key={unit.trainingId} className="relative group flex-shrink-0">
                    <button
                      type="button"
                      data-testid={`training-block-${unit.trainingId}`}
                      onClick={() => onSelectTraining(unit.trainingId)}
                      aria-label={`${unit.lessonName}: 正確率 ${unit.accuracy}%, 嘗試 ${unit.totalAttempts} 次`}
                      className={`w-[36px] h-[36px] rounded-lg border text-xs font-mono transition-all duration-150 flex items-center justify-center cursor-pointer select-none ${completionStyle} ${
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
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isCompleted ? '已完成一輪' : '未完成'}
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
