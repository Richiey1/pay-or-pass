"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import { CONTRACT_ADDRESS, LOSSLESS_ARENA_ABI } from "@/lib/constants/contracts";
import { useGameToast } from "@/components/ui/Toast";

export default function AdminPanel() {
  const [apyValue, setApyValue] = useState("");

  const { data: currentApy, refetch: refetchApy } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: "apyBasisPoints",
  });

  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const toast = useGameToast();

  const handleUpdateApy = async () => {
    try {
      setLoading(true);
      if (!apyValue) throw new Error("Please enter APY in basis points");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "setApyBasisPoints",
        args: [BigInt(apyValue)],
      });
      toast.showToast("Yield Rate successfully updated!", "success");
      refetchApy();
      setApyValue("");
    } catch (e: any) {
      toast.showToast(e.message || "Failed to update APY", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-900/10 border border-red-500/20 rounded-3xl p-5 md:p-8 space-y-8 relative overflow-hidden backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-widest flex items-center gap-3 text-red-500">
          <ShieldCheck className="w-5 h-5" />
          Arena Admin Console
        </h2>
        <p className="text-xs font-bold text-red-200/50 mt-1 uppercase tracking-wider">
          Exclusive GameFi Economics Governance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-white">Yield Rate (APY)</h3>
          <p className="text-[10px] text-red-400 font-mono mb-4">
            Current: {currentApy ? Number(currentApy).toString() : "Loading..."} bps ({(Number(currentApy) / 100).toFixed(2)}%)
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="APY in bps (e.g. 800 = 8%)"
              value={apyValue}
              onChange={(e) => setApyValue(e.target.value)}
              className="w-full bg-black border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs font-black outline-none transition-all text-white"
            />
            <button
              onClick={handleUpdateApy}
              disabled={loading || !apyValue}
              className="w-full h-10 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Update APY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
