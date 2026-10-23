import React from 'react';
import { ModalShell } from './ModalShell';
import type { CategoryStat, PerformanceStats, UserPerformance } from '../../types/chunkflow';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PerformanceStats;
  categoryStats: Record<string, CategoryStat>;
  history: UserPerformance[];
  practiceMode: 'smart' | 'random';
  onTogglePracticeMode: () => void;
  onResetData: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  stats,
  categoryStats,
  history,
  practiceMode,
  onTogglePracticeMode,
  onResetData,
}) => {
  if (!isOpen) return null;

  const recentHistory = history.slice(-20);
  const maxLatency = Math.max(3000, ...recentHistory.map((h) => h.latencyMs));

  const categoryEntries = Object.values(categoryStats).sort((a, b) => {
    // Sort weak categories (lowest accuracy, or highest latency) to top
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return b.avgLatencyMs - a.avgLatencyMs;
  });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <span className="text-cyan-400">Keybr-Style</span> Performance Analytics
        </>
      }
      subtitle="Local telemetry tracking reaction latency, streak retention, and syntactic category weaknesses."
      maxWidthClass="max-w-3xl"
      closeAriaLabel="Close analytics"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePracticeMode}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 tracking-wide transition-colors cursor-pointer"
            >
              Mode: {practiceMode === 'smart' ? 'Weakness-Weighted Drill' : 'Uniform Random'}
            </button>
            <button
              onClick={onResetData}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/50 text-xs font-semibold text-zinc-400 hover:text-rose-300 tracking-wide transition-colors cursor-pointer"
            >
              Reset Saved Stats
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold tracking-wide transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Global Summary Metrics (Lifetime & Strategic Diagnostics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Lifetime Accuracy
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              {stats.totalAttempts > 0 ? `${stats.accuracy}%` : '--'}
            </div>
            <span className="text-[10px] text-zinc-400">
              {stats.correctAttempts} / {stats.totalAttempts} correct
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Lifetime Latency
            </span>
            <div className="text-2xl font-extrabold font-mono text-cyan-300 mt-1">
              {stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs}ms` : '--'}
            </div>
            <span className="text-[10px] text-zinc-400">
              Target: &lt; 2000ms
              {stats.recent?.sampleSize > 0 && (
                <span className="ml-1 text-cyan-400/80 font-mono">
                  (Recent: {stats.recent.avgLatencyMs}ms)
                </span>
              )}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Total Practiced
            </span>
            <div className="text-2xl font-extrabold font-mono text-indigo-300 mt-1">
              {stats.totalAttempts}
            </div>
            <span className="text-[10px] text-zinc-400">
              {stats.chunksPerMin > 0 ? `${stats.chunksPerMin} cpm avg` : 'Sentences completed'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Best Streak
            </span>
            <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
              {stats.bestStreak} 🔥
            </div>
            <span className="text-[10px] text-zinc-400">Current: {stats.currentStreak} 🔥</span>
          </div>
        </div>

        {/* Recent 20 Trials Latency Trend */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
              Recent Reaction Speed (Last {recentHistory.length} Trials)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded bg-emerald-500" /> Correct
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded bg-rose-500" /> Incorrect
              </span>
            </div>
          </div>

          {recentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-zinc-500">
              No recent practice trials recorded yet. Complete questions to see latency trends.
            </div>
          ) : (
            <div className="h-32 flex items-end gap-1.5 pt-4 border-b border-zinc-800">
              {recentHistory.map((item, idx) => {
                const heightPercent = Math.min(
                  100,
                  Math.max(12, (item.latencyMs / maxLatency) * 100)
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-200 text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {item.latencyMs}ms ({item.targetCategory})
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.isCorrect
                          ? 'bg-emerald-500/80 group-hover:bg-emerald-400'
                          : 'bg-rose-500/80 group-hover:bg-rose-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Syntactic Weakness Breakdown */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-300">
              Syntactic Category Mastery & Weakness Analysis
            </span>
            <span className="text-[11px] text-zinc-400">
              Sorted by weakness priority (Smart Drill target)
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-zinc-500 border border-zinc-800 rounded-xl">
              Answer more sentences to generate category-level mastery insights.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryEntries.map((cat) => {
                const isWeak = cat.accuracy < 70 || cat.avgLatencyMs > 2500;
                return (
                  <div
                    key={cat.category}
                    className={`p-4 rounded-xl border flex flex-col gap-2 transition-colors ${
                      isWeak
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-zinc-900/50 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                        {cat.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isWeak
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isWeak ? 'NEEDS FOCUS' : 'PROFICIENT'}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          cat.accuracy >= 80
                            ? 'bg-emerald-400'
                            : cat.accuracy >= 60
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${cat.accuracy}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mt-0.5">
                      <span>
                        Accuracy: <strong className="text-zinc-200">{cat.accuracy}%</strong> (
                        {cat.correct}/{cat.total})
                      </span>
                      <span>
                        Latency: <strong className="text-zinc-200">{cat.avgLatencyMs}ms</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
