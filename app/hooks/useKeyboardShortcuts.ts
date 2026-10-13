import { useEffect } from 'react';
import type { TimeChoice, VoiceChoice } from '../types/chunkflow';

interface UseKeyboardShortcutsOptions {
  onSelectVoice: (voice: VoiceChoice) => void;
  onSelectTime: (time: TimeChoice) => void;
  onNextQuestion?: () => void;
  disabled?: boolean;
  showFeedback?: boolean;
}

export function useKeyboardShortcuts({
  onSelectVoice,
  onSelectTime,
  onNextQuestion,
  disabled = false,
  showFeedback = false,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Diagnostic log at the very entry point
      const rawKey = event.key ? event.key.toLowerCase() : '';
      const code = event.code;
      const keyCode = event.keyCode;
      const target = event.target as HTMLElement | null;

      // Don't intercept if user is typing in form controls
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore browser system modifier combos (e.g. Ctrl+A, Alt+F4, Cmd+R)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // If feedback is showing, Space or Enter triggers Next Question
      if (showFeedback && onNextQuestion) {
        if (
          code === 'Space' ||
          code === 'Enter' ||
          rawKey === ' ' ||
          rawKey === 'enter'
        ) {
          event.preventDefault();
          onNextQuestion();
          return;
        }
      }

      if (disabled) return;

      // 1. Voice - Active:
      // Primary: 'A' (KeyA, 65, ㄇ)
      // Alternate 1: 'J' (Home-row Vim key for right hand)
      // Alternate 2: 'ArrowLeft' (Handles keyboards where Fn+W swapped WASD with arrow keys)
      const isVoiceActive =
        rawKey === 'a' ||
        code === 'KeyA' ||
        keyCode === 65 ||
        rawKey === 'ㄇ' ||
        rawKey === 'j' ||
        code === 'KeyJ' ||
        keyCode === 74 ||
        rawKey === 'arrowleft' ||
        code === 'ArrowLeft' ||
        keyCode === 37;

      // 2. Voice - Passive:
      // Primary: 'P' (KeyP, 80, ㄣ)
      // Alternate 1: 'K' (Home-row Vim key for right hand)
      // Alternate 2: 'ArrowRight'
      const isVoicePassive =
        rawKey === 'p' ||
        code === 'KeyP' ||
        keyCode === 80 ||
        rawKey === 'ㄣ' ||
        rawKey === 'k' ||
        code === 'KeyK' ||
        keyCode === 75 ||
        rawKey === 'arrowright' ||
        code === 'ArrowRight' ||
        keyCode === 39;

      // 3. Tense - Present:
      const isTimePresent =
        rawKey === '1' ||
        code === 'Digit1' ||
        code === 'Numpad1' ||
        keyCode === 49 ||
        keyCode === 97 ||
        rawKey === 'ㄅ';

      // 4. Tense - Past:
      const isTimePast =
        rawKey === '2' ||
        code === 'Digit2' ||
        code === 'Numpad2' ||
        keyCode === 50 ||
        keyCode === 98 ||
        rawKey === 'ㄉ';

      // 5. Tense - Future:
      const isTimeFuture =
        rawKey === '3' ||
        code === 'Digit3' ||
        code === 'Numpad3' ||
        keyCode === 51 ||
        keyCode === 99 ||
        rawKey === 'ˇ';

      if (isVoiceActive) {
        event.preventDefault();
        onSelectVoice('active');
      } else if (isVoicePassive) {
        event.preventDefault();
        onSelectVoice('passive');
      } else if (isTimePresent) {
        event.preventDefault();
        onSelectTime('present');
      } else if (isTimePast) {
        event.preventDefault();
        onSelectTime('past');
      } else if (isTimeFuture) {
        event.preventDefault();
        onSelectTime('future');
      }
    };

    // Use { capture: true } to intercept in capture phase before any browser extensions or parent elements can swallow it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [disabled, showFeedback, onSelectVoice, onSelectTime, onNextQuestion]);
}
