import React from 'react';

interface HeaderHUDProps {
  practiceMode: 'smart' | 'random';
  onTogglePracticeMode: () => void;
  isSubjectVerbDrill?: boolean;
  onToggleSubjectVerbDrill?: () => void;
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
  onOpenImport?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  practiceMode,
  onTogglePracticeMode,
  isSubjectVerbDrill = true,
  onToggleSubjectVerbDrill,
  onOpenAnalytics,
  onOpenSettings,
  onOpenImport,
}) => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 md:px-8 py-3 flex items-center justify-between gap-3 sm:gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-black text-zinc-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          CF
        </div>
        <span className="hidden sm:inline-block font-extrabold text-lg md:text-xl tracking-tight text-white">
          Chunk<span className="text-cyan-400">Flow</span>
        </span>
      </div>

      {/* Action Controls Cluster */}
      <div className="flex items-center gap-2">
        {onToggleSubjectVerbDrill && (
          <button
            onClick={onToggleSubjectVerbDrill}
            title={
              isSubjectVerbDrill
                ? 'S+V Drill: Lock Subject chunk first, then classify Verb (Click to switch to Verb Only)'
                : 'Verb Only Drill: Direct verb classification (Click to switch to S+V Drill)'
            }
            aria-label="Toggle Subject-Verb drill mode"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSubjectVerbDrill ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span className="hidden xs:inline">
              {isSubjectVerbDrill ? 'S+V Drill' : 'Verb Only'}
            </span>
            <span className="xs:hidden">{isSubjectVerbDrill ? 'S+V' : 'Verb'}</span>
          </button>
        )}

        <button
          onClick={onTogglePracticeMode}
          title="Click to toggle practice algorithm"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              practiceMode === 'smart' ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-500'
            }`}
          />
          <span className="hidden xs:inline">
            {practiceMode === 'smart' ? 'Weakness Drill' : 'Uniform Random'}
          </span>
          <span className="xs:hidden">{practiceMode === 'smart' ? 'Drill' : 'Random'}</span>
        </button>

        {onOpenImport && (
          <button
            onClick={onOpenImport}
            title="Import custom questions"
            aria-label="Import custom questions"
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-700/80 hover:border-cyan-500/80 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-medium text-zinc-200 tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="hidden sm:inline">Import</span>
          </button>
        )}
        <button
          onClick={onOpenAnalytics}
          title="Analytics"
          className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-700/80 hover:border-cyan-500/80 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-medium text-zinc-200 tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="hidden sm:inline">Analytics</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 rounded-lg border border-zinc-700/80 hover:border-cyan-500/80 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
          aria-label="Settings"
        >
          <svg
            className="w-4 h-4 text-zinc-300 hover:text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
