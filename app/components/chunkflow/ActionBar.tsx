import React from 'react';
import type { TimeChoice, VoiceChoice } from '../../types/chunkflow';

interface ActionBarProps {
  selectedVoice: VoiceChoice | null;
  selectedTime: TimeChoice | null;
  onSelectVoice: (voice: VoiceChoice) => void;
  onSelectTime: (time: TimeChoice) => void;
  disabled?: boolean;
  showGuidance?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedVoice,
  selectedTime,
  onSelectVoice,
  onSelectTime,
  disabled = false,
  showGuidance = true,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-5 md:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
        {/* Voice Selection Group */}
        <div className="flex flex-col items-center md:items-start gap-2.5 w-full md:w-auto">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            1. Voice (語態)
          </span>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectVoice('active')}
              className={`flex-1 md:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 ${
                selectedVoice === 'active'
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Active</span>
              <kbd
                className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedVoice === 'active'
                    ? 'bg-zinc-950 text-cyan-300'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                A / J
              </kbd>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectVoice('passive')}
              className={`flex-1 md:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 ${
                selectedVoice === 'passive'
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Passive</span>
              <kbd
                className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedVoice === 'passive'
                    ? 'bg-zinc-950 text-cyan-300'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                P / K
              </kbd>
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px h-12 bg-zinc-800" />

        {/* Time / Tense Selection Group */}
        <div className="flex flex-col items-center md:items-start gap-2.5 w-full md:w-auto">
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            2. Tense (時態)
          </span>
          <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectTime('present')}
              className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                selectedTime === 'present'
                  ? 'bg-indigo-500 text-zinc-950 border-indigo-300 shadow-[0_0_22px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Present</span>
              <kbd
                className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedTime === 'present'
                    ? 'bg-zinc-950 text-indigo-300'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                1
              </kbd>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectTime('past')}
              className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                selectedTime === 'past'
                  ? 'bg-indigo-500 text-zinc-950 border-indigo-300 shadow-[0_0_22px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Past</span>
              <kbd
                className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedTime === 'past'
                    ? 'bg-zinc-950 text-indigo-300'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                2
              </kbd>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectTime('future')}
              className={`flex-1 md:flex-initial px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                selectedTime === 'future'
                  ? 'bg-indigo-500 text-zinc-950 border-indigo-300 shadow-[0_0_22px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/40'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80 hover:border-zinc-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>Future</span>
              <kbd
                className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                  selectedTime === 'future'
                    ? 'bg-zinc-950 text-indigo-300'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                3
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Guidance Hint */}
      {(showGuidance || selectedVoice || selectedTime) && (
        <div className="w-full pt-3 border-t border-zinc-800/80 text-center text-xs font-mono">
          {selectedVoice && !selectedTime && (
            <span className="text-cyan-300 flex items-center justify-center gap-1.5 animate-pulse">
              <span>
                Voice: <strong>{selectedVoice.toUpperCase()}</strong> ✓
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-300">
                {showGuidance ? 'Now select Tense [1 / 2 / 3] to submit!' : 'Select Tense'}
              </span>
            </span>
          )}
          {!selectedVoice && selectedTime && (
            <span className="text-indigo-300 flex items-center justify-center gap-1.5 animate-pulse">
              <span>
                Tense: <strong>{selectedTime.toUpperCase()}</strong> ✓
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-300">
                {showGuidance ? 'Now select Voice [A / P] to submit!' : 'Select Voice'}
              </span>
            </span>
          )}
          {!selectedVoice && !selectedTime && showGuidance && (
            <span className="text-zinc-500">
              Select Voice and Tense in any order to submit answer.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
