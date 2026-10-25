import React, { useMemo } from 'react';
import { ModalShell } from './ModalShell';
import type { ChunkFlowSettings, NarrationSequenceMode, SpeechAccent } from '../../types/chunkflow';
import {
  ACCENT_CONFIG,
  ACCENT_PREVIEW_SENTENCE,
  findChineseVoice,
  isMultilingualVoice,
} from '../../hooks/useSpeechNarration';
import {
  loadListeningNarrationMode,
  loadListeningPauseInterval,
  loadListeningSpeechRate,
  saveListeningNarrationMode,
  saveListeningPauseInterval,
  saveListeningSpeechRate,
} from '../../utils/storage';

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
  hasChineseVoice?: boolean;
  onPreviewVoice?: (
    text: string,
    options?: {
      force?: boolean;
      voice?: SpeechSynthesisVoice | null;
      voiceURI?: string;
      accent?: SpeechAccent;
      rate?: number;
    }
  ) => void;
}

const ACCENT_ORDER: SpeechAccent[] = ['AU', 'CA', 'GB', 'US'];
const SPEECH_RATES = [0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
const PAUSE_INTERVALS = [600, 700, 800, 1000];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  accent = 'US',
  onSelectAccent,
  voices = [],
  selectedVoiceURI,
  onSelectVoiceURI,
  hasChineseVoice,
  onPreviewVoice,
}) => {
  if (!isOpen) return null;

  const resolvedHasChineseVoice =
    hasChineseVoice !== undefined ? hasChineseVoice : Boolean(findChineseVoice(voices));

  const activeSequenceMode = settings?.listeningNarrationMode ?? loadListeningNarrationMode();
  const activePauseInterval = settings?.listeningPauseIntervalMs ?? loadListeningPauseInterval();
  const activeSpeechRate = settings?.listeningSpeechRate ?? loadListeningSpeechRate();

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
    onPreviewVoice?.(ACCENT_PREVIEW_SENTENCE, {
      force: true,
      accent: accKey,
      rate: activeSpeechRate,
    });
  };

  const handleSelectVoiceURI = (voiceURI: string) => {
    onSelectVoiceURI?.(voiceURI);
    onPreviewVoice?.(ACCENT_PREVIEW_SENTENCE, {
      force: true,
      voiceURI,
      accent,
      rate: activeSpeechRate,
    });
  };

  const handleSelectSequenceMode = (mode: NarrationSequenceMode) => {
    saveListeningNarrationMode(mode);
    onUpdateSettings?.({ listeningNarrationMode: mode });
  };

  const handleSelectSpeechRate = (rate: number) => {
    saveListeningSpeechRate(rate);
    onUpdateSettings?.({ listeningSpeechRate: rate });
    onPreviewVoice?.(ACCENT_PREVIEW_SENTENCE, {
      force: true,
      accent,
      voiceURI: selectedVoiceURI ?? undefined,
      rate,
    });
  };

  const handleSelectPauseInterval = (intervalMs: number) => {
    saveListeningPauseInterval(intervalMs);
    onUpdateSettings?.({ listeningPauseIntervalMs: intervalMs });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <span className="text-cyan-400">Arena</span> Settings
        </>
      }
      subtitle="Customize voice synthesis and interface preferences."
      maxWidthClass="max-w-md"
      closeAriaLabel="Close settings"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
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

          {/* Staged Accent Training Guidance Card */}
          <div
            data-testid="accent-guidance-card"
            className="text-[11px] bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3 flex flex-col gap-1.5 text-zinc-300"
          >
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <span>🎯</span> 口音循序訓練指南（聽力進階建議）
            </span>
            <div className="flex flex-col gap-1 text-zinc-400 leading-relaxed font-sans">
              <p>
                • <strong className="text-zinc-200">初期 / 一刷（建立自信）</strong>：優先選擇{' '}
                <span className="text-cyan-300">🇺🇸 美式</span> 或{' '}
                <span className="text-cyan-300">🇨🇦 加拿大</span>{' '}
                口音。在熟悉的捲舌（Rhotic）與發音習慣下建立「聲音➔字義」快速連結，減少初期認知負擔。
              </p>
              <p>
                • <strong className="text-zinc-200">進階 / 多刷（高壓特訓）</strong>：切換至{' '}
                <span className="text-cyan-300">🇬🇧 英式</span> 或{' '}
                <span className="text-cyan-300">🇦🇺 澳洲</span>{' '}
                口音。重點適應非捲舌音（Non-rhotic）及母音位移，全方位攻克多益多國口音盲區。
              </p>
            </div>
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
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Speech Rate Selection */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">朗誦速度 (Playback Speed)</label>
              <span className="text-xs font-mono text-cyan-400">{activeSpeechRate}x</span>
            </div>
            <div
              data-testid="speech-rate-switch"
              role="group"
              aria-label="朗誦速度切換"
              className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/90"
            >
              {SPEECH_RATES.map((rate) => {
                const isSelected = activeSpeechRate === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    data-testid={`rate-button-${rate}`}
                    onClick={() => handleSelectSpeechRate(rate)}
                    aria-pressed={isSelected}
                    className={`py-1.5 px-1 rounded-lg text-xs font-mono transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold ring-1 ring-cyan-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    {rate}x
                  </button>
                );
              })}
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

        {/* Listening Settings Section */}
        <div
          data-testid="listening-settings-section"
          className="flex flex-col gap-3.5 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span className="text-base">🎧</span> 聽力題庫朗誦設定
            </span>
            <span className="text-xs font-mono text-cyan-400">{activePauseInterval}ms</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            設定聽力題庫的朗誦順序循環與語句間隔停頓時間。
          </p>

          {/* Sequence Mode Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-300">
              朗誦順序模式 (Narration Sequence)
            </label>
            <div
              data-testid="listening-sequence-mode-switch"
              role="group"
              aria-label="朗誦順序模式"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/90"
            >
              <button
                type="button"
                data-testid="sequence-mode-en2-zh1-en1"
                onClick={() => handleSelectSequenceMode('en2-zh1-en1')}
                aria-pressed={activeSequenceMode === 'en2-zh1-en1'}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  activeSequenceMode === 'en2-zh1-en1'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold ring-1 ring-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span className="font-semibold">預設循環</span>
                <span className="text-[10px] text-zinc-400 font-mono">英x2→中x1→英x1</span>
              </button>

              <button
                type="button"
                data-testid="sequence-mode-en2"
                onClick={() => handleSelectSequenceMode('en2')}
                aria-pressed={activeSequenceMode === 'en2'}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  activeSequenceMode === 'en2'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold ring-1 ring-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span className="font-semibold">純英雙播</span>
                <span className="text-[10px] text-zinc-400 font-mono">英 x2</span>
              </button>

              <button
                type="button"
                data-testid="sequence-mode-en1"
                onClick={() => handleSelectSequenceMode('en1')}
                aria-pressed={activeSequenceMode === 'en1'}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  activeSequenceMode === 'en1'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold ring-1 ring-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span className="font-semibold">精簡單播</span>
                <span className="text-[10px] text-zinc-400 font-mono">英 x1</span>
              </button>
            </div>

            {!resolvedHasChineseVoice && activeSequenceMode === 'en2-zh1-en1' && (
              <div
                data-testid="chinese-voice-fallback-hint"
                className="text-[11px] text-amber-400/90 bg-amber-950/20 border border-amber-800/40 rounded-lg p-2 flex items-center gap-1.5"
              >
                <span>⚠️</span> 目前裝置無可用中文語音，播放時將自動退回「純英雙播」。
              </div>
            )}
          </div>

          {/* Pause Interval Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                語句間隔停頓 (Pause Interval)
              </label>
              <span className="text-xs font-mono text-zinc-400">{activePauseInterval}ms</span>
            </div>
            <div
              data-testid="pause-interval-input"
              role="group"
              aria-label="語句間隔停頓時間"
              className="grid grid-cols-4 gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/90"
            >
              {PAUSE_INTERVALS.map((ms) => {
                const isSelected = activePauseInterval === ms;
                return (
                  <button
                    key={ms}
                    type="button"
                    data-testid={`interval-button-${ms}`}
                    onClick={() => handleSelectPauseInterval(ms)}
                    aria-pressed={isSelected}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-bold ring-1 ring-indigo-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    {ms}ms
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
