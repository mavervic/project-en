import React from 'react';
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
}) => {
  const isCorrect = lastEvaluation?.isCorrect;

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
      {stats && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-2 py-1 text-xs font-mono">
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

      {/* Top Countdown / Focus Bar */}
      <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-zinc-800/80">
        <div
          className={`h-full transition-all ease-linear ${
            showFeedback
              ? isCorrect
                ? 'bg-emerald-400'
                : 'bg-rose-500'
              : focusState === 'focusing'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                : 'bg-zinc-600'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
        />
      </div>

      {/* Main Sentence Arena Card */}
      <div
        className={`relative min-h-[220px] rounded-2xl border p-8 md:p-12 flex flex-col justify-center items-center backdrop-blur-sm transition-all duration-300 ${getCardStyle()}`}
      >
        {/* Subtle Watermark Category Tag */}
        <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-mono tracking-wider text-zinc-500 uppercase flex-wrap">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
          <span>Syntactic Focus Arena</span>
          {isSubjectVerbDrill && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                roundStage === 'subject'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : roundStage === 'verb'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {roundStage === 'subject'
                ? '1. Tap Subject Chunk'
                : roundStage === 'verb'
                  ? '✓ Subject Locked → 2. Tap Verb Chunk'
                  : '✓ S+V Locked → 3. Classify Voice & Tense'}
            </span>
          )}
        </div>

        {/* Arena Audio Controls */}
        <div className="absolute top-4 right-6 flex items-center gap-2">
          {onToggleNarration && (
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
        </div>

        {/* Large Typography Sentence Chunks (Stable box geometry with 0 layout shift) */}
        <div className="w-full text-center flex flex-wrap justify-center items-center gap-x-2.5 gap-y-3.5 my-4">
          {question.chunks.map((chunk, index) => {
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
            if (!showFeedback && isSubjectVerbDrill) {
              if (roundStage === 'subject') {
                isInteractive = true;
              } else if (roundStage === 'verb') {
                isInteractive = !isSubjectChunk;
              }
            }

            const selectHandler = onSelectChunk || onSelectSubjectChunk;

            let chunkStyle = 'border-transparent bg-transparent text-zinc-300';
            if (isMisfired) {
              chunkStyle =
                'border-rose-500 bg-rose-950/60 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-shake';
            } else if (isInteractive) {
              chunkStyle =
                'border-dashed border-zinc-700/80 hover:border-cyan-400 hover:bg-zinc-900 text-zinc-200 cursor-pointer hover:scale-105 active:scale-95 shadow-sm';
            } else if (
              isSubjectChunk &&
              (isSubjectLocked || showFeedback || focusState !== 'idle')
            ) {
              chunkStyle =
                'border-sky-500/60 bg-sky-950/30 text-sky-200 ring-1 ring-sky-500/30 shadow-sm';
            } else if (isVerbChunk && isVerbLocked && (focusState !== 'idle' || showFeedback)) {
              chunkStyle =
                'border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/20';
            } else {
              chunkStyle = 'border-transparent bg-transparent text-zinc-400';
            }

            return (
              <span
                key={index}
                onClick={isInteractive ? () => selectHandler?.(index) : undefined}
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                aria-label={isInteractive ? `Select chunk: ${chunk.text}` : undefined}
                className={`relative inline-flex items-center px-3.5 py-1.5 rounded-xl border-2 text-xl md:text-3xl font-semibold tracking-tight transition-all duration-200 select-none ${chunkStyle}`}
              >
                {chunk.text}
                {isSubjectChunk && isSubjectLocked && (
                  <span className="ml-2 text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold uppercase">
                    S
                  </span>
                )}
                {isVerbChunk && roundStage === 'classify' && isSubjectVerbDrill && (
                  <span className="ml-2 text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    V
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Feedback & Grammar Note Reveal */}
      {showFeedback && lastEvaluation && (
        <div
          className={`rounded-xl border p-5 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isCorrect
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase ${
                  isCorrect ? 'bg-emerald-500 text-zinc-950' : 'bg-rose-500 text-zinc-950'
                }`}
              >
                {isCorrect ? 'PERFECT MATCH' : 'INCORRECT'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Reaction Time:{' '}
                <strong className="text-zinc-200">{lastEvaluation.latencyMs}ms</strong>
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Correct:{' '}
                <strong className="text-cyan-300 capitalize">
                  {question.correctAnswers.time} {question.correctAnswers.voice}
                </strong>
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-1">{question.grammarNote}</p>
          </div>

          {onNextQuestion && (
            <button
              onClick={onNextQuestion}
              className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all self-end sm:self-center cursor-pointer whitespace-nowrap"
            >
              Next Sentence →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
