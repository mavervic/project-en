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

  it('enables narration idempotently via enableNarration and persists preference', () => {
    const { result } = renderHook(() => useSpeechNarration());
    expect(result.current.narrationEnabled).toBe(false);

    act(() => {
      result.current.enableNarration();
    });
    expect(result.current.narrationEnabled).toBe(true);
    expect(window.localStorage.getItem('chunkflow_narration_enabled_v1')).toBe('true');

    // Calling enableNarration again keeps it true
    act(() => {
      result.current.enableNarration();
    });
    expect(result.current.narrationEnabled).toBe(true);
    expect(window.localStorage.getItem('chunkflow_narration_enabled_v1')).toBe('true');
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

  it('does not use selectedVoiceURI if it does not match the requested target accent', () => {
    const availableVoices = [
      { voiceURI: 'v-us-custom', name: 'Custom US Voice', lang: 'en-US' },
      { voiceURI: 'v-gb-natural', name: 'Sonia Online (Natural)', lang: 'en-GB' },
    ] as unknown as SpeechSynthesisVoice[];

    (window.speechSynthesis.getVoices as any).mockReturnValue(availableVoices);

    const { result } = renderHook(() => useSpeechNarration());

    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis.onvoiceschanged as any)();
      }
      result.current.toggleNarration();
      result.current.setVoiceURI('v-us-custom');
    });

    // Speaking with explicit accent 'GB' should resolve to GB voice, ignoring 'v-us-custom'
    act(() => {
      result.current.speak('Hello UK', { force: true, accent: 'GB' });
    });

    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.voice.voiceURI).toBe('v-gb-natural');
  });

  it('automatically falls back to an offline local voice when an online voice fails with onerror', () => {
    vi.useFakeTimers();
    const onlineGb = {
      voiceURI: 'v-gb-online',
      name: 'Microsoft Sonia Online (Natural)',
      lang: 'en-GB',
      localService: false,
    };
    const localUs = {
      voiceURI: 'v-us-local',
      name: 'Microsoft Zira Desktop',
      lang: 'en-US',
      localService: true,
    };

    (window.speechSynthesis.getVoices as any).mockReturnValue([onlineGb, localUs]);

    const { result } = renderHook(() => useSpeechNarration());

    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis.onvoiceschanged as any)();
      }
      result.current.toggleNarration();
    });

    act(() => {
      result.current.speak('Testing fallback', { force: true, accent: 'GB' });
    });

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const firstUtterance = mockSpeak.mock.calls[0][0];
    expect(firstUtterance.voice.voiceURI).toBe('v-gb-online');

    // Simulate online voice failing with interrupted or network error
    act(() => {
      if (firstUtterance.onerror) {
        firstUtterance.onerror({ error: 'interrupted' });
      }
      vi.advanceTimersByTime(100);
    });

    // Should have retried speaking with localUs fallback
    expect(mockSpeak).toHaveBeenCalledTimes(2);
    const retryUtterance = mockSpeak.mock.calls[1][0];
    expect(retryUtterance.voice.voiceURI).toBe('v-us-local');
    vi.useRealTimers();
  });

  it('prioritizes stable non-multilingual natural voices over multilingual ones', () => {
    const mixedVoices = [
      {
        voiceURI: 'v-ada',
        name: 'Microsoft Ada Multilingual Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
      {
        voiceURI: 'v-sonia',
        name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
    ] as unknown as SpeechSynthesisVoice[];

    (window.speechSynthesis.getVoices as any).mockReturnValue(mixedVoices);
    const { result } = renderHook(() => useSpeechNarration());

    act(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        (window.speechSynthesis.onvoiceschanged as any)();
      }
      result.current.toggleNarration();
      result.current.speak('Hello UK', { force: true, accent: 'GB' });
    });

    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.voice.voiceURI).toBe('v-sonia');
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

  it('auto-enables narration and speaks active question sentence when blind mode is activated while muted in Home', async () => {
    window.localStorage.clear();
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();

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
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });

    window.localStorage.setItem('chunkflow_active_bank_v1', 'starter');
    const { default: Home } = await import('../app/routes/home');
    render(<Home />);

    const blindBtn = screen.getByTestId('blind-mode-toggle-btn');
    const narrationBtn = screen.getByTestId('narration-toggle-btn');

    expect(narrationBtn.textContent).toContain('靜音');
    expect(mockSpeak).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(blindBtn);
    });

    expect(window.localStorage.getItem('chunkflow_blind_mode_v1')).toBe('true');
    expect(window.localStorage.getItem('chunkflow_narration_enabled_v1')).toBe('true');
    expect(screen.getByTestId('narration-toggle-btn').textContent).toContain('朗誦開');
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('mutes narration on toggle button click, stops speech, and does not re-trigger speech playback', async () => {
    window.localStorage.setItem('chunkflow_narration_enabled_v1', 'true');
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();

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
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
      },
      writable: true,
      configurable: true,
    });

    window.localStorage.setItem('chunkflow_active_bank_v1', 'starter');
    const { default: Home } = await import('../app/routes/home');
    render(<Home />);

    const narrationBtn = screen.getByTestId('narration-toggle-btn');
    expect(narrationBtn.textContent).toContain('朗誦開');
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    mockSpeak.mockClear();

    // Click to mute
    act(() => {
      fireEvent.click(narrationBtn);
    });

    expect(narrationBtn.textContent).toContain('靜音');
    expect(mockCancel).toHaveBeenCalled();
    // Clicking mute MUST NOT trigger speak!
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});

describe('SettingsModal Voice Settings Controls', () => {
  const mockVoices = [
    { voiceURI: 'v-au-1', name: 'Natasha (Natural)', lang: 'en-AU' },
    { voiceURI: 'v-ca-1', name: 'Liam (Natural)', lang: 'en-CA' },
    { voiceURI: 'v-gb-1', name: 'Sonia (Natural)', lang: 'en-GB' },
    { voiceURI: 'v-us-1', name: 'Jenny (Natural)', lang: 'en-US' },
    { voiceURI: 'v-us-2', name: 'Guy (Natural)', lang: 'en-US' },
  ] as unknown as SpeechSynthesisVoice[];

  it('renders 4-flag accent switch and handles flag selection with auto-preview', async () => {
    const { SettingsModal } = await import('../app/components/chunkflow/SettingsModal');
    const { ACCENT_PREVIEW_SENTENCE } = await import('../app/hooks/useSpeechNarration');
    const onSelectAccent = vi.fn();
    const onSelectVoiceURI = vi.fn();
    const onPreviewVoice = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        accent="US"
        onSelectAccent={onSelectAccent}
        voices={mockVoices}
        selectedVoiceURI="v-us-1"
        onSelectVoiceURI={onSelectVoiceURI}
        onPreviewVoice={onPreviewVoice}
      />
    );

    expect(screen.getByTestId('voice-settings-section')).toBeDefined();
    expect(screen.getByTestId('accent-flag-switch')).toBeDefined();
    expect(screen.getByTestId('voice-priority-guidance')).toBeDefined();
    expect(screen.getByTestId('voice-priority-guidance').textContent).toContain('Natural / Neural');

    // Ensure redundant voice name preview is removed next to label
    expect(screen.queryByTestId('selected-voice-name')).toBeNull();

    const auBtn = screen.getByTestId('flag-switch-AU');
    const caBtn = screen.getByTestId('flag-switch-CA');
    const gbBtn = screen.getByTestId('flag-switch-GB');
    const usBtn = screen.getByTestId('flag-switch-US');

    expect(auBtn.textContent).toContain('🇦🇺');
    expect(caBtn.textContent).toContain('🇨🇦');
    expect(gbBtn.textContent).toContain('🇬🇧');
    expect(usBtn.textContent).toContain('🇺🇸');

    // Click GB flag -> triggers selection and auto-preview
    fireEvent.click(gbBtn);
    expect(onSelectAccent).toHaveBeenCalledWith('GB');
    expect(onPreviewVoice).toHaveBeenCalledWith(
      ACCENT_PREVIEW_SENTENCE,
      expect.objectContaining({ force: true, accent: 'GB' })
    );

    const select = screen.getByTestId('voice-dropdown-select') as HTMLSelectElement;
    expect(select.value).toBe('v-us-1');

    // Change voice in dropdown -> triggers selection and auto-preview
    fireEvent.change(select, { target: { value: 'v-us-2' } });
    expect(onSelectVoiceURI).toHaveBeenCalledWith('v-us-2');
    expect(onPreviewVoice).toHaveBeenCalledWith(
      ACCENT_PREVIEW_SENTENCE,
      expect.objectContaining({ force: true, voiceURI: 'v-us-2' })
    );
  });

  it('filters available voices by the selected accent in the dropdown', async () => {
    const { SettingsModal } = await import('../app/components/chunkflow/SettingsModal');

    const { rerender } = render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        accent="AU"
        onSelectAccent={vi.fn()}
        voices={mockVoices}
      />
    );

    const select = screen.getByTestId('voice-dropdown-select') as HTMLSelectElement;
    expect(select.options.length).toBe(1);
    expect(select.options[0].textContent).toContain('Natasha');

    rerender(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        accent="US"
        onSelectAccent={vi.fn()}
        voices={mockVoices}
      />
    );

    const updatedSelect = screen.getByTestId('voice-dropdown-select') as HTMLSelectElement;
    expect(updatedSelect.options.length).toBe(2);
  });

  it('disables flag switch and displays empty notice when an accent has no available synthesizers', async () => {
    const { SettingsModal } = await import('../app/components/chunkflow/SettingsModal');
    // Voices list with only US voices
    const usOnlyVoices = [
      { voiceURI: 'v-us-1', name: 'Jenny (Natural)', lang: 'en-US' },
    ] as unknown as SpeechSynthesisVoice[];

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        accent="AU"
        onSelectAccent={vi.fn()}
        voices={usOnlyVoices}
      />
    );

    const auBtn = screen.getByTestId('flag-switch-AU') as HTMLButtonElement;
    const usBtn = screen.getByTestId('flag-switch-US') as HTMLButtonElement;

    // AU has no voices in usOnlyVoices -> disabled
    expect(auBtn.disabled).toBe(true);
    expect(auBtn.className).toContain('cursor-not-allowed');

    // US has voice -> enabled
    expect(usBtn.disabled).toBe(false);

    // Dropdown for AU should be disabled with empty notice
    const select = screen.getByTestId('voice-dropdown-select') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(select.options[0].textContent).toContain('目前裝置無此國家的可用語音合成器');
  });

  it('excludes problematic multilingual voices from dropdown when stable voices exist', async () => {
    const { SettingsModal } = await import('../app/components/chunkflow/SettingsModal');
    const mixedGbVoices = [
      {
        voiceURI: 'v-ada',
        name: 'Microsoft Ada Multilingual Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
      {
        voiceURI: 'v-ollie',
        name: 'Microsoft Ollie Multilingual Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
      {
        voiceURI: 'v-sonia',
        name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
      {
        voiceURI: 'v-ryan',
        name: 'Microsoft Ryan Online (Natural) - English (United Kingdom)',
        lang: 'en-GB',
      },
    ] as unknown as SpeechSynthesisVoice[];

    render(<SettingsModal isOpen={true} onClose={vi.fn()} accent="GB" voices={mixedGbVoices} />);

    const select = screen.getByTestId('voice-dropdown-select') as HTMLSelectElement;
    // Should filter out Ada and Ollie, keeping only Sonia and Ryan
    expect(select.options.length).toBe(2);
    expect(select.options[0].textContent).toContain('Sonia');
    expect(select.options[1].textContent).toContain('Ryan');
  });

  it('voices preview utterance with newly chosen speech rate on rate button click', async () => {
    const { SettingsModal } = await import('../app/components/chunkflow/SettingsModal');
    const { ACCENT_PREVIEW_SENTENCE } = await import('../app/hooks/useSpeechNarration');
    const onPreviewVoice = vi.fn();
    const onUpdateSettings = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onPreviewVoice={onPreviewVoice}
        onUpdateSettings={onUpdateSettings}
      />
    );

    const rateBtn = screen.getByTestId('rate-button-1.5');
    fireEvent.click(rateBtn);

    expect(onUpdateSettings).toHaveBeenCalledWith({ listeningSpeechRate: 1.5 });
    expect(onPreviewVoice).toHaveBeenCalledWith(
      ACCENT_PREVIEW_SENTENCE,
      expect.objectContaining({ rate: 1.5, force: true })
    );
  });
});
