"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, BarChart3, TrendingUp, Activity, ArrowRight, 
  Wallet, ShieldCheck, Trophy, Timer, Play, Cpu, 
  Sparkles, Layers, DollarSign, ChevronLeft, ChevronRight,
  Menu, Info, Eye, EyeOff, CheckCircle2, AlertTriangle, HelpCircle,
  Copy, RefreshCw, LogIn, ChevronDown, Award
} from "lucide-react";
import { CONTRACT_ADDRESS as DEFAULT_CONTRACT_ADDRESS, PAY_OR_PASS_ABI } from "../lib/constants/contracts";

export default function Home() {
  const [chainId, setChainId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [chainInfo, setChainInfo] = useState<any>(null);
  const [chainHistory, setChainHistory] = useState<any[]>([]);

  // Wallet & Context State
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Real-time Countdown Timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;

  async function getProvider() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider("https://forno.celo.org");
  }

  // Check & Auto-Connect for MiniPay Context
  useEffect(() => {
    async function checkMiniPay() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum;
        const isMin = !!eth.isMiniPay;
        setIsMiniPay(isMin);

        if (isMin) {
          try {
            const provider = new ethers.BrowserProvider(eth);
            const accounts = await eth.request({ method: "eth_accounts" });
            if (accounts && accounts[0]) {
              setAddress(accounts[0]);
              setIsConnected(true);
              const bal = await provider.getBalance(accounts[0]);
              setBalance(ethers.formatEther(bal));
            } else {
              const reqAccounts = await eth.request({ method: "eth_requestAccounts" });
              if (reqAccounts && reqAccounts[0]) {
                setAddress(reqAccounts[0]);
                setIsConnected(true);
                const bal = await provider.getBalance(reqAccounts[0]);
                setBalance(ethers.formatEther(bal));
              }
            }
          } catch (err) {
            console.error("MiniPay silent connection failed:", err);
          }
        }
      }
    }
    checkMiniPay();
  }, []);

  // Countdown timer handler
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  async function connectWallet() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        setLoading(true);
        setStatus("Connecting wallet...");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setAddress(accounts[0]);
          setIsConnected(true);
          const bal = await provider.getBalance(accounts[0]);
          setBalance(ethers.formatEther(bal));
          setStatus("Wallet connected successfully!");
        }
      } catch (err: any) {
        setStatus(`Connection failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      setStatus("No Web3 provider found. Please use Valora or Opera Mini.");
    }
  }

  async function updateBalance(provider: any, userAddr: string) {
    try {
      const bal = await provider.getBalance(userAddr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Failed to update balance:", err);
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
      await updateBalance(provider, address);
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
      await updateBalance(provider, address);
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
      await updateBalance(provider, address);
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
    <div className="min-h-screen bg-[#060608] text-zinc-100 font-sans selection:bg-green-500 selection:text-black overflow-x-hidden flex flex-col justify-between relative">
      
      {/* Neo Grid Backdrop styling */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808004_1px,transparent_1px),linear-gradient(to_bottom,#80808004_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full filter blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full filter blur-[150px] pointer-events-none z-0" />

      {/* Floating Borderless Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#060608]/40 border-b border-zinc-900/60 h-20 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/10">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <span className="text-lg font-black uppercase tracking-widest bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent italic">
              PayOrPass.
            </span>
            <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest">Celo Social Payment Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-900 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-md">
          {isConnected ? (
            <div className="flex items-center gap-4 text-xs">
              <button 
                onClick={() => copyToClipboard(address)}
                className="flex items-center gap-1.5 hover:text-green-400 transition-colors text-zinc-400 font-mono bg-zinc-900/60 px-3 py-1 rounded-xl border border-zinc-800"
              >
                <span>{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
                <Copy className="w-3 h-3" />
              </button>
              <div className="h-4 w-[1px] bg-zinc-800" />
              <div className="flex items-center gap-1.5 font-extrabold text-white">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                <span>{parseFloat(balance).toFixed(4)} CELO</span>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connectWallet}
              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" /> Connect Wallet
            </motion.button>
          )}

          {isMiniPay && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
              ⚡ MiniPay Live
            </span>
          )}
        </div>
      </nav>

      {/* Main Command Console Layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 lg:px-8 pt-28 pb-12 gap-6 min-h-[calc(100vh-140px)]">
        
        {/* ================= LEFT SIDEBAR: BEHAVIORAL PROTOCOL RULES ================= */}
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[320px] bg-zinc-950/40 border border-zinc-900/80 rounded-[32px] p-6 flex flex-col justify-between backdrop-blur-2xl shadow-xl shrink-0 gap-6"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <Info className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Behavioral Game</h3>
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Protocol Architecture</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { step: "01", label: "Establish Pool Chain", desc: "A user commits a starting stake (e.g. 1 CELO) to deploy a dynamic social payment chain." },
                { step: "02", label: "Pressure Multiplier", desc: "If you are the current holder, you can Pass. This instantly transfers the pool stake to another recipient and increases the stakes by 20%!" },
                { step: "03", label: "Timeout Resolution", desc: "Every holder is under a strict countdown timer (1 hour). If the timer hits zero, a manual trigger finishes the game by locking the transaction." },
                { step: "04", label: "Termination (Pay)", desc: "A holder decides to Pay. This absorbs the total accumulated amount and closes the cycle, ending the chain." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-sm font-black text-green-500/30 font-mono mt-0.5">{step.step}</div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white italic">{step.label}</h4>
                    <p className="text-[9.5px] text-zinc-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/10 border border-zinc-900 text-center">
            <HelpCircle className="w-5 h-5 text-green-500/40 mx-auto mb-2" />
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Behavioral pressure experiment</span>
          </div>
        </motion.aside>

        {/* ================= MIDDLE CONSOLE: CORE ACTION CARDS ================= */}
        <motion.main 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-zinc-950/20 border border-zinc-900/80 rounded-[32px] p-6 sm:p-8 flex flex-col justify-between gap-8 backdrop-blur-2xl shadow-xl min-h-[500px]"
        >
          {/* Sparkles Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-900/60">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-green-400 text-[8px] font-black uppercase tracking-[0.2em] mb-2">
                <Sparkles className="w-3 h-3 text-green-400" /> Game Theory Payment Protocol
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-white">
                Social Payment <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">Terminal.</span>
              </h1>
            </div>

            {loading && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-400 uppercase tracking-widest animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Fetching Ledger
              </div>
            )}
          </div>

          {/* Action Grid Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            {/* CARD 1: CREATE NEW CHAIN */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-[24px] p-6 flex flex-col justify-between gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full filter blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 fill-green-400 text-green-400" /> Start New Chain
                  </h3>
                  {isConnected && (
                    <button 
                      onClick={handleMax}
                      className="text-[9px] font-black text-green-400 hover:text-green-300 transition-colors uppercase tracking-widest px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 rounded-lg border border-green-500/10"
                    >
                      MAX
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-zinc-500 font-medium">Commit a starting value in CELO to initiate the social passing sequence.</p>

                <div className="space-y-2 pt-2">
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Amount (CELO)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-650 text-sm font-extrabold focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                    <span className="absolute right-4 top-3 text-xs font-black text-zinc-500">CELO</span>
                  </div>
                  {amount && (
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest text-right">
                      Next dynamic pass cost: <span className="text-green-400">{(parseFloat(amount) * 1.2).toFixed(4)} CELO</span>
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createChain}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black uppercase tracking-wider text-[10px] shadow-lg shadow-green-500/10 flex items-center justify-center gap-2"
              >
                Create Dynamic Chain
              </motion.button>
            </div>

            {/* CARD 2: LOAD EXISTING CHAIN */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-[24px] p-6 flex flex-col justify-between gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Track Existing Chain
                </h3>

                <p className="text-[10px] text-zinc-500 font-medium">Enter a chain ID lookup number to monitor its live on-chain timeline, value, and holder status.</p>

                <div className="space-y-2 pt-2">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Enter Chain ID (e.g. 1)"
                      value={chainId}
                      onChange={(e) => setChainId(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-650 text-sm font-extrabold focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <span className="absolute right-4 top-3.5 text-[9px] font-black text-zinc-500 uppercase">Lookup</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadChain()}
                className="w-full py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-cyan-400 font-black uppercase tracking-wider text-[10px] shadow-sm flex items-center justify-center gap-2"
              >
                Track Chain
              </motion.button>
            </div>

          </div>

          {/* Status logs board */}
          <AnimatePresence mode="wait">
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full bg-zinc-950/80 border border-zinc-900 p-4 rounded-2xl flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <p className="text-[10px] font-mono text-zinc-400">{status}</p>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.main>

        {/* ================= RIGHT PANEL: LIVE CONTROL & NODES ================= */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[420px] bg-zinc-950/40 border border-zinc-900/80 rounded-[32px] p-6 flex flex-col justify-between backdrop-blur-2xl shadow-xl shrink-0 gap-6"
        >
          {chainInfo ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Header Info Block */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-white italic uppercase">Chain #{chainId}</h2>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    chainInfo.status === "Active" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : chainInfo.status === "Completed"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {chainInfo.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
                    <span className="text-zinc-500 block uppercase tracking-widest text-[7.5px] font-black">Current Pool</span>
                    <span className="text-base font-black text-white mt-1 block italic">{chainInfo.amount} CELO</span>
                  </div>
                  <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
                    <span className="text-zinc-500 block uppercase tracking-widest text-[7.5px] font-black">Next Pass Cost</span>
                    <span className="text-base font-black text-green-400 mt-1 block italic">{chainInfo.nextAmount} CELO</span>
                  </div>
                </div>
              </div>

              {/* Real-time Countdown clock */}
              {chainInfo.status === "Active" && secondsLeft !== null && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Timeout countdown</span>
                  </div>
                  <span className="font-mono text-base font-bold text-red-400">{formatTime(secondsLeft)}</span>
                </div>
              )}

              {/* Dynamic Path History (Pass Timeline Flow) */}
              <div className="flex-1 space-y-3">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Social Routing Path</span>
                
                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3 relative pl-4 border-l border-zinc-900">
                  {/* Originator Node */}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500" />
                    <div className="text-[10px]">
                      <span className="text-[8px] font-black text-green-400 uppercase tracking-widest block">Originator Deploy</span>
                      <button 
                        onClick={() => copyToClipboard(chainInfo.originator)}
                        className="font-mono text-zinc-300 hover:text-white transition-colors"
                      >
                        {chainInfo.originator.substring(0, 8)}...{chainInfo.originator.substring(chainInfo.originator.length - 6)}
                      </button>
                      <span className="text-[8px] text-zinc-500 block">{chainInfo.createdAt}</span>
                    </div>
                  </div>

                  {/* Pass History Loops */}
                  {chainHistory.map((node, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500/30 border border-cyan-500" />
                      <div className="text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Pass #{idx + 1}</span>
                          <span className="text-[8px] font-extrabold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">+{node.amount} CELO</span>
                        </div>
                        <p className="font-mono text-zinc-300">
                          {node.from.substring(0, 6)}... → {node.to.substring(0, 6)}...
                        </p>
                        <span className="text-[8px] text-zinc-500 block">{node.timestamp}</span>
                      </div>
                    </div>
                  ))}

                  {/* Current Holder Node */}
                  {chainInfo.status === "Active" && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 animate-ping" />
                      <div className="text-[10px]">
                        <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest block">Active Holder</span>
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

              {/* Holder Commands Controls */}
              {chainInfo.status === "Active" && (
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={pay}
                      className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-wider text-[10px] shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
                    >
                      💰 Absorb & Pay {chainInfo.amount} CELO
                    </motion.button>

                    <div className="space-y-2">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Pass to another recipient (+20%)</span>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Recipient address (0x...)"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 font-mono focus:outline-none focus:border-green-500/50"
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={passTo}
                          className="py-3 px-5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-wider text-[9px]"
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
            <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-600">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-zinc-400">Ledger Index Monitor</h4>
                <p className="text-[10px] text-zinc-500 max-w-[240px] mx-auto">Create a new social payment chain or track an existing lookup ID above to start active control terminal processes.</p>
              </div>
            </div>
          )}
        </motion.aside>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#060608]/40 py-6 text-center relative z-10 text-[8px] text-zinc-600 uppercase tracking-widest font-black">
        © 2026 PayOrPass Protocol. ALL OUTCOMES DEPLOYED ON CELO ALFAJORES LEDGER.
      </footer>

    </div>
  );
}
