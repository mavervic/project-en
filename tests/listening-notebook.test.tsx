import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ListeningNotebookModal } from '../app/components/chunkflow/ListeningNotebookModal';
import { HeaderHUD } from '../app/components/chunkflow/HeaderHUD';
import type { MarkedChunkRecord } from '../app/types/chunkflow';

describe('ListeningNotebookModal Component', () => {
  const sampleRecords: MarkedChunkRecord[] = [
    {
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-01',
      chunkText: 'The flight to Tokyo',
      chunkIndex: 0,
      sentence: 'The flight to Tokyo has been delayed.',
      translation: '前往東京的航班延誤了。',
      topic: 'listening-01',
      timestamp: 1000,
    },
    {
      id: 'q2-1',
      questionId: 'q2',
      trainingId: 'listening-02',
      chunkText: 'reserved a private table',
      chunkIndex: 1,
      sentence: 'The client reserved a private table for dinner.',
      translation: '客戶預訂了一張晚餐專用包廂座位。',
      topic: 'listening-02',
      timestamp: 2000,
    },
  ];

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <ListeningNotebookModal isOpen={false} onClose={vi.fn()} markedChunks={sampleRecords} />
    );
    expect(screen.queryByTestId('listening-notebook-modal')).toBeNull();
  });

  it('renders marked chunk list and details when open', () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={sampleRecords} />);

    expect(screen.getByTestId('listening-notebook-modal')).toBeDefined();
    expect(screen.getByText('The flight to Tokyo')).toBeDefined();
    expect(screen.getByText('reserved a private table')).toBeDefined();
    expect(screen.getByText('The flight to Tokyo has been delayed.')).toBeDefined();
    expect(screen.getByText('前往東京的航班延誤了。')).toBeDefined();
  });

  it('renders topic badges and obstacle chips for marked chunks with obstacles', () => {
    const recordsWithObstacles: MarkedChunkRecord[] = [
      {
        id: 'parker-01-q01-0',
        questionId: 'parker-01-q01',
        trainingId: 'parker-01',
        chunkText: 'A woman',
        chunkIndex: 0,
        sentence: 'A woman is watering plants.',
        translation: '一位女士正在給植物澆水。',
        topic: 'Housing',
        obstacles: ['too-fast', 'liaison'],
        timestamp: 1000,
      },
    ];

    render(
      <ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={recordsWithObstacles} />
    );

    expect(screen.getByTestId('notebook-item-topic-parker-01-q01-0')).toBeDefined();
    expect(screen.getByText('Housing')).toBeDefined();
    expect(screen.getByTestId('notebook-item-obstacles-parker-01-q01-0')).toBeDefined();
    expect(screen.getByTestId('notebook-obstacle-tag-parker-01-q01-0-too-fast')).toBeDefined();
    expect(screen.getByTestId('notebook-obstacle-tag-parker-01-q01-0-liaison')).toBeDefined();
    expect(screen.getByText('⚡ 速度太快')).toBeDefined();
    expect(screen.getByText('🔗 連音')).toBeDefined();
  });

  it('displays empty state when there are no marked chunks', () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={[]} />);

    expect(screen.getByTestId('notebook-empty-state')).toBeDefined();
    expect(screen.getByText('目前沒有標記任何聽力盲點語塊')).toBeDefined();
  });

  it('filters chunks by selected topic', () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={sampleRecords} />);

    const select = screen.getByTestId('notebook-topic-filter');
    fireEvent.change(select, { target: { value: 'listening-01' } });

    expect(screen.getByText('The flight to Tokyo')).toBeDefined();
    expect(screen.queryByText('reserved a private table')).toBeNull();
  });

  it('searches chunks by query string', () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={sampleRecords} />);

    const input = screen.getByTestId('notebook-search-input');
    fireEvent.change(input, { target: { value: 'private' } });

    expect(screen.queryByText('The flight to Tokyo')).toBeNull();
    expect(screen.getByText('reserved a private table')).toBeDefined();
  });

  it('triggers onRemoveChunk when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={vi.fn()}
        markedChunks={sampleRecords}
        onRemoveChunk={onRemove}
      />
    );

    const removeBtn = screen.getByTestId('remove-marked-chunk-q1-0');
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('q1-0');
  });

  it('triggers onClearAll when clear button is clicked', () => {
    const onClearAll = vi.fn();
    render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={vi.fn()}
        markedChunks={sampleRecords}
        onClearAll={onClearAll}
      />
    );

    const clearBtn = screen.getByTestId('clear-all-notes-btn');
    fireEvent.click(clearBtn);
    expect(onClearAll).toHaveBeenCalled();
  });

  it('exports marked chunks as Markdown to clipboard', async () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={sampleRecords} />);

    const mdBtn = screen.getByTestId('export-markdown-btn');
    fireEvent.click(mdBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      const written = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
      expect(written).toContain('# TOEIC Listening Notebook');
      expect(written).toContain('The flight to Tokyo');
      expect(written).toContain('Travel');
      expect(written).toContain('Dining out');
      expect(screen.getByTestId('copy-feedback-toast')).toBeDefined();
    });
  });

  it('exports marked chunks as plain text to clipboard', async () => {
    render(<ListeningNotebookModal isOpen={true} onClose={vi.fn()} markedChunks={sampleRecords} />);

    const txtBtn = screen.getByTestId('export-text-btn');
    fireEvent.click(txtBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      const written = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
      expect(written).toContain('[Travel]');
      expect(written).toContain('The flight to Tokyo');
      expect(screen.getByTestId('copy-feedback-toast')).toBeDefined();
    });
  });
  it('triggers onPlayAudio for full sentence and isolated chunk when clicked', () => {
    const onPlayAudio = vi.fn();
    render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={vi.fn()}
        markedChunks={sampleRecords}
        onPlayAudio={onPlayAudio}
      />
    );

    const playSentenceBtn = screen.getByTestId('play-sentence-q1-0');
    expect(playSentenceBtn).toBeDefined();
    fireEvent.click(playSentenceBtn);
    expect(onPlayAudio).toHaveBeenCalledWith('The flight to Tokyo has been delayed.');

    const playChunkBtn = screen.getByTestId('play-chunk-q1-0');
    expect(playChunkBtn).toBeDefined();
    fireEvent.click(playChunkBtn);
    expect(onPlayAudio).toHaveBeenCalledWith('The flight to Tokyo');
  });
});

describe('HeaderHUD - Listening Notebook Integration', () => {
  it('renders notebook button with badge count and triggers onOpenNotebook', () => {
    const onOpenNotebook = vi.fn();
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenNotebook={onOpenNotebook}
        markedChunksCount={5}
      />
    );

    const btn = screen.getByTestId('header-notebook-btn');
    expect(btn).toBeDefined();

    const badge = screen.getByTestId('header-notebook-count');
    expect(badge.textContent).toBe('5');

    fireEvent.click(btn);
    expect(onOpenNotebook).toHaveBeenCalledTimes(1);
  });
});
