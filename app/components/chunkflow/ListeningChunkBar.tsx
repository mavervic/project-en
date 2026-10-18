import React from 'react';
import type { SlotChunk } from '../../types/chunkflow';

export interface ListeningChunkBarProps {
  chunks: SlotChunk[];
  markedChunkIndices: number[];
  onToggleMarkChunk: (index: number) => void;
  isNarrationPlaying: boolean;
  onNextQuestion?: () => void;
  disabled?: boolean;
  onReplayAudio?: () => void;
  isAudioPlaying?: boolean;
}

export const ListeningChunkBar: React.FC<ListeningChunkBarProps> = ({
  chunks,
  markedChunkIndices,
  onToggleMarkChunk,
  isNarrationPlaying,
  onNextQuestion,
  disabled = false,
  onReplayAudio,
  isAudioPlaying = false,
}) => {
  return (
    <div
      data-testid="listening-chunk-bar"
      className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-5 md:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md transition-all"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isNarrationPlaying ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-300 font-semibold">
            {isNarrationPlaying ? '1. 聽音理解中 (Listening)' : '2. 聽力盲點快速筆記 (Chunk Notes)'}
          </span>
        </div>

        <div className="text-xs font-mono flex items-center gap-3">
          {isNarrationPlaying ? (
            <span
              data-testid="audio-playing-indicator"
              className="text-cyan-400 flex items-center gap-1.5 animate-pulse"
            >
              <span>🎧</span> 語音播放中...
            </span>
          ) : (
            <>
              <span className="text-zinc-400">
                已標記 <strong className="text-amber-400">{markedChunkIndices.length}</strong>{' '}
                個語塊
              </span>
              {onReplayAudio && (
                <button
                  type="button"
                  data-testid="listening-replay-btn"
                  onClick={onReplayAudio}
                  disabled={disabled}
                  title="重新播放本題語音"
                  aria-label="重新播放本題語音"
                  className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-sans cursor-pointer active:scale-95 shadow-sm ${
                    isAudioPlaying
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400'
                  }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isAudioPlaying ? 'text-cyan-300 animate-spin' : 'text-cyan-400'}`}
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
                  <span>{isAudioPlaying ? '播放中...' : '重新聽這題'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chunks Selection Area */}
      {isNarrationPlaying ? (
        <div
          data-testid="listening-wait-placeholder"
          className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs font-mono"
        >
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-4 bg-cyan-400/60 rounded animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-6 bg-cyan-400/80 rounded animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-8 bg-cyan-400 rounded animate-bounce [animation-delay:300ms]" />
            <span className="w-1.5 h-6 bg-cyan-400/80 rounded animate-bounce [animation-delay:450ms]" />
            <span className="w-1.5 h-4 bg-cyan-400/60 rounded animate-bounce [animation-delay:600ms]" />
          </div>
          <span>音檔播放完畢後將自動顯示語塊供快速點選筆記</span>
        </div>
      ) : (
        <div
          data-testid="chunk-chips-container"
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2"
        >
          {chunks.map((chunk, index) => {
            const isMarked = markedChunkIndices.includes(index);
            return (
              <button
                key={`${chunk.text}-${index}`}
                type="button"
                data-testid={`chunk-chip-${index}`}
                disabled={disabled}
                onClick={() => onToggleMarkChunk(index)}
                aria-pressed={isMarked}
                title={isMarked ? '點擊取消標記' : '點擊標記為聽力盲點/生詞'}
                className={`relative px-4 py-2.5 rounded-xl border text-sm sm:text-base font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                  isMarked
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/30 font-bold'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{chunk.text}</span>
                {isMarked ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-mono font-bold">
                    盲點
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono font-normal">
                    #{index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
