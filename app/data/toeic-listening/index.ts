import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
  TrainingUnitMeta,
} from '../../types/chunkflow';

// Easy tier question datasets
import travelEasyQuestions from './easy/01-travel.json';
import diningOutEasyQuestions from './easy/02-dining-out.json';
import entertainmentEasyQuestions from './easy/03-entertainment.json';
import housingEasyQuestions from './easy/04-housing.json';
import purchasingEasyQuestions from './easy/05-purchasing.json';
import personnelEasyQuestions from './easy/06-personnel.json';
import officesEasyQuestions from './easy/07-offices.json';
import healthEasyQuestions from './easy/08-health.json';
import generalBusinessEasyQuestions from './easy/09-general-business.json';
import manufacturingEasyQuestions from './easy/10-manufacturing.json';
import corporateDevEasyQuestions from './easy/11-corporate-development.json';
import technicalAreasEasyQuestions from './easy/12-technical-areas.json';
import financingBudgetingEasyQuestions from './easy/13-financing-budgeting.json';

// Medium tier question datasets
import travelMediumQuestions from './medium/01-travel.json';
import diningOutMediumQuestions from './medium/02-dining-out.json';
import entertainmentMediumQuestions from './medium/03-entertainment.json';
import housingMediumQuestions from './medium/04-housing.json';
import purchasingMediumQuestions from './medium/05-purchasing.json';
import personnelMediumQuestions from './medium/06-personnel.json';
import officesMediumQuestions from './medium/07-offices.json';
import healthMediumQuestions from './medium/08-health.json';
import generalBusinessMediumQuestions from './medium/09-general-business.json';
import manufacturingMediumQuestions from './medium/10-manufacturing.json';
import corporateDevMediumQuestions from './medium/11-corporate-development.json';
import technicalAreasMediumQuestions from './medium/12-technical-areas.json';
import financingBudgetingMediumQuestions from './medium/13-financing-budgeting.json';

// Hard tier question datasets
import travelHardQuestions from './hard/01-travel.json';
import diningOutHardQuestions from './hard/02-dining-out.json';
import entertainmentHardQuestions from './hard/03-entertainment.json';
import housingHardQuestions from './hard/04-housing.json';
import purchasingHardQuestions from './hard/05-purchasing.json';
import personnelHardQuestions from './hard/06-personnel.json';
import officesHardQuestions from './hard/07-offices.json';
import healthHardQuestions from './hard/08-health.json';
import generalBusinessHardQuestions from './hard/09-general-business.json';
import manufacturingHardQuestions from './hard/10-manufacturing.json';
import corporateDevHardQuestions from './hard/11-corporate-development.json';
import technicalAreasHardQuestions from './hard/12-technical-areas.json';
import financingBudgetingHardQuestions from './hard/13-financing-budgeting.json';

export const TOEIC_LISTENING_EASY_UNITS: TrainingUnitMeta[] = [
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

export const TOEIC_LISTENING_MEDIUM_UNITS: TrainingUnitMeta[] = [
  {
    trainingId: 'listening-01-medium',
    title: 'Travel (Medium)',
    unitNumber: 14,
    difficulty: 'Medium' as const,
    tags: ['出差轉機', '延誤因應', '商務行程'],
  },
  {
    trainingId: 'listening-02-medium',
    title: 'Dining out (Medium)',
    unitNumber: 15,
    difficulty: 'Medium' as const,
    tags: ['晚宴接待', '菜單特調', '飲食限制'],
  },
  {
    trainingId: 'listening-03-medium',
    title: 'Entertainment (Medium)',
    unitNumber: 16,
    difficulty: 'Medium' as const,
    tags: ['文化藝術', '贊助門票', '展演參訪'],
  },
  {
    trainingId: 'listening-04-medium',
    title: 'Housing (Medium)',
    unitNumber: 17,
    difficulty: 'Medium' as const,
    tags: ['商辦租賃', '空間裝修', '物業管理'],
  },
  {
    trainingId: 'listening-05-medium',
    title: 'Purchasing (Medium)',
    unitNumber: 18,
    difficulty: 'Medium' as const,
    tags: ['大宗採購', '供應商評鑑', '物流保險'],
  },
  {
    trainingId: 'listening-06-medium',
    title: 'Personnel (Medium)',
    unitNumber: 19,
    difficulty: 'Medium' as const,
    tags: ['人才獵聘', '績效考評', '勞資制度'],
  },
  {
    trainingId: 'listening-07-medium',
    title: 'Offices (Medium)',
    unitNumber: 20,
    difficulty: 'Medium' as const,
    tags: ['行政管理', '設備整合', '視訊會議'],
  },
  {
    trainingId: 'listening-08-medium',
    title: 'Health (Medium)',
    unitNumber: 21,
    difficulty: 'Medium' as const,
    tags: ['職業醫學', '心理健康', '工安防護'],
  },
  {
    trainingId: 'listening-09-medium',
    title: 'General Business (Medium)',
    unitNumber: 22,
    difficulty: 'Medium' as const,
    tags: ['策略聯盟', '市場調研', '商業談判'],
  },
  {
    trainingId: 'listening-10-medium',
    title: 'Manufacturing (Medium)',
    unitNumber: 23,
    difficulty: 'Medium' as const,
    tags: ['精密加工', '自動化製程', '產能優化'],
  },
  {
    trainingId: 'listening-11-medium',
    title: 'Corporate Development (Medium)',
    unitNumber: 24,
    difficulty: 'Medium' as const,
    tags: ['股權收購', '專利布局', '跨國擴張'],
  },
  {
    trainingId: 'listening-12-medium',
    title: 'Technical areas (Medium)',
    unitNumber: 25,
    difficulty: 'Medium' as const,
    tags: ['雲端架構', '資安防護', '資料庫容錯'],
  },
  {
    trainingId: 'listening-13-medium',
    title: 'Financing & Budgeting (Medium)',
    unitNumber: 26,
    difficulty: 'Medium' as const,
    tags: ['審計對帳', '資本支出', '外匯避險'],
  },
];

export const TOEIC_LISTENING_HARD_UNITS: TrainingUnitMeta[] = [
  {
    trainingId: 'listening-01-hard',
    title: 'Travel (Hard)',
    unitNumber: 27,
    difficulty: 'Hard' as const,
    tags: ['高階差旅', '突發改票', '跨國轉機'],
  },
  {
    trainingId: 'listening-02-hard',
    title: 'Dining out (Hard)',
    unitNumber: 28,
    difficulty: 'Hard' as const,
    tags: ['高規格宴請', '食材過敏應變', '預約協調'],
  },
  {
    trainingId: 'listening-03-hard',
    title: 'Entertainment (Hard)',
    unitNumber: 29,
    difficulty: 'Hard' as const,
    tags: ['文化外交', '大型展演贊助', '文資保存'],
  },
  {
    trainingId: 'listening-04-hard',
    title: 'Housing (Hard)',
    unitNumber: 30,
    difficulty: 'Hard' as const,
    tags: ['商辦長期租約', '物業工程查驗', '違約終止條款'],
  },
  {
    trainingId: 'listening-05-hard',
    title: 'Purchasing (Hard)',
    unitNumber: 31,
    difficulty: 'Hard' as const,
    tags: ['跨國半導體採購', '供應鏈斷鏈應變', '仲裁合約'],
  },
  {
    trainingId: 'listening-06-hard',
    title: 'Personnel (Hard)',
    unitNumber: 32,
    difficulty: 'Hard' as const,
    tags: ['高階獵才決策', '跨國併購留任', '勞資仲裁法庭'],
  },
  {
    trainingId: 'listening-07-hard',
    title: 'Offices (Hard)',
    unitNumber: 33,
    difficulty: 'Hard' as const,
    tags: ['關鍵設施故障', '全域通訊備援', '合規審計'],
  },
  {
    trainingId: 'listening-08-hard',
    title: 'Health (Hard)',
    unitNumber: 34,
    difficulty: 'Hard' as const,
    tags: ['重大工安停工', '危險物質整頓', '勞動法遵罰則'],
  },
  {
    trainingId: 'listening-09-hard',
    title: 'General Business (Hard)',
    unitNumber: 35,
    difficulty: 'Hard' as const,
    tags: ['跨國合資談判', '智財權糾紛', '市場准入限制'],
  },
  {
    trainingId: 'listening-10-hard',
    title: 'Manufacturing (Hard)',
    unitNumber: 36,
    difficulty: 'Hard' as const,
    tags: ['精密製程異常', '產線緊急停機', '環保排污查核'],
  },
  {
    trainingId: 'listening-11-hard',
    title: 'Corporate Development (Hard)',
    unitNumber: 37,
    difficulty: 'Hard' as const,
    tags: ['跨國收購要約', '反壟斷合規', '股權資產分割'],
  },
  {
    trainingId: 'listening-12-hard',
    title: 'Technical areas (Hard)',
    unitNumber: 38,
    difficulty: 'Hard' as const,
    tags: ['高階資安防護', '邊緣伺服器漏洞', '災難復原中斷'],
  },
  {
    trainingId: 'listening-13-hard',
    title: 'Financing & Budgeting (Hard)',
    unitNumber: 39,
    difficulty: 'Hard' as const,
    tags: ['跨國交叉換匯', '主權債信評估', '外幣審計核對'],
  },
];

export const TOEIC_LISTENING_UNITS: TrainingUnitMeta[] = [
  ...TOEIC_LISTENING_EASY_UNITS,
  ...TOEIC_LISTENING_MEDIUM_UNITS,
  ...TOEIC_LISTENING_HARD_UNITS,
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
    const easyUnit = TOEIC_LISTENING_EASY_UNITS[idx];
    const mediumUnit = TOEIC_LISTENING_MEDIUM_UNITS[idx];
    const hardUnit = TOEIC_LISTENING_HARD_UNITS[idx];
    return {
      id: `group-listening-${pad}`,
      title: `${pad}. ${situationTitle}`,
      units: [easyUnit, mediumUnit, hardUnit],
    };
  }
);

export const TOEIC_LISTENING_QUESTIONS: Question[] = [
  // Easy questions (390)
  ...(travelEasyQuestions as Question[]),
  ...(diningOutEasyQuestions as Question[]),
  ...(entertainmentEasyQuestions as Question[]),
  ...(housingEasyQuestions as Question[]),
  ...(purchasingEasyQuestions as Question[]),
  ...(personnelEasyQuestions as Question[]),
  ...(officesEasyQuestions as Question[]),
  ...(healthEasyQuestions as Question[]),
  ...(generalBusinessEasyQuestions as Question[]),
  ...(manufacturingEasyQuestions as Question[]),
  ...(corporateDevEasyQuestions as Question[]),
  ...(technicalAreasEasyQuestions as Question[]),
  ...(financingBudgetingEasyQuestions as Question[]),

  // Medium questions (390)
  ...(travelMediumQuestions as Question[]),
  ...(diningOutMediumQuestions as Question[]),
  ...(entertainmentMediumQuestions as Question[]),
  ...(housingMediumQuestions as Question[]),
  ...(purchasingMediumQuestions as Question[]),
  ...(personnelMediumQuestions as Question[]),
  ...(officesMediumQuestions as Question[]),
  ...(healthMediumQuestions as Question[]),
  ...(generalBusinessMediumQuestions as Question[]),
  ...(manufacturingMediumQuestions as Question[]),
  ...(corporateDevMediumQuestions as Question[]),
  ...(technicalAreasMediumQuestions as Question[]),
  ...(financingBudgetingMediumQuestions as Question[]),

  // Hard questions (390)
  ...(travelHardQuestions as Question[]),
  ...(diningOutHardQuestions as Question[]),
  ...(entertainmentHardQuestions as Question[]),
  ...(housingHardQuestions as Question[]),
  ...(purchasingHardQuestions as Question[]),
  ...(personnelHardQuestions as Question[]),
  ...(officesHardQuestions as Question[]),
  ...(healthHardQuestions as Question[]),
  ...(generalBusinessHardQuestions as Question[]),
  ...(manufacturingHardQuestions as Question[]),
  ...(corporateDevHardQuestions as Question[]),
  ...(technicalAreasHardQuestions as Question[]),
  ...(financingBudgetingHardQuestions as Question[]),
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
