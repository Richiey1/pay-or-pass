"use client";

import React from "react";
import { Zap, Clock, Check } from "lucide-react";

interface FreeFightBannerProps {
  canClaim: boolean;
  hasClaimed: boolean;
  hasFreeFight: boolean;
  hoursUntilReset: number;
  minutesUntilReset: number;
  onClaim: () => void;
}

/**
 * FreeFightBanner
 *
 * Renders inside the gladiator profile panel (when user is in arena).
 * Three states:
 *  1. canClaim   → Prominent CTA: "Share to earn 1 Free Fight today"
 *  2. hasFreeFight (after share, not yet used) → "⚡ Free Fight ready!"
 *  3. hasClaimed + !hasFreeFight → cooldown countdown
 */
export default function FreeFightBanner({
  canClaim,
  hasClaimed,
  hasFreeFight,
  hoursUntilReset,
  minutesUntilReset,
  onClaim,
}: FreeFightBannerProps) {
  if (hasFreeFight) {
    // Credit active, not yet used
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl border animate-pulse"
        style={{
          background: "rgba(234,179,8,0.08)",
          borderColor: "rgba(234,179,8,0.35)",
        }}
      >
        <Zap className="w-4 h-4 shrink-0 text-yellow-400" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
            ⚡ Free Fight Credit Active
          </div>
          <div className="text-[9px] text-white/40 tracking-wider mt-0.5">
            Pick an opponent — this fight won't cost you stake entry
          </div>
        </div>
      </div>
    );
  }

  if (hasClaimed && !hasFreeFight) {
    // Already used today
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl border"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Check className="w-4 h-4 shrink-0 text-green-500" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-widest text-white/50 uppercase">
            Daily Fight Used
          </div>
          <div className="text-[9px] text-white/30 tracking-wider mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 inline" />
            Resets in {hoursUntilReset}h {minutesUntilReset}m
          </div>
        </div>
      </div>
    );
  }

  // canClaim — prominent share CTA
  return (
    <button
      onClick={onClaim}
      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
      style={{
        background: "linear-gradient(135deg, rgba(29,161,242,0.12), rgba(99,102,241,0.08))",
        borderColor: "rgba(29,161,242,0.35)",
      }}
    >
      {/* X / Twitter icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
        style={{ background: "rgba(29,161,242,0.15)" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-[#1DA1F2]"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-[10px] font-black tracking-widest text-[#1DA1F2] uppercase">
          Share → Earn 1 Free Fight
        </div>
        <div className="text-[9px] text-white/40 tracking-wider mt-0.5">
          Post your gladiator profile on X — resets every 24h
        </div>
      </div>
      <Zap className="w-4 h-4 text-yellow-400 shrink-0 group-hover:animate-bounce" />
    </button>
  );
}
