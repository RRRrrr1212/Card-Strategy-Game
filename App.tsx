import React, { useState, useEffect, useRef } from 'react';
import { 
  GameState, GameScreen, GameMode, Card 
} from './types';
import { 
  initializeGame, processEventPhase, playCard, 
  endPlayerTurn, getAutoMove, processResolutionPhase, refreshHand 
} from './services/gameLogic';
import { 
  INACTIVITY_TIMEOUT_MS, DEMO_STEP_INTERVAL_MS, CARD_CATALOG 
} from './constants';
import { Button } from './components/Button';
import { CardView } from './components/CardView';
import { PlayerDashboard } from './components/PlayerDashboard';
import { RefreshCw, Play, Pause, Book, Info, Award, History, X, Clock, LogOut, DollarSign, Plane, FileText, Globe, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.MAIN_MENU);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  
  // State for Main Menu Countdown
  const [menuCountdown, setMenuCountdown] = useState(10);
  
  // Timers: Use ReturnType<typeof setTimeout> for cross-environment compatibility
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- 1. Main Menu Auto-Demo Countdown ---
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (screen === GameScreen.MAIN_MENU) {
      timer = setInterval(() => {
        setMenuCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Time reached 0: Start Auto Demo (2 players, 5 rounds)
            startGame(2, 5, 'Demo');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset countdown if we leave the main menu
      setMenuCountdown(10);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [screen]);

  // --- 2. Game Loop (Demo Mode Execution) ---
  useEffect(() => {
    if (gameState?.gameMode === 'Demo' && !gameState.winnerId) {
      demoIntervalRef.current = setInterval(() => {
        executeDemoStep();
      }, DEMO_STEP_INTERVAL_MS);
    } else {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    }
    return () => { if (demoIntervalRef.current) clearInterval(demoIntervalRef.current); };
  }, [gameState?.gameMode, gameState?.phase, gameState?.currentPlayerIndex, gameState?.round]);

  // (Removed previous Inactivity Monitor useEffect here)

  // --- Actions ---

  const startGame = (players: number, rounds: number, mode: GameMode) => {
    const newState = initializeGame(players, rounds, mode);
    setGameState(newState);
    setScreen(GameScreen.GAME_BOARD);
    
    // Auto-start event phase
    setTimeout(() => {
       setGameState(prev => prev ? processEventPhase(prev) : null);
    }, 1000);
  };

  const handleExit = () => {
    setGameState(null);
    setScreen(GameScreen.MAIN_MENU);
  };

  const interruptDemo = () => {
    if (!gameState || gameState.gameMode !== 'Demo') return;
    setGameState(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        gameMode: 'Manual',
        logs: [...prev.logs, {
          ts: Date.now(), round: prev.round, phase: prev.phase, actor: 'Player', action: '接管控制'
        }]
      };
    });
  };

  const executeDemoStep = () => {
    setGameState(prev => {
      if (!prev || prev.winnerId) return prev;
      
      let nextState = { ...prev };

      if (nextState.phase === 'Event') {
        nextState = processEventPhase(nextState);
      } else if (nextState.phase === 'Action') {
        const move = getAutoMove(nextState);
        if (move.action === 'PLAY' && move.cardId) {
          nextState = playCard(nextState, move.cardId);
        } else {
          nextState = endPlayerTurn(nextState);
        }
      } else if (nextState.phase === 'Resolution') {
         // Logic handles transition in endPlayerTurn, so if we are stuck here, force next event
         if (nextState.round < nextState.maxRounds) {
            nextState = processEventPhase({
                ...nextState,
                phase: 'Event',
                round: nextState.round + 1,
                currentPlayerIndex: 0
            });
         }
      }
      return nextState;
    });
  };

  const handleCardClick = (cardId: string) => {
    if (gameState?.gameMode === 'Demo') {
      interruptDemo();
      return;
    }
    setSelectedCardId(cardId);
  };

  const handlePlayCard = () => {
    if (!gameState || !selectedCardId) return;
    const newState = playCard(gameState, selectedCardId);
    setGameState(newState);
    setSelectedCardId(null);
  };

  const handleRefreshHand = () => {
    if (!gameState) return;
    if (gameState.gameMode === 'Demo') {
        interruptDemo();
        return;
    }
    const newState = refreshHand(gameState);
    setGameState(newState);
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    if (gameState.gameMode === 'Demo') {
        interruptDemo();
        return;
    }
    const newState = endPlayerTurn(gameState);
    setGameState(newState);
    
    // If Phase looped back to Event (New Round), auto-trigger event
    if (newState.phase === 'Event') {
      setTimeout(() => {
        setGameState(current => current ? processEventPhase(current) : null);
      }, 1000);
    }
  };

  // --- Render Helpers ---

  if (!gameState && screen === GameScreen.GAME_BOARD) return <div>Loading...</div>;

  const currentPlayer = gameState ? gameState.players[gameState.currentPlayerIndex] : null;

  return (
    <div className="w-full h-screen bg-slate-100 overflow-hidden flex flex-col relative font-sans" onClick={() => gameState?.gameMode === 'Demo' && interruptDemo()}>
      
      {/* --- Main Menu --- */}
      {screen === GameScreen.MAIN_MENU && (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-emerald-900">
          
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
             {/* Using a high-quality abstract flight/cloud image */}
             <img 
               src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop" 
               alt="Background" 
               className="w-full h-full object-cover opacity-50"
             />
             {/* Brand Color Overlay Gradient (EVA Green) */}
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-green-950/90 mix-blend-multiply"></div>
          </div>

          {/* EVA Air Logo: Top Left, No Container, White for Contrast */}
          <div className="absolute top-8 left-8 z-20">
             <img 
               src="https://www.evacsr.com/archive/images/logo_header/logo_green.svg" 
               alt="EVA Air Logo" 
               className="h-10 md:h-12 object-contain brightness-0 invert opacity-90"
             />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="text-center space-y-4 mb-12">
               <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-white drop-shadow-lg font-sans">
                 ESG Wings
               </h1>
               {/* Decorative Element matching EVA Orange */}
               <div className="h-1.5 w-32 bg-orange-500 mx-auto rounded-full shadow-lg"></div>
               <p className="text-xl md:text-2xl text-emerald-50 font-medium tracking-wide drop-shadow-md">
                 長榮航空永續策略模擬
               </p>
            </div>
            
            <div className="flex flex-col gap-4 w-72">
              <Button size="lg" variant="secondary" onClick={() => setScreen(GameScreen.SETUP)} className="shadow-xl shadow-orange-900/20 border border-orange-400/50">
                 <Plane className="w-5 h-5 mr-2" />
                 開始遊戲
              </Button>
              <Button size="lg" variant="ghost" className="text-emerald-50 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md" onClick={() => setScreen(GameScreen.RULEBOOK)}>
                 <Book className="w-5 h-5 mr-2" />
                 遊戲規則
              </Button>
            </div>

            {/* Auto Demo Countdown Indicator */}
            <div className="mt-12 flex items-center gap-2 text-emerald-200/80 text-sm font-mono bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Clock className="w-4 h-4" />
              <span>閒置 {menuCountdown} 秒後自動進入演示模式...</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Setup --- */}
      {screen === GameScreen.SETUP && (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-slate-100">
           {/* Enhanced Background for Setup */}
           <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1500644249849-0f212513f803?q=80&w=2070&auto=format&fit=crop" 
               alt="Sky Background" 
               className="w-full h-full object-cover"
             />
             {/* Use a lighter gradient overlay to make image visible but text readable */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/50 to-emerald-50/60 backdrop-blur-[2px]"></div>
           </div>
           
           {/* Decorative blurred blobs for design depth */}
           <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-emerald-300/30 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>
           <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-orange-300/30 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>

           <div className="relative z-10 flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
             {/* Header */}
             <div className="flex items-center gap-3 text-emerald-900 mb-2 drop-shadow-sm">
                <Globe className="w-8 h-8" />
                <h2 className="text-4xl font-extrabold tracking-tight">航班配置</h2>
             </div>
             
             {/* Card Container */}
             <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-[450px] space-y-8 border border-white/60 relative overflow-hidden">
               {/* Decorative top bar */}
               <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>

               <div className="space-y-6 text-center">
                 <div className="space-y-2">
                   <label className="block text-lg font-bold text-slate-800">選擇參與玩家</label>
                   <p className="text-sm text-slate-500">決定參與這場永續策略模擬的航空公司數量</p>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-3">
                   {[2, 3, 4].map(n => (
                     <Button 
                        key={n} 
                        variant="secondary" 
                        className="h-16 text-xl font-bold border-b-4 border-orange-700 hover:border-orange-800 active:border-b-0 active:translate-y-1 transition-all" 
                        onClick={() => startGame(n, 5, 'Manual')}
                     >
                       {n} 人
                     </Button>
                   ))}
                 </div>

                 <div className="bg-emerald-50/80 p-4 rounded-lg border border-emerald-100 flex items-start gap-3 text-left">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">任務簡報</p>
                      <p className="text-sm text-emerald-700 leading-relaxed">
                        遊戲長度固定為 <span className="font-bold">5 回合</span> (快速局)。您需要在全球突發事件中，平衡財務報表與 ESG 永續指標。
                      </p>
                    </div>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-slate-200">
                  <Button variant="ghost" onClick={() => setScreen(GameScreen.MAIN_MENU)} className="w-full text-slate-500 hover:text-slate-800">
                    <X className="w-4 h-4 mr-2" />
                    返回主畫面
                  </Button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* --- Game Board --- */}
      {screen === GameScreen.GAME_BOARD && gameState && currentPlayer && (
        <>
          {/* Top Bar */}
          <header className="h-16 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white border-b border-emerald-700 flex items-center justify-between px-6 shadow-md z-20">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">回合</span>
                  <span className="text-xl font-bold leading-none">{gameState.round}/{gameState.maxRounds}</span>
                </div>
                <div className="h-8 w-px bg-emerald-700 mx-2"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">階段</span>
                  <span className={`text-lg font-bold leading-none ${
                    gameState.phase === 'Event' ? 'text-orange-400' :
                    gameState.phase === 'Action' ? 'text-blue-300' : 'text-purple-300'
                  }`}>{
                      gameState.phase === 'Event' ? '突發事件' :
                      gameState.phase === 'Action' ? '行動決策' : '結算'
                  }</span>
                </div>
             </div>

             <div className="flex items-center gap-2">
                {gameState.gameMode === 'Demo' ? (
                  <span className="bg-red-500/20 text-red-200 border border-red-500/50 px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
                    <Play className="w-4 h-4" /> 自動演示中
                  </span>
                ) : (
                   <span className="bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-xs font-bold">手動模式</span>
                )}
                <Button variant="ghost" size="sm" className="text-emerald-100 hover:bg-emerald-800 hover:text-white" onClick={() => setShowLog(!showLog)}>
                  <History className="w-5 h-5" />
                </Button>
                <Button variant="danger" size="sm" onClick={handleExit} className="ml-2 shadow-sm border border-red-400/30">
                   <LogOut className="w-4 h-4 mr-1" /> 退出
                </Button>
             </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Main Area */}
            <main className="flex-1 flex flex-col p-6 relative bg-slate-100">
               
               {/* Opponents / Dashboards */}
               <div className="flex justify-center gap-6 mb-8">
                  {gameState.players.map((p, idx) => (
                    <PlayerDashboard 
                      key={p.playerId} 
                      player={p} 
                      active={idx === gameState.currentPlayerIndex} 
                    />
                  ))}
               </div>

               {/* Center Action Area (Event Card or System Message) */}
               <div className="flex-1 flex items-center justify-center pointer-events-none">
                  {gameState.phase === 'Event' && (
                    <div className="animate-bounce">
                       <div className="bg-orange-100 border border-orange-200 text-orange-800 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-3">
                         <Info className="w-6 h-6" />
                         突發事件處理中...
                       </div>
                    </div>
                  )}
                  {gameState.winnerId && (
                     <div className="bg-emerald-900/90 backdrop-blur-sm absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
                        <div className="bg-white p-12 rounded-2xl text-center space-y-6 max-w-lg shadow-2xl">
                           <Award className="w-24 h-24 text-orange-500 mx-auto" />
                           <h2 className="text-4xl font-bold text-slate-800">遊戲結束</h2>
                           <p className="text-2xl text-emerald-700 font-bold">
                             {gameState.winnerId === 'DRAW' ? '平局!' : `${gameState.players.find(p => p.playerId === gameState.winnerId)?.name} 獲勝!`}
                           </p>
                           <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                             結束原因: {gameState.endReason}
                           </p>
                           <Button size="lg" onClick={() => setScreen(GameScreen.MAIN_MENU)} className="w-full">返回主選單</Button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Player Hand */}
               <div className="mt-auto z-10">
                 <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                         <div className="w-2 h-6 bg-orange-500 rounded-sm"></div>
                         您的手牌
                      </h3>
                      {/* Budget Display - Requested Location #2 */}
                      <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 border border-emerald-200 shadow-sm">
                         <DollarSign className="w-4 h-4" />
                         可用資金: {currentPlayer.budget}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Refresh Button - Requested Location #1 */}
                      <Button 
                        onClick={handleRefreshHand} 
                        disabled={gameState.phase !== 'Action' || gameState.gameMode === 'Demo' || currentPlayer.budget < 1}
                        variant="ghost"
                        className="text-slate-600 border border-slate-300 hover:bg-slate-100"
                        size="md"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" /> 刷新 ($1)
                      </Button>

                      <Button 
                        onClick={handleEndTurn} 
                        disabled={gameState.phase !== 'Action' || gameState.gameMode === 'Demo'}
                        variant="secondary"
                      >
                        結束回合
                      </Button>
                    </div>
                 </div>
                 <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-hide min-h-[260px]">
                    {currentPlayer.hand.map((cardId, i) => (
                      <CardView 
                        key={`${cardId}-${i}`} 
                        card={CARD_CATALOG[cardId]} 
                        onClick={() => handleCardClick(cardId)}
                        disabled={gameState.phase !== 'Action' || gameState.gameMode === 'Demo' || currentPlayer.budget < CARD_CATALOG[cardId].cost}
                      />
                    ))}
                 </div>
               </div>
            </main>

            {/* Side Log (Collapsible) */}
            {showLog && (
              <aside className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col z-20">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-700">遊戲紀錄</h3>
                  <Button size="sm" variant="ghost" onClick={() => setShowLog(false)}><X className="w-4 h-4"/></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {gameState.logs.slice().reverse().map((log, i) => (
                     <div key={i} className="text-sm border-b pb-3 last:border-0 border-slate-100">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span className="bg-slate-100 px-1.5 rounded">R{log.round} | {
                              log.phase === 'Event' ? '事件' : log.phase === 'Action' ? '行動' : '結算'
                          }</span>
                          <span>{new Date(log.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <div className="font-medium text-slate-800">
                          <span className="font-bold text-emerald-700">{log.actor}</span>: {log.action}
                        </div>
                        {log.cardId && (
                           <div className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-slate-300">
                             卡牌: {CARD_CATALOG[log.cardId]?.name}
                           </div>
                        )}
                        {log.diff && (
                          <div className="text-[10px] text-slate-400 mt-1 bg-slate-50 p-1.5 rounded">
                            {/* Simple render of diff keys if any */}
                            {Object.keys(log.diff).filter(k => k !== 'name' && k !== 'cost').join(', ')}
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              </aside>
            )}
          </div>

          {/* Card Detail Modal */}
          {selectedCardId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCardId(null)}>
               <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-center transform scale-110 my-4">
                    <CardView card={CARD_CATALOG[selectedCardId]} size="lg" highlight />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 border border-slate-200">
                       <strong className="block text-slate-700 mb-1 flex items-center gap-1">
                          <Book className="w-3 h-3" /> 資料來源:
                       </strong>
                       {CARD_CATALOG[selectedCardId].sourceNote}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setSelectedCardId(null)} className="flex-1">取消</Button>
                      <Button 
                        variant="secondary"
                        onClick={handlePlayCard} 
                        className="flex-1"
                        disabled={currentPlayer.budget < CARD_CATALOG[selectedCardId].cost}
                      >
                         使用 (${CARD_CATALOG[selectedCardId].cost})
                      </Button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </>
      )}

      {/* --- Rulebook --- */}
      {screen === GameScreen.RULEBOOK && (
        <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden">
           {/* Back Button - Top Left */}
           <div className="absolute top-6 left-6 z-50">
             <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white border border-white/30 backdrop-blur-sm" onClick={() => setScreen(GameScreen.MAIN_MENU)}>
               <ArrowLeft className="w-5 h-5 mr-2" />
               返回
             </Button>
           </div>

           {/* Decorative Header Background */}
           <div className="absolute top-0 w-full h-80 bg-emerald-900 z-0">
             <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-100 to-transparent"></div>
           </div>

           <div className="relative z-10 flex-1 flex flex-col items-center overflow-y-auto py-12 px-4">
              {/* Title Block */}
              <div className="text-center mb-8 text-white space-y-2">
                 <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 mb-2">
                   <Book className="w-8 h-8 text-orange-400" />
                 </div>
                 <h1 className="text-4xl font-extrabold tracking-tight">策略操作手冊</h1>
                 <p className="text-emerald-100 opacity-80">ESG Wings Operation Manual</p>
              </div>

              {/* Main Document Content */}
              <div className="max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-hidden mb-10 border border-slate-200">
                {/* Document Header Line */}
                <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500"></div>
                
                <div className="p-10 md:p-12 space-y-10">
                  <div className="prose prose-emerald max-w-none text-slate-600">
                      
                      {/* Section 1 */}
                      <div className="flex gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xl">01</div>
                        <div className="space-y-3">
                           <h3 className="text-2xl font-bold text-slate-800 m-0">核心目標</h3>
                           <p className="leading-relaxed">
                             您將扮演長榮航空的永續策略長。在 <strong>5 個回合</strong>的營運週期內，您的目標是透過策略卡牌的運用，平衡 <span className="font-semibold text-emerald-700">ESG 指標</span> 並最大化企業價值。
                           </p>
                           <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-orange-400 text-sm">
                             <span className="font-bold block text-slate-700 mb-1">獲勝關鍵</span>
                             不僅要賺錢，更要確保合規與聲譽。單一指標的極端惡化可能導致直接出局。
                           </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 my-8" />

                      {/* Section 2 */}
                      <div className="flex gap-6 items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xl">02</div>
                        <div className="space-y-3">
                           <h3 className="text-2xl font-bold text-slate-800 m-0">關鍵指標說明</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="border border-slate-200 rounded-lg p-3">
                                 <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-2"><Globe className="w-4 h-4"/> 追求低分 (Target 0)</h4>
                                 <ul className="text-sm space-y-1 list-disc pl-4">
                                   <li><strong>碳排放 (Carbon)</strong></li>
                                   <li><strong>營運成本 (Cost)</strong></li>
                                   <li><strong>營運風險 (Risk)</strong></li>
                                 </ul>
                              </div>
                              <div className="border border-slate-200 rounded-lg p-3">
                                 <h4 className="font-bold text-purple-700 flex items-center gap-2 mb-2"><Award className="w-4 h-4"/> 追求高分 (Target 10)</h4>
                                 <ul className="text-sm space-y-1 list-disc pl-4">
                                   <li><strong>法規合規 (Compliance)</strong></li>
                                   <li><strong>企業聲譽 (Reputation)</strong></li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 my-8" />

                      {/* Section 3 */}
                      <div className="flex gap-6 items-start">
                         <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-700 font-bold text-xl">03</div>
                         <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-slate-800 m-0">風險與結算</h3>
                            <p>每個回合結束時將進行結算，若指標失衡將觸發連鎖效應：</p>
                            <div className="space-y-2 mt-2">
                               <div className="flex items-center gap-3 text-sm p-2 bg-red-50 rounded text-red-800">
                                  <AlertOctagon className="w-4 h-4" /> 
                                  <span>若 <strong>合規 (Compliance) ≤ 1</strong>，將被強制停業，遊戲直接失敗。</span>
                               </div>
                               <div className="flex items-center gap-3 text-sm p-2 bg-orange-50 rounded text-orange-800">
                                  <AlertOctagon className="w-4 h-4" />
                                  <span>若 <strong>成本 (Cost) ≥ 8</strong>，將損害聲譽 (-1)。</span>
                               </div>
                               <div className="flex items-center gap-3 text-sm p-2 bg-orange-50 rounded text-orange-800">
                                  <AlertOctagon className="w-4 h-4" />
                                  <span>若 <strong>風險 (Risk) ≥ 8</strong>，將導致合規下降 (-1)。</span>
                               </div>
                            </div>
                         </div>
                      </div>

                  </div>
                </div>

                {/* Document Footer */}
                <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200">
                  <span className="text-xs text-slate-400 font-mono">DOC ID: EVA-ESG-2025-V1</span>
                  <Button onClick={() => setScreen(GameScreen.MAIN_MENU)}>
                    <FileText className="w-4 h-4 mr-2" />
                    閱讀完畢，返回主選單
                  </Button>
                </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// Helper icon for rules
function AlertOctagon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export default App;