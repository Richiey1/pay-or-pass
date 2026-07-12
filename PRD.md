# 📘 Product Requirements Document (PRD): PayOrPass (Phase 2)

## 🟢 Product Name
PayOrPass (Lossless Arena)

## 🧠 One-Line Summary
A social GameFi primitive where players stake assets into a lossless gladiator arena, fight for accumulated DeFi yield using commit-reveal combat, and keep 100% of their principal safe.

---

## 🎯 Problem Statement
DeFi yield generation is isolated, boring, and too complex for retail users.
- Standard yield strategies fail to provide any interactive engagement.
- Users are often forced to choose between highly risky speculation or slow, boring yields.
- There are no viral social loops built directly into DeFi protocols.

---

## 💡 Solution
PayOrPass abstracts DeFi complexity behind an engaging, risk-free game:
- **100% Principal Protection:** Users stake CELO/USDm/etc., which is vaulted and earns yield (Simulated 8% APY or real Moola Market interest). The principal is never lost.
- **Commit-Reveal Strategic Combat:** Replaces pure randomness with player agency. Players secretly choose Strike, Block, or Yield.
- **Viral Social Loops:** Integrating Farcaster/Twitter sharing for daily "Free Fights" and referral-based Defense Buffs.

---

## ⚙️ Core Product Features

### 1. Strategic Combat (Strike / Block / Yield)
- **Strike:** Drains a percentage of the opponent's yield.
- **Block:** Defends against Strikes.
- **Yield:** Grows the player's share cleanly, unless hit by a Strike.
- Uses a `submitChoice` (commit) and `revealChoice` pattern.

### 2. The 70/10/10 Prize Split
When a fight is won, the entire global pool is NOT drained. Instead:
- **70-80%** to the fight winner.
- **10%** back to the Global Prize Pool (ensures the pool never hits zero).
- **10%** to a Seasonal Leaderboard fund.
- **5%** protocol fee.

### 3. Social Mechanics
- **Daily Free Fight:** Sharing a gladiator profile or "Share My Victory" card on social media grants 1 Free Energy fight per day (24h cooldown).
- **Referral Buff:** Friends joining via a referral link grant both players a +1 Defense Buff for 24 hours.

### 4. Push Notifications
- MiniPay web push notifies players when a "Mega Yield" threshold is crossed in the arena.

---

## 🏗️ Technical Architecture

### Smart Contracts (Solidity)
- **`LosslessArena.sol`**:
  - Manages stakes, yields, and the commit-reveal combat logic.
  - Implements the 70/10/10 `distributeFight()` split.
  - Handles referral buff storage and daily free fight claims.

### Frontend
- Next.js (TypeScript) + Tailwind CSS.
- Single "Stake & Enter" button (DeFi complexity hidden).
- Animated round resolution screen.
- Leaderboards (Top Earners, Longest Streak, Season Rank).
- MiniPay CIP-64 fee abstraction.
