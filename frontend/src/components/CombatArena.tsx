import React, { useState, useEffect } from 'react';
import { Zap, Shield, TrendingUp, Skull, Lock, Eye } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS, FUNCTION_NAMES } from '@/lib/constants/contracts';

interface CombatArenaProps {
  myAddress: string | undefined;
  opponentAddress: string | null;
  currentFightId: bigint | undefined;
  currentFightData: any;
  onInitiateFight: (choice: number) => void;
  onJoinFight: (fightId: bigint, choice: number) => void;
  onRevealChoice: (fightId: bigint) => void;
  onClearOpponent: () => void;
}

export default function CombatArena({
  myAddress,
  opponentAddress,
  currentFightId,
  currentFightData,
  onInitiateFight,
  onJoinFight,
  onRevealChoice,
  onClearOpponent
}: CombatArenaProps) {
  const [choice, setChoice] = useState<number | null>(null);

  // Derive state from currentFightData
  let isMyTurn = true;
  let isWaiting = false;
  let isReadyToReveal = false;
  let isResolved = false;
  let activeOpponent = opponentAddress;
  let myCommit = "";
  let oppCommit = "";

  if (currentFightId && currentFightData) {
    const [p1, p2, c1, c2, ch1, ch2, startTime, resolved] = currentFightData;
    isResolved = resolved;
    
    if (myAddress?.toLowerCase() === p1.toLowerCase()) {
      activeOpponent = p2;
      myCommit = c1;
      oppCommit = c2;
    } else {
      activeOpponent = p1;
      myCommit = c2;
      oppCommit = c1;
    }

    const emptyCommit = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const myCommitExists = myCommit !== emptyCommit;
    const oppCommitExists = oppCommit !== emptyCommit;

    if (myCommitExists && !oppCommitExists) {
      isWaiting = true;
      isMyTurn = false;
    } else if (!myCommitExists && oppCommitExists) {
      isMyTurn = true;
    } else if (myCommitExists && oppCommitExists && !resolved) {
      isReadyToReveal = true;
      isMyTurn = false;
    }
  }

  // Fetch opponent stats
  const { data: opponentGladiatorData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GLADIATORS,
    args: activeOpponent ? [activeOpponent as `0x${string}`] : undefined,
  });

  const oppData = opponentGladiatorData as any;
  const oppYield = oppData ? formatEther(oppData[2]) : "0.0";

  const handleAction = () => {
    if (isReadyToReveal && currentFightId) {
      onRevealChoice(currentFightId);
    } else if (choice) {
      if (currentFightId && currentFightId > BigInt(0)) {
        onJoinFight(currentFightId, choice);
      } else {
        onInitiateFight(choice);
      }
    }
  };

  let statusText = "VS";
  if (isWaiting) statusText = "WAITING FOR OPPONENT";
  if (isReadyToReveal) statusText = "CLASH IMMINENT - REVEAL NOW";
  if (isResolved) statusText = "FIGHT RESOLVED";

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl font-mono mt-8">
      {/* Header */}
      <div className="p-6 text-center border-b border-white/10 relative">
        <button onClick={onClearOpponent} className="absolute left-6 top-6 text-white/50 hover:text-white text-xs transition-colors">
          ← BACK TO LOBBY
        </button>
        <h2 className="text-3xl font-black text-white tracking-widest uppercase">
          COMBAT ARENA
        </h2>
      </div>

      <div className="p-8">
        {/* Battle Stage */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="text-center w-1/3">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-500 bg-red-950 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-4 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${myAddress}`} alt="Me" className="w-full h-full" />
            </div>
            <div className="font-bold text-white text-lg">YOU</div>
          </div>

          <div className="text-center w-1/3 text-xl md:text-2xl font-black italic text-gray-400 animate-pulse uppercase">
            {statusText}
          </div>

          <div className="text-center w-1/3">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 bg-blue-950 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4 overflow-hidden">
               {activeOpponent ? (
                 <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeOpponent}`} alt="Opponent" className="w-full h-full" />
               ) : (
                 <span className="text-3xl">?</span>
               )}
            </div>
            <div className="font-bold text-white text-lg">OPPONENT</div>
            {activeOpponent && <div className="text-blue-400 text-xs mt-1">Yield Won: {parseFloat(oppYield).toFixed(4)}</div>}
          </div>
        </div>

        {/* Combat Controls */}
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
          <h3 className="text-center text-white/50 mb-6 font-bold tracking-widest uppercase">
            {isReadyToReveal ? "REVEAL YOUR TACTIC" : isWaiting ? "ENEMY IS DECIDING..." : "SELECT YOUR TACTIC"}
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button 
              onClick={() => setChoice(1)}
              disabled={!isMyTurn}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 1 ? 'border-red-500 bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gray-800 hover:border-red-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Zap className={choice === 1 ? 'text-red-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 1 ? 'text-red-400' : 'text-gray-400'}`}>STRIKE</div>
              <div className="text-xs text-gray-500 text-center">Aggressive Move.<br/>Defeats Yield, blocked by Block.</div>
            </button>

            <button 
              onClick={() => setChoice(2)}
              disabled={!isMyTurn}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 2 ? 'border-blue-500 bg-blue-950/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-gray-800 hover:border-blue-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Shield className={choice === 2 ? 'text-blue-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 2 ? 'text-blue-400' : 'text-gray-400'}`}>BLOCK</div>
              <div className="text-xs text-gray-500 text-center">Defensive Move.<br/>Defeats Strike, loses to Yield.</div>
            </button>

            <button 
              onClick={() => setChoice(3)}
              disabled={!isMyTurn}
              className={`p-4 rounded border-2 transition-all flex flex-col items-center gap-3
                ${choice === 3 ? 'border-green-500 bg-green-950/50 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-gray-800 hover:border-green-900 bg-gray-900'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <TrendingUp className={choice === 3 ? 'text-green-500' : 'text-gray-500'} size={32} />
              <div className={`font-bold ${choice === 3 ? 'text-green-400' : 'text-gray-400'}`}>YIELD</div>
              <div className="text-xs text-gray-500 text-center">Greedy Move.<br/>Defeats Block, crushed by Strike.</div>
            </button>
          </div>

          <div className="text-center">
            {isResolved ? (
              <button 
                onClick={onClearOpponent}
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded font-bold transition"
              >
                RETURN TO LOBBY
              </button>
            ) : (
              <button 
                onClick={handleAction}
                disabled={(!choice && !isReadyToReveal) || isWaiting}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-12 py-4 rounded font-black tracking-widest text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:shadow-none flex items-center justify-center gap-2 mx-auto"
              >
                {isReadyToReveal ? <><Eye className="w-5 h-5"/> REVEAL TACTIC</> : <><Lock className="w-5 h-5" /> COMMIT TACTIC (HASH)</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
