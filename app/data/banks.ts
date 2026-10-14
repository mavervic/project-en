import type { Question, QuestionBank, QuestionBankMeta } from '~/types/chunkflow';
import { STARTER_QUESTIONS } from './starterQuestions';
import { PARKER_BANK, PARKER_BANK_META, PARKER_QUESTIONS } from './parker';

export const STARTER_BANK_META: QuestionBankMeta = {
  id: 'starter',
  name: '核心多益題庫',
  description: 'ChunkFlow 精選 12 題高頻商務情境多益題庫',
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
  starter: STARTER_BANK,
  parker: PARKER_BANK,
};

export function getRegisteredBanks(): QuestionBankMeta[] {
  return [STARTER_BANK_META, PARKER_BANK_META];
}

export function getBankById(id: string): QuestionBank | undefined {
  return REGISTERED_BANKS[id];
}

export function getBankQuestions(id: string): Question[] {
  return REGISTERED_BANKS[id]?.questions ?? STARTER_BANK.questions;
}

export { PARKER_BANK, PARKER_BANK_META, PARKER_QUESTIONS };
