import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const deployerPrivateKey = process.env.ACCOUNT_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const etherscanApiKey = process.env.ETHERSCAN_V2_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    }],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: { count: 20 },
    },
    celoAlfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
      chainId: 44787,
    },
  },
  etherscan: {
    apiKey: {
      celoAlfajores: process.env.CELOSCAN_API_KEY || etherscanApiKey,
    },
    customChains: [{
      network: "celoAlfajores",
      chainId: 44787,
      urls: {
        apiURL: "https://api-alfajores.celoscan.io/api",
        browserURL: "https://alfajores.celoscan.io",
      },
    }],
  },
};

export default config;
