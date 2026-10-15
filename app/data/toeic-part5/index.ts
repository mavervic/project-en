import type { Question, QuestionBank, QuestionBankMeta } from '../../types/chunkflow';
import level1Questions from './level1/training1.json';
import level2Questions from './level2/training1.json';
import level3Questions from './level3/training1.json';

export const TOEIC_PART5_LEVEL1_QUESTIONS: Question[] = level1Questions as Question[];
export const TOEIC_PART5_LEVEL2_QUESTIONS: Question[] = level2Questions as Question[];
export const TOEIC_PART5_LEVEL3_QUESTIONS: Question[] = level3Questions as Question[];

export const TOEIC_PART5_L1_META: QuestionBankMeta = {
  id: 'toeic-part5-l1',
  name: 'Part 5: Level 1 基礎句型 (S-V 緊鄰)',
  description: '初階題庫訓練1 (30題)：短主詞與主要動詞緊鄰，涵蓋主被動與三種時態',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: TOEIC_PART5_LEVEL1_QUESTIONS.length,
  totalTrainings: 1,
};

export const TOEIC_PART5_L2_META: QuestionBankMeta = {
  id: 'toeic-part5-l2',
  name: 'Part 5: Level 2 中階句型 (介系詞隔離)',
  description: '中階題庫訓練1 (30題)：長主詞被介系詞片語隔開，解鎖完成式與進行式',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: TOEIC_PART5_LEVEL2_QUESTIONS.length,
  totalTrainings: 1,
};

export const TOEIC_PART5_L3_META: QuestionBankMeta = {
  id: 'toeic-part5-l3',
  name: 'Part 5: Level 3 高階句型 (真假動詞陷阱)',
  description: '高階題庫訓練1 (30題)：真假動詞陷阱、分詞後修飾與關係子句',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: TOEIC_PART5_LEVEL3_QUESTIONS.length,
  totalTrainings: 1,
};

export const TOEIC_PART5_L1_BANK: QuestionBank = {
  ...TOEIC_PART5_L1_META,
  questions: TOEIC_PART5_LEVEL1_QUESTIONS,
};

export const TOEIC_PART5_L2_BANK: QuestionBank = {
  ...TOEIC_PART5_L2_META,
  questions: TOEIC_PART5_LEVEL2_QUESTIONS,
};

export const TOEIC_PART5_L3_BANK: QuestionBank = {
  ...TOEIC_PART5_L3_META,
  questions: TOEIC_PART5_LEVEL3_QUESTIONS,
};

export const TOEIC_PART5_BANKS: Record<string, QuestionBank> = {
  'toeic-part5-l1': TOEIC_PART5_L1_BANK,
  'toeic-part5-l2': TOEIC_PART5_L2_BANK,
  'toeic-part5-l3': TOEIC_PART5_L3_BANK,
};
