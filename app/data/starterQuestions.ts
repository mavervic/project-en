import type { Question } from '../types/chunkflow';

export const STARTER_QUESTIONS: Question[] = [
  {
    id: 'toeic-01',
    sentence:
      'The executive board will review the quarterly financial statements before the annual shareholder meeting.',
    chunks: [
      { text: 'The executive board', isTargetSlot: false, type: 'subject' },
      { text: 'will review', isTargetSlot: true, type: 'verb' },
      {
        text: 'the quarterly financial statements',
        isTargetSlot: false,
        type: 'object',
      },
      {
        text: 'before the annual shareholder meeting.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'future',
      aspect: 'simple',
    },
    grammarNote:
      '「will review」為未來主動式 (Future Active)。主詞 The executive board（執行董事會）主動執行審查 (review) 財務報表動作。',
  },
  {
    id: 'toeic-02',
    sentence:
      'All confidential client records were encrypted by the IT security department yesterday.',
    chunks: [
      {
        text: 'All confidential client records',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'were encrypted', isTargetSlot: true, type: 'verb' },
      {
        text: 'by the IT security department',
        isTargetSlot: false,
        type: 'clause',
      },
      { text: 'yesterday.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'past',
      aspect: 'simple',
    },
    grammarNote:
      '「were encrypted」為過去被動式 (Past Passive, were + p.p.)。主詞 records 為受動者，由 IT 安全部門執行加密動作。',
  },
  {
    id: 'toeic-03',
    sentence:
      'The regional branch manager submits performance evaluations to headquarters at the end of each fiscal month.',
    chunks: [
      {
        text: 'The regional branch manager',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'submits', isTargetSlot: true, type: 'verb' },
      { text: 'performance evaluations', isTargetSlot: false, type: 'object' },
      {
        text: 'to headquarters at the end of each fiscal month.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'present',
      aspect: 'simple',
    },
    grammarNote:
      '「submits」為現在主動式 (Present Active, 第三人稱單數常態動詞加 s)。描述經理每月末例行性呈報評估報告。',
  },
  {
    id: 'toeic-04',
    sentence:
      'The newly renovated convention center is visited by international delegates throughout the conference week.',
    chunks: [
      {
        text: 'The newly renovated convention center',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'is visited', isTargetSlot: true, type: 'verb' },
      {
        text: 'by international delegates',
        isTargetSlot: false,
        type: 'clause',
      },
      {
        text: 'throughout the conference week.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'present',
      aspect: 'simple',
    },
    grammarNote:
      '「is visited」為現在被動式 (Present Passive, is + p.p.)。會議中心作為地點名詞，被國際代表團參訪。',
  },
  {
    id: 'toeic-05',
    sentence:
      'The logistics supplier had dispatched all priority shipments prior to the port strike announcement.',
    chunks: [
      { text: 'The logistics supplier', isTargetSlot: false, type: 'subject' },
      { text: 'had dispatched', isTargetSlot: true, type: 'verb' },
      { text: 'all priority shipments', isTargetSlot: false, type: 'object' },
      {
        text: 'prior to the port strike announcement.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'past',
      aspect: 'perfect',
    },
    grammarNote:
      '「had dispatched」為過去主動完成式 (Past Active Perfect)。物流供應商在過去特定時間點（罷工公告）之前已完成發貨動作。',
  },
  {
    id: 'toeic-06',
    sentence:
      'A comprehensive inspection report will be prepared by the quality assurance team tomorrow morning.',
    chunks: [
      {
        text: 'A comprehensive inspection report',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'will be prepared', isTargetSlot: true, type: 'verb' },
      {
        text: 'by the quality assurance team',
        isTargetSlot: false,
        type: 'clause',
      },
      { text: 'tomorrow morning.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'future',
      aspect: 'simple',
    },
    grammarNote:
      '「will be prepared」為未來被動式 (Future Passive, will be + p.p.)。檢驗報告將在明天上午由品管小組準備完畢。',
  },
  {
    id: 'toeic-07',
    sentence:
      'The senior software architect has served as lead developer since the project launch in 2022.',
    chunks: [
      {
        text: 'The senior software architect',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'has served', isTargetSlot: true, type: 'verb' },
      { text: 'as lead developer', isTargetSlot: false, type: 'object' },
      {
        text: 'since the project launch in 2022.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'perfect' },
    grammarNote:
      '「has served」為現在主動完成式 (Present Active Perfect)。與時間副詞片語「since + 時間點」連用，為多益 Part 5 最高頻的完成式考點。',
  },
  {
    id: 'toeic-08',
    sentence: 'The revised annual marketing budget has been approved by the board of directors.',
    chunks: [
      {
        text: 'The revised annual marketing budget',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'has been approved', isTargetSlot: true, type: 'verb' },
      {
        text: 'by the board of directors.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'present', aspect: 'perfect' },
    grammarNote:
      '「has been approved」為現在被動完成式 (Present Passive Perfect)。預算案作為主詞被董事會核准，強調至今已完成的狀態。',
  },
  {
    id: 'toeic-09',
    sentence:
      'The main conference hall is currently being renovated to accommodate larger international forums.',
    chunks: [
      {
        text: 'The main conference hall',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'is being renovated', isTargetSlot: true, type: 'verb' },
      {
        text: 'to accommodate larger international forums.',
        isTargetSlot: false,
        type: 'clause',
      },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'present', aspect: 'continuous' },
    grammarNote:
      '「is being renovated」為現在進行被動式 (Present Continuous Passive)。多益 Part 1 照片題與 Part 5 高頻考點，表達「目前正在被整修中」。',
  },
  {
    id: 'toeic-10',
    sentence:
      'By the time the new policy takes effect next month, the HR department will have completed all training sessions.',
    chunks: [
      {
        text: 'By the time the new policy takes effect next month,',
        isTargetSlot: false,
        type: 'clause',
      },
      { text: 'the HR department', isTargetSlot: false, type: 'subject' },
      { text: 'will have completed', isTargetSlot: true, type: 'verb' },
      { text: 'all training sessions.', isTargetSlot: false, type: 'object' },
    ],
    targetSlotIndex: 2,
    correctAnswers: { voice: 'active', time: 'future', aspect: 'perfect' },
    grammarNote:
      '「will have completed」為未來主動完成式 (Future Active Perfect)。關鍵觸發詞為「By the time + 現在式動詞（代表未來時間點）」，表達「到那時將已完成」。',
  },
  {
    id: 'toeic-11',
    sentence:
      'All expense reimbursement requests must be submitted to the accounting department by Friday afternoon.',
    chunks: [
      {
        text: 'All expense reimbursement requests',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'must be submitted', isTargetSlot: true, type: 'verb' },
      {
        text: 'to the accounting department',
        isTargetSlot: false,
        type: 'clause',
      },
      { text: 'by Friday afternoon.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'future', aspect: 'simple' },
    grammarNote:
      '「must be submitted」為情態助動詞被動式 (Modal Passive)。多益商務公告極高頻句型，報銷申請必須被提交。',
  },
  {
    id: 'toeic-12',
    sentence:
      'The research and development team is currently conducting thorough performance testing on the new prototype.',
    chunks: [
      {
        text: 'The research and development team',
        isTargetSlot: false,
        type: 'subject',
      },
      { text: 'is conducting', isTargetSlot: true, type: 'verb' },
      {
        text: 'thorough performance testing',
        isTargetSlot: false,
        type: 'object',
      },
      { text: 'on the new prototype.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'continuous' },
    grammarNote:
      '「is conducting」為現在進行主動式 (Present Active Continuous)。常搭配「currently」或「now」，表達團隊當前正在進行測試。',
  },
];
