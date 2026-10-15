export interface SlotChunk {
  text: string;
  isTargetSlot: boolean;
  type?: 'verb' | 'subject' | 'object' | 'clause';
}

export interface Question {
  id: string;
  sentence: string;
  translation?: string; // Traditional Chinese sentence translation
  chunks: SlotChunk[];
  targetSlotIndex: number;
  correctAnswers: {
    voice: 'active' | 'passive';
    time: 'present' | 'past' | 'future';
    aspect?: 'simple' | 'continuous' | 'perfect';
  };
  grammarNote: string; // 解答與範例說明
  trainingId?: string; // e.g., 'parker-01'
}

export interface UserPerformance {
  questionId: string;
  latencyMs: number;
  isCorrect: boolean;
  timestamp: number;
  targetCategory: string; // e.g., 'past-passive'
}

export type VoiceChoice = 'active' | 'passive';
export type TimeChoice = 'present' | 'past' | 'future';

export interface RecentStats {
  accuracy: number; // 0 - 100 percentage over recent attempts (up to 10)
  avgLatencyMs: number;
  chunksPerMin: number;
  sampleSize: number;
  totalAttempts: number;
  correctAttempts: number;
}

export interface PerformanceStats {
  accuracy: number; // 0 - 100 lifetime percentage
  avgLatencyMs: number;
  chunksPerMin: number;
  currentStreak: number;
  bestStreak: number;
  totalAttempts: number;
  correctAttempts: number;
  recent: RecentStats;
}

export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
  avgLatencyMs: number;
}

export type SpeechAccent = 'AU' | 'GB' | 'US' | 'CA';

export interface ChunkFlowSettings {
  showGuidance: boolean;
  narrationEnabled?: boolean;
  speechAccent?: SpeechAccent;
}

export interface QuestionBankMeta {
  id: string;
  name: string;
  description: string;
  category?: string; // Grouping category in switcher (e.g. 'TOEIC Part 5 文法句型', 'TOEIC Listening 聽力題庫')
  totalQuestions: number;
  totalTrainings: number;
}

export interface QuestionBank extends QuestionBankMeta {
  questions: Question[];
}

export interface TrainingUnitTelemetry {
  trainingId: string;
  lessonName: string;
  unitNumber: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number; // 0 - 100
  avgLatencyMs: number;
  bestStreak: number;
  masteryTier: 0 | 1 | 2 | 3 | 4;
  isCompleted: boolean;
}

export interface QuestionValidationResult {
  valid: boolean;
  errors: string[];
  questions: Question[];
}
