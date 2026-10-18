import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { QuestionBankMeta, TrainingUnitTelemetry } from '../../types/chunkflow';
import { getBankById } from '../../data/banks';
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
  markedChunksCountMap?: Record<string, number>;
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
  markedChunksCountMap = {},
}) => {
  const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
  const [showTags, setShowTags] = useState(true);
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

  const activeBank =
    banks.find((b) => b.id === activeBankId) ??
    (activeBankId ? getBankById(activeBankId) : undefined);
  const hasCurriculumGroups = Boolean(activeBank?.groups && activeBank.groups.length > 0);

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
    if (hasCurriculumGroups && activeBank?.groups) {
      return activeBank.groups.flatMap((g) => g.units);
    }
    const list = Object.values(telemetry);
    return [...list].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [telemetry, hasCurriculumGroups, activeBank]);

  const activeTrainingName = useMemo(() => {
    if (!activeTrainingId) return null;
    if (hasCurriculumGroups && activeBank?.groups) {
      const match = activeBank.groups
        .flatMap((g) => g.units)
        .find((u) => u.trainingId === activeTrainingId);
      if (match) return match.title;
    }
    return telemetry[activeTrainingId]?.lessonName ?? activeTrainingId;
  }, [activeTrainingId, hasCurriculumGroups, activeBank, telemetry]);

  // Group into clusters of 5 units (1 cluster per row)
  const clusters = useMemo(() => {
    const list = Object.values(telemetry).sort((a, b) => a.unitNumber - b.unitNumber);
    const res: TrainingUnitTelemetry[][] = [];
    for (let i = 0; i < list.length; i += 5) {
      res.push(list.slice(i, i + 5));
    }
    return res;
  }, [telemetry]);

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
              鎖定: {activeTrainingName ?? activeTrainingId}
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

        {/* Study Plan Subheader & Show Tags Switch */}
        {hasCurriculumGroups && (
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800/60 bg-zinc-950/40">
            <span className="text-xs font-medium text-zinc-400">課程進度</span>
            <button
              type="button"
              data-testid="show-tags-switch"
              role="switch"
              aria-checked={showTags}
              onClick={() => setShowTags((prev) => !prev)}
              className="group flex cursor-pointer outline-none items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 select-none transition-colors"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  showTags
                    ? 'bg-cyan-500 border-cyan-400 text-zinc-950'
                    : 'bg-zinc-800 border-zinc-700 text-transparent'
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="leading-5">Show tags</span>
            </button>
          </div>
        )}

        {/* Legend */}
        {!hasCurriculumGroups && (
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
        )}

        {/* Clustered 5-Block Stack Body vs LeetCode Study Plan Grouped Body */}
        {hasCurriculumGroups && activeBank?.groups ? (
          <div
            data-testid="training-groups-container"
            className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 custom-scrollbar"
          >
            {activeBank.groups.map((group) => (
              <div
                key={group.id}
                data-testid={`training-group-${group.id}`}
                className="w-full overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/20"
              >
                {/* Group Header */}
                <div className="flex h-10 items-center justify-between px-3.5 bg-zinc-900/80 border-b border-zinc-800/80 text-xs font-semibold text-zinc-300">
                  <span className="truncate pr-2">{group.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    ({group.units.length} 課)
                  </span>
                </div>

                {/* Lesson Rows */}
                <div className="divide-y divide-zinc-800/60">
                  {group.units.map((unit) => {
                    const isSelected = activeTrainingId === unit.trainingId;
                    const unitTel = telemetry[unit.trainingId];
                    const isCompleted = Boolean(unitTel?.isCompleted);
                    const markedCount = markedChunksCountMap[unit.trainingId] || 0;

                    const difficultyClass =
                      unit.difficulty === 'Easy'
                        ? 'text-emerald-400'
                        : unit.difficulty === 'Medium'
                          ? 'text-amber-400'
                          : 'text-rose-400';

                    return (
                      <button
                        key={unit.trainingId}
                        type="button"
                        data-testid={`training-row-${unit.trainingId}`}
                        onClick={() => onSelectTraining(isSelected ? null : unit.trainingId)}
                        className={`w-full text-left min-h-[50px] px-3.5 py-2.5 flex flex-col justify-center cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'bg-zinc-800/90 ring-1 ring-cyan-500/50'
                            : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          {/* Completion status icon */}
                          <div className="flex items-center shrink-0">
                            {isCompleted ? (
                              <svg
                                data-testid={`status-completed-${unit.trainingId}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4 text-emerald-400"
                                aria-label="Completed"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                data-testid={`status-uncompleted-${unit.trainingId}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4 text-zinc-600"
                                aria-label="Not completed"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Lesson Title & Difficulty */}
                          <div className="relative flex h-full w-full items-center justify-between min-w-0">
                            <div className="flex items-center min-w-0 pr-2">
                              <span
                                className={`text-xs sm:text-sm font-medium truncate ${
                                  isSelected ? 'text-cyan-300 font-semibold' : 'text-zinc-200'
                                }`}
                              >
                                {unit.title}
                              </span>
                              {markedCount > 0 && (
                                <span
                                  data-testid={`marked-chunk-badge-${unit.trainingId}`}
                                  className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0"
                                >
                                  {markedCount} 語塊
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-semibold shrink-0 ${difficultyClass}`}>
                              {unit.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Tag Badges */}
                        {showTags && unit.tags && unit.tags.length > 0 && (
                          <div
                            data-testid={`tag-row-${unit.trainingId}`}
                            className="mt-1.5 ml-7 flex flex-wrap gap-1"
                          >
                            {unit.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-zinc-800/70 text-zinc-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                  const markedCount = markedChunksCountMap[unit.trainingId] || 0;
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
                        className={`w-[36px] h-[36px] rounded-lg border text-xs font-mono transition-all duration-150 flex items-center justify-center cursor-pointer select-none relative ${completionStyle} ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950 scale-105 z-10'
                            : ''
                        }`}
                      >
                        {String(unit.unitNumber).padStart(2, '0')}
                        {markedCount > 0 && (
                          <span
                            data-testid={`cluster-marked-dot-${unit.trainingId}`}
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-zinc-950"
                          />
                        )}
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
                          {markedCount > 0 && (
                            <div
                              data-testid={`cluster-marked-badge-${unit.trainingId}`}
                              className="flex justify-between pt-1 border-t border-zinc-800/60"
                            >
                              <span className="text-zinc-500">標記語塊:</span>
                              <span className="font-bold text-amber-300">{markedCount} 個</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
};
