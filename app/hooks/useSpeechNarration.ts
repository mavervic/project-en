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

function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return name.includes('natural') || name.includes('online') || name.includes('neural');
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

      // Priority 1: Match selected accent with Natural / Online / Neural in name
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

      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      let chosenVoice: SpeechSynthesisVoice | null = null;
      if (options?.voice) {
        chosenVoice = options.voice;
      } else if (options?.voiceURI) {
        chosenVoice = voices.find((v) => v.voiceURI === options.voiceURI) || null;
      }
      if (!chosenVoice) {
        chosenVoice = resolveVoice(options?.accent || accent);
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = ACCENT_CONFIG[options?.accent || accent].langPrefix;
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
    [narrationEnabled, accent, resolveVoice, voices]
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
    voices,
    selectedVoiceURI,
    setVoiceURI,
    resolveVoice,
  };
}
