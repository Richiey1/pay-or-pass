# 🎮 Celo PayOrPass — Game-Theoretic Social Payment Escrow

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![Network](https://img.shields.io/badge/Celo-Testnet-16D14E?style=flat-square&logo=celo)](https://celo.org)
[![Tests](https://img.shields.io/badge/Tests-9%20passing-success?style=flat-square)](https://github.com/Richiey1/pay-or-pass)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)

**Turn passive Web3 transactions into high-stakes social coordinate games. One transaction → multiple behavioral outcomes.**

[Explore Live Terminal](https://payorpass.vercel.app/) • [Review Verified Contract](https://alfajores.celoscan.io/address/0xeacf08b103e33b66444444444444444444444444)

</div>

---

## 🎯 The Protocol Paradigm

Traditional payment systems are passive. When funds are transferred, they exist in a binary state of completion. **Celo PayOrPass** disrupts this design by transforming raw transfers into an interactive, time-constrained game theory sequence.

Every payment exists inside a dynamic escrow chain. Upon receiving the "hot potato" pool, the current holder is subjected to two opposing forces:
1. **💰 Absorb & Pay**: Settle the current accumulated pool cost to terminate the chain and end the cycle.
2. **🔁 Pass**: Deflect the pressure by immediately forwarding the pool to a new recipient, instantly transferring the accumulated balance to them, but **increasing the stake requirement by 20%**!

---

## ⚙️ Mathematical Game Mechanics

Every social payment chain operates on rigorous, deterministic on-chain rules:

### 1. Dynamic Stake Escalation
When a chain is passed, the next required payment amount ($A_{n+1}$) escalates dynamically based on the current pool amount ($A_n$) and the pass multiplier ($M$):

$$A_{n+1} = A_n \times \left(1 + \frac{M}{10000}\right)$$

*By default, the multiplier is set to `12000` basis points ($1.2\times$ or a $20\%$ escalation).*

| Pass Step | Required CELO Stake | Escrow Growth |
|---|---|---|
| **Originator Start** | `1.00 CELO` | Initial escrow pool size |
| **Pass 1** | `1.20 CELO` | +0.20 CELO added to holder pool |
| **Pass 2** | `1.44 CELO` | +0.24 CELO added to holder pool |
| **Pass 3** | `1.728 CELO` | +0.288 CELO added to holder pool |

### 2. Time-Lock Constraints (The Hot Potato Loop)
Every holder is subject to a strict timeout duration ($T$):
$$T_{\text{expiry}} = \text{lastActionTimestamp} + \text{defaultTimeout}$$

*By default, the timeout is configured to `3600` seconds (1 hour).*
* **If the timer expires ($t > T_{\text{expiry}}$)**: The chain deadlocks. Anyone can trigger `triggerTimeout` to freeze state transitions and mark the chain as `TimedOut`.

---

## 🏗️ Directory Architecture

The repository is divided into two highly optimized workspaces:

```
PayorPass/
├── smartcontract/             # Solidity & Hardhat Sandbox Workspace
│   ├── contracts/             # Core Protocol Contracts
│   │   ├── PayOrPass.sol      # Main state logic & escrow engine
│   │   └── mocks/             # ERC20 mock interfaces for sandboxed tests
│   ├── scripts/               # TypeScript deploy & verification routines
│   │   ├── deploy.ts          # Alpha Celo deployment setup
│   │   └── verify.ts          # Celoscan verification script
│   ├── test/                  # Comprehensive Chai unit tests
│   │   └── PayOrPass.test.ts  # 9-point contract lifecycle verification
│   └── hardhat.config.ts      # TypeScript Hardhat config
│
└── frontend/                  # NextJS Web3 Command Terminal
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx       # Dark glassmorphic Social Dashboard
    │   │   └── globals.css    # Tailwind base styling directives
    │   └── lib/
    │       └── constants/     # Chain IDs & ABI parameters
    └── package.json           # Frontend packages mapping
```

---

## 💎 Frontend Features (State-of-the-Art Terminal)

The Celo PayOrPass Web3 client is engineered for visual premium and fluid engagement:
* **Floating Glassmorphic Console**: Borderless blurred control panels styled with HSL tailored dark-mode gradients and glowing emerald green highlights.
* **On-Chain Social Pipeline Renders**: Queries `getPasses` dynamically from Celo ledger logs to compile a visual timeline of the social path history showing addresses, pass steps, amounts, and dates.
* **Real-time Countdown Ticker**: Features a ticking millisecond-accurate timer showing remaining time before a deadlock.
* **Wallet Auto-Connect & MiniPay Live Support**: Natively detects Opera Mini and Valora browser providers for zero-friction transaction signing.

---

## 🧪 Smart Contract Operations

### Core Functions

```solidity
/**
 * @notice Start a new social escrow chain
 * @param token The token address (0x000... for native CELO)
 * @param amount Starting pool size (staked by originator)
 */
function createChain(address token, uint256 amount) external payable returns (uint256);

/**
 * @notice Pay the current accumulated stake to close the chain
 * @param chainId Target lookup ID
 */
function pay(uint256 chainId) external payable;

/**
 * @notice Pass the chain, forwarding pool balance and increasing next amount by 20%
 * @param chainId Target lookup ID
 * @param to Address of the new recipient
 */
function pass(uint256 chainId, address to) external;
```

---

## 🚀 Sandbox Development Guide

### Prerequisites
* [Node.js v18+](https://nodejs.org)
* [NPM](https://npmjs.com)

### 1. Smart Contract Sandbox

Navigate to the `smartcontract` folder, install dependencies, compile, and run tests:
```bash
cd smartcontract

# Install local dependencies
npm install

# Compile contracts and generate TypeChain artifacts
npx hardhat compile

# Run the comprehensive Chai unit test suite
npx hardhat test
```

Expected output:
```bash
  PayOrPass Contract
    Deployment & Configuration
      ✔ Should set the right default parameters and owner (1662ms)
      ✔ Should allow the owner to update timeout and multiplier
    Chain Lifecycle (Native Token)
      ✔ Should successfully create a payment chain (43ms)
      ✔ Should fail chain creation with mismatched native value
      ✔ Should allow the current holder to pay and complete the chain
      ✔ Should successfully pass the chain, increasing the stakes by 20%
      ✔ Should prevent non-holders from passing the chain
    Timeout Handling
      ✔ Should reject timeout trigger if duration has not passed
      ✔ Should trigger timeout successfully after delay

  9 passing (2s)
```

### 2. Frontend Interface Sandbox

Navigate to `frontend`, install requirements, and run the Next.js development server:
```bash
cd ../frontend

# Install dependencies
npm install

# Start Next.js hot-reloaded development portal
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on a Web3 browser to play locally!

To test a production bundle compile:
```bash
npm run build
```

---

## 🌍 Testnet Deployment & Verification

To deploy to Celo Alfajores Testnet, populate your variables inside `smartcontract/.env`:
```env
ACCOUNT_PRIVATE_KEY="0x..."
CELOSCAN_API_KEY="your-celoscan-api-key"
```

Execute the TS deployment pipeline:
```bash
# Run deployment script
npx hardhat run scripts/deploy.ts --network celoAlfajores

# Verify on Celoscan
npx hardhat run scripts/verify.ts --network celoAlfajores
```

---

## 🔗 Resources
* [Celo Protocol Network Docs](https://docs.celo.org/)
* [Hardhat Framework Documentation](https://hardhat.org/)
* [Tailwind CSS Styling](https://tailwindcss.com/)

---

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © **PayOrPass Protocol**