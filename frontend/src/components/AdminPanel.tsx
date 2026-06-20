"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import { CONTRACT_ADDRESS, LOSSLESS_ARENA_ABI, FUNCTION_NAMES } from "@/lib/constants/contracts";
import { useGameToast } from "@/components/ui/Toast";

export default function AdminPanel() {
  const { address } = useAccount();
  const { data: isAdminData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.IS_ADMIN,
    args: address ? [address] : undefined,
  });

  const { data: ownerData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.OWNER,
  });

  const isWalletAdmin = address && (
    isAdminData === true || (ownerData && (ownerData as string).toLowerCase() === address.toLowerCase())
  );

  const [apyValue, setApyValue] = useState("");
  const [feeValue, setFeeValue] = useState("");
  const [cooldownValue, setCooldownValue] = useState("");

  const { data: currentApy, refetch: refetchApy } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.APY_BASIS_POINTS,
  });

  const { data: currentFee, refetch: refetchFee } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.ENTRY_FEE,
  });

  const { data: currentCooldown, refetch: refetchCooldown } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.FIGHT_COOLDOWN,
  });

  const { writeContractAsync } = useWriteContract();
  const [loadingApy, setLoadingApy] = useState(false);
  const [loadingFee, setLoadingFee] = useState(false);
  const [loadingCooldown, setLoadingCooldown] = useState(false);
  const toast = useGameToast();

  if (!isWalletAdmin) return null;

  const handleUpdateApy = async () => {
    try {
      setLoadingApy(true);
      if (!apyValue) throw new Error("Please enter APY in basis points");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.SET_APY_BASIS_POINTS,
        args: [BigInt(apyValue)],
      });
      toast.showToast("Yield Rate successfully updated!", "success");
      refetchApy();
      setApyValue("");
    } catch (e: any) {
      toast.showToast(e.message || "Failed to update APY", "error");
    } finally {
      setLoadingApy(false);
    }
  };

  const handleUpdateFee = async () => {
    try {
      setLoadingFee(true);
      if (!feeValue) throw new Error("Please enter Entry Fee");
      // Import parseEther dynamically or assume viem is available, better to use viem.parseEther
      const { parseEther } = await import("viem");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.SET_ENTRY_FEE,
        args: [parseEther(feeValue)],
      });
      toast.showToast("Entry Fee successfully updated!", "success");
      refetchFee();
      setFeeValue("");
    } catch (e: any) {
      toast.showToast(e.message || "Failed to update Entry Fee", "error");
    } finally {
      setLoadingFee(false);
    }
  };

  const handleUpdateCooldown = async () => {
    try {
      setLoadingCooldown(true);
      if (!cooldownValue) throw new Error("Please enter cooldown in seconds");
      await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.SET_FIGHT_COOLDOWN,
        args: [BigInt(cooldownValue)],
      });
      toast.showToast("Fight Cooldown successfully updated!", "success");
      refetchCooldown();
      setCooldownValue("");
    } catch (e: any) {
      toast.showToast(e.message || "Failed to update Fight Cooldown", "error");
    } finally {
      setLoadingCooldown(false);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-white">Yield Rate (APY)</h3>
          <p className="text-[10px] text-red-400 font-mono mb-4">
            Current: {currentApy ? Number(currentApy).toString() : "Loading..."} bps ({(Number(currentApy || 0) / 100).toFixed(2)}%)
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
              disabled={loadingApy || !apyValue}
              className="w-full h-10 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loadingApy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Update APY
            </button>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-white">Entry Fee</h3>
          <p className="text-[10px] text-red-400 font-mono mb-4">
            Current: {currentFee ? (Number(currentFee) / 1e18).toFixed(2) : "Loading..."} CELO
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Fee in CELO"
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              className="w-full bg-black border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs font-black outline-none transition-all text-white"
            />
            <button
              onClick={handleUpdateFee}
              disabled={loadingFee || !feeValue}
              className="w-full h-10 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loadingFee ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Update Fee
            </button>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-white">Fight Cooldown</h3>
          <p className="text-[10px] text-red-400 font-mono mb-4">
            Current: {currentCooldown ? Number(currentCooldown).toString() : "Loading..."} sec
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Cooldown in seconds"
              value={cooldownValue}
              onChange={(e) => setCooldownValue(e.target.value)}
              className="w-full bg-black border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs font-black outline-none transition-all text-white"
            />
            <button
              onClick={handleUpdateCooldown}
              disabled={loadingCooldown || !cooldownValue}
              className="w-full h-10 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loadingCooldown ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Update Cooldown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
