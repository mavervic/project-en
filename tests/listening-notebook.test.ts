import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadMarkedChunks,
  saveMarkedChunk,
  removeMarkedChunk,
  clearMarkedChunks,
  getMarkedChunksCountByTrainingId,
  getMarkedChunksCountMap,
} from '../app/utils/storage';
import type { MarkedChunkRecord } from '../app/types/chunkflow';

describe('Listening Notebook Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads an empty list initially', () => {
    expect(loadMarkedChunks()).toEqual([]);
    expect(getMarkedChunksCountMap()).toEqual({});
    expect(getMarkedChunksCountByTrainingId('listening-travel')).toBe(0);
  });

  it('saves and retrieves marked chunk records', () => {
    const item1: MarkedChunkRecord = {
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'The flight to Tokyo',
      chunkIndex: 0,
      sentence: 'The flight to Tokyo has been delayed.',
      translation: '前往東京的航班延誤了。',
      topic: 'listening-travel',
      timestamp: 1000,
    };

    const saved = saveMarkedChunk(item1);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toEqual(item1);
    expect(loadMarkedChunks()).toEqual([item1]);

    expect(getMarkedChunksCountByTrainingId('listening-travel')).toBe(1);
    expect(getMarkedChunksCountMap()).toEqual({
      'listening-travel': 1,
    });
  });

  it('updates an existing record if saved with same ID', () => {
    const item1: MarkedChunkRecord = {
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'The flight to Tokyo',
      chunkIndex: 0,
      sentence: 'The flight to Tokyo has been delayed.',
      timestamp: 1000,
    };

    const updatedItem: MarkedChunkRecord = {
      ...item1,
      timestamp: 2000,
    };

    saveMarkedChunk(item1);
    const updatedList = saveMarkedChunk(updatedItem);
    expect(updatedList).toHaveLength(1);
    expect(updatedList[0].timestamp).toBe(2000);
  });

  it('removes a record by ID correctly', () => {
    const item1: MarkedChunkRecord = {
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'The flight to Tokyo',
      chunkIndex: 0,
      sentence: 'The flight to Tokyo has been delayed.',
      timestamp: 1000,
    };
    const item2: MarkedChunkRecord = {
      id: 'q1-1',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'has been delayed',
      chunkIndex: 1,
      sentence: 'The flight to Tokyo has been delayed.',
      timestamp: 1001,
    };

    saveMarkedChunk(item1);
    saveMarkedChunk(item2);
    expect(loadMarkedChunks()).toHaveLength(2);

    const afterRemove = removeMarkedChunk('q1-0');
    expect(afterRemove).toHaveLength(1);
    expect(afterRemove[0].id).toBe('q1-1');
    expect(loadMarkedChunks()).toEqual([item2]);
  });

  it('clears all marked chunks', () => {
    saveMarkedChunk({
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'chunk',
      chunkIndex: 0,
      sentence: 'sentence',
      timestamp: 1000,
    });
    saveMarkedChunk({
      id: 'q2-0',
      questionId: 'q2',
      trainingId: 'listening-dining',
      chunkText: 'chunk2',
      chunkIndex: 0,
      sentence: 'sentence2',
      timestamp: 1001,
    });

    expect(loadMarkedChunks()).toHaveLength(2);
    clearMarkedChunks();
    expect(loadMarkedChunks()).toEqual([]);
    expect(getMarkedChunksCountMap()).toEqual({});
  });

  it('computes count map across multiple training units', () => {
    saveMarkedChunk({
      id: 'q1-0',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'chunk',
      chunkIndex: 0,
      sentence: 'sentence',
      timestamp: 1000,
    });
    saveMarkedChunk({
      id: 'q1-1',
      questionId: 'q1',
      trainingId: 'listening-travel',
      chunkText: 'chunk1',
      chunkIndex: 1,
      sentence: 'sentence',
      timestamp: 1001,
    });
    saveMarkedChunk({
      id: 'q2-0',
      questionId: 'q2',
      trainingId: 'listening-dining',
      chunkText: 'chunk2',
      chunkIndex: 0,
      sentence: 'sentence2',
      timestamp: 1002,
    });

    const map = getMarkedChunksCountMap();
    expect(map['listening-travel']).toBe(2);
    expect(map['listening-dining']).toBe(1);
    expect(map['listening-housing']).toBeUndefined();
  });
});
