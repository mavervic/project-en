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

  it('renders listening obstacle chips when narration completes and triggers onToggleObstacle', () => {
    const onToggleObstacle = vi.fn();
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        activeObstacles={['too-fast']}
        onToggleObstacle={onToggleObstacle}
      />
    );

    expect(screen.getByTestId('listening-obstacle-bar')).toBeDefined();
    expect(screen.getByText('這題聽不懂的障礙感受？（可多選）：')).toBeDefined();

    const tooFastChip = screen.getByTestId('obstacle-chip-too-fast');
    expect(tooFastChip.className).toContain('text-amber-300');

    const accentChip = screen.getByTestId('obstacle-chip-accent');
    expect(accentChip.className).toContain('text-zinc-400');

    fireEvent.click(accentChip);
    expect(onToggleObstacle).toHaveBeenCalledWith('accent');
  });

  it('ActionBar forwards activeObstacles and onToggleObstacle to ListeningChunkBar in listening mode', () => {
    const onToggleObstacle = vi.fn();
    render(
      <ActionBar
        selectedVoice={null}
        selectedTime={null}
        onSelectVoice={vi.fn()}
        onSelectTime={vi.fn()}
        isListeningMode={true}
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        activeObstacles={['liaison']}
        onToggleObstacle={onToggleObstacle}
      />
    );

    const liaisonChip = screen.getByTestId('obstacle-chip-liaison');
    expect(liaisonChip.className).toContain('text-amber-300');

    const tooFastChip = screen.getByTestId('obstacle-chip-too-fast');
    fireEvent.click(tooFastChip);
    expect(onToggleObstacle).toHaveBeenCalledWith('too-fast');
  });

  it('renders solo chunk audio button and triggers onPlayChunk with chunk text', () => {
    const onPlayChunk = vi.fn();
    render(
      <ListeningChunkBar
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        onPlayChunk={onPlayChunk}
      />
    );

    const chunkAudioBtn1 = screen.getByTestId('chunk-audio-btn-1');
    expect(chunkAudioBtn1).toBeDefined();

    fireEvent.click(chunkAudioBtn1);
    expect(onPlayChunk).toHaveBeenCalledTimes(1);
    expect(onPlayChunk).toHaveBeenCalledWith('has been moved');
  });

  it('ActionBar forwards onPlayChunk to ListeningChunkBar in listening mode', () => {
    const onPlayChunk = vi.fn();
    render(
      <ActionBar
        selectedVoice={null}
        selectedTime={null}
        onSelectVoice={vi.fn()}
        onSelectTime={vi.fn()}
        isListeningMode={true}
        chunks={sampleChunks}
        markedChunkIndices={[]}
        onToggleMarkChunk={vi.fn()}
        isNarrationPlaying={false}
        onPlayChunk={onPlayChunk}
      />
    );

    const chunkAudioBtn0 = screen.getByTestId('chunk-audio-btn-0');
    fireEvent.click(chunkAudioBtn0);
    expect(onPlayChunk).toHaveBeenCalledTimes(1);
    expect(onPlayChunk).toHaveBeenCalledWith('The departure gate');
  });
});
