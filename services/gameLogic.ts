import { 
  GameState, PlayerState, Card, Effect, LogEntry, 
  Metrics, Decks, GameMode 
} from '../types';
import { 
  CARD_CATALOG, INITIAL_METRICS, INITIAL_BUDGET, 
  INITIAL_HAND_SIZE, EVENT_DECK_IDS, MAIN_DECK_IDS 
} from '../constants';

// ==========================================
// 1. Helper Functions (Defined first to avoid hoisting issues)
// ==========================================

function shuffle(array: string[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function clampMetric(val: number): number {
  return Math.min(Math.max(val, 0), 10);
}

// Exported helper
export function calculateScore(metrics: Metrics): number {
  // FinalScore = (Compliance × 2) + (Reputation × 2) + (10 - Carbon) + (10 - Risk) - Cost
  // If Compliance < 5: -5 penalty
  let score = (metrics.Compliance * 2) + (metrics.Reputation * 2) + (10 - metrics.Carbon) + (10 - metrics.Risk) - metrics.Cost;
  if (metrics.Compliance < 5) score -= 5;
  return score;
}

function determineWinner(players: PlayerState[]): string {
  let bestScore = -999;
  let winner = "DRAW";
  
  players.forEach(p => {
    // If Compliance <= 1, they can't win (already handled by Game Over trigger, but check safety)
    if (p.metrics.Compliance <= 1) return;

    const s = calculateScore(p.metrics);
    if (s > bestScore) {
      bestScore = s;
      winner = p.playerId;
    } else if (s === bestScore) {
       // Tie breaking (Spec 4.7)
       const currentWinner = players.find(pl => pl.playerId === winner);
       if (currentWinner) {
         if (p.metrics.Compliance > currentWinner.metrics.Compliance) winner = p.playerId;
         else if (p.metrics.Compliance === currentWinner.metrics.Compliance && p.metrics.Reputation > currentWinner.metrics.Reputation) winner = p.playerId;
         else winner = "DRAW"; // Truly tied
       }
    }
  });
  return winner;
}

function drawCardForPlayer(state: GameState, playerIdx: number): GameState {
  const newState = { ...state, players: [...state.players], decks: {...state.decks} };
  
  if (newState.decks.mainDeck.length === 0) {
      newState.decks.mainDeck = shuffle(newState.decks.mainDiscard);
      newState.decks.mainDiscard = [];
  }
  
  const cardId = newState.decks.mainDeck.pop();
  if (cardId) {
      newState.players[playerIdx].hand = [...newState.players[playerIdx].hand, cardId];
  }
  return newState;
}

function applyEffect(
  state: GameState, 
  effect: Effect, 
  sourceCardId: string, 
  actorId: string
): GameState {
  const newState = { ...state, players: [...state.players] };
  
  // Determine Targets
  let targets: number[] = [];
  if (effect.target === 'Self') {
    const idx = newState.players.findIndex(p => p.playerId === actorId);
    if (idx !== -1) targets = [idx];
  } else if (effect.target === 'All') {
    targets = newState.players.map((_, i) => i);
  } else if (effect.target === 'PlayerId') {
    // Not implemented for MVP, default to current
    targets = [newState.currentPlayerIndex];
  }

  targets.forEach(pIdx => {
    const player = { ...newState.players[pIdx], metrics: { ...newState.players[pIdx].metrics } };
    const diff: any = {};

    switch (effect.kind) {
      case 'ModifyMetric':
        if (effect.metric && effect.delta !== undefined) {
          const oldVal = player.metrics[effect.metric];
          player.metrics[effect.metric] = clampMetric(oldVal + effect.delta);
          diff[effect.metric] = { before: oldVal, after: player.metrics[effect.metric] };
        }
        break;
      case 'ModifyBudget':
        if (effect.delta !== undefined) {
          const oldVal = player.budget;
          player.budget = Math.max(0, player.budget + effect.delta);
           diff['Budget'] = { before: oldVal, after: player.budget };
        }
        break;
      case 'Draw':
          // Handled outside typically
        break;
    }

    newState.players[pIdx] = player;
    
    // Log specific effect application
    if (Object.keys(diff).length > 0) {
      newState.logs = [...newState.logs, {
        ts: Date.now(),
        round: newState.round,
        phase: newState.phase,
        actor: player.playerId,
        action: '效果生效',
        cardId: sourceCardId,
        diff
      }];
    }
  });

  return newState;
}

// ==========================================
// 2. Core Logic Exports
// ==========================================

export const initializeGame = (
  playerCount: number, 
  maxRounds: number, 
  initialMode: GameMode
): GameState => {
  const timestamp = Date.now();
  const gameId = `G_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(Math.random()*1000)}`;

  // Create Players
  const players: PlayerState[] = Array.from({ length: playerCount }).map((_, i) => ({
    playerId: `P${i + 1}`,
    name: `玩家 ${i + 1}`,
    isHuman: i === 0 || initialMode === 'Manual',
    budget: INITIAL_BUDGET,
    metrics: { ...INITIAL_METRICS },
    hand: [],
    discard: [],
    flags: []
  }));

  // Create Decks
  const decks: Decks = {
    eventDeck: shuffle([...EVENT_DECK_IDS, ...EVENT_DECK_IDS, ...EVENT_DECK_IDS]),
    mainDeck: shuffle([...MAIN_DECK_IDS, ...MAIN_DECK_IDS]),
    eventDiscard: [],
    mainDiscard: []
  };

  // Initial Draw
  players.forEach(p => {
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      const cardId = decks.mainDeck.pop();
      if (cardId) p.hand.push(cardId);
    }
  });

  // Initial Log
  const initialLog: LogEntry = {
    ts: timestamp,
    round: 0,
    phase: 'Event',
    actor: 'System',
    action: '遊戲開始',
    diff: { playerCount, maxRounds, mode: initialMode }
  };

  return {
    gameId,
    round: 1,
    maxRounds,
    phase: 'Event',
    currentPlayerIndex: 0,
    players,
    decks,
    rulesetVersion: '1.0',
    gameMode: initialMode,
    lastInteractionAt: timestamp,
    demoSeed: 42,
    logs: [initialLog],
    winnerId: null
  };
};

export const processResolutionPhase = (state: GameState): GameState => {
  let newState = { ...state, players: [...state.players] };

  // 1. MVP Rules R-RES-01, 02, 03
  newState.players.forEach((p, idx) => {
    const player = { ...p, metrics: { ...p.metrics } };
    const diff: any = {};

    // R-RES-01: Cost >= 8 -> Reputation -1
    if (player.metrics.Cost >= 8) {
      const old = player.metrics.Reputation;
      player.metrics.Reputation = clampMetric(player.metrics.Reputation - 1);
      if(old !== player.metrics.Reputation) diff['Reputation'] = { rule: 'R-RES-01', before: old, after: player.metrics.Reputation };
    }

    // R-RES-02: Risk >= 8 -> Compliance -1
    if (player.metrics.Risk >= 8) {
      const old = player.metrics.Compliance;
      player.metrics.Compliance = clampMetric(player.metrics.Compliance - 1);
      if(old !== player.metrics.Compliance) diff['Compliance'] = { rule: 'R-RES-02', before: old, after: player.metrics.Compliance };
    }

    newState.players[idx] = player;

    if (Object.keys(diff).length > 0) {
      newState.logs.push({
        ts: Date.now(),
        round: newState.round,
        phase: 'Resolution',
        actor: player.playerId,
        action: '規則觸發',
        diff
      });
    }

    // R-RES-03: Compliance <= 1 -> Instant Loss
    if (player.metrics.Compliance <= 1) {
      newState.endReason = `${player.name} 法規合規過低 (≤1) 遭勒令停業。`;
    }
  });

  if (newState.endReason) {
    newState.winnerId = determineWinner(newState.players);
    return newState;
  }

  // Check Max Rounds
  if (newState.round >= newState.maxRounds) {
    newState.endReason = "已達最大回合數。";
    newState.winnerId = determineWinner(newState.players);
    return newState;
  }

  // Next Round
  newState.round++;
  newState.phase = 'Event';
  newState.currentPlayerIndex = 0;
  newState.logs.push({
    ts: Date.now(),
    round: newState.round,
    phase: 'Event',
    actor: 'System',
    action: '新回合',
  });

  // Provide budget top-up
  newState.players = newState.players.map(p => ({...p, budget: INITIAL_BUDGET}));

  return newState;
};

export const processEventPhase = (state: GameState): GameState => {
  let newState = { ...state };
  
  // Reshuffle if empty (AC-04)
  if (newState.decks.eventDeck.length === 0) {
    newState.decks.eventDeck = shuffle(newState.decks.eventDiscard);
    newState.decks.eventDiscard = [];
  }

  const cardId = newState.decks.eventDeck.pop();
  if (!cardId) return newState; 

  newState.decks.eventDiscard.push(cardId);
  const card = CARD_CATALOG[cardId];

  // Log Event
  newState.logs.push({
    ts: Date.now(),
    round: newState.round,
    phase: 'Event',
    actor: 'System',
    action: '突發事件',
    cardId: cardId,
    diff: { name: card.name }
  });

  // Apply Effects
  card.effects.forEach(eff => {
    newState = applyEffect(newState, eff, cardId, 'System');
  });

  // Transition to Action Phase
  newState.phase = 'Action';
  newState.currentPlayerIndex = 0;
  
  // Start of Action Phase logic (Draw card for first player)
  newState = drawCardForPlayer(newState, 0);

  return newState;
};

export const playCard = (state: GameState, cardId: string): GameState => {
  // Validation
  if (state.phase !== 'Action') return state;
  const pIdx = state.currentPlayerIndex;
  const player = state.players[pIdx];
  const card = CARD_CATALOG[cardId];

  if (!player.hand.includes(cardId)) return state;
  if (player.budget < card.cost) return state;

  // Clone State
  let newState = { ...state, players: [...state.players] };
  let activePlayer = { ...newState.players[pIdx] };

  // Pay Cost
  activePlayer.budget -= card.cost;
  // Remove from hand
  activePlayer.hand = activePlayer.hand.filter(id => id !== cardId); // Remove one instance
  // Add to discard
  newState.decks.mainDiscard.push(cardId);
  
  newState.players[pIdx] = activePlayer;

  // Log
  newState.logs.push({
    ts: Date.now(),
    round: newState.round,
    phase: 'Action',
    actor: activePlayer.playerId,
    action: '打出卡牌',
    cardId: cardId,
    diff: { cost: card.cost }
  });

  // Apply Effects
  card.effects.forEach(eff => {
    newState = applyEffect(newState, eff, cardId, activePlayer.playerId);
  });

  return newState;
};

export const refreshHand = (state: GameState): GameState => {
  // Validation
  if (state.phase !== 'Action') return state;
  const pIdx = state.currentPlayerIndex;
  const player = state.players[pIdx];

  // Logic: Cost 1 to refresh hand
  const REFRESH_COST = 1;
  if (player.budget < REFRESH_COST) return state;

  let newState = { ...state, players: [...state.players], decks: { ...state.decks } };
  let activePlayer = { ...newState.players[pIdx] };

  // Pay Cost
  activePlayer.budget -= REFRESH_COST;

  // Discard all cards
  newState.decks.mainDiscard = [...newState.decks.mainDiscard, ...activePlayer.hand];
  activePlayer.hand = [];

  // Save changes temporarily
  newState.players[pIdx] = activePlayer;

  // Draw new cards up to INITIAL_HAND_SIZE
  for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
    newState = drawCardForPlayer(newState, pIdx);
  }

  // Log
  newState.logs.push({
    ts: Date.now(),
    round: newState.round,
    phase: 'Action',
    actor: newState.players[pIdx].playerId,
    action: '刷新手牌',
    diff: { cost: REFRESH_COST }
  });

  return newState;
};

export const endPlayerTurn = (state: GameState): GameState => {
  let newState = { ...state };
  
  if (newState.currentPlayerIndex < newState.players.length - 1) {
    // Next player
    newState.currentPlayerIndex++;
    // Draw card for next player
    newState = drawCardForPlayer(newState, newState.currentPlayerIndex);
  } else {
    // All players done, go to Resolution
    newState.phase = 'Resolution';
    newState = processResolutionPhase(newState);
  }
  return newState;
};

export const getAutoMove = (state: GameState): { action: 'PLAY' | 'END', cardId?: string } => {
  const pIdx = state.currentPlayerIndex;
  const player = state.players[pIdx];

  // Simple heuristic
  const playableCards = player.hand
    .map(id => CARD_CATALOG[id])
    .filter(c => c.cost <= player.budget);

  if (playableCards.length === 0) return { action: 'END' };

  const bestCard = playableCards[0]; 
  
  return { action: 'PLAY', cardId: bestCard.id };
};