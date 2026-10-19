import { ALL_PARKER_QUESTIONS, PARKER_QUESTIONS_BY_UNIT } from './units';
import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
  TrainingUnitMeta,
} from '~/types/chunkflow';

export { ALL_PARKER_QUESTIONS, PARKER_QUESTIONS_BY_UNIT };
export const PARKER_QUESTIONS: Question[] = ALL_PARKER_QUESTIONS;

interface GroupConfig {
  id: string;
  title: string;
  unitCount: number;
  tags: string[];
}

const GROUP_CONFIGS: GroupConfig[] = [
  {
    id: 'group-parker-01',
    title: 'Lessons 01–10 (綜合實戰訓練組 I)',
    unitCount: 10,
    tags: ['綜合聽力', '多益高頻', '實戰句型'],
  },
  {
    id: 'group-parker-02',
    title: 'Lessons 11–20 (綜合實戰訓練組 II)',
    unitCount: 10,
    tags: ['綜合聽力', '多益高頻', '實戰句型'],
  },
  {
    id: 'group-parker-03',
    title: 'Lessons 21–30 (綜合實戰訓練組 III)',
    unitCount: 10,
    tags: ['綜合聽力', '多益高頻', '實戰句型'],
  },
  {
    id: 'group-parker-04',
    title: 'Lessons 31–40 (綜合實戰訓練組 IV)',
    unitCount: 10,
    tags: ['綜合實戰', '聽力強化', '商務語塊'],
  },
  {
    id: 'group-parker-05',
    title: 'Lessons 41–50 (綜合實戰訓練組 V)',
    unitCount: 10,
    tags: ['綜合實戰', '聽力強化', '商務語塊'],
  },
];

export const PARKER_UNITS: TrainingUnitMeta[] = [];
export const PARKER_GROUPS: TrainingGroup[] = [];

let currentUnitIndex = 0;
for (const config of GROUP_CONFIGS) {
  const groupUnits: TrainingUnitMeta[] = [];
  for (let i = 0; i < config.unitCount; i++) {
    const unitNum = currentUnitIndex + 1;
    const pad = String(unitNum).padStart(2, '0');
    const unitMeta: TrainingUnitMeta = {
      trainingId: `parker-${pad}`,
      title: `Parker Lesson ${pad} (Easy)`,
      unitNumber: unitNum,
      difficulty: 'Easy' as const,
      tags: config.tags,
    };
    PARKER_UNITS.push(unitMeta);
    groupUnits.push(unitMeta);
    currentUnitIndex++;
  }
  PARKER_GROUPS.push({
    id: config.id,
    title: config.title,
    units: groupUnits,
  });
}

export const PARKER_BANK_META: QuestionBankMeta = {
  id: 'parker',
  name: '怕渴題庫',
  description: '精選 50 部怕渴英文多益聽力訓練句型題庫 (50 堂課獨立單元)',
  category: 'TOEIC Listening 聽力題庫',
  totalQuestions: PARKER_QUESTIONS.length,
  totalTrainings: 50,
  groups: PARKER_GROUPS,
};

export const PARKER_BANK: QuestionBank = {
  ...PARKER_BANK_META,
  questions: PARKER_QUESTIONS,
};
