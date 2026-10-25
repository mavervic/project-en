import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
  TrainingUnitMeta,
} from '../../types/chunkflow';

import prematchQuestions from './units/01-prematch.json';
import draftQuestions from './units/02-draft.json';
import macroQuestions from './units/03-macro.json';
import teamfightQuestions from './units/04-teamfights.json';

export const LOL_WORLDS_LISTENING_UNITS: TrainingUnitMeta[] = [
  {
    trainingId: 'lol-worlds-01-prematch',
    title: 'Pre-Match & Narrative (賽前看點與戰隊狀態)',
    unitNumber: 1,
    difficulty: 'Easy' as const,
    tags: ['賽前分析', '戰隊狀態', '選手對位'],
  },
  {
    trainingId: 'lol-worlds-02-draft',
    title: 'Draft Phase & Win Conditions (BP 選角與陣容分析)',
    unitNumber: 2,
    difficulty: 'Easy' as const,
    tags: ['BP禁選', '勝勢條件', '陣容相性'],
  },
  {
    trainingId: 'lol-worlds-03-macro',
    title: 'Early Game & Macro Objectives (前期對線、發育與地圖物件)',
    unitNumber: 3,
    difficulty: 'Easy' as const,
    tags: ['換線發育', '地圖物件', '經濟分差'],
  },
  {
    trainingId: 'lol-worlds-04-teamfights',
    title: 'Teamfights & Decisive Moments (關鍵團戰、巴龍與決勝時刻)',
    unitNumber: 4,
    difficulty: 'Easy' as const,
    tags: ['巴龍團戰', '極限翻盤', '主堡終結'],
  },
];

export const LOL_WORLDS_LISTENING_GROUPS: TrainingGroup[] = [
  {
    id: 'lol-worlds-tournament',
    title: '英雄聯盟世界賽四幕式觀賽流程',
    units: LOL_WORLDS_LISTENING_UNITS,
  },
];

export const LOL_WORLDS_LISTENING_QUESTIONS: Question[] = [
  ...(prematchQuestions as Question[]),
  ...(draftQuestions as Question[]),
  ...(macroQuestions as Question[]),
  ...(teamfightQuestions as Question[]),
];

export const LOL_WORLDS_LISTENING_META: QuestionBankMeta = {
  id: 'lol-worlds-listening',
  name: 'LOL 英雄聯盟世界賽聽力題庫',
  description: '世界大賽官方英文播報 40 題高頻句型與體育跨界解析',
  category: 'Esports 賽事聽力題庫',
  totalQuestions: LOL_WORLDS_LISTENING_QUESTIONS.length,
  totalTrainings: LOL_WORLDS_LISTENING_UNITS.length,
  groups: LOL_WORLDS_LISTENING_GROUPS,
};

export const LOL_WORLDS_LISTENING_BANK: QuestionBank = {
  ...LOL_WORLDS_LISTENING_META,
  questions: LOL_WORLDS_LISTENING_QUESTIONS,
};
