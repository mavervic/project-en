import type { Question } from '../types/chunkflow';

export const STARTER_QUESTIONS: Question[] = [
  {
    id: 'toeic-01',
    sentence: 'The executive board will review the quarterly financial statements before the annual shareholder meeting.',
    chunks: [
      { text: 'The executive board', isTargetSlot: false, type: 'subject' },
      { text: 'will review', isTargetSlot: true, type: 'verb' },
      { text: 'the quarterly financial statements', isTargetSlot: false, type: 'object' },
      { text: 'before the annual shareholder meeting.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'future',
      aspect: 'simple',
    },
    grammarNote: '「will review」為未來主動式 (Future Active)。主詞 The executive board（執行董事會）主動執行審查 (review) 財務報表動作。',
  },
  {
    id: 'toeic-02',
    sentence: 'All confidential client records were encrypted by the IT security department yesterday.',
    chunks: [
      { text: 'All confidential client records', isTargetSlot: false, type: 'subject' },
      { text: 'were encrypted', isTargetSlot: true, type: 'verb' },
      { text: 'by the IT security department', isTargetSlot: false, type: 'clause' },
      { text: 'yesterday.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'past',
      aspect: 'simple',
    },
    grammarNote: '「were encrypted」為過去被動式 (Past Passive, were + p.p.)。主詞 records 為受動者，由 IT 安全部門執行加密動作。',
  },
  {
    id: 'toeic-03',
    sentence: 'The regional branch manager submits performance evaluations to headquarters at the end of each fiscal month.',
    chunks: [
      { text: 'The regional branch manager', isTargetSlot: false, type: 'subject' },
      { text: 'submits', isTargetSlot: true, type: 'verb' },
      { text: 'performance evaluations', isTargetSlot: false, type: 'object' },
      { text: 'to headquarters at the end of each fiscal month.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'present',
      aspect: 'simple',
    },
    grammarNote: '「submits」為現在主動式 (Present Active, 第三人稱單數常態動詞加 s)。描述經理每月末例行性呈報評估報告。',
  },
  {
    id: 'toeic-04',
    sentence: 'The newly renovated convention center is visited by international delegates throughout the conference week.',
    chunks: [
      { text: 'The newly renovated convention center', isTargetSlot: false, type: 'subject' },
      { text: 'is visited', isTargetSlot: true, type: 'verb' },
      { text: 'by international delegates', isTargetSlot: false, type: 'clause' },
      { text: 'throughout the conference week.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'present',
      aspect: 'simple',
    },
    grammarNote: '「is visited」為現在被動式 (Present Passive, is + p.p.)。會議中心作為地點名詞，被國際代表團參訪。',
  },
  {
    id: 'toeic-05',
    sentence: 'The logistics supplier had dispatched all priority shipments prior to the port strike announcement.',
    chunks: [
      { text: 'The logistics supplier', isTargetSlot: false, type: 'subject' },
      { text: 'had dispatched', isTargetSlot: true, type: 'verb' },
      { text: 'all priority shipments', isTargetSlot: false, type: 'object' },
      { text: 'prior to the port strike announcement.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'active',
      time: 'past',
      aspect: 'perfect',
    },
    grammarNote: '「had dispatched」為過去主動完成式 (Past Active Perfect)。物流供應商在過去特定時間點（罷工公告）之前已完成發貨動作。',
  },
  {
    id: 'toeic-06',
    sentence: 'A comprehensive inspection report will be prepared by the quality assurance team tomorrow morning.',
    chunks: [
      { text: 'A comprehensive inspection report', isTargetSlot: false, type: 'subject' },
      { text: 'will be prepared', isTargetSlot: true, type: 'verb' },
      { text: 'by the quality assurance team', isTargetSlot: false, type: 'clause' },
      { text: 'tomorrow morning.', isTargetSlot: false, type: 'clause' },
    ],
    targetSlotIndex: 1,
    correctAnswers: {
      voice: 'passive',
      time: 'future',
      aspect: 'simple',
    },
    grammarNote: '「will be prepared」為未來被動式 (Future Passive, will be + p.p.)。檢驗報告將在明天上午由品管小組準備完畢。',
  },
];
