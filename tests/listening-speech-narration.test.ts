import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechNarration, findChineseVoice } from '../app/hooks/useSpeechNarration';

describe('useSpeechNarration - Listening Sequencing and Chinese Fallback', () => {
  let mockSpeak: any;
  let mockCancel: any;
  let createdUtterances: any[] = [];

  const mockVoices = [
    {
      name: 'Microsoft Jenny Online (Natural) - English (United States)',
      lang: 'en-US',
      voiceURI: 'jenny-us',
      localService: false,
      default: true,
    },
    {
      name: 'Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)',
      lang: 'zh-TW',
      voiceURI: 'hsiaochen-tw',
      localService: false,
      default: false,
    },
    {
      name: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
      lang: 'zh-CN',
      voiceURI: 'yunxi-cn',
      localService: false,
      default: false,
    },
  ] as unknown as SpeechSynthesisVoice[];

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    createdUtterances = [];
    mockSpeak = vi.fn().mockImplementation((utterance: any) => {
      createdUtterances.push(utterance);
      // Simulate asynchronous utterance end
      setTimeout(() => {
        utterance.onstart?.();
        setTimeout(() => {
          utterance.onend?.();
        }, 50);
      }, 0);
    });
    mockCancel = vi.fn();

    class MockSpeechSynthesisUtterance {
      text: string;
      voice: any = null;
      lang = '';
      rate = 1;
      onstart: any = null;
      onend: any = null;
      onerror: any = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: vi.fn().mockReturnValue(mockVoices),
        onvoiceschanged: null,
        speaking: false,
        pending: false,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('detects Chinese voice with findChineseVoice', () => {
    const zhVoice = findChineseVoice(mockVoices);
    expect(zhVoice).toBeDefined();
    expect(zhVoice?.lang).toBe('zh-TW');

    const noZhVoices = [mockVoices[0]];
    expect(findChineseVoice(noZhVoices)).toBeNull();
  });

  it('executes default sequence en2-zh1-en1 when Chinese voice is available', async () => {
    const { result } = renderHook(() => useSpeechNarration());

    // Trigger voices changed listener
    act(() => {
      (window.speechSynthesis as any).onvoiceschanged?.();
    });

    const onStep = vi.fn();
    const onComplete = vi.fn();

    act(() => {
      result.current.speakListeningSequence('The flight was delayed.', '航班延誤了。', {
        mode: 'en2-zh1-en1',
        pauseIntervalMs: 600,
        rate: 1.25,
        force: true,
        onStep,
        onComplete,
      });
    });

    // Advance through the sequence: 4 steps
    // Step 0: setup tick 50ms + speech 50ms
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(onStep).toHaveBeenCalledWith(0, 4, 'en');

    // Step 1: pause 600ms + speech 50ms
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(onStep).toHaveBeenCalledWith(1, 4, 'en');

    // Step 2: pause 600ms + speech 50ms (Chinese)
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(onStep).toHaveBeenCalledWith(2, 4, 'zh');

    // Step 3: pause 600ms + speech 50ms (English)
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(onStep).toHaveBeenCalledWith(3, 4, 'en');

    expect(onComplete).toHaveBeenCalled();
    expect(createdUtterances).toHaveLength(4);
    expect(createdUtterances[0].text).toBe('The flight was delayed.');
    expect(createdUtterances[0].rate).toBe(1.25);
    expect(createdUtterances[1].text).toBe('The flight was delayed.');
    expect(createdUtterances[2].text).toBe('航班延誤了。');
    expect(createdUtterances[2].voice?.lang).toBe('zh-TW');
    expect(createdUtterances[3].text).toBe('The flight was delayed.');
  });

  it('gracefully falls back to en2 sequence when no Chinese voice exists', async () => {
    // Only English voices
    (window.speechSynthesis.getVoices as any).mockReturnValue([mockVoices[0]]);

    const { result } = renderHook(() => useSpeechNarration());
    act(() => {
      (window.speechSynthesis as any).onvoiceschanged?.();
    });

    const onStep = vi.fn();
    const onComplete = vi.fn();

    act(() => {
      result.current.speakListeningSequence('The flight was delayed.', '航班延誤了。', {
        mode: 'en2-zh1-en1',
        pauseIntervalMs: 500,
        force: true,
        onStep,
        onComplete,
      });
    });

    // Step 0
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(onStep).toHaveBeenCalledWith(0, 2, 'en');

    // Step 1
    act(() => {
      vi.advanceTimersByTime(560);
    });
    expect(onStep).toHaveBeenCalledWith(1, 2, 'en');

    expect(onComplete).toHaveBeenCalled();
    expect(createdUtterances).toHaveLength(2);
    expect(createdUtterances[0].text).toBe('The flight was delayed.');
    expect(createdUtterances[1].text).toBe('The flight was delayed.');
  });

  it('cancels pending sequence when stop() is invoked', () => {
    const { result } = renderHook(() => useSpeechNarration());
    const onComplete = vi.fn();

    act(() => {
      result.current.speakListeningSequence('Test sentence', '測試', {
        force: true,
        onComplete,
      });
    });

    act(() => {
      result.current.stop();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
