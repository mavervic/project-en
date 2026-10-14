import parkerQuestionsData from './parkerQuestions.json';
import type { Question, QuestionBank, QuestionBankMeta } from '~/types/chunkflow';

export const PARKER_QUESTIONS: Question[] = parkerQuestionsData as Question[];

export const PARKER_BANK_META: QuestionBankMeta = {
  id: 'parker',
  name: '怕渴題庫',
  description: '精選 50 部怕渴英文多益聽力訓練句型題庫',
  totalQuestions: PARKER_QUESTIONS.length,
  totalTrainings: 50,
};

export const PARKER_BANK: QuestionBank = {
  ...PARKER_BANK_META,
  questions: PARKER_QUESTIONS,
};
