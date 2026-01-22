import React from 'react';
import { Convoy } from '../types';
import { CheckCircle2, AlertTriangle, User } from 'lucide-react';

interface Props {
  convoy: Convoy;
  index: number;
}

const ConvoyRow: React.FC<Props> = ({ convoy, index }) => {
  const isStale = convoy.status === 'STALE';
  const isComplete = convoy.status === 'COMPLETE';

  return (
    <div 
      className={`
        group relative grid grid-cols-12 gap-4 p-4 items-center
        border-b border-industrial-800/50 hover:bg-[#3d2616] transition-colors duration-200
        ${index % 2 === 0 ? 'bg-[#1f1612]/60' : 'bg-transparent'}
      `}
    >
      {/* Left Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isComplete ? 'bg-emerald-700' : 'bg-amber-600'}`}></div>

      {/* Status Column */}
      <div className="col-span-2 md:col-span-1 flex justify-center">
        {isComplete ? (
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full bg-[#0f291e] border border-emerald-800 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
             </div>
             <span className="text-[9px] uppercase font-bold text-emerald-700/80 mt-1 tracking-wider group-hover:text-emerald-600 transition-colors">Done</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#2e1a0b] border border-amber-700/50 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[9px] uppercase font-bold text-amber-700 mt-1 tracking-wider group-hover:text-amber-600 transition-colors">Stale</span>
          </div>
        )}
      </div>

      {/* Details Column */}
      <div className="col-span-10 md:col-span-6 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-industrial-500 text-xs">{convoy.id}</span>
          {convoy.worker && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm bg-copper-900/40 text-copper-400 border border-copper-800/50 shadow-sm">
               <User className="w-3 h-3" /> {convoy.worker}
            </span>
          )}
        </div>
        <h3 className="font-serif text-xl text-industrial-100 leading-tight group-hover:text-brass-300 transition-colors drop-shadow-sm">
          {convoy.name}
        </h3>
        <p className="text-industrial-400 text-sm mt-0.5 font-mono truncate hidden md:block opacity-80 group-hover:opacity-100">
          Work: {convoy.description}
        </p>
      </div>

      {/* Progress Column */}
      <div className="col-span-6 md:col-span-2 flex flex-col justify-center">
         <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-industrial-500 font-mono uppercase">Output</span>
            <span className={`font-mono font-bold text-sm ${isComplete ? 'text-emerald-500/80' : 'text-brass-200'}`}>
              {convoy.progress.current}/{convoy.progress.total}
            </span>
         </div>
         {/* Pipe/Tube looking progress bar */}
         <div className="w-full h-3 bg-[#120b09] rounded-full border border-[#2a1d18] relative overflow-hidden shadow-inner">
            <div 
              className={`h-full absolute top-0 left-0 transition-all duration-1000 ${isComplete ? 'bg-emerald-800' : 'bg-amber-700'}`}
              style={{ width: `${(convoy.progress.current / convoy.progress.total) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/10"></div>
              {/* Glossy highlight on pipe */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20"></div>
              {/* Striped warning pattern for stale bars */}
              {!isComplete && (
                 <div className="absolute inset-0 w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.4) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.4) 50%,rgba(0,0,0,.4) 75%,transparent 75%,transparent)', backgroundSize: '8px 8px' }}></div>
              )}
            </div>
         </div>
      </div>

      {/* Activity Column */}
      <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-3 text-right">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase text-industrial-600 tracking-wider">Last Activity</span>
            <span className={`font-mono text-sm ${isStale ? 'text-amber-500' : 'text-industrial-400'}`}>
              {convoy.lastActivity}
            </span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#120b09] relative border border-[#2a1d18]">
           {isStale && <div className="absolute inset-0 bg-amber-600 rounded-full animate-ping opacity-50"></div>}
           <div className={`w-full h-full rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)] ${isStale ? 'bg-amber-600 box-shadow-glow-amber' : 'bg-industrial-700'}`}></div>
        </div>
      </div>

    </div>
  );
};

export default ConvoyRow;