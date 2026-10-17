import React, { useMemo } from 'react';
import type { ChunkFlowSettings, SpeechAccent } from '../../types/chunkflow';
import {
  ACCENT_CONFIG,
  ACCENT_PREVIEW_SENTENCE,
  isMultilingualVoice,
} from '../../hooks/useSpeechNarration';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: ChunkFlowSettings;
  onUpdateSettings?: (newSettings: Partial<ChunkFlowSettings>) => void;
  accent?: SpeechAccent;
  onSelectAccent?: (accent: SpeechAccent) => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string | null;
  onSelectVoiceURI?: (voiceURI: string) => void;
  onPreviewVoice?: (
    text: string,
    options?: {
      force?: boolean;
      voice?: SpeechSynthesisVoice | null;
      voiceURI?: string;
      accent?: SpeechAccent;
    }
  ) => void;
}

const ACCENT_ORDER: SpeechAccent[] = ['AU', 'CA', 'GB', 'US'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accent = 'US',
  onSelectAccent,
  voices = [],
  selectedVoiceURI,
  onSelectVoiceURI,
  onPreviewVoice,
}) => {
  if (!isOpen) return null;

  const currentAccentConfig = ACCENT_CONFIG[accent] || ACCENT_CONFIG.US;
  const targetPrefix = currentAccentConfig.langPrefix;

  // Calculate voice availability per accent
  const accentAvailability = useMemo(() => {
    const availability: Record<SpeechAccent, boolean> = {
      AU: true,
      CA: true,
      GB: true,
      US: true,
    };
    if (voices.length > 0) {
      for (const acc of ACCENT_ORDER) {
        const prefix = ACCENT_CONFIG[acc].langPrefix;
        const hasVoice = voices.some((v) => v.lang.replace('_', '-').startsWith(prefix));
        availability[acc] = hasVoice;
      }
    }
    return availability;
  }, [voices]);

  // Filter voices that match the active accent prefix (excluding problematic Multilingual voices if stable dedicated voices exist)
  const filteredVoices = useMemo(() => {
    if (voices.length === 0) return [];
    const matching = voices.filter((v) => {
      const lang = v.lang.replace('_', '-');
      return lang.startsWith(targetPrefix);
    });
    const stable = matching.filter((v) => !isMultilingualVoice(v));
    return stable.length > 0 ? stable : matching;
  }, [voices, targetPrefix]);

  // Determine currently active voice
  const activeVoice = useMemo(() => {
    if (selectedVoiceURI) {
      const found = voices.find(
        (v) => v.voiceURI === selectedVoiceURI && v.lang.replace('_', '-').startsWith(targetPrefix)
      );
      if (found) return found;
    }
    // Prefer natural voice matching target accent
    const naturalMatch = filteredVoices.find((v) => {
      const name = v.name.toLowerCase();
      return name.includes('natural') || name.includes('online') || name.includes('neural');
    });
    return naturalMatch || filteredVoices[0] || null;
  }, [selectedVoiceURI, voices, filteredVoices, targetPrefix]);

  const handleSelectAccent = (accKey: SpeechAccent) => {
    onSelectAccent?.(accKey);
    onPreviewVoice?.(ACCENT_PREVIEW_SENTENCE, { force: true, accent: accKey });
  };

  const handleSelectVoiceURI = (voiceURI: string) => {
    onSelectVoiceURI?.(voiceURI);
    onPreviewVoice?.(ACCENT_PREVIEW_SENTENCE, { force: true, voiceURI, accent });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 md:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-cyan-400">Arena</span> Settings
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Customize voice synthesis and interface preferences.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-4">
          {/* Voice Settings Section */}
          <div
            data-testid="voice-settings-section"
            className="flex flex-col gap-3.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span className="text-base">🎙️</span> 語音設定
              </span>
              <span className="text-xs font-mono text-cyan-400">{currentAccentConfig.label}</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              選擇英語朗讀口音與合成語音（選定後自動播放測試句）。
            </p>

            {/* Segmented Flag Switch */}
            <div
              data-testid="accent-flag-switch"
              role="group"
              aria-label="英語口音切換"
              className="grid grid-cols-4 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/90"
            >
              {ACCENT_ORDER.map((accKey) => {
                const isSelected = accKey === accent;
                const cfg = ACCENT_CONFIG[accKey];
                const isAvailable = accentAvailability[accKey];
                return (
                  <button
                    key={accKey}
                    type="button"
                    data-testid={`flag-switch-${accKey}`}
                    disabled={!isAvailable}
                    onClick={() => handleSelectAccent(accKey)}
                    title={!isAvailable ? `${cfg.label} (目前裝置無可用語音)` : cfg.label}
                    aria-pressed={isSelected}
                    className={`py-2 px-1 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all select-none ${
                      !isAvailable
                        ? 'opacity-35 cursor-not-allowed text-zinc-600 bg-zinc-950/40 border border-transparent'
                        : isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold ring-1 ring-cyan-500/30 cursor-pointer'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent cursor-pointer'
                    }`}
                  >
                    <span className="text-xl leading-none">{cfg.flag}</span>
                    <span className="text-[11px] font-mono">{accKey}</span>
                  </button>
                );
              })}
            </div>

            {/* Synthesized Voice Dropdown Select */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label htmlFor="voice-dropdown-select" className="text-xs font-medium text-zinc-300">
                合成語音 (Voice)
              </label>

              <div className="relative">
                <select
                  id="voice-dropdown-select"
                  data-testid="voice-dropdown-select"
                  disabled={filteredVoices.length === 0}
                  value={activeVoice?.voiceURI ?? ''}
                  onChange={(e) => handleSelectVoiceURI(e.target.value)}
                  className={`w-full bg-zinc-950 border border-zinc-700/90 hover:border-cyan-500/80 text-zinc-200 rounded-xl px-3 py-2 text-xs font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-8 ${
                    filteredVoices.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {filteredVoices.length > 0 ? (
                    filteredVoices.map((v) => (
                      <option
                        key={v.voiceURI}
                        value={v.voiceURI}
                        className="bg-zinc-900 text-zinc-200"
                      >
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled className="bg-zinc-900 text-zinc-500">
                      目前裝置無此國家的可用語音合成器
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  <svg
                    className="w-3.5 h-3.5"
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
                </div>
              </div>
            </div>

            {/* Voice Priority Hint */}
            <div
              data-testid="voice-priority-guidance"
              className="text-[11px] bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-1 text-zinc-400"
            >
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>💡</span> 語音優先級判定說明
              </span>
              <p className="leading-relaxed text-zinc-400">
                系統優先選用高音質 <strong className="text-cyan-300">Natural / Neural</strong>{' '}
                線上合成語音；若瀏覽器或作業系統無此口音之自然語音，將自動採用該地區本機語音，或回退至標準美式英語
                (en-US)。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-900">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
