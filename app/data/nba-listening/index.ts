import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
  TrainingUnitMeta,
} from '../../types/chunkflow';

import pregameQuestions from './units/01-pregame.json';
import halfcourtQuestions from './units/02-halfcourt.json';
import defenseQuestions from './units/03-defense.json';
import clutchQuestions from './units/04-clutch.json';

export const NBA_LISTENING_UNITS: TrainingUnitMeta[] = [
  {
    trainingId: 'nba-01-pregame',
    title: 'Pre-Game & Matchups (賽前看點與陣容對位)',
    unitNumber: 1,
    difficulty: 'Easy' as const,
    tags: ['賽前分析', '先發名單', '球星對決'],
  },
  {
    trainingId: 'nba-02-halfcourt',
    title: 'Half-Court Sets & Ball Movement (陣地進攻與戰術體系)',
    unitNumber: 2,
    difficulty: 'Easy' as const,
    tags: ['擋拆戰術', '空間拉開', '傳球導動'],
  },
  {
    trainingId: 'nba-03-defense',
    title: 'Defense & Fast Breaks (防守壓迫與轉換快攻)',
    unitNumber: 3,
    difficulty: 'Easy' as const,
    tags: ['抄截快攻', '禁區護框', '全場緊逼'],
  },
  {
    trainingId: 'nba-04-clutch',
    title: 'Clutch Time & Buzzer Beaters (決勝關鍵與壓哨絕殺)',
    unitNumber: 4,
    difficulty: 'Easy' as const,
    tags: ['關鍵時刻', '後撤三分', '壓哨絕殺'],
  },
];

export const NBA_LISTENING_GROUPS: TrainingGroup[] = [
  {
    id: 'nba-game-flow',
    title: 'NBA 職業籃球賽事四幕式觀賽流程',
    units: NBA_LISTENING_UNITS,
  },
];

export const NBA_LISTENING_QUESTIONS: Question[] = [
  ...(pregameQuestions as Question[]),
  ...(halfcourtQuestions as Question[]),
  ...(defenseQuestions as Question[]),
  ...(clutchQuestions as Question[]),
];

export const NBA_LISTENING_META: QuestionBankMeta = {
  id: 'nba-listening',
  name: 'NBA 職業籃球賽事聽力題庫',
  description: 'NBA 官方英文轉播 40 題高頻戰術與球星播報句型',
  category: 'Sports 體育賽事聽力',
  totalQuestions: NBA_LISTENING_QUESTIONS.length,
  totalTrainings: NBA_LISTENING_UNITS.length,
  groups: NBA_LISTENING_GROUPS,
};

export const NBA_LISTENING_BANK: QuestionBank = {
  ...NBA_LISTENING_META,
  questions: NBA_LISTENING_QUESTIONS,
};
