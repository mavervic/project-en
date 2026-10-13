import React from 'react';
import type { Question } from '../../types/chunkflow';

interface ChunkFlowArenaProps {
  question: Question;
  focusState: 'idle' | 'focusing' | 'evaluated';
  progressPercent: number; // 0 to 100
  lastEvaluation: { isCorrect: boolean; latencyMs: number } | null;
  showFeedback: boolean;
  onNextQuestion?: () => void;
}

export const ChunkFlowArena: React.FC<ChunkFlowArenaProps> = ({
  question,
  focusState,
  progressPercent,
  lastEvaluation,
  showFeedback,
  onNextQuestion,
}) => {
  const isCorrect = lastEvaluation?.isCorrect;

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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
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
        <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-mono tracking-wider text-zinc-500 uppercase">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
          <span>Syntactic Focus Arena</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">
            Target: {question.correctAnswers.time.toUpperCase()}{' '}
            {question.correctAnswers.voice.toUpperCase()}
          </span>
        </div>

        {/* Large Typography Sentence Chunks */}
        <div className="w-full text-center flex flex-wrap justify-center items-center gap-x-2.5 gap-y-3.5 my-4">
          {question.chunks.map((chunk, index) => {
            if (chunk.isTargetSlot) {
              return (
                <span
                  key={index}
                  className="relative group inline-flex items-center px-4 py-2 rounded-xl text-xl md:text-3xl font-bold tracking-tight bg-cyan-950/80 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/20 transition-transform duration-200 hover:scale-[1.02]"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-cyan-500 text-zinc-950 font-black shadow-sm">
                    {chunk.type ? `${chunk.type.toUpperCase()} SLOT` : 'TARGET SLOT'}
                  </span>
                  {chunk.text}
                </span>
              );
            }

            return (
              <span
                key={index}
                className="text-xl md:text-3xl font-medium text-zinc-300 tracking-normal hover:text-zinc-100 transition-colors"
              >
                {chunk.text}
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
