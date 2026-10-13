import React from 'react';
import type { PerformanceStats } from '../../types/chunkflow';

interface HeaderHUDProps {
  stats: PerformanceStats;
  practiceMode: 'smart' | 'random';
  onTogglePracticeMode: () => void;
  onOpenAnalytics: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  stats,
  practiceMode,
  onTogglePracticeMode,
  onOpenAnalytics,
}) => {
  const getAccuracyColor = (acc: number) => {
    if (stats.totalAttempts === 0) return 'text-zinc-400';
    if (acc >= 85) return 'text-emerald-400';
    if (acc >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Brand & Mode Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-black text-zinc-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            CF
          </div>
          <span className="font-extrabold text-lg md:text-xl tracking-tight text-white">
            Chunk<span className="text-cyan-400">Flow</span>
          </span>
        </div>

        <button
          onClick={onTogglePracticeMode}
          title="Click to toggle practice algorithm"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              practiceMode === 'smart' ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'
            }`}
          />
          {practiceMode === 'smart' ? 'Weakness Drill' : 'Uniform Random'}
        </button>
      </div>

      {/* Center/Right Performance Stats */}
      <div className="flex items-center gap-4 md:gap-7">
        <div className="flex flex-col items-center sm:items-end">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
            Accuracy
          </span>
          <span className={`text-sm md:text-base font-bold font-mono ${getAccuracyColor(stats.accuracy)}`}>
            {stats.totalAttempts > 0 ? `${stats.accuracy}%` : '--'}
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
            Avg Latency
          </span>
          <span className="text-sm md:text-base font-bold font-mono text-zinc-200">
            {stats.avgLatencyMs > 0 ? `${stats.avgLatencyMs}ms` : '--'}
          </span>
        </div>

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
            Speed
          </span>
          <span className="text-sm md:text-base font-bold font-mono text-cyan-300">
            {stats.chunksPerMin > 0 ? `${stats.chunksPerMin} cpm` : '--'}
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
            Streak
          </span>
          <span className="text-sm md:text-base font-bold font-mono text-amber-400 flex items-center gap-1">
            {stats.currentStreak > 0 ? `${stats.currentStreak} 🔥` : '0'}
          </span>
        </div>

        <button
          onClick={onOpenAnalytics}
          className="px-3 py-1.5 rounded-lg border border-zinc-700/80 hover:border-cyan-500/80 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-medium text-zinc-200 tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </button>
      </div>
    </header>
  );
};
