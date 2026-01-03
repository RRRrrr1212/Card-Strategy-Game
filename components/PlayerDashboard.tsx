import React from 'react';
import { PlayerState, Metrics } from '../types';
import { Cloud, DollarSign, Shield, ThumbsUp, AlertOctagon } from 'lucide-react';
import { calculateScore } from '../services/gameLogic';

const MetricBar = ({ label, value, icon: Icon, color, reverse = false }: any) => {
  // Logic: Some metrics are "Lower is Better" (Carbon, Cost, Risk).
  // Visuals: High Value = Full Bar. 
  // Color: If reverse=true (Bad metrics), High Value = Red. 
  
  const percentage = (value / 10) * 100;
  
  // Determine color based on "goodness"
  let barColor = color; // Default base color class
  
  return (
    <div className="flex flex-col mb-2">
      <div className="flex justify-between text-xs font-semibold mb-0.5 text-slate-600">
        <div className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {label}
        </div>
        <span>{value}/10</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const PlayerDashboard: React.FC<{ player: PlayerState, active: boolean }> = ({ player, active }) => {
  return (
    <div className={`
      rounded-xl p-4 transition-all duration-300 border-2
      ${active ? 'bg-white border-emerald-600 shadow-xl scale-105 z-10' : 'bg-slate-50 border-transparent opacity-80 scale-95'}
    `}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-bold ${active ? 'text-emerald-900' : 'text-slate-500'}`}>
          {player.name}
          {active && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">回合中</span>}
        </h3>
        
        {/* Enhanced Budget Display for Active Player */}
        <div className={`
          flex items-center gap-1 rounded-lg font-bold transition-all duration-300
          ${active 
             ? 'bg-orange-500 text-white px-3 py-1.5 shadow-md scale-105' 
             : 'bg-emerald-100 text-emerald-800 px-2 py-1 text-sm'}
        `}>
          <DollarSign className={active ? "w-4 h-4" : "w-3 h-3"} />
          {active && <span className="text-xs mr-1 opacity-90 font-normal">可用資金:</span>}
          <span className={active ? "text-lg" : ""}>{player.budget}</span>
        </div>
      </div>

      <div className="space-y-1">
        <MetricBar 
          label="碳排放 (Carbon)" 
          value={player.metrics.Carbon} 
          icon={Cloud} 
          color="bg-gray-600" 
          reverse 
        />
        <MetricBar 
          label="營運成本 (Cost)" 
          value={player.metrics.Cost} 
          icon={DollarSign} 
          color="bg-orange-500" 
          reverse 
        />
        <MetricBar 
          label="法規合規 (Compliance)" 
          value={player.metrics.Compliance} 
          icon={Shield} 
          color="bg-emerald-500" 
        />
        <MetricBar 
          label="企業聲譽 (Reputation)" 
          value={player.metrics.Reputation} 
          icon={ThumbsUp} 
          color="bg-purple-500" 
        />
        <MetricBar 
          label="營運風險 (Risk)" 
          value={player.metrics.Risk} 
          icon={AlertOctagon} 
          color="bg-red-500" 
          reverse 
        />
      </div>

      <div className="mt-3 pt-2 border-t text-xs text-center text-slate-400">
        預估分數: <span className="font-mono font-bold text-slate-600">{calculateScore(player.metrics)}</span>
      </div>
    </div>
  );
};