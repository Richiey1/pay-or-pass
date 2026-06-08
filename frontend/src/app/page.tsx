"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useDisconnect } from "wagmi";
import { parseEther, formatEther } from "viem";
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS } from "@/lib/constants/contracts";
import { useAppKit } from "@reown/appkit/react";
import AdminPanel from "@/components/AdminPanel";
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
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  
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

  const { data: entryFeeData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "entryFee",
  });

  const { data: isAdminData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
  });

  // Derived State
  const totalStake = totalStakeData ? formatEther(totalStakeData as bigint) : "0.0";
  const currentPrize = currentPrizeData ? formatEther(currentPrizeData as bigint) : "0.000";
  const activePlayers = (activePlayersData as string[]) || [];
  const entryFee = entryFeeData ? formatEther(entryFeeData as bigint) : "10.0";
  const isAdmin = isAdminData === true;
  
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
        value: entryFeeData as bigint || parseEther("10"),
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
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative flex flex-col">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600 blur-[150px] rounded-full" />
      </div>

      {/* Header Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 md:p-6 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center">
            <Swords className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-red-500">
            PAYOR<span className="text-red-600 font-black">PASS</span>
          </span>
        </div>
        
        {isConnected && (
          <button
            onClick={() => disconnect()}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-500 transition-all cursor-pointer shadow-lg"
            title="Disconnect Wallet"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-2xl mx-auto space-y-8 my-auto">
            
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] text-transparent bg-clip-text bg-gradient-to-br from-white to-red-600">
              PAYOR<br/>PASS
            </h1>
            
            <p className="text-red-200/50 font-bold uppercase text-sm tracking-widest max-w-2xl leading-relaxed">
              An Elite Retail Onboarding Play. We abstract away complex DeFi yield generation behind a fun, risk-free arcade game to drive massive Daily Active Users. Stake {entryFee} CELO, fight for the accrued yield, keep your principal 100% safe.
            </p>
            
            <button
              onClick={() => open()}
              className="w-full max-w-md bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black p-5 rounded-2xl transition-all text-xl shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <Zap className="w-6 h-6 animate-bounce" /> START GAME
            </button>
          </div>
        ) : (
          <div className="space-y-12 py-6">
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
                
                {!isInArena ? (
                  <div className="space-y-6 w-full mt-4">
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/10 bg-white/5 overflow-hidden relative flex items-center justify-center shadow-lg">
                      <img
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=Gladiator"
                        alt="Gladiator Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-white/50 text-sm">You are currently sitting in the stands.</div>
                    <button 
                      onClick={handleEnterArena}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black p-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      STAKE {entryFee} CELO TO ENTER <Swords className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-500 overflow-hidden bg-red-500/10 relative shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
                        alt="My Gladiator"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-red-600 text-[10px] font-black px-2 py-1 rounded border border-black z-10">ACTIVE</div>
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
                        className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white/70 hover:text-white font-black p-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
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
                  ) : activePlayers.length === 1 && address && activePlayers[0].toLowerCase() === address.toLowerCase() ? (
                    <div className="text-white/40 italic py-10 text-center">You are currently the only player in the arena. Waiting for opponents to enter...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePlayers.map((playerAddr) => {
                        if (playerAddr.toLowerCase() === address?.toLowerCase()) return null;
                        const isSelected = selectedOpponent === playerAddr;
                        return (
                          <div 
                            key={playerAddr}
                            onClick={() => setSelectedOpponent(playerAddr)}
                            className={`group cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                              isSelected 
                                ? "bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
                                : "bg-white/5 border-white/10 hover:border-red-500/30 hover:bg-red-950/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all ${isSelected ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-white/10 bg-white/5'}`}>
                                <img
                                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${playerAddr}`}
                                  alt="Gladiator"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-mono text-sm font-bold text-white/80">
                                  {playerAddr.slice(0,6)}...{playerAddr.slice(-4)}
                                </div>
                                <div className="text-[10px] text-white/40 font-black tracking-widest mt-1">GLADIATOR</div>
                              </div>
                            </div>
                            <div>
                              {isSelected ? (
                                <span className="text-[9px] font-black text-red-500 px-2.5 py-1 rounded bg-red-950/30 border border-red-500/50 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                  <Crosshair className="w-3 h-3 text-red-500" /> LOCKED
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-white/30 px-2.5 py-1 rounded bg-white/5 border border-white/5 uppercase tracking-widest group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                                  SELECT
                                </span>
                              )}
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
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black p-5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl shadow-[0_0_40px_rgba(220,38,38,0.3)] cursor-pointer"
                  >
                    <Swords className="w-6 h-6" /> INITIATE COMBAT
                  </button>
                  {!isInArena && (
                    <div className="text-center text-xs text-red-400 font-bold mt-3">You must be in the arena to fight.</div>
                  )}
                </div>
              </div>

            </div>
            
            {/* Owner Governance Admin Console */}
            {isAdmin && (
              <div className="mt-8">
                <AdminPanel />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
