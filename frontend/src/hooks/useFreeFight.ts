/**
 * useFreeFight
 * Tracks the daily Free Fight credit earned by sharing the gladiator profile.
 *
 * Mechanic:
 *  - One free fight credit is granted per 24-hour window.
 *  - Credit is stored in localStorage keyed to the wallet address.
 *  - After the user clicks "Share on X/Twitter", the share window opens and
 *    we start a 10-second grace period before unlocking the credit (enough
 *    time for the tweet sheet to open — we can't verify the share server-side
 *    without a backend, so we trust-and-reward like most web3 social loops).
 *  - canClaim  → user has NOT yet shared today (show the CTA)
 *  - hasClaimed → user shared today (show "Credit active", countdown to reset)
 *  - hasFreeFight → credit is active and not yet consumed
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "payorpass_free_fight_";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function storageKey(address: string) {
  return `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
}

export interface FreeFightState {
  hasFreeFight: boolean;      // credit active and unused
  hasClaimed: boolean;        // shared today (regardless of whether credit consumed)
  canClaim: boolean;          // hasn't shared today
  hoursUntilReset: number;    // countdown in hours
  minutesUntilReset: number;  // remainder minutes
  claimCredit: () => void;    // call when user clicks share — opens twitter + grants credit
  consumeCredit: () => void;  // call when free fight is used
}

export function useFreeFight(address: string | undefined): FreeFightState {
  const [tick, setTick] = useState(0); // force recalc every minute

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  function getRecord() {
    if (!address) return null;
    try {
      const raw = localStorage.getItem(storageKey(address));
      if (!raw) return null;
      return JSON.parse(raw) as { sharedAt: number; consumed: boolean };
    } catch {
      return null;
    }
  }

  function saveRecord(record: { sharedAt: number; consumed: boolean }) {
    if (!address) return;
    localStorage.setItem(storageKey(address), JSON.stringify(record));
  }

  const record = getRecord();
  const now = Date.now();
  const withinWindow = record ? now - record.sharedAt < COOLDOWN_MS : false;
  const hasClaimed = withinWindow;
  const hasFreeFight = withinWindow && !record?.consumed;
  const canClaim = !hasClaimed;

  const msUntilReset = record && withinWindow ? COOLDOWN_MS - (now - record.sharedAt) : 0;
  const hoursUntilReset = Math.floor(msUntilReset / 3_600_000);
  const minutesUntilReset = Math.floor((msUntilReset % 3_600_000) / 60_000);

  const claimCredit = useCallback(() => {
    if (!address) return;
    // Open Twitter/X share sheet
    const tweetText = encodeURIComponent(
      `⚔️ I'm dominating the Lossless Arena in @PayOrPass! Fight me for the yield!\nhttps://payorpass.xyz/?ref=${address}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");

    // Grant credit after a short grace period (user opened the share window)
    setTimeout(() => {
      saveRecord({ sharedAt: Date.now(), consumed: false });
      setTick((t) => t + 1); // trigger re-render
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const consumeCredit = useCallback(() => {
    if (!address || !record) return;
    saveRecord({ ...record, consumed: true });
    setTick((t) => t + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, record]);

  return {
    hasFreeFight,
    hasClaimed,
    canClaim,
    hoursUntilReset,
    minutesUntilReset,
    claimCredit,
    consumeCredit,
  };
}
