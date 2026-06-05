"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import { CONTRACT_ADDRESS, PAY_OR_PASS_ABI } from "@/lib/constants/contracts";
import { useGameToast } from "@/components/ui/Toast";

export default function AdminPanel() {
  const { showToast } = useGameToast();
  const [timeoutValue, setTimeoutValue] = useState("");
  const [multiplierValue, setMultiplierValue] = useState("");
  const [apyValue, setApyValue] = useState("");

  const { data: currentTimeout, refetch: refetchTimeout } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PAY_OR_PASS_ABI,
    functionName: "defaultTimeout",
  });

  const { data: currentMultiplier, refetch: refetchMultiplier } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PAY_OR_PASS_ABI,
    functionName: "defaultMultiplier",
  });

  const { data: currentApy, refetch: refetchApy } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PAY_OR_PASS_ABI,
    functionName: "apyBasisPoints",
  });

  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const handleUpdateTimeout = async () => {
    try {
      setLoading(true);
      if (!timeoutValue) throw new Error("Please enter a valid timeout in seconds");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PAY_OR_PASS_ABI,
        functionName: "setTimeout",
        args: [BigInt(timeoutValue)],
      });
      showToast("Default Timeout successfully updated", "success");
      refetchTimeout();
      setTimeoutValue("");
    } catch (e: any) {
      showToast(e.message || "Failed to update timeout", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMultiplier = async () => {
    try {
      setLoading(true);
      if (!multiplierValue) throw new Error("Please enter a valid multiplier");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PAY_OR_PASS_ABI,
        functionName: "setMultiplier",
        args: [BigInt(multiplierValue)],
      });
      showToast("Default Multiplier successfully updated", "success");
      refetchMultiplier();
      setMultiplierValue("");
    } catch (e: any) {
      showToast(e.message || "Failed to update multiplier", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApy = async () => {
    try {
      setLoading(true);
      if (!apyValue) throw new Error("Please enter valid APY basis points");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PAY_OR_PASS_ABI,
        functionName: "setApyBasisPoints",
        args: [BigInt(apyValue)],
      });
      showToast("Yield APY successfully updated", "success");
      refetchApy();
      setApyValue("");
    } catch (e: any) {
      showToast(e.message || "Failed to update APY", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 mt-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold font-display uppercase tracking-wider text-indigo-400">
          Admin Governance Panel
        </h2>
      </div>
      
      <p className="text-xs text-white/50 mb-6 uppercase tracking-widest font-bold">
        Exclusive deployer access for protocol parameter tuning
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeout Control */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
          <h3 className="font-bold text-sm mb-2">Round Timeout</h3>
          <p className="text-xs text-indigo-400 font-mono mb-4">
            Current: {currentTimeout ? `${Number(currentTimeout)}s` : "Loading..."}
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Timeout in seconds"
              value={timeoutValue}
              onChange={(e) => setTimeoutValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none transition-all"
            />
            <button
              onClick={handleUpdateTimeout}
              disabled={loading || !timeoutValue}
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Timeout
            </button>
          </div>
        </div>

        {/* Multiplier Control */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
          <h3 className="font-bold text-sm mb-2">Pass Multiplier</h3>
          <p className="text-xs text-indigo-400 font-mono mb-4">
            Current: {currentMultiplier ? `${Number(currentMultiplier)} bps` : "Loading..."}
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Multiplier in bps (e.g. 12000 = 120%)"
              value={multiplierValue}
              onChange={(e) => setMultiplierValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none transition-all"
            />
            <button
              onClick={handleUpdateMultiplier}
              disabled={loading || !multiplierValue}
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Multiplier
            </button>
          </div>
        </div>

        {/* APY Control */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
          <h3 className="font-bold text-sm mb-2">Simulated Yield APY</h3>
          <p className="text-xs text-indigo-400 font-mono mb-4">
            Current: {currentApy ? `${Number(currentApy)} bps` : "Loading..."}
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="APY in bps (e.g. 500 = 5%)"
              value={apyValue}
              onChange={(e) => setApyValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none transition-all"
            />
            <button
              onClick={handleUpdateApy}
              disabled={loading || !apyValue}
              className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save APY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
