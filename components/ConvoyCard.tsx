import React from 'react';
import { Convoy } from '../types';
import { CheckCircle2, AlertTriangle, Loader2, User } from 'lucide-react';

interface Props {
  convoy: Convoy;
}

const ConvoyCard: React.FC<Props> = ({ convoy }) => {
  const isStale = convoy.status === 'STALE';
  const isComplete = convoy.status === 'COMPLETE';
  const isRunning = convoy.status === 'RUNNING';

  const StatusIcon = isComplete ? CheckCircle2 : isRunning ? Loader2 : AlertTriangle;
  const statusColor = isComplete ? 'emerald' : isRunning ? 'blue' : 'amber';

  return (
    <div className={`
      relative p-4 rounded-lg border transition-all duration-200
      bg-[#1f1612]/80 hover:bg-[#3d2616]
      border-industrial-800/50 hover:border-brass-700/50
    `}>
      {/* Top accent */}
      <div className={`absolute top-0 left-4 right-4 h-0.5 bg-${statusColor}-700/50 rounded-full`}></div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-industrial-500 text-xs truncate">{convoy.id}</span>
          </div>
          <h3 className="font-serif text-lg text-industrial-100 leading-tight truncate">
            {convoy.name}
          </h3>
        </div>
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isComplete ? 'bg-[#0f291e] border-emerald-800' : isRunning ? 'bg-[#0f1929] border-blue-800' : 'bg-[#2e1a0b] border-amber-700/50'}
          border
        `}>
          <StatusIcon className={`w-4 h-4 text-${statusColor}-600 ${isRunning ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {/* Worker badge */}
      {convoy.worker && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm bg-copper-900/40 text-copper-400 border border-copper-800/50">
            <User className="w-3 h-3" /> {convoy.worker}
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-industrial-500 font-mono uppercase">Progress</span>
          <span className={`font-mono font-bold text-sm ${isComplete ? 'text-emerald-500/80' : 'text-brass-200'}`}>
            {convoy.progress.current}/{convoy.progress.total}
          </span>
        </div>
        <div className="w-full h-2 bg-[#120b09] rounded-full border border-[#2a1d18] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-800' : isRunning ? 'bg-blue-700' : 'bg-amber-700'}`}
            style={{ width: `${(convoy.progress.current / convoy.progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono uppercase text-[10px] px-1.5 py-0.5 rounded ${
          isComplete ? 'bg-emerald-900/30 text-emerald-600' :
          isRunning ? 'bg-blue-900/30 text-blue-500' :
          'bg-amber-900/30 text-amber-600'
        }`}>
          {convoy.status}
        </span>
        <span className="text-industrial-500 font-mono">{convoy.lastActivity}</span>
      </div>
    </div>
  );
};

export default ConvoyCard;
