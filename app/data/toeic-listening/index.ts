import type {
  Question,
  QuestionBank,
  QuestionBankMeta,
  TrainingGroup,
} from '../../types/chunkflow';

export const TOEIC_LISTENING_UNITS = [
  {
    trainingId: 'listening-01',
    title: 'Travel',
    unitNumber: 1,
    difficulty: 'Easy' as const,
    tags: ['出差', '交通', '航班'],
  },
  {
    trainingId: 'listening-02',
    title: 'Dining out',
    unitNumber: 2,
    difficulty: 'Easy' as const,
    tags: ['商務餐敘', '訂位', '菜單'],
  },
  {
    trainingId: 'listening-03',
    title: 'Entertainment',
    unitNumber: 3,
    difficulty: 'Easy' as const,
    tags: ['文娛活動', '接待', '觀光'],
  },
  {
    trainingId: 'listening-04',
    title: 'Housing',
    unitNumber: 4,
    difficulty: 'Medium' as const,
    tags: ['租賃', '搬遷', '辦公室裝潢'],
  },
  {
    trainingId: 'listening-05',
    title: 'Purchasing',
    unitNumber: 5,
    difficulty: 'Medium' as const,
    tags: ['採購', '詢價', '供應商'],
  },
  {
    trainingId: 'listening-06',
    title: 'Personnel',
    unitNumber: 6,
    difficulty: 'Medium' as const,
    tags: ['招募', '面試', '人資福利'],
  },
  {
    trainingId: 'listening-07',
    title: 'Offices',
    unitNumber: 7,
    difficulty: 'Medium' as const,
    tags: ['辦公室行政', '會議安排', '設備'],
  },
  {
    trainingId: 'listening-08',
    title: 'Health',
    unitNumber: 8,
    difficulty: 'Medium' as const,
    tags: ['醫療保險', '健康安全', '健檢'],
  },
  {
    trainingId: 'listening-09',
    title: 'General Business',
    unitNumber: 9,
    difficulty: 'Medium' as const,
    tags: ['商業合約', '跨部門協作', '銷售'],
  },
  {
    trainingId: 'listening-10',
    title: 'Manufacturing',
    unitNumber: 10,
    difficulty: 'Hard' as const,
    tags: ['生產線', '品管', '製程'],
  },
  {
    trainingId: 'listening-11',
    title: 'Corporate Development',
    unitNumber: 11,
    difficulty: 'Hard' as const,
    tags: ['策略規劃', '企業併購', '擴張'],
  },
  {
    trainingId: 'listening-12',
    title: 'Technical areas',
    unitNumber: 12,
    difficulty: 'Hard' as const,
    tags: ['資訊科技', '軟硬體', '系統維護'],
  },
  {
    trainingId: 'listening-13',
    title: 'Financing & Budgeting',
    unitNumber: 13,
    difficulty: 'Hard' as const,
    tags: ['財務報表', '預算編列', '審計'],
  },
];

export const TOEIC_LISTENING_GROUPS: TrainingGroup[] = TOEIC_LISTENING_UNITS.map((unit, idx) => ({
  id: `group-listening-${String(idx + 1).padStart(2, '0')}`,
  title: `${String(idx + 1).padStart(2, '0')}. ${unit.title}`,
  units: [unit],
}));

export const TOEIC_LISTENING_QUESTIONS: Question[] = [
  // 01. Travel
  {
    id: 'listen-01-01',
    trainingId: 'listening-01',
    sentence: 'The departure gate has been moved to Terminal 2 due to scheduled maintenance.',
    translation: '由於預定的維護工程，登機門已移至第二航廈。',
    chunks: [
      { text: 'The departure gate', isTargetSlot: false, type: 'subject' },
      { text: 'has been moved', isTargetSlot: true, type: 'verb' },
      { text: 'to Terminal 2', isTargetSlot: false },
      { text: 'due to scheduled maintenance.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'present', aspect: 'perfect' },
    grammarNote: '現在完成被動態 (has been moved)。',
  },
  {
    id: 'listen-01-02',
    trainingId: 'listening-01',
    sentence: 'Passengers must present their boarding passes before entering the boarding area.',
    translation: '乘客在進入登機區前必須出示登機證。',
    chunks: [
      { text: 'Passengers', isTargetSlot: false, type: 'subject' },
      { text: 'must present', isTargetSlot: true, type: 'verb' },
      { text: 'their boarding passes', isTargetSlot: false, type: 'object' },
      { text: 'before entering the boarding area.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '情態動詞 (must present) 搭配主動原形。',
  },

  // 02. Dining out
  {
    id: 'listen-02-01',
    trainingId: 'listening-02',
    sentence: 'Our restaurant accommodates dietary restrictions upon advance notification.',
    translation: '本餐廳在提前通知的情況下可配合特殊飲食限制。',
    chunks: [
      { text: 'Our restaurant', isTargetSlot: false, type: 'subject' },
      { text: 'accommodates', isTargetSlot: true, type: 'verb' },
      { text: 'dietary restrictions', isTargetSlot: false, type: 'object' },
      { text: 'upon advance notification.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在簡單主動 (accommodates)。',
  },
  {
    id: 'listen-02-02',
    trainingId: 'listening-02',
    sentence: 'The banquet hall was reserved for an executive luncheon tomorrow afternoon.',
    translation: '宴會廳已預訂供明天下午的主管午餐會使用。',
    chunks: [
      { text: 'The banquet hall', isTargetSlot: false, type: 'subject' },
      { text: 'was reserved', isTargetSlot: true, type: 'verb' },
      { text: 'for an executive luncheon', isTargetSlot: false },
      { text: 'tomorrow afternoon.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (was reserved)。',
  },

  // 03. Entertainment
  {
    id: 'listen-03-01',
    trainingId: 'listening-03',
    sentence: 'The cultural center will host an international film exhibition this weekend.',
    translation: '文化中心將於本週末舉辦國際電影展覽。',
    chunks: [
      { text: 'The cultural center', isTargetSlot: false, type: 'subject' },
      { text: 'will host', isTargetSlot: true, type: 'verb' },
      { text: 'an international film exhibition', isTargetSlot: false, type: 'object' },
      { text: 'this weekend.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'future', aspect: 'simple' },
    grammarNote: '未來主動 (will host)。',
  },
  {
    id: 'listen-03-02',
    trainingId: 'listening-03',
    sentence:
      'Complimentary tickets were distributed to corporate sponsors prior to opening night.',
    translation: '開幕之夜前，貴賓贈票已分發給企業贊助商。',
    chunks: [
      { text: 'Complimentary tickets', isTargetSlot: false, type: 'subject' },
      { text: 'were distributed', isTargetSlot: true, type: 'verb' },
      { text: 'to corporate sponsors', isTargetSlot: false },
      { text: 'prior to opening night.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were distributed)。',
  },

  // 04. Housing
  {
    id: 'listen-04-01',
    trainingId: 'listening-04',
    sentence: 'The commercial lease agreement will expire at the end of this fiscal quarter.',
    translation: '商業租賃合約將在本財政季度末到期。',
    chunks: [
      { text: 'The commercial lease agreement', isTargetSlot: false, type: 'subject' },
      { text: 'will expire', isTargetSlot: true, type: 'verb' },
      { text: 'at the end', isTargetSlot: false },
      { text: 'of this fiscal quarter.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'future', aspect: 'simple' },
    grammarNote: '未來主動 (will expire)。',
  },
  {
    id: 'listen-04-02',
    trainingId: 'listening-04',
    sentence: 'Renovation proposals were submitted by three licensed architectural firms.',
    translation: '三家持有執照的建築事務所已提交翻修提案。',
    chunks: [
      { text: 'Renovation proposals', isTargetSlot: false, type: 'subject' },
      { text: 'were submitted', isTargetSlot: true, type: 'verb' },
      { text: 'by three licensed architectural firms.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were submitted)。',
  },

  // 05. Purchasing
  {
    id: 'listen-05-01',
    trainingId: 'listening-05',
    sentence: 'The procurement manager negotiates volume discounts with trusted vendors.',
    translation: '採購經理與值得信賴的供應商協商大宗採購折扣。',
    chunks: [
      { text: 'The procurement manager', isTargetSlot: false, type: 'subject' },
      { text: 'negotiates', isTargetSlot: true, type: 'verb' },
      { text: 'volume discounts', isTargetSlot: false, type: 'object' },
      { text: 'with trusted vendors.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在簡單主動 (negotiates)。',
  },
  {
    id: 'listen-05-02',
    trainingId: 'listening-05',
    sentence: 'The purchase order was approved by the finance director this morning.',
    translation: '採購單已於今天上午由財務總監核准。',
    chunks: [
      { text: 'The purchase order', isTargetSlot: false, type: 'subject' },
      { text: 'was approved', isTargetSlot: true, type: 'verb' },
      { text: 'by the finance director', isTargetSlot: false },
      { text: 'this morning.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (was approved)。',
  },

  // 06. Personnel
  {
    id: 'listen-06-01',
    trainingId: 'listening-06',
    sentence: 'The hiring committee conducts background evaluations for shortlisted candidates.',
    translation: '招募委員會對入圍決選的候選人進行背景評估。',
    chunks: [
      { text: 'The hiring committee', isTargetSlot: false, type: 'subject' },
      { text: 'conducts', isTargetSlot: true, type: 'verb' },
      { text: 'background evaluations', isTargetSlot: false, type: 'object' },
      { text: 'for shortlisted candidates.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在主動 (conducts)。',
  },
  {
    id: 'listen-06-02',
    trainingId: 'listening-06',
    sentence: 'Outstanding employee contributions were recognized during the annual gala.',
    translation: '在年度盛會期間表彰了員工的傑出貢獻。',
    chunks: [
      { text: 'Outstanding employee contributions', isTargetSlot: false, type: 'subject' },
      { text: 'were recognized', isTargetSlot: true, type: 'verb' },
      { text: 'during the annual gala.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were recognized)。',
  },

  // 07. Offices
  {
    id: 'listen-07-01',
    trainingId: 'listening-07',
    sentence: 'The administrative assistant schedules conference rooms for project briefings.',
    translation: '行政助理為專案簡報排定會議室。',
    chunks: [
      { text: 'The administrative assistant', isTargetSlot: false, type: 'subject' },
      { text: 'schedules', isTargetSlot: true, type: 'verb' },
      { text: 'conference rooms', isTargetSlot: false, type: 'object' },
      { text: 'for project briefings.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在主動 (schedules)。',
  },
  {
    id: 'listen-07-02',
    trainingId: 'listening-07',
    sentence: 'Faulty projector units were replaced by the facilities team yesterday.',
    translation: '故障的投影機設備昨天已由設施維護團隊更換。',
    chunks: [
      { text: 'Faulty projector units', isTargetSlot: false, type: 'subject' },
      { text: 'were replaced', isTargetSlot: true, type: 'verb' },
      { text: 'by the facilities team', isTargetSlot: false },
      { text: 'yesterday.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were replaced)。',
  },

  // 08. Health
  {
    id: 'listen-08-01',
    trainingId: 'listening-08',
    sentence:
      'The human resources division provides comprehensive medical coverage for full-time staff.',
    translation: '人力資源部為全職員工提供全面的醫療保險。',
    chunks: [
      { text: 'The human resources division', isTargetSlot: false, type: 'subject' },
      { text: 'provides', isTargetSlot: true, type: 'verb' },
      { text: 'comprehensive medical coverage', isTargetSlot: false, type: 'object' },
      { text: 'for full-time staff.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在主動 (provides)。',
  },
  {
    id: 'listen-08-02',
    trainingId: 'listening-08',
    sentence: 'Ergonomic office equipment was recommended by safety inspectors last month.',
    translation: '安全檢查員上個月建議採用人體工學辦公設備。',
    chunks: [
      { text: 'Ergonomic office equipment', isTargetSlot: false, type: 'subject' },
      { text: 'was recommended', isTargetSlot: true, type: 'verb' },
      { text: 'by safety inspectors', isTargetSlot: false },
      { text: 'last month.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (was recommended)。',
  },

  // 09. General Business
  {
    id: 'listen-09-01',
    trainingId: 'listening-09',
    sentence:
      'Both partner corporations finalized a distribution contract after lengthy discussions.',
    translation: '兩家合作企業在漫長的討論後敲定了分銷合約。',
    chunks: [
      { text: 'Both partner corporations', isTargetSlot: false, type: 'subject' },
      { text: 'finalized', isTargetSlot: true, type: 'verb' },
      { text: 'a distribution contract', isTargetSlot: false, type: 'object' },
      { text: 'after lengthy discussions.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'past', aspect: 'simple' },
    grammarNote: '過去主動 (finalized)。',
  },
  {
    id: 'listen-09-02',
    trainingId: 'listening-09',
    sentence: 'Quarterly sales targets were exceeded by the regional marketing group.',
    translation: '區域行銷團隊超越了季度銷售目標。',
    chunks: [
      { text: 'Quarterly sales targets', isTargetSlot: false, type: 'subject' },
      { text: 'were exceeded', isTargetSlot: true, type: 'verb' },
      { text: 'by the regional marketing group.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were exceeded)。',
  },

  // 10. Manufacturing
  {
    id: 'listen-10-01',
    trainingId: 'listening-10',
    sentence: 'The assembly plant operates automated conveyor systems for maximum efficiency.',
    translation: '組裝廠運行自動化輸送系統以實現最高效率。',
    chunks: [
      { text: 'The assembly plant', isTargetSlot: false, type: 'subject' },
      { text: 'operates', isTargetSlot: true, type: 'verb' },
      { text: 'automated conveyor systems', isTargetSlot: false, type: 'object' },
      { text: 'for maximum efficiency.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在主動 (operates)。',
  },
  {
    id: 'listen-10-02',
    trainingId: 'listening-10',
    sentence: 'Defective circuit boards were discarded during rigorous quality assessments.',
    translation: '在嚴格的品質評估過程中，有缺陷的電路板被剔除。',
    chunks: [
      { text: 'Defective circuit boards', isTargetSlot: false, type: 'subject' },
      { text: 'were discarded', isTargetSlot: true, type: 'verb' },
      { text: 'during rigorous quality assessments.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (were discarded)。',
  },

  // 11. Corporate Development
  {
    id: 'listen-11-01',
    trainingId: 'listening-11',
    sentence: 'The enterprise will acquire an emerging technology startup next quarter.',
    translation: '該企業將於下個季度收購一家新興科技新創公司。',
    chunks: [
      { text: 'The enterprise', isTargetSlot: false, type: 'subject' },
      { text: 'will acquire', isTargetSlot: true, type: 'verb' },
      { text: 'an emerging technology startup', isTargetSlot: false, type: 'object' },
      { text: 'next quarter.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'future', aspect: 'simple' },
    grammarNote: '未來主動 (will acquire)。',
  },
  {
    id: 'listen-11-02',
    trainingId: 'listening-11',
    sentence: 'A strategic expansion proposal was approved unanimously by the board of trustees.',
    translation: '策略擴張提案獲得董事會一致通過。',
    chunks: [
      { text: 'A strategic expansion proposal', isTargetSlot: false, type: 'subject' },
      { text: 'was approved unanimously', isTargetSlot: true, type: 'verb' },
      { text: 'by the board of trustees.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (was approved)。',
  },

  // 12. Technical areas
  {
    id: 'listen-12-01',
    trainingId: 'listening-12',
    sentence: 'Network engineers resolved the database connectivity glitch within an hour.',
    translation: '網路工程師在一小時內修復了資料庫連線異常。',
    chunks: [
      { text: 'Network engineers', isTargetSlot: false, type: 'subject' },
      { text: 'resolved', isTargetSlot: true, type: 'verb' },
      { text: 'the database connectivity glitch', isTargetSlot: false, type: 'object' },
      { text: 'within an hour.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'past', aspect: 'simple' },
    grammarNote: '過去主動 (resolved)。',
  },
  {
    id: 'listen-12-02',
    trainingId: 'listening-12',
    sentence: 'Security patches are deployed automatically across company workstations overnight.',
    translation: '安全修補程式在夜間自動部署到全公司的工作站。',
    chunks: [
      { text: 'Security patches', isTargetSlot: false, type: 'subject' },
      { text: 'are deployed automatically', isTargetSlot: true, type: 'verb' },
      { text: 'across company workstations', isTargetSlot: false },
      { text: 'overnight.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'present', aspect: 'simple' },
    grammarNote: '現在被動 (are deployed)。',
  },

  // 13. Financing & Budgeting
  {
    id: 'listen-13-01',
    trainingId: 'listening-13',
    sentence: 'The internal audit department examines expenditure receipts every Friday afternoon.',
    translation: '內部稽核部門每週五下午審查支出收據。',
    chunks: [
      { text: 'The internal audit department', isTargetSlot: false, type: 'subject' },
      { text: 'examines', isTargetSlot: true, type: 'verb' },
      { text: 'expenditure receipts', isTargetSlot: false, type: 'object' },
      { text: 'every Friday afternoon.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'active', time: 'present', aspect: 'simple' },
    grammarNote: '現在主動 (examines)。',
  },
  {
    id: 'listen-13-02',
    trainingId: 'listening-13',
    sentence: 'The annual operating budget was revised to reflect increased shipping expenses.',
    translation: '年度營運預算已修訂以反映增加的運輸費用。',
    chunks: [
      { text: 'The annual operating budget', isTargetSlot: false, type: 'subject' },
      { text: 'was revised', isTargetSlot: true, type: 'verb' },
      { text: 'to reflect increased shipping expenses.', isTargetSlot: false },
    ],
    targetSlotIndex: 1,
    correctAnswers: { voice: 'passive', time: 'past', aspect: 'simple' },
    grammarNote: '過去被動 (was revised)。',
  },
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
