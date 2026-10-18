import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ListeningChunkBar } from '../app/components/chunkflow/ListeningChunkBar';
import { ActionBar } from '../app/components/chunkflow/ActionBar';
import type { SlotChunk } from '../app/types/chunkflow';

describe('ListeningChunkBar and ActionBar Delegation', () => {
  const sampleChunks: SlotChunk[] = [
    { text: 'The departure gate', isTargetSlot: false, type: 'subject' },
    { text: 'has been moved', isTargetSlot: true, type: 'verb' },
    { text: 'to Terminal 2', isTargetSlot: false },
    { text: 'due to maintenance.', isTargetSlot: false },
  ];

  it('renders audio playing indicator and waiting placeholder when narration is active', () => {
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={true}
      />
    );

    expect(screen.getByTestId('audio-playing-indicator')).toBeDefined();
    expect(screen.getByTestId('listening-wait-placeholder')).toBeDefined();
    expect(screen.queryByTestId('chunk-chips-container')).toBeNull();
  });

  it('renders clickable chunk chips when narration has finished', () => {
    const onToggleMarkChunk = vi.fn();
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[1]}
        onToggleMarkChunk={onToggleMarkChunk}
        isNarrationPlaying={false}
      />
    );

    expect(screen.getByTestId('chunk-chips-container')).toBeDefined();
    expect(screen.queryByTestId('listening-wait-placeholder')).toBeNull();

    // Chunk 0 is unselected
    const chip0 = screen.getByTestId('chunk-chip-0');
    expect(chip0.getAttribute('aria-pressed')).toBe('false');

    // Chunk 1 is selected
    const chip1 = screen.getByTestId('chunk-chip-1');
    expect(chip1.getAttribute('aria-pressed')).toBe('true');
    expect(chip1.textContent).toContain('盲點');

    // Clicking chip calls onToggleMarkChunk with its index
    fireEvent.click(chip0);
    expect(onToggleMarkChunk).toHaveBeenCalledWith(0);
  });

  it('ActionBar delegates to ListeningChunkBar when isListeningMode is true', () => {
    const onToggleMarkChunk = vi.fn();
    render(
      <ActionBar
        selectedVoice={null}
        selectedTime={null}
        onSelectVoice={vi.fn()}
        onSelectTime={vi.fn()}
        isListeningMode={true}
        chunks={sampleChunks}
        markedChunkIndices={[0]}
        onToggleMarkChunk={onToggleMarkChunk}
        isNarrationPlaying={false}
      />
    );

    expect(screen.getByTestId('listening-chunk-bar')).toBeDefined();
    expect(screen.queryByText('1. Voice (語態)')).toBeNull();

    const chip = screen.getByTestId('chunk-chip-0');
    expect(chip.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not render redundant bottom advance buttons since Next Sentence is in the feedback card', () => {
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
      />
    );

    expect(screen.queryByTestId('chunk-bar-next-btn')).toBeNull();
    expect(screen.queryByText('點選聽不清楚的單字或片語加入筆記')).toBeNull();
  });

  it('renders replay button in chunk notes state and triggers onReplayAudio when clicked', () => {
    const onReplayAudio = vi.fn();
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        onReplayAudio={onReplayAudio}
        isAudioPlaying={false}
      />
    );

    const replayBtn = screen.getByTestId('listening-replay-btn');
    expect(replayBtn).toBeDefined();
    expect(replayBtn.textContent).toContain('重新聽這題');

    fireEvent.click(replayBtn);
    expect(onReplayAudio).toHaveBeenCalledTimes(1);
  });

  it('displays playing state on replay button when isAudioPlaying is true', () => {
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        onReplayAudio={vi.fn()}
        isAudioPlaying={true}
      />
    );

    const replayBtn = screen.getByTestId('listening-replay-btn');
    expect(replayBtn.textContent).toContain('播放中...');
  });
});
