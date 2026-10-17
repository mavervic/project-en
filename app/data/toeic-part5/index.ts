import type { Question, QuestionBank, QuestionBankMeta } from '../../types/chunkflow';
import level1Questions from './level1/training1.json';
import level1Training2 from './level1/training2.json';
import level1Training3 from './level1/training3.json';
import level1Training4 from './level1/training4.json';
import level1Training5 from './level1/training5.json';
import level2Questions from './level2/training1.json';
import level2Training2 from './level2/training2.json';
import level2Training3 from './level2/training3.json';
import level3Questions from './level3/training1.json';
import level3Training2 from './level3/training2.json';
import level3Training3 from './level3/training3.json';

export const TOEIC_PART5_LEVEL1_QUESTIONS: Question[] = level1Questions as Question[];
export const TOEIC_PART5_LEVEL1_T2_QUESTIONS: Question[] = level1Training2 as Question[];
export const TOEIC_PART5_LEVEL1_T3_QUESTIONS: Question[] = level1Training3 as Question[];
export const TOEIC_PART5_LEVEL1_T4_QUESTIONS: Question[] = level1Training4 as Question[];
export const TOEIC_PART5_LEVEL1_T5_QUESTIONS: Question[] = level1Training5 as Question[];
export const TOEIC_PART5_LEVEL2_QUESTIONS: Question[] = level2Questions as Question[];
export const TOEIC_PART5_LEVEL2_T2_QUESTIONS: Question[] = level2Training2 as Question[];
export const TOEIC_PART5_LEVEL2_T3_QUESTIONS: Question[] = level2Training3 as Question[];
export const TOEIC_PART5_LEVEL3_QUESTIONS: Question[] = level3Questions as Question[];
export const TOEIC_PART5_LEVEL3_T2_QUESTIONS: Question[] = level3Training2 as Question[];
export const TOEIC_PART5_LEVEL3_T3_QUESTIONS: Question[] = level3Training3 as Question[];

export const ALL_TOEIC_PART5_LEVEL1_QUESTIONS: Question[] = [
  ...TOEIC_PART5_LEVEL1_QUESTIONS,
  ...TOEIC_PART5_LEVEL1_T2_QUESTIONS,
  ...TOEIC_PART5_LEVEL1_T3_QUESTIONS,
  ...TOEIC_PART5_LEVEL1_T4_QUESTIONS,
  ...TOEIC_PART5_LEVEL1_T5_QUESTIONS,
];

export const ALL_TOEIC_PART5_LEVEL2_QUESTIONS: Question[] = [
  ...TOEIC_PART5_LEVEL2_QUESTIONS,
  ...TOEIC_PART5_LEVEL2_T2_QUESTIONS,
  ...TOEIC_PART5_LEVEL2_T3_QUESTIONS,
];

export const ALL_TOEIC_PART5_LEVEL3_QUESTIONS: Question[] = [
  ...TOEIC_PART5_LEVEL3_QUESTIONS,
  ...TOEIC_PART5_LEVEL3_T2_QUESTIONS,
  ...TOEIC_PART5_LEVEL3_T3_QUESTIONS,
];

export const TOEIC_PART5_QUESTIONS_BY_UNIT: Record<string, Question[]> = {
  'level1-01': TOEIC_PART5_LEVEL1_QUESTIONS,
  'level1-02': TOEIC_PART5_LEVEL1_T2_QUESTIONS,
  'level1-03': TOEIC_PART5_LEVEL1_T3_QUESTIONS,
  'level1-04': TOEIC_PART5_LEVEL1_T4_QUESTIONS,
  'level1-05': TOEIC_PART5_LEVEL1_T5_QUESTIONS,
  'level2-01': TOEIC_PART5_LEVEL2_QUESTIONS,
  'level2-02': TOEIC_PART5_LEVEL2_T2_QUESTIONS,
  'level2-03': TOEIC_PART5_LEVEL2_T3_QUESTIONS,
  'level3-01': TOEIC_PART5_LEVEL3_QUESTIONS,
  'level3-02': TOEIC_PART5_LEVEL3_T2_QUESTIONS,
  'level3-03': TOEIC_PART5_LEVEL3_T3_QUESTIONS,
};

export const TOEIC_PART5_L1_META: QuestionBankMeta = {
  id: 'toeic-part5-l1',
  name: 'Part 5: Level 1 基礎句型 (S-V 緊鄰)',
  description: '初階題庫 (150題，5 個訓練單元)：短主詞與主要動詞緊鄰，涵蓋主被動與三種時態',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: ALL_TOEIC_PART5_LEVEL1_QUESTIONS.length,
  totalTrainings: 5,
};

export const TOEIC_PART5_L2_META: QuestionBankMeta = {
  id: 'toeic-part5-l2',
  name: 'Part 5: Level 2 中階句型 (介系詞隔離)',
  description: '中階題庫 (90題，3 個訓練單元)：長主詞被介系詞片語隔開，解鎖完成式與進行式',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: ALL_TOEIC_PART5_LEVEL2_QUESTIONS.length,
  totalTrainings: 3,
};

export const TOEIC_PART5_L3_META: QuestionBankMeta = {
  id: 'toeic-part5-l3',
  name: 'Part 5: Level 3 高階句型 (真假動詞陷阱)',
  description:
    '高階題庫 (90題，3 個訓練單元)：真假動詞陷阱、情態完成式 (Modal Perfect) 與假設倒裝句型',
  category: 'TOEIC Part 5 文法句型',
  totalQuestions: ALL_TOEIC_PART5_LEVEL3_QUESTIONS.length,
  totalTrainings: 3,
};

export const TOEIC_PART5_L1_BANK: QuestionBank = {
  ...TOEIC_PART5_L1_META,
  questions: ALL_TOEIC_PART5_LEVEL1_QUESTIONS,
};

export const TOEIC_PART5_L2_BANK: QuestionBank = {
  ...TOEIC_PART5_L2_META,
  questions: ALL_TOEIC_PART5_LEVEL2_QUESTIONS,
};

export const TOEIC_PART5_L3_BANK: QuestionBank = {
  ...TOEIC_PART5_L3_META,
  questions: ALL_TOEIC_PART5_LEVEL3_QUESTIONS,
};

export const TOEIC_PART5_BANKS: Record<string, QuestionBank> = {
  'toeic-part5-l1': TOEIC_PART5_L1_BANK,
  'toeic-part5-l2': TOEIC_PART5_L2_BANK,
  'toeic-part5-l3': TOEIC_PART5_L3_BANK,
};
