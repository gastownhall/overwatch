import React from 'react';
import { Truck, Activity, Battery, Clock, Users } from 'lucide-react';
import { SystemStats } from '../types';

interface Props {
  stats: SystemStats;
  lastUpdated: number | null;
}

function formatLastUpdated(timestamp: number | null): string {
  if (timestamp === null) return '--';

  const now = new Date();
  const date = new Date(timestamp);

  // Check if same day
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }

  // Calculate days ago
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 14) {
    return 'last week';
  }
  return `${Math.floor(diffDays / 7)}w ago`;
}

const IndustrialHeader: React.FC<Props> = ({ stats, lastUpdated }) => {
  return (
    <div className="bg-[#261a15] border-b-4 border-brass-700 p-6 relative overflow-hidden shadow-lg z-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #c69519 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>
      
      {/* Glow Effect from top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-amber-500/50 blur-xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Branding */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-brass-gradient rounded-full flex items-center justify-center shadow-glow-brass border-[3px] border-[#3d2616] ring-1 ring-brass-500/50">
            <Truck className="w-10 h-10 text-[#2a1d18]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-display text-brass-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">
              GAS TOWN <span className="text-industrial-400 font-serif font-bold italic text-3xl">Convoys</span>
            </h1>
            <div className="h-px w-full bg-gradient-to-r from-brass-800 to-transparent my-1"></div>
            <p className="text-brass-700 font-mono text-xs uppercase tracking-[0.2em] shadow-black drop-shadow-sm">
              Refinery & Transport Division
            </p>
          </div>
        </div>

        {/* Stats Panel - Styled like a control plate */}
        <div className="flex gap-4 md:gap-8 bg-[#1f1511] p-1.5 rounded-lg border border-brass-800 shadow-panel-inset">
          <div className="flex gap-4 md:gap-8 bg-[#2a1d18] border border-white/5 p-3 rounded shadow-inner">
          
            {/* Guzzoline Gauge - Completion Rate */}
            <div className="flex flex-col items-center gap-1" title="Completion rate: completed items / total items across all convoys (from gt convoy status)">
              <div className="text-brass-600 text-[10px] font-mono uppercase tracking-widest mb-1">Guzzoline</div>
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-600/80" />
                <span className="text-xl font-mono text-brass-100 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">{stats.completionRate}%</span>
              </div>
              <div className="w-16 h-1.5 bg-[#140d0a] rounded-full mt-1 border border-[#38251b]">
                <div className="h-full bg-emerald-700 rounded-full relative overflow-hidden" style={{ width: `${stats.completionRate}%` }}>
                   <div className="absolute inset-0 bg-white/20"></div>
                </div>
              </div>
            </div>

            <div className="w-px bg-brass-900/50 h-10 self-center border-r border-white/5"></div>

            {/* Activity Gauge - Unique Polecats */}
            <div className="flex flex-col items-center gap-1" title="Count of unique polecats (*/polecats/*) assigned to open convoy issues">
              <div className="text-brass-600 text-[10px] font-mono uppercase tracking-widest mb-1">Polecats</div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-copper-400" />
                <span className="text-xl font-mono text-brass-100 drop-shadow-[0_0_5px_rgba(224,118,77,0.3)]">{stats.activePolecats}</span>
              </div>
               <div className="text-[9px] text-industrial-500 font-mono">ON SHIFT</div>
            </div>

             <div className="w-px bg-brass-900/50 h-10 self-center border-r border-white/5"></div>

            {/* Crew Count - Unique Crew Members */}
            <div className="flex flex-col items-center gap-1" title="Count of unique crew members (*/crew/*) assigned to open convoy issues">
              <div className="text-brass-600 text-[10px] font-mono uppercase tracking-widest mb-1">Crew</div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brass-500" />
                <span className="text-xl font-mono text-brass-100 drop-shadow-[0_0_5px_rgba(198,149,25,0.3)]">{stats.activeCrew}</span>
              </div>
               <div className="text-[9px] text-industrial-500 font-mono">ASSIGNED</div>
            </div>

             <div className="w-px bg-brass-900/50 h-10 self-center border-r border-white/5"></div>

            {/* Last Updated */}
            <div className="flex flex-col items-center gap-1" title="When convoy data last changed">
               <div className="text-brass-600 text-[10px] font-mono uppercase tracking-widest mb-1">Updated</div>
               <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-industrial-500" />
                <span className="text-lg font-mono text-brass-200">{formatLastUpdated(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative rivets on corners */}
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full rivet"></div>
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full rivet"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full rivet"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full rivet"></div>
    </div>
  );
};

export default IndustrialHeader;