import React from 'react';
import { Card } from '../types';
import { Leaf, DollarSign, ShieldCheck, Star, AlertTriangle, Briefcase, BookOpen } from 'lucide-react';

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  size?: 'sm' | 'lg';
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'E': return <Leaf className="w-4 h-4 text-emerald-600" />;
    case 'S': return <Briefcase className="w-4 h-4 text-orange-600" />;
    case 'G': return <ShieldCheck className="w-4 h-4 text-blue-600" />;
    case 'Event': return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'Policy': return <BookOpen className="w-4 h-4 text-purple-600" />;
    case 'Investment': return <DollarSign className="w-4 h-4 text-amber-600" />;
    default: return <Star className="w-4 h-4 text-gray-600" />;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'E': return '環境 (E)';
    case 'S': return '社會 (S)';
    case 'G': return '治理 (G)';
    case 'Event': return '突發事件';
    case 'Policy': return '政策法規';
    case 'Investment': return '策略投資';
    default: return type;
  }
};

export const CardView: React.FC<CardViewProps> = ({ card, onClick, disabled, highlight, size = 'sm' }) => {
  const isEvent = card.type === 'Event' || card.type === 'Policy';
  
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative bg-white border-2 rounded-xl flex flex-col overflow-hidden transition-all duration-300
        ${size === 'sm' ? 'w-40 h-60 min-w-[10rem]' : 'w-72 h-96'}
        
        /* Highlight State (e.g. in Modal) */
        ${highlight ? 'border-orange-400 ring-4 ring-orange-100 transform -translate-y-2 shadow-2xl z-10' : ''}
        
        /* Disabled State */
        ${disabled 
            ? 'border-slate-200 opacity-60 cursor-not-allowed grayscale' 
            : 'border-slate-200 hover:border-emerald-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer'
        }
      `}
    >
      {/* Header */}
      <div className={`p-3 border-b flex justify-between items-start ${isEvent ? 'bg-orange-50' : 'bg-emerald-50'}`}>
        <div className="flex items-center gap-1">
          <TypeIcon type={card.type} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{getTypeName(card.type)}</span>
        </div>
        {!isEvent && (
          <div className="bg-emerald-800 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center">
            <DollarSign className="w-3 h-3 mr-0.5" />{card.cost}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className={`font-bold leading-tight mb-3 text-slate-800 ${size === 'sm' ? 'text-sm' : 'text-xl'}`}>
          {card.name}
        </h3>
        <p className={`text-slate-600 overflow-hidden leading-relaxed ${size === 'sm' ? 'text-xs' : 'text-base'}`}>
          {card.description}
        </p>
        
        {/* Effects Summary (Mini) */}
        <div className="mt-auto pt-3 space-y-1.5">
           {card.effects.map((eff, i) => (
             <div key={i} className="flex items-center gap-1 text-[11px] text-slate-600 font-mono bg-slate-100 rounded px-1.5 py-0.5">
                {eff.metric && (
                  <>
                    <span className={eff.delta && eff.delta > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {eff.delta && eff.delta > 0 ? '+' : ''}{eff.delta}
                    </span>
                    <span>
                      {eff.metric === 'Carbon' ? '碳排' : 
                       eff.metric === 'Cost' ? '成本' : 
                       eff.metric === 'Compliance' ? '合規' : 
                       eff.metric === 'Reputation' ? '聲譽' : '風險'}
                    </span>
                  </>
                )}
                {eff.kind === 'ModifyBudget' && (
                  <>
                     <span className="text-emerald-600 font-bold">+{eff.delta}</span> 資金
                  </>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Footer Tags */}
      <div className="bg-slate-50 p-2 text-[10px] text-slate-500 border-t flex gap-1 flex-wrap">
        {card.tags.slice(0, 2).map(tag => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </div>
  );
};