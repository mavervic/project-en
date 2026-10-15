import React, { useState, useRef, useEffect } from 'react';
import type { QuestionBankMeta, SpeechAccent } from '../../types/chunkflow';
import { ACCENT_CONFIG } from '../../hooks/useSpeechNarration';

interface HeaderHUDProps {
  practiceMode: 'smart' | 'random';
  onTogglePracticeMode: () => void;
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
  onOpenImport?: () => void;
  // Audio narration
  narrationEnabled?: boolean;
  accent?: SpeechAccent;
  onSelectAccent?: (accent: SpeechAccent) => void;
  canSelectAccents?: boolean;
  // Matrix Visibility Toggle
  showMatrix?: boolean;
  onToggleMatrix?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  practiceMode,
  onTogglePracticeMode,
  onOpenAnalytics,
  onOpenSettings,
  onOpenImport,
  narrationEnabled = false,
  accent = 'US',
  onSelectAccent,
  canSelectAccents = false,
  showMatrix = true,
  onToggleMatrix,
}) => {
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false);

  const accentMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accentMenuRef.current && !accentMenuRef.current.contains(e.target as Node)) {
        setIsAccentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentAccentConfig = ACCENT_CONFIG[accent] || ACCENT_CONFIG.US;

  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 md:px-8 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
      {/* Left: Hamburger Drawer Toggle & Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Matrix Drawer Hamburger Toggle */}
        {onToggleMatrix && (
          <button
            type="button"
            data-testid="matrix-drawer-toggle"
            onClick={onToggleMatrix}
            title={showMatrix ? '隱藏訓練矩陣' : '顯示訓練矩陣'}
            aria-label="開啟訓練矩陣"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer items-center justify-center ${
              showMatrix
                ? 'hidden'
                : 'flex bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <span data-testid="toggle-matrix-btn" className="sr-only" />
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-black text-zinc-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            CF
          </div>
          <span className="hidden sm:inline-block font-extrabold text-lg md:text-xl tracking-tight text-white">
            Chunk<span className="text-cyan-400">Flow</span>
          </span>
        </div>
      </div>

      {/* Right: Action Controls Cluster */}
      <div className="flex items-center gap-2">
        {/* Practice Algorithm Mode */}
        <button
          onClick={onTogglePracticeMode}
          title="切換練習模式演算法"
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

        {/* Flag Dropdown Selector (Only shown if narration is enabled AND natural regional voices exist) */}
        {narrationEnabled && canSelectAccents && onSelectAccent && (
          <div className="relative" ref={accentMenuRef}>
            <button
              type="button"
              data-testid="accent-selector-btn"
              onClick={() => setIsAccentMenuOpen((prev) => !prev)}
              title={`目前口音: ${currentAccentConfig.label}`}
              aria-label="選擇英語口音"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-zinc-700/80 bg-zinc-900/90 hover:border-cyan-500 text-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              <span className="text-base leading-none">{currentAccentConfig.flag}</span>
              <svg
                className="w-3 h-3 text-zinc-400"
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

            {isAccentMenuOpen && (
              <div
                data-testid="accent-dropdown-menu"
                className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-fadeIn"
              >
                <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800/80 mb-1">
                  選擇口音 (Natural)
                </div>
                {(['AU', 'GB', 'US', 'CA'] as SpeechAccent[]).map((accKey) => {
                  const cfg = ACCENT_CONFIG[accKey];
                  const isCurrent = accKey === accent;
                  return (
                    <button
                      key={accKey}
                      type="button"
                      data-testid={`select-accent-${accKey}`}
                      onClick={() => {
                        onSelectAccent(accKey);
                        setIsAccentMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none">{cfg.flag}</span>
                        <span>{cfg.label}</span>
                      </span>
                      {isCurrent && <span className="text-cyan-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Import */}
        {onOpenImport && (
          <button
            onClick={onOpenImport}
            title="匯入題庫"
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

        {/* Analytics */}
        <button
          onClick={onOpenAnalytics}
          title="統計數據"
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

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="設定"
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
