# PayOrPass — Social Payment Game on Celo

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![Network](https://img.shields.io/badge/Celo-Testnet-16D14E?style=flat-square&logo=celo)](https://celo.org)

**One transaction → multiple social outcomes.**

**[Live App](https://payorpass.vercel.app/) · [Smart Contracts](https://github.com/bbkenny/autosplit/tree/main/blocxtactoe-smartcontract)**

</div>

---

## 🎯 Problem

Sending money is passive and non-interactive. Users simply transfer funds without engagement, strategy, or social dynamics.

---

## 💡 Solution

**PayOrPass** — A social payment game on Celo where players choose:

- **Pay** — absorb the current amount, ending the chain
- **Pass** — forward an increased amount (20% more) to someone else

Money becomes a game of pressure, strategy, and social dynamics.

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Smart Contracts** | Solidity 0.8.20, Hardhat | PayOrPass game logic (create, pay, pass) |
| **Frontend** | Next.js 15, React 18, ethers.js | Game UI with wallet integration |
| **Network** | Celo Alfajores | EVM-compatible stablecoin L2 |

### Smart Contracts

#### `PayOrPass.sol`
- Create payment chains
- Pay to end chain
- Pass to increase amount and forward
- Chain state tracking
- Timeout auto-resolution

---

## 🎮 How It Works

1. **Create Chain** — Start with 1 cUSD
2. **Choose** — Pay (end) or Pass (forward 1.2 cUSD)
3. **Chain Continues** — Each recipient faces same choice
4. **End Game** — Someone pays, absorbing the accumulated cost

---

## 🚀 Development

### Smart Contracts

```bash
cd BlocxTacToe/blocxtactoe-smartcontract

# Install
npm install

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy
npx hardhat run scripts/deploy.js --network alfajores
```

### Frontend

```bash
cd BlocxTacToe/blocxtactoe-frontend

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

---

## 🔗 Links

- [Live App](https://payorpass.vercel.app/)
- [Smart Contracts](https://github.com/bbkenny/autosplit/tree/main/blocxtactoe-smartcontract)
- [Celo Alfajores Faucet](https://faucet.celo.org/alfajores)

---

## 📄 License

MIT © PayOrPass Protocol