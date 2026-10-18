import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { NarrationSequenceMode, SpeechAccent } from '../types/chunkflow';
import {
  loadListeningNarrationMode,
  loadListeningPauseInterval,
  loadListeningSpeechRate,
  loadNarrationEnabled,
  loadSpeechAccent,
  loadSpeechVoiceURI,
  saveNarrationEnabled,
  saveSpeechAccent,
  saveSpeechVoiceURI,
} from '../utils/storage';

export const ACCENT_CONFIG: Record<
  SpeechAccent,
  { flag: string; label: string; langPrefix: string }
> = {
  AU: { flag: '🇦🇺', label: '澳洲 (AU)', langPrefix: 'en-AU' },
  GB: { flag: '🇬🇧', label: '英國 (UK)', langPrefix: 'en-GB' },
  US: { flag: '🇺🇸', label: '美國 (US)', langPrefix: 'en-US' },
  CA: { flag: '🇨🇦', label: '加拿大 (CA)', langPrefix: 'en-CA' },
};

export const ACCENT_PREVIEW_SENTENCE =
  'The director scheduled a conference about our water project.';

export function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return name.includes('natural') || name.includes('online') || name.includes('neural');
}

export function isMultilingualVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.name.toLowerCase().includes('multilingual');
}

export function findChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  // Priority 1: Natural / Online zh-TW or zh-Hant
  const twNatural = voices.find((v) => {
    const lang = v.lang.replace('_', '-');
    return (lang.startsWith('zh-TW') || lang.startsWith('zh-Hant')) && isNaturalVoice(v);
  });
  if (twNatural) return twNatural;

  // Priority 2: Any zh-TW or zh-Hant
  const anyTw = voices.find((v) => {
    const lang = v.lang.replace('_', '-');
    return lang.startsWith('zh-TW') || lang.startsWith('zh-Hant');
  });
  if (anyTw) return anyTw;

  // Priority 3: Natural zh
  const zhNatural = voices.find((v) => {
    const lang = v.lang.replace('_', '-');
    return lang.startsWith('zh') && isNaturalVoice(v);
  });
  if (zhNatural) return zhNatural;

  // Priority 4: Any zh
  const anyZh = voices.find((v) => v.lang.replace('_', '-').startsWith('zh'));
  return anyZh || null;
}

export function useSpeechNarration() {
  const [narrationEnabled, setNarrationEnabledState] = useState<boolean>(() =>
    loadNarrationEnabled()
  );
  const [accent, setAccentState] = useState<SpeechAccent>(() => loadSpeechAccent());
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string | null>(() =>
    loadSpeechVoiceURI()
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [canSelectAccents, setCanSelectAccents] = useState<boolean>(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSequenceIdRef = useRef<number>(0);

  const hasChineseVoice = useMemo(() => Boolean(findChineseVoice(voices)), [voices]);

  // Clean up any speaking utterance on unmount
  useEffect(() => {
    return () => {
      activeSequenceIdRef.current++;
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
      }
    };
  }, []);

  // Load voices and listen for voice changes (asynchronous in Chromium)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);

      // Check if regional natural voices (AU, GB, or CA) exist
      const hasRegionalNatural = available.some((v) => {
        const lang = v.lang.replace('_', '-');
        const isRegional =
          lang.startsWith('en-AU') || lang.startsWith('en-GB') || lang.startsWith('en-CA');
        return isRegional && isNaturalVoice(v);
      });

      setCanSelectAccents(hasRegionalNatural);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const setVoiceURI = useCallback((uri: string | null) => {
    setSelectedVoiceURIState(uri);
    saveSpeechVoiceURI(uri);
  }, []);

  const resolveVoice = useCallback(
    (targetAccent: SpeechAccent): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const targetPrefix = ACCENT_CONFIG[targetAccent].langPrefix;

      // Priority 0: Explicitly user-selected voice URI matching target accent
      if (selectedVoiceURI) {
        const found = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (found && found.lang.replace('_', '-').startsWith(targetPrefix)) {
          return found;
        }
      }

      // Priority 1: Match selected accent with stable Natural / Online / Neural (non-multilingual)
      const stableNaturalMatch = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith(targetPrefix) && isNaturalVoice(v) && !isMultilingualVoice(v);
      });
      if (stableNaturalMatch) {
        return stableNaturalMatch;
      }

      // Priority 1b: Fallback to any natural match (including multilingual)
      const naturalMatch = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith(targetPrefix) && isNaturalVoice(v);
      });
      if (naturalMatch) {
        return naturalMatch;
      }

      // Priority 2: Standard regional match for selected accent
      const regionalMatch = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith(targetPrefix);
      });
      if (regionalMatch) {
        return regionalMatch;
      }

      // Priority 3: Standard US English fallback
      const usNatural = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith('en-US') && isNaturalVoice(v);
      });
      if (usNatural) {
        return usNatural;
      }

      const standardUs = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith('en-US') || lang.startsWith('en');
      });

      return standardUs || voices[0] || null;
    },
    [voices, selectedVoiceURI]
  );

  const stop = useCallback(() => {
    activeSequenceIdRef.current++;
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const toggleNarration = useCallback((): boolean => {
    const nextVal = !narrationEnabled;
    setNarrationEnabledState(nextVal);
    saveNarrationEnabled(nextVal);
    if (!nextVal) {
      stop();
    }
    return nextVal;
  }, [narrationEnabled, stop]);

  const enableNarration = useCallback(() => {
    setNarrationEnabledState(true);
    saveNarrationEnabled(true);
  }, []);

  const setAccent = useCallback((newAccent: SpeechAccent) => {
    setAccentState(newAccent);
    saveSpeechAccent(newAccent);
    // When accent is explicitly switched, reset specific voice URI so accent resolution applies
    setSelectedVoiceURIState(null);
    saveSpeechVoiceURI(null);
  }, []);

  const speak = useCallback(
    (
      text: string,
      options?: {
        force?: boolean;
        voice?: SpeechSynthesisVoice | null;
        voiceURI?: string;
        accent?: SpeechAccent;
        rate?: number;
      }
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!narrationEnabled && !options?.force) return;

      activeSequenceIdRef.current++;

      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }

      let chosenVoice: SpeechSynthesisVoice | null = null;
      if (options?.voice) {
        chosenVoice = options.voice;
      } else if (options?.voiceURI) {
        chosenVoice = voices.find((v) => v.voiceURI === options.voiceURI) || null;
      }
      if (!chosenVoice) {
        chosenVoice = resolveVoice(options?.accent || accent);
      }

      const executeSpeak = (targetVoice: SpeechSynthesisVoice | null, isRetry = false) => {
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtteranceRef.current = utterance;

        if (targetVoice) {
          utterance.voice = targetVoice;
          utterance.lang = targetVoice.lang;
        } else {
          utterance.lang = ACCENT_CONFIG[options?.accent || accent].langPrefix;
        }
        utterance.rate = options?.rate ?? 0.95;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
        };
        utterance.onerror = (e) => {
          // If an online voice failed and this wasn't already a retry, fall back to a local/standard voice
          if (!isRetry && targetVoice && !targetVoice.localService) {
            const fallbackVoice =
              voices.find((v) => v.localService && v.lang.startsWith('en')) || null;
            if (fallbackVoice && fallbackVoice.voiceURI !== targetVoice.voiceURI) {
              speechTimeoutRef.current = setTimeout(() => {
                executeSpeak(fallbackVoice, true);
              }, 50);
              return;
            }
          }
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        // Give Chromium/Edge a tick after cancel() to tear down speech channel before streaming online voices
        speechTimeoutRef.current = setTimeout(() => {
          executeSpeak(chosenVoice);
        }, 50);
      } else {
        executeSpeak(chosenVoice);
      }
    },
    [narrationEnabled, accent, resolveVoice, voices]
  );

  const speakListeningSequence = useCallback(
    (
      englishText: string,
      chineseText?: string,
      options?: {
        mode?: NarrationSequenceMode;
        pauseIntervalMs?: number;
        rate?: number;
        force?: boolean;
        accent?: SpeechAccent;
        onStep?: (stepIndex: number, totalSteps: number, lang: 'en' | 'zh') => void;
        onComplete?: () => void;
      }
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!narrationEnabled && !options?.force) return;

      const sequenceId = ++activeSequenceIdRef.current;

      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const mode = options?.mode || loadListeningNarrationMode();
      const interval = options?.pauseIntervalMs ?? loadListeningPauseInterval();
      const rate = options?.rate ?? loadListeningSpeechRate();
      const enVoice = resolveVoice(options?.accent || accent);
      const zhVoice = findChineseVoice(voices);

      type SequenceStep = { lang: 'en' | 'zh'; text: string; voice: SpeechSynthesisVoice | null };
      let steps: SequenceStep[] = [];

      if (mode === 'en2-zh1-en1') {
        if (chineseText && zhVoice) {
          steps = [
            { lang: 'en', text: englishText, voice: enVoice },
            { lang: 'en', text: englishText, voice: enVoice },
            { lang: 'zh', text: chineseText, voice: zhVoice },
            { lang: 'en', text: englishText, voice: enVoice },
          ];
        } else {
          // Graceful fallback to en2 when chinese voice is absent or no translation
          steps = [
            { lang: 'en', text: englishText, voice: enVoice },
            { lang: 'en', text: englishText, voice: enVoice },
          ];
        }
      } else if (mode === 'en2') {
        steps = [
          { lang: 'en', text: englishText, voice: enVoice },
          { lang: 'en', text: englishText, voice: enVoice },
        ];
      } else {
        steps = [{ lang: 'en', text: englishText, voice: enVoice }];
      }

      const runStep = (index: number) => {
        if (activeSequenceIdRef.current !== sequenceId) return;
        if (index >= steps.length) {
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
          options?.onComplete?.();
          return;
        }

        const currentStep = steps[index];
        options?.onStep?.(index, steps.length, currentStep.lang);

        const utterance = new SpeechSynthesisUtterance(currentStep.text);
        activeUtteranceRef.current = utterance;
        utterance.rate = rate;

        if (currentStep.voice) {
          utterance.voice = currentStep.voice;
          utterance.lang = currentStep.voice.lang;
        } else if (currentStep.lang === 'zh') {
          utterance.lang = 'zh-TW';
        } else {
          utterance.lang = ACCENT_CONFIG[options?.accent || accent].langPrefix;
        }

        utterance.onstart = () => {
          if (activeSequenceIdRef.current === sequenceId) {
            setIsSpeaking(true);
          }
        };

        const handleStepEnd = () => {
          if (activeSequenceIdRef.current !== sequenceId) return;
          if (index + 1 < steps.length) {
            speechTimeoutRef.current = setTimeout(() => {
              runStep(index + 1);
            }, interval);
          } else {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            options?.onComplete?.();
          }
        };

        utterance.onend = handleStepEnd;
        utterance.onerror = () => {
          handleStepEnd();
        };

        window.speechSynthesis.speak(utterance);
      };

      speechTimeoutRef.current = setTimeout(() => {
        runStep(0);
      }, 50);
    },
    [narrationEnabled, accent, resolveVoice, voices]
  );

  return {
    narrationEnabled,
    toggleNarration,
    enableNarration,
    accent,
    setAccent,
    speak,
    speakListeningSequence,
    stop,
    isSpeaking,
    canSelectAccents,
    hasChineseVoice,
    voices,
    selectedVoiceURI,
    setVoiceURI,
    resolveVoice,
  };
}
