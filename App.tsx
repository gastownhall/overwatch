import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import IndustrialHeader from './components/IndustrialHeader';
import ConvoyRow from './components/ConvoyRow';
import ConvoyCard from './components/ConvoyCard';
import { INITIAL_STATS } from './constants';
import { RefreshCcw, ChevronDown } from 'lucide-react';
import { Convoy, ConvoyStatus, GtConvoyStatus, transformGtConvoy, calculateStats } from './types';

type ViewMode = 'list' | 'grid';
type FilterMode = 'all' | ConvoyStatus;

const WS_URL = 'ws://localhost:3001';

interface WsMessage {
  type: string;
  data: GtConvoyStatus[];
}

export default function App() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [convoys, setConvoys] = useState<Convoy[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterMode>('all');
  const wsRef = useRef<WebSocket | null>(null);
  const prevDataRef = useRef<string>('');

  const filteredConvoys = useMemo(() => {
    if (filter === 'all') return convoys;
    return convoys.filter((c) => c.status === filter);
  }, [convoys, filter]);

  const filterCounts = useMemo(() => ({
    RUNNING: convoys.filter((c) => c.status === 'RUNNING').length,
    STALE: convoys.filter((c) => c.status === 'STALE').length,
    COMPLETE: convoys.filter((c) => c.status === 'COMPLETE').length,
  }), [convoys]);

  const handleConvoyData = useCallback((data: GtConvoyStatus[]) => {
    setConvoys(data.map(transformGtConvoy));
    setStats(calculateStats(data));

    // Update lastUpdated when data changes (including first load)
    const dataFingerprint = JSON.stringify(data);
    if (dataFingerprint !== prevDataRef.current) {
      prevDataRef.current = dataFingerprint;
      setLastUpdated(Date.now());
    }

    setHasReceivedData(true);
    setIsRefreshing(false);
  }, []);

  const requestRefresh = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending refresh request');
      setIsRefreshing(true);
      wsRef.current.send(JSON.stringify({ type: 'refresh' }));
    } else {
      console.log('WebSocket not connected, cannot refresh');
    }
  }, []);

  useEffect(() => {
    const connect = (): void => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setError(null);
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as WsMessage;
        if (message.type === 'convoys') {
          handleConvoyData(message.data);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [handleConvoyData]);

  return (
    <div className="min-h-screen bg-industrial-950 text-industrial-200 font-sans selection:bg-amber-500/30 selection:text-amber-100 flex justify-center p-0 md:p-4 lg:p-8">
      
      {/* Main Machine Container */}
      <div className="w-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        
        {/* Outer Frame Decoration */}
        <div className="absolute -inset-1 md:-inset-3 bg-[#2b1d16] rounded-xl border border-[#3e2b20] shadow-2xl pointer-events-none z-0">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 12px)' }}></div>
          {/* Corner Bolts */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-gradient-to-br from-brass-400 to-brass-800 shadow-md border border-black opacity-80"></div>
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-to-br from-brass-400 to-brass-800 shadow-md border border-black opacity-80"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-gradient-to-br from-brass-400 to-brass-800 shadow-md border border-black opacity-80"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-gradient-to-br from-brass-400 to-brass-800 shadow-md border border-black opacity-80"></div>
        </div>

        {/* Inner Content Area */}
        <div className="relative z-10 bg-industrial-900 rounded-lg border-2 border-brass-700 overflow-hidden flex flex-col min-h-[80vh] shadow-inner-depth">
          
          <IndustrialHeader stats={stats} lastUpdated={lastUpdated} />

          {/* Controls Bar */}
          <div className="bg-industrial-800 border-b border-brass-900 p-3 flex justify-between items-center px-6 relative">
             <div className="absolute inset-0 panel-texture opacity-30 pointer-events-none"></div>
            <div className="flex gap-4 text-xs font-mono uppercase text-industrial-400 tracking-wider relative z-10">
               {/* View Mode Selector */}
               <Menu as="div" className="relative">
                  <MenuButton className="flex items-center gap-1 hover:text-brass-300 transition-colors">
                    [View: {viewMode}]
                    <ChevronDown size={12} />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom start"
                    className="z-50 mt-1 bg-industrial-800 border border-brass-900 rounded shadow-lg min-w-[100px] origin-top-left transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                  >
                    <MenuItem>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${viewMode === 'list' ? 'text-brass-300' : ''}`}
                      >
                        List
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${viewMode === 'grid' ? 'text-brass-300' : ''}`}
                      >
                        Grid
                      </button>
                    </MenuItem>
                  </MenuItems>
               </Menu>

               {/* Filter Selector */}
               <Menu as="div" className="relative">
                  <MenuButton className="flex items-center gap-1 hover:text-brass-300 transition-colors">
                    [Filter: {filter}]
                    <ChevronDown size={12} />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom start"
                    className="z-50 mt-1 bg-industrial-800 border border-brass-900 rounded shadow-lg min-w-[120px] origin-top-left transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                  >
                    <MenuItem>
                      <button
                        onClick={() => setFilter('all')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${filter === 'all' ? 'text-brass-300' : ''}`}
                      >
                        All ({convoys.length})
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => setFilter('RUNNING')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${filter === 'RUNNING' ? 'text-brass-300' : ''}`}
                      >
                        Running ({filterCounts.RUNNING})
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => setFilter('STALE')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${filter === 'STALE' ? 'text-brass-300' : ''}`}
                      >
                        Stale ({filterCounts.STALE})
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => setFilter('COMPLETE')}
                        className={`block w-full px-3 py-2 text-left data-[focus]:bg-industrial-700 ${filter === 'COMPLETE' ? 'text-brass-300' : ''}`}
                      >
                        Complete ({filterCounts.COMPLETE})
                      </button>
                    </MenuItem>
                  </MenuItems>
               </Menu>
            </div>

            <div className="flex gap-3 relative z-10">
               <button
                onClick={requestRefresh}
                className={`p-2 rounded bg-industrial-700/50 border border-brass-900 text-brass-500 hover:text-brass-200 hover:bg-industrial-600 transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
                title="Request refresh from server (sends WebSocket message)"
               >
                 <RefreshCcw size={18} />
               </button>
            </div>
          </div>

          {/* Table Header - only show in list view */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#241914] border-b border-brass-800 text-xs font-mono uppercase tracking-widest text-brass-600 sticky top-0 z-20 shadow-md">
              <div className="col-span-2 md:col-span-1 text-center">Status</div>
              <div className="col-span-10 md:col-span-6">Manifest / Description</div>
              <div className="col-span-6 md:col-span-2">Throughput</div>
              <div className="col-span-6 md:col-span-3 text-right">Activity Log</div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto relative bg-[#1a120e]">
             {/* Steam texture overlay */}
             <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay" 
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")' }}>
             </div>

             <div className={`relative z-10 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4' : 'flex flex-col'}`}>
               {error && (
                 <div className="p-4 m-4 bg-red-900/30 border border-red-700 rounded text-red-300 font-mono text-sm col-span-full">
                   {error}
                 </div>
               )}
               {!hasReceivedData && !error && (
                 <div className="p-8 text-industrial-400 font-mono text-sm text-center col-span-full">
                   Fetching Gas Town updates...
                 </div>
               )}
               {hasReceivedData && convoys.length === 0 && !error && (
                 <div className="p-8 text-industrial-500 font-mono text-sm text-center col-span-full">
                   All's quiet in Gas Town
                 </div>
               )}
               {hasReceivedData && filteredConvoys.length === 0 && convoys.length > 0 && (
                 <div className="p-8 text-industrial-500 font-mono text-sm text-center col-span-full">
                   No convoys match the current filter.
                 </div>
               )}
               {viewMode === 'list'
                 ? filteredConvoys.map((convoy, idx) => (
                     <ConvoyRow key={convoy.id} convoy={convoy} index={idx} />
                   ))
                 : filteredConvoys.map((convoy) => (
                     <ConvoyCard key={convoy.id} convoy={convoy} />
                   ))
               }
             </div>

             {/* Bottom Spacer with decorative pipe element */}
             <div className="h-16 border-t border-industrial-800 flex flex-col items-center justify-center opacity-60 mt-8 relative overflow-hidden">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-brass-700 to-transparent mb-2"></div>
                <div className="text-[10px] font-mono text-industrial-600 uppercase tracking-[0.3em]">End of Line</div>
                {/* Visual Gears decoration */}
                <div className="absolute -bottom-10 -right-10 w-24 h-24 border-4 border-industrial-800 rounded-full border-dashed opacity-20 animate-[spin_10s_linear_infinite]"></div>
             </div>
          </div>

          {/* Footer */}
          <div className="bg-[#120b09] border-t border-brass-800 p-2 px-6 flex justify-between items-center text-[10px] uppercase font-mono text-industrial-500 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-20">
             <span title="WebSocket connection status to API server (ws://localhost:3001)">
               System: <span className={isConnected ? "text-emerald-600/70" : "text-red-600/70"}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
             </span>
             <span className="text-brass-800" title="Version from package.json">Gas Town Operations v0.1.0</span>
             <span title="Active when any convoy has in-progress work (open with incomplete items)">
               Refinery: <span className={stats.hasRunningConvoys ? "text-amber-700/70" : "text-industrial-600"}>{stats.hasRunningConvoys ? 'ACTIVE' : 'IDLE'}</span>
             </span>
          </div>

        </div>

        {/* Decorative Pipes (Left and Right) - hidden on mobile */}
        <div className="absolute -left-3 md:-left-5 top-16 bottom-16 w-3 bg-gradient-to-r from-[#2a1d18] via-[#5c4033] to-[#2a1d18] rounded-full border border-black hidden lg:block shadow-xl z-20"></div>
        <div className="absolute -right-3 md:-right-5 top-16 bottom-16 w-3 bg-gradient-to-r from-[#5c4033] via-[#8c5e3c] to-[#5c4033] rounded-full border border-black hidden lg:block shadow-xl z-20"></div>

      </div>
    </div>
  );
}