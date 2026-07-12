# 🎮 PayOrPass (Lossless Arena) Phase 2

**An Elite Retail Onboarding play. A Social GameFi app designed to abstract away DeFi yield generation behind a fun, risk-free gladiator arena.**

---

## 🌐 Deployed Contracts (Celo Mainnet)

* **PayOrPass (LosslessArena):** [`0x5644B2467Ec62e1Ef91dc44D8E5Fe545d16665Df`](https://celoscan.io/address/0x5644B2467Ec62e1Ef91dc44D8E5Fe545d16665Df)

---

## 🎯 The Protocol Paradigm

Traditional DeFi yield products are boring and complex. **PayOrPass Phase 2** transforms passive yield generation into an interactive, risk-free game.

Players stake an entry fee (CELO, USDm, etc.) into a principal-protected vault. The combined TVL of all gladiators accrues yield (simulated 8% APY or real Moola Market interest). This accumulated yield is the real prize pool.

### Strategic Combat (Commit-Reveal)
Players don't just roll dice; they use strategy:
- ⚔️ **Strike** (Drains opponent's yield)
- 🛡️ **Block** (Stops a strike)
- 📈 **Yield** (Grows cleanly)

### The 70/10/10 Prize Split
When a player wins a fight, the pool isn't drained to zero:
1. **70%** goes to the winner.
2. **10%** stays in the Global Prize Pool.
3. **10%** funds the Seasonal Leaderboard.

*Your principal is NEVER at risk. You can withdraw 100% of your initial stake at any time.*

---

## 🚀 Viral Social Loops

- **Daily Free Fights:** Share your "Victory Card" on Farcaster or Twitter to earn 1 free fight energy per day.
- **Referral Buffs:** Invite a friend to play, and BOTH of you receive a Defense Buff for 24 hours.
- **Mega Yield Pings:** Receive MiniPay push notifications when the prize pool crosses massive thresholds.

---

## 🏗️ Directory Architecture

```
PayorPass/
├── smartcontract/             # Solidity Workspace
│   ├── contracts/             # Core Protocol Contracts
│   │   └── PayOrPass.sol      # LosslessArena, commit-reveal logic
│   └── hardhat.config.ts      # TypeScript Hardhat config
│
└── frontend/                  # NextJS Web3 Game Client
    ├── src/
    │   ├── app/
    │   │   └── page.tsx       # Stake & Enter, Combat UI, Leaderboards
    └── package.json           # Frontend packages
```

---

## 🧪 Quickstart

Navigate to `frontend`, install requirements, and run the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on a Web3 browser to play locally!