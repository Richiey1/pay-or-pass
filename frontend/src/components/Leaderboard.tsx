import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Medal, TrendingUp } from 'lucide-react';
import { useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS, FUNCTION_NAMES } from '@/lib/constants/contracts';

interface LeaderboardProps {
  activePlayers: string[];
}

export function Leaderboard({ activePlayers }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'yield' | 'wins'>('yield');

  const { data: gladiatorData, isLoading } = useReadContracts({
    contracts: activePlayers.map((player) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: LOSSLESS_ARENA_ABI,
      functionName: FUNCTION_NAMES.GLADIATORS,
      args: [player as `0x${string}`],
    })),
    query: {
      enabled: activePlayers.length > 0,
    }
  });

  const players = activePlayers.map((address, index) => {
    const data = gladiatorData?.[index]?.result as any;
    const yieldWon = data ? parseFloat(formatEther(data[2])) : 0;
    const wins = data ? Number(data[3]) : 0;
    const losses = data ? Number(data[4]) : 0;
    const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    return { address, yieldWon, wins, losses, winRate };
  });

  if (activeTab === 'yield') {
    players.sort((a, b) => b.yieldWon - a.yieldWon);
  } else {
    players.sort((a, b) => b.wins - a.wins);
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md font-mono mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black italic tracking-widest flex items-center gap-2">
          <Trophy className="text-yellow-500 w-6 h-6" /> HALL OF FAME
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('yield')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'yield' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            TOP YIELD
          </button>
          <button 
            onClick={() => setActiveTab('wins')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'wins' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            MOST WINS
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-10 text-white/40 italic">No gladiators to display.</div>
      ) : (
        <div className="space-y-3">
          {players.slice(0, 10).map((player, idx) => (
            <div key={player.address} className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                  idx === 0 ? 'bg-yellow-500 text-black' : 
                  idx === 1 ? 'bg-gray-300 text-black' : 
                  idx === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-black overflow-hidden flex-shrink-0">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.address}`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white/90">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </div>
                    <div className="text-[10px] text-white/40 font-black tracking-widest mt-1">GLADIATOR</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <div className="text-[10px] text-white/50 font-black tracking-widest">RECORD</div>
                  <div className="font-bold text-sm text-white/80">{player.wins}W - {player.losses}L</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-white/50 font-black tracking-widest">WIN RATE</div>
                  <div className="font-bold text-sm text-white/80">{player.winRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-yellow-500/50 font-black tracking-widest">YIELD WON</div>
                  <div className="font-bold text-sm text-yellow-500">{player.yieldWon.toFixed(4)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
