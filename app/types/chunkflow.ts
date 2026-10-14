export interface SlotChunk {
  text: string;
  isTargetSlot: boolean;
  type?: 'verb' | 'subject' | 'object' | 'clause';
}

export interface Question {
  id: string;
  sentence: string;
  chunks: SlotChunk[];
  targetSlotIndex: number;
  correctAnswers: {
    voice: 'active' | 'passive';
    time: 'present' | 'past' | 'future';
    aspect?: 'simple' | 'continuous' | 'perfect';
  };
  grammarNote: string; // 解答與範例說明
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

export interface PerformanceStats {
  accuracy: number; // 0 - 100 percentage
  avgLatencyMs: number;
  chunksPerMin: number;
  currentStreak: number;
  totalAttempts: number;
  correctAttempts: number;
}

export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
  avgLatencyMs: number;
}

export interface ChunkFlowSettings {
  showGuidance: boolean;
}

export interface QuestionValidationResult {
  valid: boolean;
  errors: string[];
  questions: Question[];
}
