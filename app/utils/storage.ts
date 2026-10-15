import type {
  CategoryStat,
  ChunkFlowSettings,
  PerformanceStats,
  Question,
  QuestionValidationResult,
  SpeechAccent,
  TrainingUnitTelemetry,
  UserPerformance,
} from '../types/chunkflow';

const STORAGE_KEY = 'chunkflow_performance_v1';
const SETTINGS_STORAGE_KEY = 'chunkflow_settings_v1';
const CUSTOM_QUESTIONS_STORAGE_KEY = 'chunkflow_custom_questions_v1';
const NARRATION_STORAGE_KEY = 'chunkflow_narration_enabled_v1';
const SPEECH_ACCENT_STORAGE_KEY = 'chunkflow_speech_accent_v1';
const ACTIVE_BANK_STORAGE_KEY = 'chunkflow_active_bank_v1';

const DEFAULT_SETTINGS: ChunkFlowSettings = {
  showGuidance: false,
  narrationEnabled: false,
  speechAccent: 'US',
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

const BEST_STREAK_STORAGE_KEY = 'chunkflow_best_streak_v1';

export function loadBestStreak(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(BEST_STREAK_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch (err) {
    console.warn('Failed to load best streak from localStorage', err);
    return 0;
  }
}

export function saveBestStreak(streak: number): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BEST_STREAK_STORAGE_KEY, String(streak));
    } catch (err) {
      console.warn('Failed to save best streak to localStorage', err);
    }
  }
}

const SV_DRILL_STORAGE_KEY = 'chunkflow_sv_drill_v1';

export function loadSubjectVerbDrill(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(SV_DRILL_STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch (err) {
    console.warn('Failed to load subject-verb drill setting from localStorage', err);
    return true;
  }
}

export function saveSubjectVerbDrill(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SV_DRILL_STORAGE_KEY, String(enabled));
    } catch (err) {
      console.warn('Failed to save subject-verb drill setting to localStorage', err);
    }
  }
}

export function computeStats(records: UserPerformance[]): PerformanceStats {
  const storedBest = loadBestStreak();

  if (records.length === 0) {
    return {
      accuracy: 0,
      avgLatencyMs: 0,
      chunksPerMin: 0,
      currentStreak: 0,
      bestStreak: storedBest,
      totalAttempts: 0,
      correctAttempts: 0,
      recent: {
        accuracy: 0,
        avgLatencyMs: 0,
        chunksPerMin: 0,
        sampleSize: 0,
        totalAttempts: 0,
        correctAttempts: 0,
      },
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

  // Calculate maximum streak achieved across all records in the dataset
  let maxHistoricalStreak = 0;
  let runningStreak = 0;
  for (let i = 0; i < records.length; i++) {
    if (records[i].isCorrect) {
      runningStreak++;
      if (runningStreak > maxHistoricalStreak) {
        maxHistoricalStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  const bestStreak = Math.max(storedBest, maxHistoricalStreak, currentStreak);
  if (bestStreak > storedBest) {
    saveBestStreak(bestStreak);
  }

  // Compute Recent-10 Rolling Window
  const recentRecords = records.slice(-10);
  const recentSampleSize = recentRecords.length;
  const recentCorrect = recentRecords.filter((r) => r.isCorrect).length;
  const recentAccuracy =
    recentSampleSize > 0 ? Math.round((recentCorrect / recentSampleSize) * 100) : 0;
  const recentTotalLatency = recentRecords.reduce((acc, r) => acc + r.latencyMs, 0);
  const recentAvgLatencyMs =
    recentSampleSize > 0 ? Math.round(recentTotalLatency / recentSampleSize) : 0;
  const recentChunksPerMin = recentAvgLatencyMs > 0 ? Math.round(60000 / recentAvgLatencyMs) : 0;

  return {
    accuracy,
    avgLatencyMs,
    chunksPerMin,
    currentStreak,
    bestStreak,
    totalAttempts,
    correctAttempts,
    recent: {
      accuracy: recentAccuracy,
      avgLatencyMs: recentAvgLatencyMs,
      chunksPerMin: recentChunksPerMin,
      sampleSize: recentSampleSize,
      totalAttempts: recentSampleSize,
      correctAttempts: recentCorrect,
    },
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
      return {
        showGuidance: parsed.showGuidance ?? DEFAULT_SETTINGS.showGuidance,
        narrationEnabled: parsed.narrationEnabled ?? DEFAULT_SETTINGS.narrationEnabled,
        speechAccent: parsed.speechAccent ?? DEFAULT_SETTINGS.speechAccent,
      };
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

export function loadNarrationEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(NARRATION_STORAGE_KEY);
    if (raw === null) return false;
    return raw === 'true';
  } catch (err) {
    console.warn('Failed to load narration enabled setting from localStorage', err);
    return false;
  }
}

export function saveNarrationEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(NARRATION_STORAGE_KEY, String(enabled));
    } catch (err) {
      console.warn('Failed to save narration enabled setting to localStorage', err);
    }
  }
}

export function loadSpeechAccent(): SpeechAccent {
  if (typeof window === 'undefined') return 'US';
  try {
    const raw = window.localStorage.getItem(SPEECH_ACCENT_STORAGE_KEY);
    if (raw === 'AU' || raw === 'GB' || raw === 'US' || raw === 'CA') {
      return raw;
    }
  } catch (err) {
    console.warn('Failed to load speech accent from localStorage', err);
  }
  return 'US';
}

export function saveSpeechAccent(accent: SpeechAccent): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SPEECH_ACCENT_STORAGE_KEY, accent);
    } catch (err) {
      console.warn('Failed to save speech accent to localStorage', err);
    }
  }
}

export function loadActiveBankId(): string {
  if (typeof window === 'undefined') return 'parker';
  try {
    const raw = window.localStorage.getItem(ACTIVE_BANK_STORAGE_KEY);
    if (raw) return raw;
  } catch (err) {
    console.warn('Failed to load active bank ID from localStorage', err);
  }
  return 'parker';
}

export function saveActiveBankId(id: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ACTIVE_BANK_STORAGE_KEY, id);
    } catch (err) {
      console.warn('Failed to save active bank ID to localStorage', err);
    }
  }
}

export function computeMasteryTier(totalAttempts: number, accuracy: number): 0 | 1 | 2 | 3 | 4 {
  if (totalAttempts === 0) return 0;
  if (accuracy < 60) return 1;
  if (accuracy < 80) return 2;
  if (accuracy < 90) return 3;
  return 4;
}

export function computeTrainingTelemetry(
  history: UserPerformance[],
  questions: Question[]
): Record<string, TrainingUnitTelemetry> {
  const questionTrainingMap = new Map<string, string>();
  const trainingIds = new Set<string>();
  const unitQuestionsMap = new Map<string, string[]>();

  for (const q of questions) {
    if (q.trainingId) {
      questionTrainingMap.set(q.id, q.trainingId);
      trainingIds.add(q.trainingId);
      if (!unitQuestionsMap.has(q.trainingId)) {
        unitQuestionsMap.set(q.trainingId, []);
      }
      unitQuestionsMap.get(q.trainingId)!.push(q.id);
    }
  }

  const trainingRecordsMap = new Map<string, UserPerformance[]>();
  for (const tId of trainingIds) {
    trainingRecordsMap.set(tId, []);
  }

  for (const record of history) {
    const tId = questionTrainingMap.get(record.questionId);
    if (tId && trainingRecordsMap.has(tId)) {
      trainingRecordsMap.get(tId)!.push(record);
    }
  }

  const result: Record<string, TrainingUnitTelemetry> = {};

  for (const tId of trainingIds) {
    const records = trainingRecordsMap.get(tId) || [];
    const unitQIds = unitQuestionsMap.get(tId) || [];
    const attemptedQIds = new Set(records.map((r) => r.questionId));
    const isCompleted = unitQIds.length > 0 && attemptedQIds.size >= unitQIds.length;

    const totalAttempts = records.length;
    const correctAttempts = records.filter((r) => r.isCorrect).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    const totalLatency = records.reduce((acc, r) => acc + r.latencyMs, 0);
    const avgLatencyMs = totalAttempts > 0 ? Math.round(totalLatency / totalAttempts) : 0;

    let bestStreak = 0;
    let runningStreak = 0;
    for (const r of records) {
      if (r.isCorrect) {
        runningStreak++;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }

    const match = tId.match(/(\d+)(?!.*\d)/);
    const unitNumber = match ? parseInt(match[1], 10) : 0;
    const padded = unitNumber > 0 ? String(unitNumber).padStart(2, '0') : tId;
    const lessonName = `第 ${padded} 課`;

    result[tId] = {
      trainingId: tId,
      lessonName,
      unitNumber,
      totalAttempts,
      correctAttempts,
      accuracy,
      avgLatencyMs,
      bestStreak,
      masteryTier: computeMasteryTier(totalAttempts, accuracy),
      isCompleted,
    };
  }

  return result;
}

export function loadCustomQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_QUESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load custom questions from localStorage', err);
  }
  return [];
}

export function saveCustomQuestions(questions: Question[]): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
    } catch (err) {
      console.warn('Failed to save custom questions to localStorage', err);
    }
  }
}

export function clearCustomQuestions(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(CUSTOM_QUESTIONS_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear custom questions from localStorage', err);
    }
  }
}

export function validateQuestionsJson(raw: string): QuestionValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return {
      valid: false,
      errors: ['Input is empty. Please paste valid JSON text or upload a .json file.'],
      questions: [],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      valid: false,
      errors: [`Invalid JSON syntax: ${(err as Error).message}`],
      questions: [],
    };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (items.length === 0) {
    return {
      valid: false,
      errors: ['JSON array contains no question items.'],
      questions: [],
    };
  }

  const validatedQuestions: Question[] = [];

  items.forEach((item, index) => {
    const qNum = index + 1;
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item #${qNum} is not a valid question object.`);
      return;
    }

    const q = item as Record<string, any>;

    // 1. Sentence check
    if (typeof q.sentence !== 'string' || !q.sentence.trim()) {
      errors.push(`Question #${qNum}: Missing or empty 'sentence' string.`);
    }

    // 2. Chunks check
    let foundTargetIndex = -1;
    if (!Array.isArray(q.chunks) || q.chunks.length === 0) {
      errors.push(`Question #${qNum}: 'chunks' must be a non-empty array of chunk objects.`);
    } else {
      let targetSlotCount = 0;
      q.chunks.forEach((chunk: any, cIdx: number) => {
        if (typeof chunk !== 'object' || chunk === null) {
          errors.push(
            `Question #${qNum}, Chunk #${cIdx + 1}: Must be an object with 'text' and 'isTargetSlot'.`
          );
          return;
        }
        if (typeof chunk.text !== 'string' || !chunk.text.trim()) {
          errors.push(`Question #${qNum}, Chunk #${cIdx + 1}: Missing or empty chunk 'text'.`);
        }
        if (typeof chunk.isTargetSlot !== 'boolean') {
          errors.push(
            `Question #${qNum}, Chunk #${cIdx + 1}: 'isTargetSlot' must be a boolean (true or false).`
          );
        } else if (chunk.isTargetSlot) {
          targetSlotCount++;
          if (foundTargetIndex === -1) {
            foundTargetIndex = cIdx;
          }
        }
      });

      if (targetSlotCount === 0) {
        errors.push(
          `Question #${qNum}: Exactly one chunk must have 'isTargetSlot: true' (found 0).`
        );
      } else if (targetSlotCount > 1) {
        errors.push(
          `Question #${qNum}: Only one chunk can have 'isTargetSlot: true' (found ${targetSlotCount}).`
        );
      }
    }

    // 3. Target Slot Index
    const targetSlotIndex =
      typeof q.targetSlotIndex === 'number' && q.targetSlotIndex >= 0
        ? q.targetSlotIndex
        : foundTargetIndex >= 0
          ? foundTargetIndex
          : 0;

    // 4. Correct Answers check
    if (typeof q.correctAnswers !== 'object' || q.correctAnswers === null) {
      errors.push(`Question #${qNum}: Missing 'correctAnswers' object.`);
    } else {
      const validVoices = ['active', 'passive'];
      const validTimes = ['present', 'past', 'future'];

      if (!validVoices.includes(q.correctAnswers.voice)) {
        errors.push(
          `Question #${qNum}: 'correctAnswers.voice' must be either 'active' or 'passive' (received: ${q.correctAnswers.voice}).`
        );
      }
      if (!validTimes.includes(q.correctAnswers.time)) {
        errors.push(
          `Question #${qNum}: 'correctAnswers.time' must be 'present', 'past', or 'future' (received: ${q.correctAnswers.time}).`
        );
      }
    }

    // 5. Grammar Note check
    const grammarNote = typeof q.grammarNote === 'string' ? q.grammarNote : '';

    if (errors.length === 0) {
      const id =
        typeof q.id === 'string' && q.id.trim()
          ? q.id.trim()
          : `q-custom-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

      validatedQuestions.push({
        id,
        sentence: q.sentence.trim(),
        chunks: q.chunks.map((c: any) => ({
          text: String(c.text).trim(),
          isTargetSlot: Boolean(c.isTargetSlot),
          type: c.type,
        })),
        targetSlotIndex: foundTargetIndex >= 0 ? foundTargetIndex : targetSlotIndex,
        correctAnswers: {
          voice: q.correctAnswers.voice,
          time: q.correctAnswers.time,
          aspect: q.correctAnswers.aspect,
        },
        grammarNote,
        translation:
          typeof q.translation === 'string' && q.translation.trim()
            ? q.translation.trim()
            : undefined,
        trainingId:
          typeof q.trainingId === 'string' && q.trainingId.trim() ? q.trainingId.trim() : undefined,
      });
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      questions: [],
    };
  }

  return {
    valid: true,
    errors: [],
    questions: validatedQuestions,
  };
}
