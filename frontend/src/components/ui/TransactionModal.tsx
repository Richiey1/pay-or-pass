import React from "react";
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { TxState } from "@/hooks/useLosslessArena";

interface TransactionModalProps {
  txState: TxState;
  txError: string | null;
  txHash: string | null;
  activeAction: "enter" | "fight" | "exit" | null;
  entryFee: string;
  usdRate?: number; // CELO to USD conversion rate
  onClose: () => void;
}

export function TransactionModal({
  txState,
  txError,
  txHash,
  activeAction,
  entryFee,
  usdRate = 0.62, // Default static rate if not fetched
  onClose,
}: TransactionModalProps) {
  if (txState === "idle") return null;

  const getActionName = () => {
    switch (activeAction) {
      case "enter":
        return "Staking Principal to Enter Arena";
      case "fight":
        return "Initiating Combat with Gladiator";
      case "exit":
        return "Withdrawing Principal & Exiting Arena";
      default:
        return "Executing Smart Contract Action";
    }
  };

  const getActionAmount = () => {
    if (activeAction === "enter") {
      const feeNum = parseFloat(entryFee);
      return {
        celo: `${feeNum.toFixed(4)} CELO`,
        usd: `$${(feeNum * usdRate).toFixed(2)} USD`,
      };
    }
    return null;
  };

  const amountDetails = getActionAmount();

  // Multi-stage status indicator checks
  const isPrepDone = txState !== "preparing";
  const isBroadcastDone = isPrepDone && txState !== "broadcasting";
  const isConfirmingDone = isBroadcastDone && txState !== "confirming";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121214] border border-red-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black tracking-widest uppercase text-white flex items-center justify-center gap-2">
            <Cpu className="w-5 h-5 text-red-500 animate-pulse" />
            Web3 Transaction HUD
          </h3>
          <p className="text-xs text-red-400 font-bold uppercase tracking-widest">
            {getActionName()}
          </p>
        </div>

        {/* Transaction Parameters (Simulation Details) */}
        {amountDetails && (
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center text-sm">
            <div>
              <span className="text-[10px] text-white/40 font-black uppercase tracking-wider block">Estimated Stake</span>
              <span className="font-mono font-bold text-white text-base">{amountDetails.celo}</span>
            </div>
            <ArrowRight className="text-red-500/50 w-4 h-4" />
            <div className="text-right">
              <span className="text-[10px] text-white/40 font-black uppercase tracking-wider block">USD Equivalent</span>
              <span className="font-mono font-bold text-red-400 text-base">{amountDetails.usd}</span>
            </div>
          </div>
        )}

        {/* Multi-Stage Tracker UI */}
        <div className="space-y-4 pt-2">
          
          {/* Stage 1: Preparing */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              txState === "preparing" ? "border-red-500 bg-red-500/10 text-red-500" :
              isPrepDone ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-white/10 text-white/30"
            }`}>
              {txState === "preparing" ? <Loader2 size={16} className="animate-spin" /> : 
               isPrepDone ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">1</span>}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-wider ${txState === "preparing" ? "text-red-400" : isPrepDone ? "text-white" : "text-white/30"}`}>
                Stage 1: Client Simulation
              </p>
              <p className="text-[10px] text-white/40">Checking balances, estimating gas & simulating call</p>
            </div>
          </div>

          {/* Stage 2: Broadcasting */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              txState === "broadcasting" ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse" :
              isBroadcastDone ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-white/10 text-white/30"
            }`}>
              {txState === "broadcasting" ? <Loader2 size={16} className="animate-spin" /> : 
               isBroadcastDone ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">2</span>}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-wider ${txState === "broadcasting" ? "text-red-400" : isBroadcastDone ? "text-white" : "text-white/30"}`}>
                Stage 2: Broadcasting to Network
              </p>
              <p className="text-[10px] text-white/40">Requesting wallet signature & broadcasting payload</p>
            </div>
          </div>

          {/* Stage 3: Confirming */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              txState === "confirming" ? "border-red-500 bg-red-500/10 text-red-500" :
              isConfirmingDone ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-white/10 text-white/30"
            }`}>
              {txState === "confirming" ? <Loader2 size={16} className="animate-spin" /> : 
               isConfirmingDone ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">3</span>}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-wider ${txState === "confirming" ? "text-red-400" : isConfirmingDone ? "text-white" : "text-white/30"}`}>
                Stage 3: Network Confirmation
              </p>
              <p className="text-[10px] text-white/40">Awaiting block inclusion & receipt confirmation</p>
            </div>
          </div>

        </div>

        {/* Status Messages / Hash display */}
        {txHash && (
          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Transaction Hash</span>
            <a 
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-red-400 hover:text-red-300 underline break-all block"
            >
              {txHash}
            </a>
          </div>
        )}

        {/* Error Handling */}
        {txState === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider block">Execution Failed</span>
              <p className="text-xs font-mono text-red-200/70 max-h-20 overflow-y-auto break-words">{txError}</p>
            </div>
          </div>
        )}

        {/* Confirmed Success State */}
        {txState === "confirmed" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">Transaction Success</span>
              <p className="text-xs text-emerald-200/70">Blockchain state successfully synchronized.</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2">
          {txState === "confirmed" || txState === "error" ? (
            <button
              onClick={onClose}
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center"
            >
              Close HUD
            </button>
          ) : (
            <div className="text-center text-[10px] text-white/30 font-black uppercase tracking-wider animate-pulse py-2">
              Do not close window. Smart contract execution in progress...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
