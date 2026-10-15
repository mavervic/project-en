import type { Question, QuestionBank, QuestionBankMeta } from '../types/chunkflow';
import { STARTER_QUESTIONS } from './starterQuestions';
import { PARKER_BANK, PARKER_BANK_META, PARKER_QUESTIONS } from './parker';
import {
  TOEIC_PART5_L1_BANK,
  TOEIC_PART5_L1_META,
  TOEIC_PART5_L2_BANK,
  TOEIC_PART5_L2_META,
  TOEIC_PART5_L3_BANK,
  TOEIC_PART5_L3_META,
  TOEIC_PART5_BANKS,
} from './toeic-part5';

export const STARTER_BANK_META: QuestionBankMeta = {
  id: 'starter',
  name: '核心多益題庫',
  description: 'ChunkFlow 精選 12 題高頻商務情境多益題庫',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: STARTER_QUESTIONS.length,
  totalTrainings: 1,
};

export const STARTER_BANK: QuestionBank = {
  ...STARTER_BANK_META,
  questions: STARTER_QUESTIONS.map((q) => ({
    ...q,
    trainingId: q.trainingId ?? 'starter-01',
  })),
};

export const REGISTERED_BANKS: Record<string, QuestionBank> = {
  'toeic-part5-l1': TOEIC_PART5_L1_BANK,
  'toeic-part5-l2': TOEIC_PART5_L2_BANK,
  'toeic-part5-l3': TOEIC_PART5_L3_BANK,
  starter: STARTER_BANK,
  parker: PARKER_BANK,
};

export function getRegisteredBanks(): QuestionBankMeta[] {
  return [
    TOEIC_PART5_L1_META,
    TOEIC_PART5_L2_META,
    TOEIC_PART5_L3_META,
    STARTER_BANK_META,
    PARKER_BANK_META,
  ];
}

export function getBankById(id: string): QuestionBank | undefined {
  return REGISTERED_BANKS[id];
}

export function getBankQuestions(id: string): Question[] {
  return REGISTERED_BANKS[id]?.questions ?? STARTER_BANK.questions;
}

export { PARKER_BANK, PARKER_BANK_META, PARKER_QUESTIONS };
