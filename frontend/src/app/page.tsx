"use client";

import React, { useState, useEffect } from "react";
import { useDisconnect, useWaitForTransactionReceipt, useBalance, useReadContract } from "wagmi";
import { formatUnits, erc20Abi } from "viem";

import { useAppKit } from "@reown/appkit/react";
import AdminPanel from "@/components/AdminPanel";
import { useLosslessArena } from "@/hooks/useLosslessArena";
import { TransactionModal } from "@/components/ui/TransactionModal";
import { GameGuideModal } from "@/components/ui/GameGuideModal";
import { OpponentHUDModal } from "@/components/ui/OpponentHUDModal";
import CombatArena from "@/components/CombatArena";
import { Leaderboard } from "@/components/Leaderboard";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useCeloPrice } from "@/hooks/useCeloPrice";
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
  Crosshair,
  RefreshCw,
  Copy,
  Check,
  Info,
  Share2
} from "lucide-react";

export default function LosslessArenaHome() {
  const [copied, setCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [viewingOpponent, setViewingOpponent] = useState<string | null>(null);

  // Check if first time user
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide_PayOrPass');
    if (!hasSeenGuide) {
      setIsGuideOpen(true);
      localStorage.setItem('hasSeenGuide_PayOrPass', 'true');
    }
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [stakeAmount, setStakeAmount] = useState("");
  
  // Auto-connect inside Celo MiniPay
  const { isMiniPay } = useMiniPay();
  const celoUsdRate = useCeloPrice();
  const [currentPage, setCurrentPage] = useState(1);
  
  const SUPPORTED_TOKENS = [
    { symbol: "CELO", address: "0x471EcE3750Da237f93B8E339c536989b8978a438", decimals: 18, isStable: false },
    { symbol: "USDm", address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18, isStable: true },
    { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, isStable: true },
    { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, isStable: true },
    { symbol: "EURm", address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", decimals: 18, isStable: true },
  ];

  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  const {
    address,
    isConnected,
    totalStake,
    currentPrize,
    activePlayers,
    entryFee,
    isAdmin,
    isInArena,
    myWins,
    myLosses,
    myYieldWon,
    selectedOpponent,
    myRank,
    getPlayerRank,
    arenaPlayers,
    arenaPlayersWithData,
    setSelectedOpponent,
    currentFightId,
    currentFightData,
    enterArena,
    fight,
    joinFight,
    revealChoice,
    exitArena,
    triggerRefetch,
    balance,
    formattedBalance,
    txState,
    setTxState,
    txError,
    txHash,
    activeAction,
    isLoading,
  } = useLosslessArena(selectedToken.address, selectedToken.decimals);

  const isNativeToken = selectedToken.address === "0x471EcE3750Da237f93B8E339c536989b8978a438" || selectedToken.address === "0x0000000000000000000000000000000000000000";

  const { data: nativeBalanceData } = useBalance({
    address: address,
    query: {
      enabled: isNativeToken,
    }
  });

  const { data: erc20BalanceData } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !isNativeToken && !!address,
    }
  });

  const formattedTokenBalance = isNativeToken 
    ? (nativeBalanceData ? formatUnits(nativeBalanceData.value, selectedToken.decimals) : "0.0")
    : (erc20BalanceData ? formatUnits(erc20BalanceData as bigint, selectedToken.decimals) : "0.0");

  // Watch for transaction confirmations
  const { data: txReceipt, isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (entryFee && !stakeAmount) {
      setStakeAmount(entryFee);
    }
  }, [entryFee, stakeAmount]);

  useEffect(() => {
    if (txConfirmed) {
      setTxState("confirmed");
      triggerRefetch();
      // Reset state after a delay
      const t = setTimeout(() => {
        setTxState("idle");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [txConfirmed, triggerRefetch, setTxState]);

  return (
    <>
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative flex flex-col">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600 blur-[150px] rounded-full" />
      </div>

      {/* Header Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 md:p-6 bg-transparent">
        <div className="flex items-center">
          <img 
            src="/payorpass-logo.png" 
            alt="PayorPass Logo" 
            onClick={() => {
              if (isConnected) {
                setSelectedOpponent(null);
                setViewingOpponent(null);
                triggerRefetch();
              }
            }}
            className="h-14 sm:h-16 md:h-24 w-auto object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95" 
          />
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all cursor-pointer shadow-lg"
              title="How to Play"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={() => triggerRefetch()}
              className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/30 text-white/70 hover:text-green-500 transition-all cursor-pointer shadow-lg"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {!isMiniPay && (
              <button
                onClick={() => disconnect()}
                className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-500 transition-all cursor-pointer shadow-lg"
                title="Disconnect Wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-2xl mx-auto space-y-8 my-auto relative">
            
            {/* Guide Button for Disconnected Users */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="absolute top-0 right-0 flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all cursor-pointer shadow-lg"
              title="How to Play"
            >
              <Info className="w-5 h-5" />
            </button>

            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] text-transparent bg-clip-text bg-gradient-to-br from-white to-red-600">
              PAYOR<br/>PASS
            </h1>
            
            <div className="text-red-200/50 font-bold uppercase text-sm tracking-widest max-w-2xl leading-relaxed space-y-4">
              <p>
                The Social Lossless Arena.<br />
                Stake your assets into the gladiator pit and fight for accumulated DeFi yield using a simple Strike/Block system. If you win, you sweep the prize pool. If you lose, you keep 100% of your principal. Pure upside, zero risk.
              </p>
              <p>
                Play, refer friends for buffs, and climb the global leaderboards.
              </p>
            </div>
            
            {!isMiniPay ? (
              <button
                onClick={() => open()}
                className="w-full max-w-md bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black p-4 sm:p-5 rounded-xl sm:rounded-2xl transition-all text-lg sm:text-xl shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3"
              >
                <Zap className="w-6 h-6 animate-bounce" /> START GAME
              </button>
            ) : (
              <div className="w-full max-w-md bg-white/5 border border-white/10 text-white/50 font-black p-5 rounded-2xl text-xl uppercase tracking-widest flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 animate-pulse" /> Connecting MiniPay...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12 py-6">
            {/* Global Stats HUD */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-red-500 mb-2" />
                <div className="text-[10px] md:text-sm font-black text-white/50 tracking-widest">GLOBAL PRIZE POOL</div>
                {isLoading ? (
                  <div className="h-8 md:h-10 w-24 md:w-32 bg-white/10 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-xl md:text-4xl font-black text-red-500">{parseFloat(currentPrize).toFixed(4)} <span className="text-sm md:text-xl text-red-500/50">{selectedToken.symbol}</span></div>
                )}
                <div className="text-[9px] md:text-xs text-white/30 mt-1">Accruing at 8% APY (Est.)</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mb-2" />
                <div className="text-[10px] md:text-sm font-black text-white/50 tracking-widest">TOTAL VALUE LOCKED</div>
                {isLoading ? (
                  <div className="h-8 md:h-10 w-24 md:w-32 bg-white/10 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-xl md:text-4xl font-black text-white">{parseFloat(totalStake).toFixed(4)} <span className="text-sm md:text-xl text-white/50">{selectedToken.symbol}</span></div>
                )}
                <div className="text-[9px] md:text-xs text-white/30 mt-1">100% Principal Safe</div>
              </div>
              <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-md flex flex-col items-center justify-center text-center relative overflow-hidden">
                <User className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-2" />
                <div className="text-[10px] md:text-sm font-black text-white/50 tracking-widest">ACTIVE GLADIATORS</div>
                {isLoading ? (
                  <div className="h-8 md:h-10 w-12 md:w-16 bg-white/10 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-2xl md:text-4xl font-black text-white">{activePlayers.length}</div>
                )}
                <div className="text-[9px] md:text-xs text-white/30 mt-1">Currently in combat</div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* My Gladiator Profile (4 cols) */}
              <div className="lg:col-span-4 bg-gradient-to-b from-red-900/20 to-black border border-red-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                
                <h2 className="text-xl sm:text-2xl font-black italic tracking-widest mb-4 sm:mb-6">MY GLADIATOR</h2>
                
                {isLoading ? (
                  <div className="space-y-5 w-full mt-4 animate-pulse">
                    <div className="w-20 h-20 mx-auto rounded-full bg-white/10" />
                    <div className="h-4 w-1/2 bg-white/10 rounded mx-auto" />
                    <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl" />
                    <div className="h-10 w-full bg-red-600/20 border border-red-600/30 rounded-2xl" />
                  </div>
                ) : !isInArena ? (
                  <div className="space-y-5 w-full mt-4">
                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-white/10 bg-white/5 overflow-hidden relative flex items-center justify-center shadow-lg">
                      <img
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=Gladiator"
                        alt="Gladiator Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-mono">
                      {address ? (
                        <>
                          <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
                          <button onClick={handleCopy} className="hover:text-white transition-colors cursor-pointer" title="Copy address">
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </>
                      ) : "You are currently sitting in the stands."}
                    </div>
                    
                    <div className="text-white/40 text-[10px] italic -mt-2">You are currently sitting in the stands.</div>
                    
                    <div className="space-y-3 w-full text-left">
                      <div className="flex justify-between items-center text-[10px] text-white/50 font-black uppercase tracking-wider mb-1">
                        <span>Stake Amount</span>
                        {formattedTokenBalance && (
                          <span>
                            Bal: {parseFloat(formattedTokenBalance).toFixed(4)} {selectedToken.symbol}
                            {!selectedToken.isStable && <span className="text-red-400 font-mono ml-1">(${(parseFloat(formattedTokenBalance) * celoUsdRate).toFixed(2)})</span>}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.005"
                          className="w-full bg-black/50 border border-red-900 rounded-xl p-3 sm:p-4 text-white placeholder-red-900/50 outline-none focus:border-red-500 transition-colors text-lg font-mono text-center appearance-none"
                        />
                        <div className="relative">
                          <button 
                            onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black px-4 rounded-xl flex items-center justify-center transition-colors h-full min-w-[80px]"
                          >
                            {selectedToken.symbol}
                          </button>
                          
                          {isTokenDropdownOpen && (
                            <div className="absolute top-full mt-2 right-0 w-32 bg-black border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                              {SUPPORTED_TOKENS.map((t) => (
                                <button
                                  key={t.symbol}
                                  onClick={() => {
                                    setSelectedToken(t);
                                    setIsTokenDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm font-black transition-colors ${
                                    selectedToken.symbol === t.symbol ? 'bg-red-600/20 text-red-500' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  {t.symbol}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setStakeAmount(formattedTokenBalance || "0")}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white text-xs font-black px-3 rounded-xl transition-colors"
                        >
                          Max
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/30 font-mono pt-1">
                        <span>Est. Value: {selectedToken.isStable ? `$${stakeAmount || "0.00"} USD` : `$${((parseFloat(stakeAmount || "0")) * celoUsdRate).toFixed(2)} USD`}</span>
                        <span className="truncate max-w-[120px] sm:max-w-[150px]">Raw: {stakeAmount ? (parseFloat(stakeAmount) * Math.pow(10, selectedToken.decimals)).toLocaleString('fullwide', {useGrouping:false}) : "0"} Wei</span>
                      </div>

                      {formattedTokenBalance && stakeAmount && parseFloat(stakeAmount) > parseFloat(formattedTokenBalance) && (
                        <div className="flex flex-col items-center gap-2 mt-2">
                          <div className="text-center text-[9px] text-red-500 font-black uppercase tracking-wider">
                            ⚠️ Insufficient balance for stake
                          </div>
                          {isMiniPay && (
                            <a 
                              href="https://minipay.opera.com/add_cash"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black rounded-lg text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                            >
                              Add Cash
                            </a>
                          )}
                        </div>
                      )}
                      
                      {stakeAmount && parseFloat(stakeAmount) < parseFloat(entryFee) && (
                        <div className="text-center text-[9px] text-red-500 font-black uppercase tracking-wider mt-2">
                          ⚠️ Minimum Stake is {entryFee} CELO
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => enterArena(stakeAmount, selectedToken.address, 0)}
                      disabled={
                        !stakeAmount || 
                        isNaN(parseFloat(stakeAmount)) || 
                        parseFloat(stakeAmount) <= 0 ||
                        (formattedTokenBalance ? parseFloat(stakeAmount) > parseFloat(formattedTokenBalance) : false) ||
                        activeAction === "enter"
                      }
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black p-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs mt-4"
                    >
                      STAKE TO ENTER <Swords className="w-5 h-5" />
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
                      <div className="absolute -bottom-2 -right-2 bg-red-600 text-[10px] font-black px-2 py-1 rounded border border-black z-10 flex gap-1 items-center">
                        ACTIVE <span className="text-yellow-300">#{myRank || "-"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-mono -mt-4 mb-2">
                      <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}</span>
                      {address && (
                        <button onClick={handleCopy} className="hover:text-white transition-colors cursor-pointer" title="Copy address">
                          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-center gap-2 mb-4">
                      <a 
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm dominating the Lossless Arena in PayOrPass! Fight me: https://payorpass.xyz/?ref=${address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                      >
                        Share to earn Energy
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://payorpass.xyz/?ref=${address}`);
                          alert('Referral link copied! Share to get a defense buff.');
                        }}
                        className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                      >
                        <Share2 className="w-3 h-3" /> Invite Friend
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/50 p-3 rounded-xl border border-white/10">
                        <div className="text-[10px] text-white/50 font-black">RECORD</div>
                        <div className="text-xl font-black text-white">{myWins}W - {myLosses}L</div>
                      </div>
                      <div className="bg-black/50 p-3 rounded-xl border border-white/10">
                        <div className="text-[10px] text-white/50 font-black">YIELD WON</div>
                        <div className="text-xl font-black text-emerald-400">{parseFloat(myYieldWon).toFixed(4)} {selectedToken.symbol}</div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button 
                        onClick={exitArena}
                        className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white/70 hover:text-white font-black p-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> WITHDRAW PRINCIPAL & EXIT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* The Arena (8 cols) */}
              <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-md">
                {(currentFightId && currentFightId > BigInt(0)) || selectedOpponent ? (
                  <CombatArena
                    myAddress={address}
                    opponentAddress={selectedOpponent}
                    currentFightId={currentFightId}
                    currentFightData={currentFightData}
                    onInitiateFight={fight}
                    onJoinFight={joinFight}
                    onRevealChoice={revealChoice}
                    onClearOpponent={() => {
                      setSelectedOpponent(null);
                      triggerRefetch();
                    }}
                  />
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black italic tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                      <Crosshair className="w-6 h-6 text-red-500" /> SELECT OPPONENT
                    </h2>
                    
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10" />
                                <div className="space-y-2">
                                  <div className="h-3 w-24 bg-white/10 rounded" />
                                  <div className="h-2.5 w-12 bg-white/5 rounded" />
                                </div>
                              </div>
                              <div className="h-6 w-12 bg-white/10 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : arenaPlayers.length === 0 ? (
                        <div className="text-white/40 italic py-10 text-center">The {selectedToken.symbol} arena is empty. Be the first to enter.</div>
                      ) : arenaPlayers.length === 1 && address && arenaPlayers[0].toLowerCase() === address.toLowerCase() ? (
                        <div className="text-white/40 italic py-10 text-center">You are currently the only player in the {selectedToken.symbol} arena. Waiting for opponents to enter...</div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {arenaPlayers
                              .filter(playerAddr => playerAddr.toLowerCase() !== address?.toLowerCase())
                              .slice((currentPage - 1) * 6, currentPage * 6)
                              .map((playerAddr) => {
                              const isSelected = selectedOpponent === playerAddr;
                              return (
                                <div 
                                  key={playerAddr}
                                  onClick={() => setViewingOpponent(playerAddr)}
                                  className={`group cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                    isSelected 
                                      ? "bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
                                      : "bg-white/5 border-white/10 hover:border-red-500/30 hover:bg-red-950/10"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all shrink-0 ${isSelected ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-white/10 bg-white/5'}`}>
                                      <img
                                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${playerAddr}`}
                                        alt="Gladiator"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm text-white/90">
                                      {playerAddr.slice(0, 6)}...{playerAddr.slice(-4)}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-black tracking-widest mt-1 flex items-center gap-1">
                                      GLADIATOR <span className="text-yellow-500">#{getPlayerRank(playerAddr) || "-"}</span>
                                    </div>
                                  </div>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black text-white/30 px-2.5 py-1 rounded bg-white/5 border border-white/5 uppercase tracking-widest group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                                      VIEW
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {arenaPlayers.filter(p => p.toLowerCase() !== address?.toLowerCase()).length > 6 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                              <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                Prev
                              </button>
                              <span className="text-white/50 text-xs font-black">
                                {currentPage} / {Math.ceil(arenaPlayers.filter(p => p.toLowerCase() !== address?.toLowerCase()).length / 6)}
                              </span>
                              <button 
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(arenaPlayers.filter(p => p.toLowerCase() !== address?.toLowerCase()).length / 6), prev + 1))}
                                disabled={currentPage === Math.ceil(arenaPlayers.filter(p => p.toLowerCase() !== address?.toLowerCase()).length / 6)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>
            
            <Leaderboard playersData={arenaPlayersWithData} isLoading={isLoading} tokenSymbol={selectedToken.symbol} />
            
            {/* Owner Governance Admin Console */}
            {isAdmin && (
              <div className="mt-8">
                <AdminPanel />
              </div>
            )}
          </div>
        )}
      </main>
      <TransactionModal
        txState={txState}
        txError={txError}
        txHash={txHash}
        activeAction={activeAction}
        entryFee={entryFee}
        usdRate={celoUsdRate}
        onClose={() => setTxState("idle")}
      />
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        entryFee={entryFee || "0.50"}
      />
      <OpponentHUDModal
        isOpen={!!viewingOpponent}
        onClose={() => setViewingOpponent(null)}
        opponentAddress={viewingOpponent}
        onSelect={(addr) => setSelectedOpponent(addr)}
        isInArena={isInArena}
      />
    </div>
    </>
  );
}
