import type { Question, QuestionBank, QuestionBankMeta } from '../types/chunkflow';
import { STARTER_QUESTIONS } from './starterQuestions';
import { PARKER_BANK, PARKER_BANK_META, PARKER_QUESTIONS } from './parker';
import {
  TOEIC_PART5_BANK,
  TOEIC_PART5_META,
  TOEIC_PART5_L1_BANK,
  TOEIC_PART5_L1_META,
  TOEIC_PART5_L2_BANK,
  TOEIC_PART5_L2_META,
  TOEIC_PART5_L3_BANK,
  TOEIC_PART5_L3_META,
} from './toeic-part5';
import {
  TOEIC_LISTENING_BANK,
  TOEIC_LISTENING_META,
  TOEIC_LISTENING_QUESTIONS,
} from './toeic-listening';
import {
  LOL_WORLDS_LISTENING_BANK,
  LOL_WORLDS_LISTENING_META,
  LOL_WORLDS_LISTENING_QUESTIONS,
} from './lol-worlds-listening';
import { NBA_LISTENING_BANK, NBA_LISTENING_META, NBA_LISTENING_QUESTIONS } from './nba-listening';

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
  'nba-listening': NBA_LISTENING_BANK,
  'lol-worlds-listening': LOL_WORLDS_LISTENING_BANK,
  'toeic-listening': TOEIC_LISTENING_BANK,
  'toeic-part5': TOEIC_PART5_BANK,
  'toeic-part5-l1': TOEIC_PART5_BANK,
  'toeic-part5-l2': TOEIC_PART5_BANK,
  'toeic-part5-l3': TOEIC_PART5_BANK,
  starter: STARTER_BANK,
  parker: PARKER_BANK,
};

export function getRegisteredBanks(): QuestionBankMeta[] {
  return [
    TOEIC_PART5_META,
    STARTER_BANK_META,
    PARKER_BANK_META,
    TOEIC_LISTENING_META,
    LOL_WORLDS_LISTENING_META,
    NBA_LISTENING_META,
  ];
}

export function getBankById(id: string): QuestionBank | undefined {
  if (id === 'toeic-part5-l1' || id === 'toeic-part5-l2' || id === 'toeic-part5-l3') {
    return TOEIC_PART5_BANK;
  }
  return REGISTERED_BANKS[id];
}

export function getBankQuestions(id: string): Question[] {
  if (id === 'toeic-part5-l1' || id === 'toeic-part5-l2' || id === 'toeic-part5-l3') {
    return TOEIC_PART5_BANK.questions;
  }
  return REGISTERED_BANKS[id]?.questions ?? STARTER_BANK.questions;
}

export {
  PARKER_BANK,
  PARKER_BANK_META,
  PARKER_QUESTIONS,
  LOL_WORLDS_LISTENING_BANK,
  LOL_WORLDS_LISTENING_META,
  LOL_WORLDS_LISTENING_QUESTIONS,
  NBA_LISTENING_BANK,
  NBA_LISTENING_META,
  NBA_LISTENING_QUESTIONS,
};
