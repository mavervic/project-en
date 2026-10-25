import React, { useState, useRef } from 'react';
import type { PerformanceStats, Question } from '../../types/chunkflow';

interface ChunkFlowArenaProps {
  question: Question;
  focusState: 'idle' | 'focusing' | 'evaluated';
  progressPercent: number; // 0 to 100
  lastEvaluation: { isCorrect: boolean; latencyMs: number } | null;
  showFeedback: boolean;
  onNextQuestion?: () => void;
  stats?: PerformanceStats;
  roundStage?: 'subject' | 'verb' | 'classify';
  isSubjectVerbDrill?: boolean;
  onSelectChunk?: (index: number) => void;
  onSelectSubjectChunk?: (index: number) => void;
  chunkMisfireIndex?: number | null;
  subjectMisfireIndex?: number | null;
  onPlayAudio?: () => void;
  isSpeaking?: boolean;
  narrationEnabled?: boolean;
  onToggleNarration?: () => void;
  blindModeEnabled?: boolean;
  onToggleBlindMode?: () => void;
  onSpeakChunk?: (text: string) => void;
  isListeningMode?: boolean;
  listeningProgressPercent?: number;
  isBlindSpotReviewMode?: boolean;
  onMasterChunk?: () => void;
  onExitReview?: () => void;
  remainingBlindSpotsCount?: number;
}

export const ChunkFlowArena: React.FC<ChunkFlowArenaProps> = ({
  question,
  focusState,
  progressPercent,
  lastEvaluation,
  showFeedback,
  onNextQuestion,
  stats,
  roundStage = 'classify',
  isSubjectVerbDrill = false,
  onSelectChunk,
  onSelectSubjectChunk,
  chunkMisfireIndex,
  subjectMisfireIndex,
  onPlayAudio,
  isSpeaking = false,
  narrationEnabled = false,
  onToggleNarration,
  blindModeEnabled = false,
  onToggleBlindMode,
  onSpeakChunk,
  isListeningMode = false,
  listeningProgressPercent,
  isBlindSpotReviewMode = false,
  onMasterChunk,
  onExitReview,
  remainingBlindSpotsCount,
}) => {
  const isCorrect = lastEvaluation?.isCorrect;
  const [isCopied, setIsCopied] = useState(false);
  const [copiedChunkIndex, setCopiedChunkIndex] = useState<number | null>(null);
  const copyChunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDoubleClickChunk = async (chunkText: string, index: number) => {
    // Stop any in-flight utterance so speech doesn't overlap on double click
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(chunkText);
      }
      setCopiedChunkIndex(index);
      if (copyChunkTimeoutRef.current) clearTimeout(copyChunkTimeoutRef.current);
      copyChunkTimeoutRef.current = setTimeout(() => {
        setCopiedChunkIndex(null);
      }, 1200);
    } catch (err) {
      console.warn('Failed to copy chunk to clipboard:', err);
    }
  };

  const handleCopySentence = async () => {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(question.sentence);
      }
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy sentence:', err);
    }
  };

  const getAccuracyColor = (acc: number) => {
    if (!stats || stats.totalAttempts === 0) return 'text-zinc-400';
    if (acc >= 85) return 'text-emerald-400';
    if (acc >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Determine card style based on state and feedback
  const getCardStyle = () => {
    if (showFeedback && lastEvaluation) {
      if (isCorrect) {
        return 'bg-emerald-950/20 border-emerald-500/70 shadow-[0_0_35px_rgba(16,185,129,0.25)]';
      }
      return 'bg-rose-950/25 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)] animate-shake';
    }

    if (focusState === 'focusing') {
      return 'bg-black/90 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.12)] transition-colors duration-[4000ms] ease-out';
    }

    // Idle initial 1-second state
    return 'bg-zinc-900/60 border-zinc-800 transition-colors duration-300';
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Telemetry Metrics Bar (2x2 on Mobile, 4-column on sm+) */}
      {/* Telemetry Metrics Bar: Recent-10 Rolling Window (2x2 on Mobile, 4-column on sm+) */}
      {!isListeningMode && stats && (
        <div
          data-testid="stats-strip"
          className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-2 py-1 text-xs font-mono"
        >
          <div
            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2"
            title="Rolling accuracy over the last 10 attempts"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
              Accuracy <span className="text-[9px] text-zinc-500 font-normal">(10)</span>
            </span>
            <span
              className={`text-xs sm:text-sm font-bold ${getAccuracyColor(
                stats.recent?.sampleSize > 0 ? stats.recent.accuracy : stats.accuracy
              )}`}
            >
              {stats.recent?.sampleSize > 0
                ? `${stats.recent.accuracy}%`
                : stats.totalAttempts > 0
                  ? `${stats.accuracy}%`
                  : '--'}
            </span>
          </div>

          <div
            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2"
            title="Rolling average reaction time over the last 10 attempts"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
              Avg Latency <span className="text-[9px] text-zinc-500 font-normal">(10)</span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-200">
              {stats.recent?.sampleSize > 0 && stats.recent.avgLatencyMs > 0
                ? `${stats.recent.avgLatencyMs}ms`
                : stats.avgLatencyMs > 0
                  ? `${stats.avgLatencyMs}ms`
                  : '--'}
            </span>
          </div>

          <div
            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2"
            title="Rolling parse throughput over the last 10 attempts"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
              Speed <span className="text-[9px] text-zinc-500 font-normal">(10)</span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300">
              {stats.recent?.sampleSize > 0 && stats.recent.chunksPerMin > 0
                ? `${stats.recent.chunksPerMin} cpm`
                : stats.chunksPerMin > 0
                  ? `${stats.chunksPerMin} cpm`
                  : '--'}
            </span>
          </div>

          <div
            className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2"
            title="Current consecutive correct answer streak"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              Streak
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1">
              {stats.currentStreak > 0 ? `${stats.currentStreak} 🔥` : '0'}
            </span>
          </div>
        </div>
      )}

      {/* Top Progress Bar: Audio Playback Progress Bar in Listening Mode, or Countdown Bar in Grammar Mode */}
      <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-800/80">
        <div
          data-testid={isListeningMode ? 'listening-progress-bar' : 'focus-progress-bar'}
          className={`h-full transition-all ease-linear ${
            isListeningMode
              ? showFeedback
                ? 'bg-emerald-400 duration-300'
                : isSpeaking
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 duration-300 animate-pulse'
                  : 'bg-zinc-700 duration-200'
              : showFeedback
                ? isCorrect
                  ? 'bg-emerald-400'
                  : 'bg-rose-500'
                : focusState === 'focusing'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  : 'bg-zinc-600'
          }`}
          style={{
            width: `${Math.max(
              0,
              Math.min(
                100,
                isListeningMode
                  ? showFeedback
                    ? 100
                    : (listeningProgressPercent ?? (isSpeaking ? 50 : 0))
                  : progressPercent
              )
            )}%`,
          }}
        />
      </div>

      {/* Main Sentence Arena Card */}
      <div
        data-testid="arena-card"
        className={`relative min-h-[220px] rounded-2xl border p-4 sm:p-6 md:p-8 flex flex-col justify-between items-center backdrop-blur-sm transition-all duration-300 ${getCardStyle()}`}
      >
        {/* Arena Card Top Bar */}
        <div className="w-full flex items-center justify-between gap-3 text-xs font-mono tracking-wider text-zinc-500 uppercase">
          {/* Subtle Watermark Category Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
            <span className="hidden sm:inline">Syntactic Focus Arena</span>
          </div>

          {/* Arena Audio & Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Blind Listening Mode Eye Toggle Button (Left of Narration Button) */}
            {!isListeningMode && (
              <button
                type="button"
                data-testid="blind-mode-toggle-btn"
                onClick={onToggleBlindMode}
                title={blindModeEnabled ? '關閉聽音辨識（顯示文字）' : '開啟聽音辨識（隱藏文字）'}
                aria-label={
                  blindModeEnabled
                    ? 'Show text (disable blind listening mode)'
                    : 'Hide text (enable blind listening mode)'
                }
                aria-pressed={blindModeEnabled}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm ${
                  blindModeEnabled
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25 cursor-pointer'
                    : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                {blindModeEnabled ? (
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">{blindModeEnabled ? '聽音中' : '聽音辨識'}</span>
              </button>
            )}

            {!isListeningMode && onToggleNarration && (
              <button
                type="button"
                data-testid="narration-toggle-btn"
                onClick={onToggleNarration}
                title={narrationEnabled ? '靜音朗誦' : '開啟朗誦'}
                aria-label={narrationEnabled ? 'Mute speech' : 'Enable speech'}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-sm ${
                  narrationEnabled
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25'
                    : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {narrationEnabled ? (
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">{narrationEnabled ? '朗誦開' : '靜音'}</span>
              </button>
            )}

            {onPlayAudio && (
              <button
                type="button"
                data-testid="replay-audio-btn"
                onClick={onPlayAudio}
                title="重播音檔"
                aria-label="重播音檔"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-400 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-sm"
              >
                <svg
                  className={`w-4 h-4 ${isSpeaking ? 'text-cyan-400 animate-spin' : 'text-zinc-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">重播</span>
              </button>
            )}

            {/* Copy Sentence Button */}
            <button
              type="button"
              data-testid="copy-sentence-btn"
              onClick={handleCopySentence}
              title={isCopied ? '已複製！' : '複製句子'}
              aria-label="複製句子"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-sm ${
                isCopied
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900/90 border-zinc-700/80 hover:border-cyan-400 text-zinc-300 hover:text-cyan-300'
              }`}
            >
              {isCopied ? (
                <svg
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">{isCopied ? '已複製' : '複製'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Drill Stage Status Row (Centered, pill style) */}
        {(isSubjectVerbDrill || blindModeEnabled || isListeningMode) && (
          <div className="w-full flex justify-center items-center gap-2 my-2 sm:my-3">
            <span
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider text-center shadow-sm max-w-full ${
                isBlindSpotReviewMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : isListeningMode
                    ? showFeedback
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                    : blindModeEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : roundStage === 'subject'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : roundStage === 'verb'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isBlindSpotReviewMode
                ? '🎯 盲點專項特訓'
                : isListeningMode
                  ? showFeedback
                    ? '✓ 聽力播放完成 → 點選下方語塊標記盲點'
                    : '🎧 聽音辨識中...'
                  : blindModeEnabled
                    ? '🎧 Listening Mode → Classify Voice & Tense'
                    : roundStage === 'subject'
                      ? '1. Tap Subject Chunk'
                      : roundStage === 'verb'
                        ? '✓ Subject Locked → 2. Tap Verb Chunk'
                        : '✓ S+V Locked → 3. Classify Voice & Tense'}
            </span>
            {isBlindSpotReviewMode && onExitReview && (
              <button
                type="button"
                data-testid="exit-review-mode-btn"
                onClick={onExitReview}
                title="退出盲點特訓，返回常規題庫練習"
                className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors cursor-pointer"
              >
                ✕ 結束特訓
              </button>
            )}
          </div>
        )}

        {/* Large Typography Sentence Chunks (Stable box geometry with 0 layout shift) */}
        <div className="w-full text-center flex flex-wrap justify-center items-center gap-x-2.5 gap-y-3.5 my-auto py-3 sm:py-4">
          {question.chunks.map((chunk, index) => {
            const isTextHidden = Boolean(blindModeEnabled && !showFeedback);
            const misfireIdx =
              chunkMisfireIndex !== undefined && chunkMisfireIndex !== null
                ? chunkMisfireIndex
                : subjectMisfireIndex;
            const isMisfired = misfireIdx === index;
            const isSubjectChunk = chunk.type === 'subject';
            const isVerbChunk = chunk.type === 'verb' || chunk.isTargetSlot;

            const isSubjectLocked =
              isSubjectVerbDrill && (roundStage === 'verb' || roundStage === 'classify');
            const isVerbLocked = !isSubjectVerbDrill || roundStage === 'classify' || showFeedback;

            let isInteractive = false;
            let clickHandler: (() => void) | undefined = undefined;

            const selectHandler = onSelectChunk || onSelectSubjectChunk;

            if (!showFeedback && !isTextHidden && isSubjectVerbDrill) {
              if (roundStage === 'subject') {
                isInteractive = true;
                clickHandler = () => selectHandler?.(index);
              } else if (roundStage === 'verb') {
                isInteractive = !isSubjectChunk;
                clickHandler = () => selectHandler?.(index);
              }
            } else if (showFeedback && onSpeakChunk) {
              isInteractive = true;
              clickHandler = () => onSpeakChunk(chunk.text);
            }

            let chunkStyle = 'border-transparent bg-transparent text-zinc-300';
            if (isTextHidden) {
              chunkStyle = 'border-transparent bg-transparent text-transparent';
            } else if (isMisfired) {
              chunkStyle =
                'border-rose-500 bg-rose-950/60 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-shake';
            } else if (showFeedback) {
              if (isSubjectChunk) {
                chunkStyle =
                  'border-sky-500/60 bg-sky-950/30 text-sky-200 ring-1 ring-sky-500/30 shadow-sm cursor-pointer hover:bg-sky-900/40 hover:scale-105 active:scale-95 transition-all';
              } else if (isVerbChunk && isVerbLocked) {
                chunkStyle =
                  'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/20 cursor-pointer hover:bg-cyan-900/50 hover:scale-105 active:scale-95 transition-all';
              } else {
                chunkStyle =
                  'border-dashed border-zinc-700/60 hover:border-cyan-400 hover:bg-zinc-900 text-zinc-300 cursor-pointer hover:scale-105 active:scale-95 shadow-sm transition-all';
              }
            } else if (isInteractive) {
              chunkStyle =
                'border-dashed border-zinc-700/80 hover:border-cyan-400 hover:bg-zinc-900 text-zinc-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm';
            } else if (isSubjectChunk && (isSubjectLocked || focusState !== 'idle')) {
              chunkStyle =
                'border-sky-500/60 bg-sky-950/30 text-sky-200 ring-1 ring-sky-500/30 shadow-sm';
            } else if (isVerbChunk && isVerbLocked && focusState !== 'idle') {
              chunkStyle =
                'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/20';
            } else {
              chunkStyle = 'border-transparent bg-transparent text-zinc-400';
            }

            const isCopiedChunk = copiedChunkIndex === index;

            const chunkAriaLabel = showFeedback
              ? `朗讀語塊 (雙擊複製): ${chunk.text}`
              : isInteractive
                ? `Select chunk: ${chunk.text}`
                : undefined;

            return (
              <span
                key={`${question.id}-${index}`}
                onClick={clickHandler}
                onDoubleClick={
                  showFeedback ? () => handleDoubleClickChunk(chunk.text, index) : undefined
                }
                onKeyDown={(e) => {
                  if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    clickHandler?.();
                  }
                }}
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                aria-label={chunkAriaLabel}
                title={showFeedback ? `點擊朗讀・雙擊複製 "${chunk.text}"` : undefined}
                className={`relative inline-flex items-center px-3.5 py-1.5 rounded-xl border-2 text-xl md:text-3xl font-semibold tracking-tight ${
                  isTextHidden ? 'transition-none' : 'transition-all duration-200'
                } select-none ${
                  isCopiedChunk
                    ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400/40 scale-105'
                    : chunkStyle
                }`}
              >
                {/* Floating Copied Badge */}
                {isCopiedChunk && (
                  <span
                    data-testid={`chunk-copied-toast-${index}`}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-zinc-950 shadow-lg animate-fadeIn z-30 pointer-events-none whitespace-nowrap font-mono"
                  >
                    ✓ 已複製
                  </span>
                )}
                {chunk.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Feedback & Grammar Note Reveal (or Listening Mode Translation Reveal) */}
      {showFeedback && (lastEvaluation || isListeningMode) && (
        <div
          data-testid="feedback-reveal-card"
          className={`rounded-xl border p-5 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isListeningMode
              ? 'bg-cyan-950/25 border-cyan-500/40 text-cyan-100 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
              : isCorrect
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {isListeningMode ? (
                <>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase ${
                      isBlindSpotReviewMode
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-cyan-500 text-zinc-950'
                    }`}
                  >
                    {isBlindSpotReviewMode ? 'BLIND-SPOT REMEDIATION' : 'LISTEN & DECODE'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {isBlindSpotReviewMode
                      ? remainingBlindSpotsCount !== undefined
                        ? `剩餘 ${remainingBlindSpotsCount} 個盲點語塊`
                        : '複習盲點語塊'
                      : '點選下方語塊標記盲點，完成後前往下一題'}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase ${
                      isCorrect ? 'bg-emerald-500 text-zinc-950' : 'bg-rose-500 text-zinc-950'
                    }`}
                  >
                    {isCorrect ? 'PERFECT MATCH' : 'INCORRECT'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Reaction Time:{' '}
                    <strong className="text-zinc-200">{lastEvaluation?.latencyMs}ms</strong>
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Correct:{' '}
                    <strong className="text-cyan-300 capitalize">
                      {question.correctAnswers.time} {question.correctAnswers.voice}
                    </strong>
                  </span>
                </>
              )}
            </div>

            {question.translation && (
              <p
                data-testid="sentence-translation"
                className="text-sm font-medium text-zinc-200 mt-1 flex items-center gap-2"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                  中文翻譯
                </span>
                <span>{question.translation}</span>
              </p>
            )}

            {isListeningMode && (
              <p
                data-testid="revealed-english-sentence"
                className="text-xs font-mono text-zinc-400 mt-0.5"
              >
                {question.sentence}
              </p>
            )}

            {question.grammarNote && (
              <div className="text-sm text-zinc-300 leading-relaxed mt-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-semibold mr-2 inline-block mb-1">
                  解析筆記
                </span>
                <p className="whitespace-pre-line text-zinc-300 text-xs sm:text-sm">
                  {question.grammarNote}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {isBlindSpotReviewMode && onMasterChunk && (
              <button
                type="button"
                onClick={onMasterChunk}
                data-testid="master-chunk-btn"
                className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95"
              >
                <span>✓ 已掌握</span>
              </button>
            )}
            {onNextQuestion && (
              <button
                onClick={onNextQuestion}
                data-testid="next-question-btn"
                className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                Next Sentence →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Banner when all blind spots are cleared in review drill */}
      {isBlindSpotReviewMode && remainingBlindSpotsCount === 0 && (
        <div
          data-testid="all-blind-spots-cleared-banner"
          className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 text-center flex flex-col items-center justify-center gap-3"
        >
          <span className="text-3xl">🎉</span>
          <h3 className="text-emerald-300 font-bold text-base">所有聽力盲點皆已掌握！</h3>
          <p className="text-xs text-zinc-400 font-mono">恭喜清除所有標記的聽力盲點，繼續保持！</p>
          {onExitReview && (
            <button
              type="button"
              data-testid="exit-review-drill-btn"
              onClick={onExitReview}
              className="mt-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow"
            >
              返回常規題庫練習
            </button>
          )}
        </div>
      )}
    </div>
  );
};
