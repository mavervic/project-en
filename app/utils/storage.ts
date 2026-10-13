import type {
  CategoryStat,
  ChunkFlowSettings,
  PerformanceStats,
  UserPerformance,
} from '../types/chunkflow';

const STORAGE_KEY = 'chunkflow_performance_v1';
const SETTINGS_STORAGE_KEY = 'chunkflow_settings_v1';

const DEFAULT_SETTINGS: ChunkFlowSettings = {
  showGuidance: false,
};

export function loadPerformanceRecords(): UserPerformance[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load ChunkFlow performance records from localStorage', err);
  }
  return [];
}

export function savePerformanceRecord(record: UserPerformance): UserPerformance[] {
  const current = loadPerformanceRecords();
  const updated = [...current, record];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save ChunkFlow performance record to localStorage', err);
    }
  }
  return updated;
}

export function clearPerformanceRecords(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear ChunkFlow performance records', err);
    }
  }
}

export function computeStats(records: UserPerformance[]): PerformanceStats {
  if (records.length === 0) {
    return {
      accuracy: 100,
      avgLatencyMs: 0,
      chunksPerMin: 0,
      currentStreak: 0,
      totalAttempts: 0,
      correctAttempts: 0,
    };
  }

  const totalAttempts = records.length;
  const correctAttempts = records.filter((r) => r.isCorrect).length;
  const accuracy = Math.round((correctAttempts / totalAttempts) * 100);

  const totalLatency = records.reduce((acc, r) => acc + r.latencyMs, 0);
  const avgLatencyMs = Math.round(totalLatency / totalAttempts);
  const chunksPerMin = avgLatencyMs > 0 ? Math.round(60000 / avgLatencyMs) : 0;

  // Calculate current streak from most recent records
  let currentStreak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].isCorrect) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    accuracy,
    avgLatencyMs,
    chunksPerMin,
    currentStreak,
    totalAttempts,
    correctAttempts,
  };
}

export function computeCategoryStats(records: UserPerformance[]): Record<string, CategoryStat> {
  const statsMap: Record<string, CategoryStat> = {};

  for (const record of records) {
    const cat = record.targetCategory;
    if (!statsMap[cat]) {
      statsMap[cat] = {
        category: cat,
        total: 0,
        correct: 0,
        accuracy: 0,
        avgLatencyMs: 0,
      };
    }
    statsMap[cat].total++;
    if (record.isCorrect) {
      statsMap[cat].correct++;
    }
  }

  // Compute accuracy and latency averages
  for (const cat in statsMap) {
    const catRecords = records.filter((r) => r.targetCategory === cat);
    const catTotalLatency = catRecords.reduce((acc, r) => acc + r.latencyMs, 0);
    statsMap[cat].accuracy = Math.round((statsMap[cat].correct / statsMap[cat].total) * 100);
    statsMap[cat].avgLatencyMs = Math.round(catTotalLatency / statsMap[cat].total);
  }

  return statsMap;
}

export function loadSettings(): ChunkFlowSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.showGuidance === 'boolean') {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load ChunkFlow settings from localStorage', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ChunkFlowSettings): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save ChunkFlow settings to localStorage', err);
    }
  }
}
