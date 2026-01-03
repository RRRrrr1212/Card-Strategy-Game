import { Card, Metrics } from './types';

// System Spec 4.3 Initial State
export const INITIAL_METRICS: Metrics = {
  Carbon: 8,
  Cost: 2,
  Compliance: 3,
  Reputation: 5,
  Risk: 5,
};

export const INITIAL_BUDGET = 3;
export const INITIAL_HAND_SIZE = 5;
export const INACTIVITY_TIMEOUT_MS = 5000;
export const DEMO_STEP_INTERVAL_MS = 5000;

// Card Catalog - Translated to Traditional Chinese
export const CARD_CATALOG: Record<string, Card> = {
  // --- EVENTS ---
  'EVT_001': {
    id: 'EVT_001',
    name: '油價飆升',
    type: 'Event',
    cost: 0,
    description: '全球燃油價格上漲，所有航空公司的營運成本增加。',
    tags: ['市場波動'],
    effects: [{ kind: 'ModifyMetric', target: 'All', metric: 'Cost', delta: 2 }],
    sourceNote: '[產業數據] IATA 航空燃油價格監測 2024'
  },
  'EVT_002': {
    id: 'EVT_002',
    name: '新碳稅政策',
    type: 'Policy',
    cost: 0,
    description: '新的區域法規要求更高的合規標準，否則將面臨罰款。',
    tags: ['法規'],
    effects: [
      { kind: 'ModifyMetric', target: 'All', metric: 'Cost', delta: 1 },
      { kind: 'ModifyMetric', target: 'All', metric: 'Compliance', delta: -1 } // Pressure
    ],
    sourceNote: '[政策] 歐盟 ETS 指令 2024 修訂版'
  },
  'EVT_003': {
    id: 'EVT_003',
    name: '極端氣候',
    type: 'Event',
    cost: 0,
    description: '風暴導致航班延誤，營運風險大幅增加。',
    tags: ['氣候'],
    effects: [{ kind: 'ModifyMetric', target: 'All', metric: 'Risk', delta: 2 }],
    sourceNote: '[科學] IPCC AR6 報告，航空業影響'
  },
  'EVT_004': {
    id: 'EVT_004',
    name: '正面媒體報導',
    type: 'Event',
    cost: 0,
    description: '業界對綠色轉型努力的廣泛認可。',
    tags: ['公關'],
    effects: [{ kind: 'ModifyMetric', target: 'All', metric: 'Reputation', delta: 1 }],
    sourceNote: '[媒體] 2023 全球航空永續獎'
  },
  
  // --- ACTIONS (E) ---
  'ACT_E_001': {
    id: 'ACT_E_001',
    name: '航路優化',
    type: 'E',
    cost: 2,
    description: '導入 AI 飛行計畫系統以減少燃油消耗。',
    tags: ['節能'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Carbon', delta: -2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Cost', delta: 1 } // Tech investment
    ],
    sourceNote: '[公司] 長榮航空永續報告書 2024, Pg 45'
  },
  'ACT_E_002': {
    id: 'ACT_E_002',
    name: '永續燃油採購 (SAF)',
    type: 'E',
    cost: 3,
    description: '採購永續航空燃油以大幅降低碳排放。',
    tags: ['燃油', 'SAF'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Carbon', delta: -3 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Cost', delta: 2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Reputation', delta: 1 }
    ],
    sourceNote: '[產業] SAF 挑戰路線圖'
  },
  
  // --- ACTIONS (S) ---
  'ACT_S_001': {
    id: 'ACT_S_001',
    name: '飛安強化訓練',
    type: 'S',
    cost: 1,
    description: '加強機組人員的緊急應變程序訓練。',
    tags: ['安全'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Risk', delta: -2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Reputation', delta: 1 }
    ],
    sourceNote: '[公司] 長榮航空飛安報告 2023'
  },
  'ACT_S_002': {
    id: 'ACT_S_002',
    name: '社區公益計畫',
    type: 'S',
    cost: 1,
    description: '贊助當地教育與環境保護計畫。',
    tags: ['CSR'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Reputation', delta: 2 }
    ],
    sourceNote: '[公司] 企業社會責任報告 2023'
  },

  // --- ACTIONS (G) ---
  'ACT_G_001': {
    id: 'ACT_G_001',
    name: '供應鏈 ESG 稽核',
    type: 'G',
    cost: 2,
    description: '對所有供應商實施嚴格的 ESG 稽核。',
    tags: ['治理'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Compliance', delta: 2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Risk', delta: -1 }
    ],
    sourceNote: '[公司] 供應商行為準則 2024'
  },
  'ACT_G_002': {
    id: 'ACT_G_002',
    name: '永續報告書發布',
    type: 'G',
    cost: 1,
    description: '發布透明的 TCFD 氣候相關財務揭露報告。',
    tags: ['報告'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Compliance', delta: 1 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Reputation', delta: 1 }
    ],
    sourceNote: '[政策] TCFD 建議書'
  },

  // --- INVESTMENT ---
  'ACT_I_001': {
    id: 'ACT_I_001',
    name: '數位轉型升級',
    type: 'Investment',
    cost: 3,
    description: '升級舊有系統以提升數據追蹤與管理效率。',
    tags: ['科技'],
    effects: [
      { kind: 'ModifyMetric', target: 'Self', metric: 'Compliance', delta: 2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Risk', delta: -2 }
    ],
    sourceNote: '[產業] 2025 數位航空趨勢'
  },
   'ACT_I_002': {
    id: 'ACT_I_002',
    name: '預算重分配',
    type: 'Investment',
    cost: 0,
    description: '將緊急預備金重新分配至營運預算。',
    tags: ['財務'],
    effects: [
      { kind: 'ModifyBudget', target: 'Self', delta: 2 },
      { kind: 'ModifyMetric', target: 'Self', metric: 'Risk', delta: 1 }
    ],
    sourceNote: '[內部] 財務規劃策略'
  }
};

export const EVENT_DECK_IDS = ['EVT_001', 'EVT_002', 'EVT_003', 'EVT_004'];
export const MAIN_DECK_IDS = [
  'ACT_E_001', 'ACT_E_001', 'ACT_E_001', 
  'ACT_E_002', 'ACT_E_002',
  'ACT_S_001', 'ACT_S_001', 'ACT_S_001',
  'ACT_S_002', 'ACT_S_002',
  'ACT_G_001', 'ACT_G_001', 'ACT_G_001',
  'ACT_G_002', 'ACT_G_002',
  'ACT_I_001', 'ACT_I_001',
  'ACT_I_002', 'ACT_I_002', 'ACT_I_002'
];