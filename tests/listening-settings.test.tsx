import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsModal } from '../app/components/chunkflow/SettingsModal';
import {
  loadListeningNarrationMode,
  loadListeningPauseInterval,
  loadListeningSpeechRate,
  saveListeningNarrationMode,
  saveListeningPauseInterval,
  saveListeningSpeechRate,
} from '../app/utils/storage';

describe('SettingsModal - Listening Drill Settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders speech rate switch inside voice settings section and sequence/interval inside listening section', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} hasChineseVoice={true} />);

    const voiceSection = screen.getByTestId('voice-settings-section');
    const listeningSection = screen.getByTestId('listening-settings-section');

    expect(voiceSection.querySelector('[data-testid="speech-rate-switch"]')).not.toBeNull();
    expect(listeningSection.querySelector('[data-testid="speech-rate-switch"]')).toBeNull();
    expect(screen.getByTestId('listening-sequence-mode-switch')).toBeDefined();
    expect(screen.getByTestId('pause-interval-input')).toBeDefined();
  });

  it('allows changing sequence mode and notifies onUpdateSettings and persists to storage', () => {
    const onUpdateSettings = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onUpdateSettings={onUpdateSettings}
        hasChineseVoice={true}
      />
    );

    const en2Btn = screen.getByTestId('sequence-mode-en2');
    fireEvent.click(en2Btn);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      listeningNarrationMode: 'en2',
    });
    expect(loadListeningNarrationMode()).toBe('en2');
  });

  it('allows changing speech rate and triggers voice preview with the selected rate', () => {
    const onUpdateSettings = vi.fn();
    const onPreviewVoice = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onUpdateSettings={onUpdateSettings}
        onPreviewVoice={onPreviewVoice}
        hasChineseVoice={true}
      />
    );

    const rate125Btn = screen.getByTestId('rate-button-1.25');
    fireEvent.click(rate125Btn);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      listeningSpeechRate: 1.25,
    });
    expect(loadListeningSpeechRate()).toBe(1.25);
    expect(onPreviewVoice).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ rate: 1.25, force: true })
    );
  });

  it('allows changing pause interval and persists to storage', () => {
    const onUpdateSettings = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onUpdateSettings={onUpdateSettings}
        hasChineseVoice={true}
      />
    );

    const interval800Btn = screen.getByTestId('interval-button-800');
    fireEvent.click(interval800Btn);

    expect(onUpdateSettings).toHaveBeenCalledWith({
      listeningPauseIntervalMs: 800,
    });
    expect(loadListeningPauseInterval()).toBe(800);
  });

  it('displays fallback notice when Chinese voice is absent and default en2-zh1-en1 mode is selected', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} hasChineseVoice={false} />);

    expect(screen.getByTestId('chinese-voice-fallback-hint')).toBeDefined();
  });

  it('renders staged accent guidance card with US/CA and UK/AU recommendations', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} hasChineseVoice={true} />);

    const guidance = screen.getByTestId('accent-guidance-card');
    expect(guidance).toBeDefined();
    expect(guidance.textContent).toContain('口音循序訓練指南');
    expect(guidance.textContent).toContain('初期 / 一刷（建立自信）');
    expect(guidance.textContent).toContain('美式');
    expect(guidance.textContent).toContain('加拿大');
    expect(guidance.textContent).toContain('進階 / 多刷（高壓特訓）');
    expect(guidance.textContent).toContain('英式');
    expect(guidance.textContent).toContain('澳洲');
  });
});
