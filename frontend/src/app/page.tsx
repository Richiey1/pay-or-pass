"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, BarChart3, TrendingUp, Activity, ArrowRight, 
  Wallet, ShieldCheck, Trophy, Timer, Play, Cpu, 
  Sparkles, Layers, DollarSign, ChevronLeft, ChevronRight,
  Menu, Info, Eye, EyeOff, CheckCircle2, AlertTriangle, HelpCircle,
  Copy, RefreshCw, LogIn, ChevronDown, Award, Compass, Sparkle
} from "lucide-react";
import { useAccount, useConnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAppKit } from "@reown/appkit/react";
import { CONTRACT_ADDRESS as DEFAULT_CONTRACT_ADDRESS, PAY_OR_PASS_ABI } from "../lib/constants/contracts";

export default function Home() {
  const [chainId, setChainId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<any>(null);
  const [chainHistory, setChainHistory] = useState<any[]>([]);

  // Reown AppKit / Wagmi Wallet Connection
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { open } = useAppKit();
  const { data: balanceData } = useBalance({
    address: address,
  });

  const [isMiniPay, setIsMiniPay] = useState(false);

  // Real-time Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;

  const balance = balanceData ? parseFloat(ethers.formatEther(balanceData.value)).toFixed(4) : "0.0000";

  async function getProvider() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider("https://forno.celo.org");
  }

  // Check & Auto-Connect for MiniPay Context
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      setIsMiniPay(true);
      if (!isConnected) {
        connect({ connector: injected() });
      }
    }
  }, [connect, isConnected]);

  // Countdown timer handler
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  async function connectWallet() {
    try {
      setLoading(true);
      setStatus("Opening connect portal...");
      await open();
      setStatus("Connect portal loaded.");
    } catch (err: any) {
      setStatus(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createChain() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setStatus("Error: Please specify a valid positive CELO amount.");
      return;
    }

    try {
      setLoading(true);
      if (!isConnected) {
        await connectWallet();
        return;
      }
      setStatus("Initiating chain contract deployment...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const parsedAmount = ethers.parseEther(amount);
      const tx = await contract.createChain(ethers.ZeroAddress, parsedAmount, {
        value: parsedAmount,
        type: 0 // Legacy type is mandatory for MiniPay environments
      });
      
      setStatus("Broadcasting to Celo ledger...");
      const receipt = await tx.wait();

      // Attempt to extract chainId from transaction logs
      let createdChainId = "1";
      if (receipt.logs) {
        try {
          const iface = new ethers.Interface(PAY_OR_PASS_ABI);
          for (const log of receipt.logs) {
            try {
              const parsedLog = iface.parseLog(log);
              if (parsedLog && parsedLog.name === "ChainCreated") {
                createdChainId = parsedLog.args.chainId.toString();
                break;
              }
            } catch {}
          }
        } catch (e) {
          console.error("Failed to parse logs for chainId:", e);
        }
      }

      setChainId(createdChainId);
      setStatus(`Success! Chain #${createdChainId} created.`);
      loadChain(createdChainId);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadChain(overrideId?: string) {
    const targetId = overrideId || chainId;
    if (!targetId || isNaN(parseInt(targetId))) {
      setStatus("Error: Please enter a valid numerical Chain ID.");
      return;
    }

    try {
      setLoading(true);
      setStatus(`Loading chain #${targetId} stats...`);
      const provider = await getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, provider);

      const info = await contract.chains(targetId);
      const nextAmount = await contract.getNextAmount(targetId);
      const timeoutReached = await contract.isTimeoutReached(targetId);
      const defaultTimeoutSec = await contract.defaultTimeout();

      // Retrieve full path pass history logs
      let historyLogs: any[] = [];
      try {
        const passes = await contract.getPasses(targetId);
        historyLogs = passes.map((p: any) => ({
          chainId: p.chainId.toString(),
          from: p.from,
          to: p.to,
          amount: ethers.formatEther(p.amount),
          timestamp: new Date(Number(p.timestamp) * 1000).toLocaleString()
        }));
      } catch (err) {
        console.warn("Failed to fetch passes history logs:", err);
      }

      setChainInfo({
        originator: info.originator,
        currentHolder: info.currentHolder,
        amount: ethers.formatEther(info.amount),
        createdAt: new Date(Number(info.createdAt) * 1000).toLocaleString(),
        lastActionAt: info.lastActionAt.toString(),
        passCount: info.passCount.toString(),
        nextAmount: ethers.formatEther(nextAmount),
        timeoutReached,
        status: ["Active", "Completed", "TimedOut"][info.status],
      });
      setChainHistory(historyLogs);
      setStatus(`Loaded details for Chain #${targetId}`);

      // Calculate countdown timer
      if (info.status === 0) { // Active
        const expireTime = Number(info.lastActionAt) + Number(defaultTimeoutSec);
        const diff = expireTime - Math.floor(Date.now() / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      } else {
        setSecondsLeft(null);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    if (!chainInfo) return;
    try {
      setLoading(true);
      if (!isConnected) {
        await connectWallet();
        return;
      }
      setStatus("Staking pay contract balance...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const parsedAmount = ethers.parseEther(chainInfo.amount);
      const tx = await contract.pay(chainId, { 
        value: parsedAmount,
        type: 0 // Legacy type is mandatory for MiniPay environments
      });

      setStatus("Broadcasting payment terminal resolution...");
      await tx.wait();

      setStatus("Success! Paid. Chain completed and ended.");
      loadChain();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function passTo() {
    if (!recipient || !recipient.startsWith("0x")) {
      setStatus("Error: Please provide a valid Celo recipient address.");
      return;
    }

    try {
      setLoading(true);
      if (!isConnected) {
        await connectWallet();
        return;
      }
      setStatus("Initiating dynamic passing stake redirection...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const tx = await contract.pass(chainId, recipient, {
        type: 0 // Legacy type is mandatory for MiniPay environments
      });

      setStatus("Broadcasting transfer...");
      await tx.wait();

      setStatus(`Success! Passed to recipient.`);
      setRecipient("");
      loadChain();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleMax = () => {
    if (balance) {
      const maxVal = Math.max(0, parseFloat(balance) - 0.005);
      setAmount(maxVal.toFixed(6));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard!");
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-[#FBCC5C] selection:text-black overflow-x-hidden flex flex-col justify-between relative">
      
      {/* Celo Gold Neo Grid Backdrop */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#fbcc5c03_1px,transparent_1px),linear-gradient(to_bottom,#fbcc5c03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#fbcc5c]/5 rounded-full filter blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-10 w-[400px] h-[400px] bg-[#e2a229]/3 rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Floating Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#070709]/60 border-b border-zinc-900/60 h-20 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/paynpass-logo.svg" alt="PayOrPass Logo" className="w-10 h-10 object-contain hover:scale-105 transition-transform duration-300" />
          <div>
            <span className="text-lg font-black uppercase tracking-widest bg-gradient-to-r from-[#FBCC5C] via-[#F0A91D] to-[#E2A229] bg-clip-text text-transparent italic">
              PayOrPass.
            </span>
            <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest">Celo Social Payment Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#111115]/90 border border-zinc-900 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-md">
          {isConnected && address ? (
            <div className="flex items-center gap-4 text-xs">
              <button 
                onClick={() => copyToClipboard(address)}
                className="flex items-center gap-1.5 hover:text-[#FBCC5C] transition-colors text-zinc-400 font-mono bg-zinc-950/60 px-3 py-1 rounded-xl border border-zinc-900"
              >
                <span>{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
                <Copy className="w-3 h-3" />
              </button>
              <div className="h-4 w-[1px] bg-zinc-800" />
              <div className="flex items-center gap-1.5 font-extrabold text-white">
                <DollarSign className="w-3.5 h-3.5 text-[#FBCC5C]" />
                <span>{balance} CELO</span>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connectWallet}
              className="bg-[#FBCC5C]/10 hover:bg-[#FBCC5C]/20 text-[#FBCC5C] border border-[#FBCC5C]/20 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" /> Connect Wallet
            </motion.button>
          )}

          {isMiniPay && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
              ⚡ MiniPay Live
            </span>
          )}
        </div>
      </nav>

      {/* Main Console Centered Layout */}
      <div className="relative z-10 w-full max-w-[1300px] mx-auto px-4 sm:px-6 pt-28 pb-12 flex flex-col gap-8 min-h-[calc(100vh-140px)]">
        
        {/* GRAND CENTERED HERO HEADER */}
        <div className="text-center space-y-3 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBCC5C]/5 border border-[#FBCC5C]/10 text-[#FBCC5C] text-[8px] font-black uppercase tracking-[0.25em] mx-auto">
            <Sparkles className="w-3 h-3 text-[#FBCC5C]" /> Dynamic Social Game Theory
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter text-white">
            SOCIAL DEFI <span className="bg-gradient-to-r from-[#FBCC5C] via-[#F0A91D] to-[#E2A229] bg-clip-text text-transparent">TERMINAL.</span>
          </h1>
          <p className="text-zinc-500 text-xs font-semibold max-w-xl mx-auto uppercase tracking-wider leading-relaxed">
            A psychological micro-game of coordination. End the chain by absorbing the pool or pass it onward with a 20% staking escalation.
          </p>
        </div>

        {/* TWO-COLUMN GRID ASSEMBLY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: CONTROLS & OPERATIONS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* OPERATION 1: DEPLOY/CREATE */}
              <div className="bg-[#0e0e13]/60 border border-zinc-900 rounded-[28px] p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-md backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FBCC5C]/3 rounded-full filter blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FBCC5C] flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-[#FBCC5C] text-[#FBCC5C]" /> Deploy Chain
                    </h3>
                    {isConnected && (
                      <button 
                        onClick={handleMax}
                        className="text-[9px] font-black text-[#FBCC5C] hover:text-amber-300 transition-colors uppercase tracking-widest px-2.5 py-1 bg-[#FBCC5C]/10 hover:bg-[#FBCC5C]/20 rounded-lg border border-[#FBCC5C]/10"
                      >
                        MAX
                      </button>
                    )}
                  </div>

                  <p className="text-[9.5px] text-zinc-500 font-medium">Commit an initial CELO deposit to launch a new behavioral cycle.</p>

                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="Amount (CELO)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-sm font-extrabold focus:outline-none focus:border-[#FBCC5C]/50 transition-colors"
                      />
                      <span className="absolute right-4 top-3 text-xs font-black text-zinc-500">CELO</span>
                    </div>
                    {amount && (
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-right">
                        Staking escalation cost: <span className="text-[#FBCC5C]">{(parseFloat(amount) * 1.2).toFixed(4)} CELO</span>
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={createChain}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FBCC5C] to-[#F0A91D] text-black font-black uppercase tracking-wider text-[10px] shadow-lg shadow-amber-500/5 flex items-center justify-center gap-2"
                >
                  Create Dynamic Chain
                </motion.button>
              </div>

              {/* OPERATION 2: LOOKUP/TRACK */}
              <div className="bg-[#0e0e13]/60 border border-zinc-900 rounded-[28px] p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-md backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 rounded-full filter blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#FBCC5C] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#FBCC5C]" /> Track Index
                  </h3>

                  <p className="text-[9.5px] text-zinc-500 font-medium">Verify state settings, dynamic payouts, and history flow of a Chain ID.</p>

                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Enter Chain ID (e.g. 1)"
                        value={chainId}
                        onChange={(e) => setChainId(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-sm font-extrabold focus:outline-none focus:border-[#FBCC5C]/50 transition-colors"
                      />
                      <span className="absolute right-4 top-3.5 text-[9px] font-black text-zinc-500 uppercase">Lookup</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => loadChain()}
                  className="w-full py-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-[#FBCC5C] font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-colors"
                >
                  Track Chain
                </motion.button>
              </div>

            </div>

            {/* Dynamic Status Dashboard Alerts */}
            <AnimatePresence mode="wait">
              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="w-full bg-[#0e0e13]/80 border border-zinc-900 p-4 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#FBCC5C] animate-ping" />
                  <p className="text-[10px] font-mono text-zinc-400">{status}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* RIGHT SIDE: LIVE LEDGER TRACKER (5 Cols) */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0e0e13]/60 border border-zinc-900 rounded-[28px] p-6 backdrop-blur-2xl shadow-xl min-h-[440px] flex flex-col justify-between"
            >
              {chainInfo ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  
                  {/* Header info */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#FBCC5C]" />
                        <h2 className="text-base font-black text-white italic uppercase tracking-wider">Chain #{chainId}</h2>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        chainInfo.status === "Active" 
                          ? "bg-amber-500/10 text-[#FBCC5C] border border-amber-500/20" 
                          : chainInfo.status === "Completed"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-zinc-850 text-zinc-550 border border-zinc-900"
                      }`}>
                        {chainInfo.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/60">
                        <span className="text-zinc-500 block uppercase tracking-widest text-[7.5px] font-black">Accrued Pool</span>
                        <span className="text-base font-black text-white mt-1 block italic">{chainInfo.amount} CELO</span>
                      </div>
                      <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/60">
                        <span className="text-zinc-500 block uppercase tracking-widest text-[7.5px] font-black">Escalation Cost</span>
                        <span className="text-base font-black text-[#FBCC5C] mt-1 block italic">{chainInfo.nextAmount} CELO</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  {chainInfo.status === "Active" && secondsLeft !== null && (
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-red-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Locked Countdown</span>
                      </div>
                      <span className="font-mono text-base font-bold text-red-400">{formatTime(secondsLeft)}</span>
                    </div>
                  )}

                  {/* Social Routing Path Log */}
                  <div className="flex-1 space-y-3 py-2">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Social Routing History</span>
                    
                    <div className="max-h-[170px] overflow-y-auto pr-1 space-y-3 relative pl-4 border-l border-zinc-900">
                      {/* Originator */}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#FBCC5C]/20 border border-[#FBCC5C]" />
                        <div className="text-[10px]">
                          <span className="text-[8px] font-black text-[#FBCC5C] uppercase tracking-widest block">Originator Deposit</span>
                          <button 
                            onClick={() => copyToClipboard(chainInfo.originator)}
                            className="font-mono text-zinc-400 hover:text-white transition-colors"
                          >
                            {chainInfo.originator.substring(0, 8)}...{chainInfo.originator.substring(chainInfo.originator.length - 6)}
                          </button>
                          <span className="text-[8px] text-zinc-500 block">{chainInfo.createdAt}</span>
                        </div>
                      </div>

                      {/* Timeline iterations */}
                      {chainHistory.map((node, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500" />
                          <div className="text-[10px] space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Redirect #{idx + 1}</span>
                              <span className="text-[8px] font-extrabold text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded">+{node.amount} CELO</span>
                            </div>
                            <p className="font-mono text-zinc-400">
                              {node.from.substring(0, 6)}... → {node.to.substring(0, 6)}...
                            </p>
                            <span className="text-[8px] text-zinc-500 block">{node.timestamp}</span>
                          </div>
                        </div>
                      ))}

                      {/* Current active holder node */}
                      {chainInfo.status === "Active" && (
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#FBCC5C] animate-ping" />
                          <div className="text-[10px]">
                            <span className="text-[8px] font-black text-[#FBCC5C] uppercase tracking-widest block">Current Holder</span>
                            <button 
                              onClick={() => copyToClipboard(chainInfo.currentHolder)}
                              className="font-mono text-zinc-300 hover:text-white"
                            >
                              {chainInfo.currentHolder.substring(0, 8)}...{chainInfo.currentHolder.substring(chainInfo.currentHolder.length - 6)}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Operational Game Triggers */}
                  {chainInfo.status === "Active" && (
                    <div className="space-y-4 pt-4 border-t border-zinc-900/60">
                      <div className="flex flex-col gap-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={pay}
                          className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px] shadow-lg shadow-red-600/10 flex items-center justify-center gap-2"
                        >
                          💰 Claim & Pay {chainInfo.amount} CELO
                        </motion.button>

                        <div className="space-y-2">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Redirect Chain (Pass to address)</span>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Recipient Celo address (0x...)"
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                              className="flex-1 bg-zinc-950/60 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-[#FBCC5C]/50"
                            />
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={passTo}
                              className="py-2.5 px-5 rounded-xl bg-[#FBCC5C] hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[9px] transition-colors"
                            >
                              🔁 Pass
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-full flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-700">
                    <Compass className="w-6 h-6 text-[#FBCC5C]/40" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-zinc-400">Live Ledger Terminal</h4>
                    <p className="text-[9.5px] text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                      Launch a dynamic pool or input a Chain ID parameters to activate live monitoring logs.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

        </div>

        {/* BOTTOM HORIZONTAL GRID: BRAND GAME ARCHITECTURE */}
        <div className="mt-6 pt-8 border-t border-zinc-900/60">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-4 h-4 text-[#FBCC5C]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Rules of Engagement</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Deploy Dynamic Pool",
                desc: "Launch a social routing chain by locking your starting CELO deposit into the protocol ledger."
              },
              {
                step: "02",
                title: "Pass Escalation",
                desc: "Pass the transaction onward. The stake instantly redirects to the target recipient, while the next required pass cost escalates by 20%."
              },
              {
                step: "03",
                title: "Timeout Deadlock",
                desc: "A strict 1-hour countdown applies. If the current holder triggers a timeout deadlock, the pool absorbs and finalizes."
              },
              {
                step: "04",
                title: "Absorb & End",
                desc: "Absorb the total accrued CELO. Pay the required claim stake to permanently close the cycle and receive the total pool."
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#0e0e13]/30 border border-zinc-900/80 rounded-2xl p-5 space-y-3 relative overflow-hidden group">
                <div className="text-xl font-mono font-black text-[#FBCC5C]/20 group-hover:text-[#FBCC5C]/40 transition-colors">{step.step}</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white italic">{step.title}</h4>
                  <p className="text-[9.5px] text-zinc-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#070709]/60 py-6 text-center relative z-10 text-[8px] text-zinc-650 uppercase tracking-widest font-black">
        © 2026 PayOrPass Protocol. ALL OUTCOMES DEPLOYED ON CELO MAINNET LEDGER.
      </footer>

    </div>
  );
}
