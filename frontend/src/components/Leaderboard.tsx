import React, { useState } from 'react';
import { Trophy, Swords, Medal, TrendingUp, Flame } from 'lucide-react';

interface PlayerData {
  address: string;
  yieldWon: number;
  wins: number;
  losses: number;
  currentStreak: number;
  longestStreak: number;
  totalFights: number;
  seasonRank: number;
}

interface LeaderboardProps {
  playersData: PlayerData[];
  isLoading: boolean;
  tokenSymbol: string;
}

export function Leaderboard({ playersData, isLoading, tokenSymbol }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'yield' | 'wins' | 'streak' | 'fights'>('yield');

  const players = playersData.map((data) => {
    const winRate = (data.wins + data.losses) > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0;
    return { ...data, winRate };
  });

  if (activeTab === 'yield') {
    players.sort((a, b) => b.yieldWon - a.yieldWon);
  } else if (activeTab === 'wins') {
    players.sort((a, b) => b.wins - a.wins);
  } else if (activeTab === 'streak') {
    players.sort((a, b) => b.longestStreak - a.longestStreak);
  } else if (activeTab === 'fights') {
    players.sort((a, b) => b.totalFights - a.totalFights);
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md font-mono mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black italic tracking-widest flex items-center gap-2">
          <Trophy className="text-yellow-500 w-6 h-6" /> HALL OF FAME
        </h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('yield')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'yield' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> TOP YIELD
          </button>
          <button 
            onClick={() => setActiveTab('wins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'wins' ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Medal className="w-3 h-3" /> MOST WINS
          </button>
          <button 
            onClick={() => setActiveTab('streak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'streak' ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3" /> STREAK
          </button>
          <button 
            onClick={() => setActiveTab('fights')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'fights' ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Swords className="w-3 h-3" /> MOST FIGHTS
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
                  idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                  idx === 1 ? 'bg-gray-300 text-black shadow-[0_0_10px_rgba(209,213,219,0.5)]' : 
                  idx === 2 ? 'bg-orange-700 text-white shadow-[0_0_10px_rgba(194,65,12,0.5)]' : 'bg-white/10 text-white/50'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-black overflow-hidden flex-shrink-0 relative">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.address}`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white/90">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </div>
                    <div className="text-[10px] text-white/40 font-black tracking-widest mt-1">SEASON RANK #{player.seasonRank}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-right">
                {activeTab === 'streak' && (
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-white/50 font-black tracking-widest">LONGEST STREAK</div>
                    <div className="font-bold text-sm text-orange-400 flex items-center justify-end gap-1"><Flame className="w-3 h-3"/> {player.longestStreak}</div>
                  </div>
                )}
                {activeTab === 'fights' && (
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-white/50 font-black tracking-widest">TOTAL FIGHTS</div>
                    <div className="font-bold text-sm text-purple-400 flex items-center justify-end gap-1"><Swords className="w-3 h-3"/> {player.totalFights}</div>
                  </div>
                )}
                {(activeTab === 'wins' || activeTab === 'yield') && (
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-white/50 font-black tracking-widest">RECORD</div>
                    <div className="font-bold text-sm text-white/80">{player.wins}W - {player.losses}L</div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-yellow-500/50 font-black tracking-widest">YIELD WON</div>
                  <div className="font-bold text-sm text-yellow-500">{player.yieldWon.toFixed(4)} {tokenSymbol}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
