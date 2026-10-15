import { ALL_PARKER_QUESTIONS, PARKER_QUESTIONS_BY_UNIT } from './units';
import type { Question, QuestionBank, QuestionBankMeta } from '~/types/chunkflow';

export { ALL_PARKER_QUESTIONS, PARKER_QUESTIONS_BY_UNIT };
export const PARKER_QUESTIONS: Question[] = ALL_PARKER_QUESTIONS;

export const PARKER_BANK_META: QuestionBankMeta = {
  id: 'parker',
  name: '怕渴題庫',
  description: '精選 50 部怕渴英文多益聽力訓練句型題庫 (50 堂課獨立單元)',
  totalQuestions: PARKER_QUESTIONS.length,
  totalTrainings: 50,
};

export const PARKER_BANK: QuestionBank = {
  ...PARKER_BANK_META,
  questions: PARKER_QUESTIONS,
};
