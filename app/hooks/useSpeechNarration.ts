import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechAccent } from '../types/chunkflow';
import {
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

  // Clean up any speaking utterance on unmount
  useEffect(() => {
    return () => {
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

  const toggleNarration = useCallback(() => {
    setNarrationEnabledState((prev) => {
      const next = !prev;
      saveNarrationEnabled(next);
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
      }
      return next;
    });
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
      }
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!narrationEnabled && !options?.force) return;

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
        utterance.rate = 0.95;

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

  const stop = useCallback(() => {
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

  return {
    narrationEnabled,
    toggleNarration,
    accent,
    setAccent,
    speak,
    stop,
    isSpeaking,
    canSelectAccents,
    voices,
    selectedVoiceURI,
    setVoiceURI,
    resolveVoice,
  };
}
