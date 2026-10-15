import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechAccent } from '../types/chunkflow';
import {
  loadNarrationEnabled,
  loadSpeechAccent,
  saveNarrationEnabled,
  saveSpeechAccent,
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

function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return name.includes('natural') || name.includes('online') || name.includes('neural');
}

export function useSpeechNarration() {
  const [narrationEnabled, setNarrationEnabledState] = useState<boolean>(() =>
    loadNarrationEnabled()
  );
  const [accent, setAccentState] = useState<SpeechAccent>(() => loadSpeechAccent());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [canSelectAccents, setCanSelectAccents] = useState<boolean>(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up any speaking utterance on unmount
  useEffect(() => {
    return () => {
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

  const resolveVoice = useCallback(
    (targetAccent: SpeechAccent): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const targetPrefix = ACCENT_CONFIG[targetAccent].langPrefix;

      // Priority 1: Match selected accent with Natural / Online / Neural in name
      const naturalMatch = voices.find((v) => {
        const lang = v.lang.replace('_', '-');
        return lang.startsWith(targetPrefix) && isNaturalVoice(v);
      });
      if (naturalMatch) {
        return naturalMatch;
      }

      // Priority 2: Standard US English fallback
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
    [voices]
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
  }, []);

  const speak = useCallback(
    (text: string, options?: { force?: boolean }) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!narrationEnabled && !options?.force) return;

      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      const chosenVoice = resolveVoice(accent);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = ACCENT_CONFIG[accent].langPrefix;
      }
      utterance.rate = 0.95;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [narrationEnabled, accent, resolveVoice]
  );

  const stop = useCallback(() => {
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
  };
}
