import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🎮 Deploying LosslessArena contract...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name, "(Chain ID:", network.chainId.toString(), ")\n");

  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting deployment with nonce:", nonce, "\n");

  try {
    const LosslessArena = await ethers.getContractFactory("PayOrPass");
    const losslessArena = await LosslessArena.deploy();
    
    console.log("Waiting for deployment confirmation...");
    await losslessArena.waitForDeployment();
    
    const contractAddress = await losslessArena.getAddress();
    console.log("✅ PayOrPass deployed to:", contractAddress);

    const deployTx = losslessArena.deploymentTransaction();
    if (deployTx) {
      console.log("Deployment transaction hash:", deployTx.hash);
      console.log("Waiting for 2 block confirmations...");
      const receipt = await deployTx.wait(2);
      console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);
    }

    const deploymentInfo = {
      contractName: "PayOrPass",
      address: contractAddress,
      deployer: deployer.address,
      network: network.name,
      chainId: network.chainId.toString(),
      transactionHash: deployTx?.hash || "N/A",
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      constructorArgs: []
    };

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Contract Name: LosslessArena");
    console.log("Address:", contractAddress);
    console.log("=========================\n");

    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    const deploymentFile = path.join(deploymentDir, `${network.name}-${network.chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    const rootDeploymentFile = path.join(__dirname, "../deployment.json");
    fs.writeFileSync(rootDeploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 Deployment completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
