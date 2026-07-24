/**
 * useReferralBuff
 *
 * On load, reads the ?ref=0x... URL param. If present and valid:
 *  1. Shows a "Claiming referral buff…" state
 *  2. Calls claimReferralBuff(referee) on LosslessArena
 *  3. Both the visitor AND the referee get a 24h Defense buff on-chain
 *  4. Cleans the param from the URL so it doesn't re-trigger on refresh
 *
 * Also reads the player's current referral buff expiry from a contract view
 * so the UI can show when the buff expires.
 */

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { CONTRACT_ADDRESS, LOSSLESS_ARENA_ABI } from "@/lib/constants/contracts";

const REFERRAL_BUFF_ABI = parseAbi([
  "function claimReferralBuff(address referee) external",
  "function referralBuffExpiry(address) view returns (uint256)",
  "function referralDefenseBonus(address) view returns (uint8)",
]);

export interface ReferralBuffState {
  /** Address detected in ?ref= param on load */
  detectedReferrer: string | null;
  /** Whether the on-chain claimReferralBuff tx is pending */
  isClaiming: boolean;
  /** Whether the claim tx was confirmed */
  claimConfirmed: boolean;
  /** Unix timestamp (seconds) when current buff expires; 0 = no buff */
  buffExpiresAt: number;
  /** Whether the current player has an active defense buff right now */
  hasActiveBuff: boolean;
  /** Hours remaining on buff */
  buffHoursLeft: number;
  /** The defense bonus value (e.g. 1 for +1 Defense) */
  defenseBonus: number;
  /** Manually trigger the claim (in case auto-claim is skipped) */
  claimBuff: (referee: string) => void;
}

export function useReferralBuff(address: string | undefined): ReferralBuffState {
  const [detectedReferrer, setDetectedReferrer] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Tick every 60s to update countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Read ?ref= from URL on mount ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^0x[0-9a-fA-F]{40}$/.test(ref)) {
      setDetectedReferrer(ref);
      // Clean the URL param so it doesn't re-trigger on hard refresh
      params.delete("ref");
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // ── Contract write: claimReferralBuff ──────────────────────────────────────
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess: claimConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  function claimBuff(referee: string) {
    if (!address || !referee) return;
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: LOSSLESS_ARENA_ABI,
      functionName: "claimReferralBuff",
      args: [referee as `0x${string}`],
    });
  }

  // Auto-claim when a valid referrer is detected and the user is connected
  useEffect(() => {
    if (detectedReferrer && address && !isPending && !claimConfirmed) {
      // Small delay so the wallet is fully ready
      const t = setTimeout(() => claimBuff(detectedReferrer), 1500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedReferrer, address]);

  // ── Read on-chain buff state for current player ────────────────────────────
  const { data: expiryRaw } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: REFERRAL_BUFF_ABI,
    functionName: "referralBuffExpiry",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const { data: bonusRaw } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: REFERRAL_BUFF_ABI,
    functionName: "referralDefenseBonus",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const buffExpiresAt = expiryRaw ? Number(expiryRaw) : 0;
  const hasActiveBuff = buffExpiresAt > now;
  const buffHoursLeft = hasActiveBuff ? Math.max(0, Math.floor((buffExpiresAt - now) / 3600)) : 0;
  const defenseBonus = bonusRaw ? Number(bonusRaw) : 0;

  return {
    detectedReferrer,
    isClaiming: isPending,
    claimConfirmed,
    buffExpiresAt,
    hasActiveBuff,
    buffHoursLeft,
    defenseBonus,
    claimBuff,
  };
}
