'use client';

import React, { useState } from 'react';
import { Zap, Shield, TrendingUp, Skull } from 'lucide-react';

export default function CombatArena() {
  const [choice, setChoice] = useState<'ATTACK' | 'DEFEND' | 'INVEST' | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'COMMITTED' | 'RESOLVING' | 'WIN' | 'LOSS' | 'CLASH'>('IDLE');

  const handleCommit = () => {
    setStatus('COMMITTED');
    setTimeout(() => {
      setStatus('RESOLVING');
      setTimeout(() => {
        const outcomes = ['WIN', 'LOSS', 'CLASH'] as const;
        setStatus(outcomes[Math.floor(Math.random() * outcomes.length)]);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 border-2 border-red-900/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] font-mono">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-gray-900 to-blue-950 p-6 text-center border-b border-gray-800">
        <h2 className="text-3xl font-black text-white tracking-widest flex items-center justify-center gap-4">
          <Skull className="text-red-500" size={32} />
          THE ARENA
          <Skull className="text-blue-500" size={32} />
        </h2>
        <div className="text-gray-400 mt-2 text-sm tracking-widest">PHASE 2 COMBAT PROTOCOL</div>
      </div>

      <div className="p-8">
        {/* Battle Stage */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="text-center w-1/3">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-500 bg-red-950 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-4">
              <span className="text-3xl">🥷</span>
            </div>
            <div className="font-bold text-white text-lg">GLADIATOR (YOU)</div>
            <div className="text-red-400">Yield Won: 1.5 CELO</div>
          </div>

          <div className="text-center w-1/3 text-4xl font-black italic text-gray-700 animate-pulse">
            {status === 'IDLE' ? 'VS' : status === 'COMMITTED' ? 'WAITING...' : status === 'RESOLVING' ? 'CLASH!' : status}
          </div>

          <div className="text-center w-1/3">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 bg-blue-950 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <div className="font-bold text-white text-lg">OPPONENT</div>
            <div className="text-blue-400">Yield Won: 0.8 CELO</div>
          </div>
        </div>

        {/* Combat Controls */}
        <div className="bg-gray-950 p-6 rounded-lg border border-gray-800">
          <h3 className="text-center text-gray-400 mb-6 font-bold tracking-widest">SELECT YOUR TACTIC</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button 
              onClick={() => setChoice('ATTACK')}
              disabled={status !== 'IDLE' && status !== 'WIN' && status !== 'LOSS' && status !== 'CLASH'}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 'ATTACK' ? 'border-red-500 bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gray-800 hover:border-red-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Zap className={choice === 'ATTACK' ? 'text-red-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 'ATTACK' ? 'text-red-400' : 'text-gray-500'}`}>ATTACK</div>
              <div className="text-xs text-gray-600 text-center">Beats Invest<br/>Loses to Defend</div>
            </button>

            <button 
              onClick={() => setChoice('DEFEND')}
              disabled={status !== 'IDLE' && status !== 'WIN' && status !== 'LOSS' && status !== 'CLASH'}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 'DEFEND' ? 'border-blue-500 bg-blue-950/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-gray-800 hover:border-blue-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Shield className={choice === 'DEFEND' ? 'text-blue-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 'DEFEND' ? 'text-blue-400' : 'text-gray-500'}`}>DEFEND</div>
              <div className="text-xs text-gray-600 text-center">Beats Attack<br/>Loses to Invest</div>
            </button>

            <button 
              onClick={() => setChoice('INVEST')}
              disabled={status !== 'IDLE' && status !== 'WIN' && status !== 'LOSS' && status !== 'CLASH'}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 'INVEST' ? 'border-green-500 bg-green-950/50 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-gray-800 hover:border-green-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <TrendingUp className={choice === 'INVEST' ? 'text-green-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 'INVEST' ? 'text-green-400' : 'text-gray-500'}`}>INVEST</div>
              <div className="text-xs text-gray-600 text-center">Beats Defend<br/>Loses to Attack</div>
            </button>
          </div>

          <div className="text-center">
            {status === 'WIN' || status === 'LOSS' || status === 'CLASH' ? (
              <button 
                onClick={() => { setStatus('IDLE'); setChoice(null); }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded font-bold transition"
              >
                FIGHT AGAIN
              </button>
            ) : (
              <button 
                onClick={handleCommit}
                disabled={!choice || status !== 'IDLE'}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-12 py-4 rounded font-black tracking-widest text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:shadow-none"
              >
                COMMIT TACTIC (HASH)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
