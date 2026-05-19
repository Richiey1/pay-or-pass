# PayOrPass — Social Payment Game on Celo

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![Network](https://img.shields.io/badge/Celo-Testnet-16D14E?style=flat-square&logo=celo)](https://celo.org)
[![Tests](https://img.shields.io/badge/Tests-9%20passing-success?style=flat-square)](https://github.com/Richiey1/pay-or-pass)

**One transaction → multiple social outcomes.**

**[Live App](https://payorpass.vercel.app/)**

</div>

---

## 🎯 Problem

Sending money today is completely passive and non-interactive. Users simply transfer stablecoins or native tokens without any social engagement, game theory, strategy, or peer pressure dynamics.

---

## 💡 Solution

**PayOrPass** — A social payment game on Celo where players choose:

- **Pay** — absorb the current amount, ending the escrow chain.
- **Pass** — forward an increased amount (20% more) to someone else, immediately transferring the pool balance to the recipient and raising the stakes!

Money becomes an interactive game of pressure, strategy, and social dynamics.

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Smart Contracts** | Solidity 0.8.20, Hardhat, TypeScript | Escrow game logic (create, pay, pass, timeouts) |
| **Frontend** | Next.js 15, React 18, ethers.js, Tailwind CSS, Framer Motion | High-fidelity responsive glassmorphic console dashboard |
| **Network** | Celo Alfajores Testnet | EVM-compatible L2 gas-optimized stablecoin network |

### Smart Contracts

#### `PayOrPass.sol`
- Create native/ERC20 payment chains.
- Pay/absorb to end chain.
- Pass to increase stake amount by 20% and forward pool balance.
- Strict timeout auto-resolution tracking.

---

## 🎮 How It Works

1. **Create Chain** — Commit a starting stake in CELO (e.g. 1 CELO).
2. **Choose** — Pay (end) or Pass (forward 1.2 CELO to a recipient).
3. **Chain Continues** — Each recipient faces the same choice under a strict 1-hour timeout.
4. **End Game** — Someone pays, absorbing the accumulated cost and ending the chain.

---

## 🚀 Development & Running Locally

### Smart Contracts

```bash
cd smartcontract

# Install local dependencies
npm install

# Compile contracts
npx hardhat compile

# Run the comprehensive 9-point unit test suite
npx hardhat test

# Deploy to Celo Alfajores Testnet
npx hardhat run scripts/deploy.ts --network celoAlfajores
```

### Frontend

```bash
cd frontend

# Install packages
npm install

# Run standard dev server
npm run dev

# Compile optimized production build
npm run build
```

---

## 🔗 Resources & Links

- [Live Application](https://payorpass.vercel.app/)
- [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)
- [Celo Developer Docs](https://docs.celo.org/)

---

## 📄 License

MIT © PayOrPass Protocol