import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Starting PayOrPass Phase 2 deployment to Celo Mainnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  const PayOrPass = await ethers.getContractFactory("PayOrPass");
  const payOrPass = await PayOrPass.deploy();
  
  await payOrPass.waitForDeployment();
  const address = await payOrPass.getAddress();

  console.log("✅ PayOrPass Phase 2 successfully deployed to:", address);
  
  // NOTE: You may want to configure yield pools for supported tokens here
  // e.g., await payOrPass.setYieldConfig(tokenAddress, poolAddress, mTokenAddress);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
