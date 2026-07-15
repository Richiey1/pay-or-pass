# PayOrPass: The Social Lossless Arena

PayOrPass transforms passive yield generation into a highly social, risk-free competitive experience. By abstracting away complex DeFi mechanics, we provide an accessible, engaging platform for retail users to earn and compete.

---

### 🌟 Core Concept

At its heart, PayOrPass is a principal-protected arena. Users stake assets (CELO, USDm, USDC, etc.) to enter. The aggregated Total Value Locked (TVL) generates yield in the background. Players compete for this yield, but **the initial staked principal is never at risk and can be withdrawn at any time.**

### ⚔️ The Combat System

Battles are resolved using a secure commit-reveal system, ensuring fair play and strategic depth. In each encounter, players choose their stance:
- **Strike:** Attempt to capture the opponent's yield.
- **Block:** Defend against incoming strikes.
- **Yield:** Focus on maximizing personal pool growth.

### 💰 Sustainable Prize Distribution (70/10/10)

Unlike winner-takes-all systems that drain liquidity, PayOrPass uses a sustainable distribution model for the accrued yield:
- **70%** awarded to the victorious player.
- **10%** injected into the Global Prize Pool.
- **10%** allocated to the Seasonal Leaderboard rewards.
- *5% network fee.*

---

### 📡 Live Deployment

PayOrPass is deployed and active on the Celo Mainnet.

**LosslessArena Contract:**
[`0x6B667D149a8B0AF00C3880fE0f09a6D9D8Cb62C7`](https://celoscan.io/address/0x6B667D149a8B0AF00C3880fE0f09a6D9D8Cb62C7)

---

### 💻 Development Setup

To run the application locally:

1.  **Clone and install dependencies:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

3.  **Access the application:**
    Open `http://localhost:3000` in a Web3-enabled browser.

---

### 📱 MiniPay Integration

PayOrPass is fully optimized for the Celo MiniPay environment, featuring:
- Seamless auto-connection.
- CIP-64 fee abstraction (users pay gas in stablecoins).
- Responsive, mobile-first UI components tailored for the MiniPay viewport.