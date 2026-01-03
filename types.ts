export type CardType = 'Event' | 'Policy' | 'E' | 'S' | 'G' | 'Investment';

export type MetricType = 'Carbon' | 'Cost' | 'Compliance' | 'Reputation' | 'Risk';

export type TargetType = 'Self' | 'All' | 'PlayerId';

export type EffectKind = 
  | 'ModifyMetric' 
  | 'ModifyBudget' 
  | 'Draw' 
  | 'DiscardRandom' 
  | 'AddFlag' 
  | 'RemoveFlag';

export interface Effect {
  kind: EffectKind;
  target: TargetType; // Simplified for MVP (usually Self or All)
  metric?: MetricType; // For ModifyMetric
  delta?: number;      // For ModifyMetric, ModifyBudget
  count?: number;      // For Draw, Discard
  flag?: string;       // For AddFlag
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string; // Added for UI display
  tags: string[];
  effects: Effect[];
  sourceNote: string;
}

export interface Metrics {
  Carbon: number;
  Cost: number;
  Compliance: number;
  Reputation: number;
  Risk: number;
}

export interface PlayerState {
  playerId: string;
  name: string;
  isHuman: boolean; // To distinguish AI/Human slots
  budget: number;
  metrics: Metrics;
  hand: string[]; // Array of Card IDs
  discard: string[];
  flags: string[];
}

export type GamePhase = 'Event' | 'Action' | 'Resolution';
export type GameMode = 'Manual' | 'Demo';

export interface LogEntry {
  ts: number;
  round: number;
  phase: GamePhase;
  actor: string; // Player Name or 'System'
  action: string;
  cardId?: string;
  diff?: Record<string, any>; // JSON description of changes
}

export interface Decks {
  eventDeck: string[]; // Card IDs
  mainDeck: string[];  // Card IDs
  eventDiscard: string[];
  mainDiscard: string[];
}

export interface GameState {
  gameId: string;
  round: number;
  maxRounds: number;
  phase: GamePhase;
  currentPlayerIndex: number;
  players: PlayerState[];
  decks: Decks;
  rulesetVersion: string;
  gameMode: GameMode;
  lastInteractionAt: number;
  demoSeed: number;
  logs: LogEntry[];
  winnerId?: string | null; // null = in progress, string = playerId, 'DRAW' = draw
  endReason?: string;
}

export enum GameScreen {
  MAIN_MENU,
  SETUP,
  GAME_BOARD,
  RULEBOOK,
  GALLERY,
  RESULTS
}