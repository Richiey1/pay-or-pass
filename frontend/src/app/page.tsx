"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS } from "@/lib/constants/contracts";
import { 
  Swords, 
  Shield, 
  Trophy, 
  Zap, 
  User,
  ArrowRight,
  TrendingUp,
  Skull,
  LogOut,
  Crosshair
} from "lucide-react";

export default function LosslessArenaHome() {
  const { address, isConnected } = useAccount();
  
  // Game State Hooks
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  
  // Contract Reads
  const { data: totalStakeData, refetch: refetchTotalStake } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "totalArenaStake",
  });
  
  const { data: currentPrizeData, refetch: refetchPrize } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "getCurrentPrizePool",
  });
  
  const { data: activePlayersData, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "getActivePlayers",
  });

  const { data: myGladiatorData, refetch: refetchMyGladiator } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "gladiators",
    args: address ? [address] : undefined,
  });

  // Derived State
  const totalStake = totalStakeData ? formatEther(totalStakeData as bigint) : "0.0";
  const currentPrize = currentPrizeData ? formatEther(currentPrizeData as bigint) : "0.000";
  const activePlayers = (activePlayersData as string[]) || [];
  
  const myGladiator = myGladiatorData as any;
  const isInArena = myGladiator ? myGladiator[6] : false; // isActive
  const myWins = myGladiator ? Number(myGladiator[3]) : 0;
  const myLosses = myGladiator ? Number(myGladiator[4]) : 0;
  const myYieldWon = myGladiator ? formatEther(myGladiator[2]) : "0.0";

  // Contract Writes
  const { writeContractAsync } = useWriteContract();
  
  const handleEnterArena = async () => {
    if (!isConnected) return;
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "enterArena",
        value: parseEther("10"),
      });
      // Poll refetch
      setTimeout(() => { refetchMyGladiator(); refetchPlayers(); refetchTotalStake(); }, 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFight = async () => {
    if (!isConnected || !selectedOpponent) return;
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "fight",
        args: [selectedOpponent],
      });
      setTimeout(() => { refetchMyGladiator(); refetchPrize(); }, 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExitArena = async () => {
    if (!isConnected) return;
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "exitArena",
      });
      setTimeout(() => { refetchMyGladiator(); refetchPlayers(); refetchTotalStake(); }, 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Live polling for prize pool
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPrize();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchPrize]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 md:p-8 pt-24 sm:pt-28 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Swords className="w-3 h-3 animate-pulse" /> Lossless Combat Protocol
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-transparent bg-clip-text bg-gradient-to-br from-white to-red-600">
            LOSSLESS<br/>ARENA
          </h1>
          <p className="text-red-200/50 font-bold uppercase text-sm tracking-widest max-w-2xl mx-auto">
            Stake 10 CELO to enter the colosseum. Fight for the accrued DeFi yield of the entire arena. 100% Principal Protection.
          </p>
        </div>

        {/* Global Stats HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-sm font-black text-white/50 tracking-widest">GLOBAL PRIZE POOL</div>
            <div className="text-4xl font-black text-red-500">{currentPrize} <span className="text-xl text-red-500/50">CELO</span></div>
            <div className="text-xs text-white/30 mt-1">Accruing at 8% APY</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center">
            <Shield className="w-8 h-8 text-orange-500 mb-2" />
            <div className="text-sm font-black text-white/50 tracking-widest">TOTAL VALUE LOCKED</div>
            <div className="text-4xl font-black text-white">{totalStake} <span className="text-xl text-white/50">CELO</span></div>
            <div className="text-xs text-white/30 mt-1">100% Principal Safe</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center">
            <User className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-sm font-black text-white/50 tracking-widest">ACTIVE GLADIATORS</div>
            <div className="text-4xl font-black text-white">{activePlayers.length}</div>
            <div className="text-xs text-white/30 mt-1">Currently in combat</div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* My Gladiator Profile (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-b from-red-900/20 to-black border border-red-500/30 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            
            <h2 className="text-2xl font-black italic tracking-widest mb-6">MY GLADIATOR</h2>
            
            {!isConnected ? (
              <div className="text-white/50 text-sm font-medium mt-10">Connect wallet to view your profile.</div>
            ) : !isInArena ? (
              <div className="space-y-6 w-full mt-4">
                <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/10 bg-white/5 flex items-center justify-center">
                  <User className="w-10 h-10 text-white/20" />
                </div>
                <div className="text-white/50 text-sm">You are currently sitting in the stands.</div>
                <button 
                  onClick={handleEnterArena}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black p-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                >
                  STAKE 10 CELO TO ENTER <Swords className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-500 bg-red-500/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                  <Skull className="w-10 h-10 text-red-500" />
                  <div className="absolute -bottom-2 -right-2 bg-red-600 text-[10px] font-black px-2 py-1 rounded border border-black">ACTIVE</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50 font-black">RECORD</div>
                    <div className="text-xl font-black text-white">{myWins}W - {myLosses}L</div>
                  </div>
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50 font-black">YIELD WON</div>
                    <div className="text-xl font-black text-emerald-400">{myYieldWon}</div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={handleExitArena}
                    className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white/70 hover:text-white font-black p-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" /> WITHDRAW PRINCIPAL & EXIT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* The Arena (8 cols) */}
          <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-black italic tracking-widest mb-6 flex items-center gap-2">
              <Crosshair className="w-6 h-6 text-red-500" /> SELECT OPPONENT
            </h2>
            
            <div className="space-y-4">
              {activePlayers.length === 0 ? (
                <div className="text-white/40 italic py-10 text-center">The arena is empty. Be the first to enter.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePlayers.map((playerAddr) => {
                    if (playerAddr.toLowerCase() === address?.toLowerCase()) return null;
                    const isSelected = selectedOpponent === playerAddr;
                    return (
                      <div 
                        key={playerAddr}
                        onClick={() => setSelectedOpponent(playerAddr)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected 
                            ? "bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-red-500' : 'bg-white/10'}`}>
                            <User className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/50'}`} />
                          </div>
                          <div>
                            <div className="font-mono text-sm font-bold text-white/80">
                              {playerAddr.slice(0,6)}...{playerAddr.slice(-4)}
                            </div>
                            <div className="text-[10px] text-white/40 font-black tracking-widest mt-1">GLADIATOR</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Combat Execution */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <button
                onClick={handleFight}
                disabled={!isInArena || !selectedOpponent}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black p-5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl shadow-[0_0_40px_rgba(220,38,38,0.3)]"
              >
                <Swords className="w-6 h-6" /> INITIATE COMBAT
              </button>
              {!isInArena && (
                <div className="text-center text-xs text-red-400 font-bold mt-3">You must be in the arena to fight.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
