import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { HeaderHUD } from '../app/components/chunkflow/HeaderHUD';
import { ChunkFlowArena } from '../app/components/chunkflow/ChunkFlowArena';
import { useSpeechNarration } from '../app/hooks/useSpeechNarration';
import type { QuestionBankMeta } from '../app/types/chunkflow';

describe('Speech Narration Hook (useSpeechNarration)', () => {
  let mockSpeak: any;
  let mockCancel: any;

  beforeEach(() => {
    window.localStorage.clear();
    mockSpeak = vi.fn();
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

    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to narration disabled (false)', () => {
    const { result } = renderHook(() => useSpeechNarration());
    expect(result.current.narrationEnabled).toBe(false);
  });

  it('toggles narration state and persists preference', () => {
    const { result } = renderHook(() => useSpeechNarration());

    act(() => {
      result.current.toggleNarration();
    });
    expect(result.current.narrationEnabled).toBe(true);

    act(() => {
      result.current.toggleNarration();
    });
    expect(result.current.narrationEnabled).toBe(false);
    expect(mockCancel).toHaveBeenCalled();
  });

  it('does not speak when narration is disabled', () => {
    const { result } = renderHook(() => useSpeechNarration());
    act(() => {
      result.current.speak('Hello world');
    });
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('speaks sentence with resolved voice when enabled', () => {
    const { result } = renderHook(() => useSpeechNarration());
    act(() => {
      result.current.toggleNarration();
    });

    act(() => {
      result.current.speak('A woman is watering plants.');
    });

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe('A woman is watering plants.');
  });

  it('resolves Priority 1 Natural voices for regional accents when present', () => {
    const mockVoices = [
      { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Natasha Online (Natural) - English (Australia)', lang: 'en-AU' },
      { name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)', lang: 'en-GB' },
    ] as unknown as SpeechSynthesisVoice[];

    (window.speechSynthesis.getVoices as any).mockReturnValue(mockVoices);

    const { result } = renderHook(() => useSpeechNarration());

    // Trigger voices changed event
    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis.onvoiceschanged as any)();
      }
    });

    expect(result.current.canSelectAccents).toBe(true);

    // Switch to AU
    act(() => {
      result.current.setAccent('AU');
      result.current.toggleNarration();
    });

    act(() => {
      result.current.speak('Gday mate');
    });

    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.voice.name).toBe('Microsoft Natasha Online (Natural) - English (Australia)');
  });

  it('falls back to US English and disables accent selection when regional Natural voices are missing', () => {
    const standardVoices = [
      { name: 'Standard US English', lang: 'en-US' },
      { name: 'Standard British English', lang: 'en-GB' }, // not Natural
    ] as unknown as SpeechSynthesisVoice[];

    (window.speechSynthesis.getVoices as any).mockReturnValue(standardVoices);

    const { result } = renderHook(() => useSpeechNarration());

    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis.onvoiceschanged as any)();
      }
    });

    // canSelectAccents should be false because no regional Natural voices
    expect(result.current.canSelectAccents).toBe(false);
  });
});

describe('HeaderHUD Audio Narration, Bank Switcher, and Matrix Controls', () => {
  const mockBanks: QuestionBankMeta[] = [
    {
      id: 'starter',
      name: '核心多益題庫',
      description: '12 題',
      totalQuestions: 12,
      totalTrainings: 1,
    },
    {
      id: 'parker',
      name: '怕渴題庫',
      description: '50 課',
      totalQuestions: 1302,
      totalTrainings: 50,
    },
  ];

  it('does not render bank switcher button in HeaderHUD', () => {
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.queryByTestId('bank-switcher-btn')).toBeNull();
  });

  it('does not render narration toggle button in HeaderHUD', () => {
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        narrationEnabled={false}
      />
    );

    expect(screen.queryByTestId('narration-toggle-btn')).toBeNull();
  });

  it('hides flag dropdown when narration is disabled', () => {
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        narrationEnabled={false}
        canSelectAccents={true}
        onSelectAccent={vi.fn()}
      />
    );

    expect(screen.queryByTestId('accent-selector-btn')).toBeNull();
  });

  it('hides flag dropdown when natural regional voices are missing (canSelectAccents is false)', () => {
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        narrationEnabled={true}
        canSelectAccents={false}
        onSelectAccent={vi.fn()}
      />
    );

    expect(screen.queryByTestId('accent-selector-btn')).toBeNull();
  });

  it('renders flag dropdown when narration is enabled and natural regional voices exist', () => {
    const onSelectAccent = vi.fn();
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        narrationEnabled={true}
        canSelectAccents={true}
        accent="US"
        onSelectAccent={onSelectAccent}
      />
    );

    const flagBtn = screen.getByTestId('accent-selector-btn');
    expect(flagBtn).toBeDefined();
    expect(flagBtn.textContent).toContain('🇺🇸');

    fireEvent.click(flagBtn);
    expect(screen.getByTestId('accent-dropdown-menu')).toBeDefined();

    const auBtn = screen.getByTestId('select-accent-AU');
    fireEvent.click(auBtn);
    expect(onSelectAccent).toHaveBeenCalledWith('AU');
  });

  it('renders Matrix toggle button and fires onToggleMatrix', () => {
    const onToggleMatrix = vi.fn();
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        showMatrix={true}
        onToggleMatrix={onToggleMatrix}
      />
    );

    const matrixBtn = screen.getByTestId('toggle-matrix-btn');
    fireEvent.click(matrixBtn);
    expect(onToggleMatrix).toHaveBeenCalledTimes(1);
  });
});

describe('ChunkFlowArena Audio Controls & Replay Integration', () => {
  const mockQuestion = {
    id: 'q1',
    sentence: 'The board will review.',
    chunks: [
      { text: 'The board', isTargetSlot: false, type: 'subject' as const },
      { text: 'will review.', isTargetSlot: true, type: 'verb' as const },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active' as const, time: 'future' as const },
    grammarNote: 'note',
  };

  it('renders audio replay button and handles click', () => {
    const onPlayAudio = vi.fn();

    render(
      <ChunkFlowArena
        question={mockQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        onPlayAudio={onPlayAudio}
        isSpeaking={false}
      />
    );

    const audioBtn = screen.getByTestId('replay-audio-btn');
    expect(audioBtn).toBeDefined();
    expect(audioBtn.textContent).toContain('重播');
    fireEvent.click(audioBtn);
    expect(onPlayAudio).toHaveBeenCalledTimes(1);
  });

  it('renders narration toggle button in Arena and handles toggle click', () => {
    const onToggleNarration = vi.fn();

    const { rerender } = render(
      <ChunkFlowArena
        question={mockQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        narrationEnabled={false}
        onToggleNarration={onToggleNarration}
      />
    );

    const toggleBtn = screen.getByTestId('narration-toggle-btn');
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.textContent).toContain('靜音');

    fireEvent.click(toggleBtn);
    expect(onToggleNarration).toHaveBeenCalledTimes(1);

    // Rerender as enabled
    rerender(
      <ChunkFlowArena
        question={mockQuestion}
        focusState="idle"
        progressPercent={100}
        lastEvaluation={null}
        showFeedback={false}
        narrationEnabled={true}
        onToggleNarration={onToggleNarration}
      />
    );

    expect(screen.getByTestId('narration-toggle-btn').textContent).toContain('朗誦開');
  });
});
