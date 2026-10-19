import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
} from '../../types/chunkflow';

import travelQuestions from './easy/01-travel.json';
import diningOutQuestions from './easy/02-dining-out.json';
import entertainmentQuestions from './easy/03-entertainment.json';
import housingQuestions from './easy/04-housing.json';
import purchasingQuestions from './easy/05-purchasing.json';
import personnelQuestions from './easy/06-personnel.json';
import officesQuestions from './easy/07-offices.json';
import healthQuestions from './easy/08-health.json';
import generalBusinessQuestions from './easy/09-general-business.json';
import manufacturingQuestions from './easy/10-manufacturing.json';
import corporateDevQuestions from './easy/11-corporate-development.json';
import technicalAreasQuestions from './easy/12-technical-areas.json';
import financingBudgetingQuestions from './easy/13-financing-budgeting.json';

export const TOEIC_LISTENING_UNITS = [
  {
    trainingId: 'listening-01-easy',
    title: 'Travel (Easy)',
    unitNumber: 1,
    difficulty: 'Easy' as const,
    tags: ['出差', '交通', '航班'],
  },
  {
    trainingId: 'listening-02-easy',
    title: 'Dining out (Easy)',
    unitNumber: 2,
    difficulty: 'Easy' as const,
    tags: ['商務餐敘', '訂位', '菜單'],
  },
  {
    trainingId: 'listening-03-easy',
    title: 'Entertainment (Easy)',
    unitNumber: 3,
    difficulty: 'Easy' as const,
    tags: ['文娛活動', '接待', '觀光'],
  },
  {
    trainingId: 'listening-04-easy',
    title: 'Housing (Easy)',
    unitNumber: 4,
    difficulty: 'Easy' as const,
    tags: ['租賃', '搬遷', '辦公室裝潢'],
  },
  {
    trainingId: 'listening-05-easy',
    title: 'Purchasing (Easy)',
    unitNumber: 5,
    difficulty: 'Easy' as const,
    tags: ['採購', '詢價', '供應商'],
  },
  {
    trainingId: 'listening-06-easy',
    title: 'Personnel (Easy)',
    unitNumber: 6,
    difficulty: 'Easy' as const,
    tags: ['招募', '面試', '人資福利'],
  },
  {
    trainingId: 'listening-07-easy',
    title: 'Offices (Easy)',
    unitNumber: 7,
    difficulty: 'Easy' as const,
    tags: ['辦公室行政', '會議安排', '設備'],
  },
  {
    trainingId: 'listening-08-easy',
    title: 'Health (Easy)',
    unitNumber: 8,
    difficulty: 'Easy' as const,
    tags: ['醫療保險', '健康安全', '健檢'],
  },
  {
    trainingId: 'listening-09-easy',
    title: 'General Business (Easy)',
    unitNumber: 9,
    difficulty: 'Easy' as const,
    tags: ['商業合約', '跨部門協作', '銷售'],
  },
  {
    trainingId: 'listening-10-easy',
    title: 'Manufacturing (Easy)',
    unitNumber: 10,
    difficulty: 'Easy' as const,
    tags: ['生產線', '品管', '製程'],
  },
  {
    trainingId: 'listening-11-easy',
    title: 'Corporate Development (Easy)',
    unitNumber: 11,
    difficulty: 'Easy' as const,
    tags: ['策略規劃', '企業併購', '擴張'],
  },
  {
    trainingId: 'listening-12-easy',
    title: 'Technical areas (Easy)',
    unitNumber: 12,
    difficulty: 'Easy' as const,
    tags: ['資訊科技', '軟硬體', '系統維護'],
  },
  {
    trainingId: 'listening-13-easy',
    title: 'Financing & Budgeting (Easy)',
    unitNumber: 13,
    difficulty: 'Easy' as const,
    tags: ['財務報表', '預算編列', '審計'],
  },
];

const SITUATION_TITLES = [
  'Travel',
  'Dining out',
  'Entertainment',
  'Housing',
  'Purchasing',
  'Personnel',
  'Offices',
  'Health',
  'General Business',
  'Manufacturing',
  'Corporate Development',
  'Technical areas',
  'Financing & Budgeting',
];

export const TOEIC_LISTENING_GROUPS: TrainingGroup[] = SITUATION_TITLES.map(
  (situationTitle, idx) => {
    const pad = String(idx + 1).padStart(2, '0');
    const unit = TOEIC_LISTENING_UNITS[idx];
    return {
      id: `group-listening-${pad}`,
      title: `${pad}. ${situationTitle}`,
      units: [unit],
    };
  }
);

export const TOEIC_LISTENING_QUESTIONS: Question[] = [
  ...(travelQuestions as Question[]),
  ...(diningOutQuestions as Question[]),
  ...(entertainmentQuestions as Question[]),
  ...(housingQuestions as Question[]),
  ...(purchasingQuestions as Question[]),
  ...(personnelQuestions as Question[]),
  ...(officesQuestions as Question[]),
  ...(healthQuestions as Question[]),
  ...(generalBusinessQuestions as Question[]),
  ...(manufacturingQuestions as Question[]),
  ...(corporateDevQuestions as Question[]),
  ...(technicalAreasQuestions as Question[]),
  ...(financingBudgetingQuestions as Question[]),
];

export const TOEIC_LISTENING_META: QuestionBankMeta = {
  id: 'toeic-listening',
  name: 'TOEIC Listening 核心聽力題庫',
  description: '13 大商務情境情境聽力與語塊盲點標記訓練',
  category: 'TOEIC Listening 聽力題庫',
  totalQuestions: TOEIC_LISTENING_QUESTIONS.length,
  totalTrainings: TOEIC_LISTENING_UNITS.length,
  groups: TOEIC_LISTENING_GROUPS,
};

export const TOEIC_LISTENING_BANK: QuestionBank = {
  ...TOEIC_LISTENING_META,
  questions: TOEIC_LISTENING_QUESTIONS,
};
