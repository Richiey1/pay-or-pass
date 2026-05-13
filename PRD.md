# PayOrPass — Social Payment Game on Celo

## 🧠 One-Liner

A social mini-game where players must decide whether to pay a small amount or pass an increased amount to someone else — turning money into a game of pressure, strategy, and social dynamics.

---

## 🎯 Vision

Turn simple payments into an interactive, social, and behavioral experience — where money moves not just by intent, but by decision-making under pressure.

---

## 🚨 Problem

Digital payments today are:

- Passive
- One-directional
- Non-interactive

There is no **social or strategic layer** to how money moves.

At the same time:

- Users enjoy lightweight social games
- Viral loops drive adoption
- Financial behavior is influenced by peer pressure

---

## 💡 Core Concept

A player receives a request:

> “Pay 1 cUSD or pass 1.2 cUSD to someone else.”

They must choose:

- ✅ Pay → Lose 1 cUSD, chain ends
- 🔁 Pass → Forward increased amount to another user

---

## ⚡ Core Loop (10-second UX)

1. User receives a request
2. Timer starts (e.g. 60 seconds)
3. Choose:
   - Pay → end chain
   - Pass → send higher amount to another user
4. Repeat until someone pays

---

## 🎯 Key Mechanics

### 1. Pass Multiplier

- Each pass increases value (e.g. +20%)
- Creates pressure escalation

### 2. Time Constraint

- If user does nothing → auto-pay
- Prevents stalling

### 3. Chain Tracking

- Each chain has:
  - Originator
  - Path history
  - Final payer

### 4. Social Layer

- Users choose who to pass to
- Creates:
  - Trust dynamics
  - Strategic targeting
  - Social tension

---

## 🧠 “Wow” Moment

> “Wait… I can push this to someone else — but it gets worse for them.”

---

## 🎮 Game Modes

### Mode 1 — Classic

- Single chain
- Ends when someone pays

### Mode 2 — Timed Survival

- Last to survive without paying wins rewards

### Mode 3 — Group Chain

- Predefined group pool
- Circular passing

---

## 💰 Economic Model

### Entry

- Optional buy-in (e.g. 0.5 cUSD)

### Flow

- Money accumulates as chain grows
- Final payer absorbs cost

### Optional Reward Layer

- Portion redistributed:
  - Chain starter reward
  - Longest survivor reward

---

## 🔐 Smart Contract Design

### Contracts

#### 1. ChainManager

- Create chains
- Track participants
- Store chain state

#### 2. PaymentRouter

- Handles:
  - Transfers
  - Pass logic
  - Auto-execution

#### 3. TimerModule

- Enforces deadlines
- Triggers auto-pay

---

## 📱 UX Design (Celo Fit)

- Mobile-first UI
- Wallet connect (Valora / WalletConnect)
- One-click actions:
  - Pay
  - Pass

---

## 🔥 Why This Wins on Celo

### Alignment

- ✅ Payments (core primitive)
- ✅ Miniapp (fast interaction loop)
- ✅ Social (viral growth)
- ✅ Real usage (actual money movement)

### Metrics it drives

- Transactions per user
- Unique users
- Gas usage
- Retention via social loops

---

## ⚠️ Risks & Mitigation

### Risk: Looks like a chain scheme

Mitigation:

- Cap max multiplier
- Add skill/strategy elements
- Transparent rules

### Risk: Abuse / spam

Mitigation:

- Rate limits
- Opt-in participation
- Contact filtering

---

## 🚀 Future Extensions

- Reputation scoring
- NFT chain history
- Sponsored chains (brands fund pools)
- Farcaster integration (miniapp sharing)

---

## 🏁 Success Metrics

- Avg chain length
- Daily active players
- Completion rate
- Total value moved
- Viral coefficient

---

## 💬 Final Insight

This is not a gambling game.

It is:

> A behavioral experiment where money moves through social pressure and decision-making.

---
