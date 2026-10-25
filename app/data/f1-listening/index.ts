import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
  TrainingUnitMeta,
} from '../../types/chunkflow';

import gridStartQuestions from './units/01-grid-start.json';
import teamRadioQuestions from './units/02-team-radio.json';
import safetyCarQuestions from './units/03-safety-car.json';
import wheelToWheelQuestions from './units/04-wheel-to-wheel.json';

export const F1_LISTENING_UNITS: TrainingUnitMeta[] = [
  {
    trainingId: 'f1-01-grid-start',
    title: 'Starting Grid & Lights Out (起跑排位與起步爭奪)',
    unitNumber: 1,
    difficulty: 'Easy' as const,
    tags: ['起跑燈滅', '桿位發車', '暖胎圈'],
  },
  {
    trainingId: 'f1-02-team-radio',
    title: 'Team Radio & Strategy (車隊無線電與進站策略)',
    unitNumber: 2,
    difficulty: 'Easy' as const,
    tags: ['進站指令', '進站超車', '胎耗管理'],
  },
  {
    trainingId: 'f1-03-safety-car',
    title: 'Safety Car & Track Flags (安全車出動與賽道旗號)',
    unitNumber: 3,
    difficulty: 'Easy' as const,
    tags: ['安全車', '虛擬安全車', '重新起跑'],
  },
  {
    trainingId: 'f1-04-wheel-to-wheel',
    title: 'Wheel-to-Wheel & Chequered Flag (輪對輪纏鬥與格子旗衝線)',
    unitNumber: 4,
    difficulty: 'Easy' as const,
    tags: ['可變尾翼DRS', '尾流超車', '格子旗衝線'],
  },
];

export const F1_LISTENING_GROUPS: TrainingGroup[] = [
  {
    id: 'f1-race-progression',
    title: 'F1 一級方程式大獎賽四階段聽力流程',
    units: F1_LISTENING_UNITS,
  },
];

export const F1_LISTENING_QUESTIONS: Question[] = [
  ...(gridStartQuestions as Question[]),
  ...(teamRadioQuestions as Question[]),
  ...(safetyCarQuestions as Question[]),
  ...(wheelToWheelQuestions as Question[]),
];

export const F1_LISTENING_META: QuestionBankMeta = {
  id: 'f1-listening',
  name: 'F1 賽車廣播聽力題庫',
  description: 'Formula 1 官方轉播與車隊無線電 40 題高頻戰術與精彩播報句型',
  category: 'Sports 體育賽事聽力',
  totalQuestions: F1_LISTENING_QUESTIONS.length,
  totalTrainings: F1_LISTENING_UNITS.length,
  groups: F1_LISTENING_GROUPS,
};

export const F1_LISTENING_BANK: QuestionBank = {
  ...F1_LISTENING_META,
  questions: F1_LISTENING_QUESTIONS,
};

// Aliases for export compliance
export const META = F1_LISTENING_META;
export const UNITS = F1_LISTENING_UNITS;
export const QUESTIONS = F1_LISTENING_QUESTIONS;
