# 🎮 PayOrPass (Lossless Arena)

**An Elite Retail Onboarding play. A GameFi app designed to abstract away DeFi yield generation behind a fun, risk-free arcade game to drive massive Daily Active Users (DAUs).**

---

## 🌐 Deployed Contracts (Celo Mainnet)

* **LosslessArena:** [`0x9b932E9B16202760F4e3173B9Dbe060924857329`](https://celoscan.io/address/0x9b932E9B16202760F4e3173B9Dbe060924857329)

---

## 🎯 The Protocol Paradigm

Traditional DeFi yield products are boring and complex. **Lossless Arena** disrupts this design by transforming passive yield generation into an interactive, risk-free game.

Every player stakes exactly 10 CELO into the principal-protected vault. The massive combined TVL of all active gladiators accrues yield (e.g. 8% APY). This accumulated yield is the real prize pool that players fight for.

When a player initiates combat:
1. **🏆 The Winner**: Absorbs the ENTIRE accrued "Global Prize Pool" yield that has accumulated since the last fight.
2. **🛡️ The Loser**: Simply records a loss on their ledger, but their 10 CELO principal remains 100% intact.

You can withdraw your 10 CELO principal and exit the arena at any time.

---

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
* **Secure Admin Governance Panel**: An owner-exclusive UI module restricted to the contract deployer. Allows real-time tuning of game-theoretic constants: Round Timeouts, Escrow Pass Multipliers, and Simulated Yield APY.

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