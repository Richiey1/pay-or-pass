import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Helper function for delays between transactions
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🎮 Deploying PayOrPass contract...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Network:", network.name, "(Chain ID:", network.chainId.toString(), ")\n");

  // Get current nonce
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Starting deployment with nonce:", nonce, "\n");

  try {
    // Constructor Arguments: 1 hour defaultTimeout, 12000 defaultMultiplier (120%)
    const defaultTimeout = 3600; 
    const defaultMultiplier = 12000;

    console.log("Deploying PayOrPass contract...");
    const PayOrPass = await ethers.getContractFactory("PayOrPass");
    const payOrPass = await PayOrPass.deploy(defaultTimeout, defaultMultiplier);
    
    console.log("Waiting for deployment confirmation...");
    await payOrPass.waitForDeployment();
    
    const contractAddress = await payOrPass.getAddress();
    console.log("✅ PayOrPass deployed to:", contractAddress);

    // Get deployment transaction and wait for confirmation
    const deployTx = payOrPass.deploymentTransaction();
    if (deployTx) {
      console.log("Deployment transaction hash:", deployTx.hash);
      console.log("Waiting for transaction confirmation (waiting for 2 block confirmations)...");
      
      const receipt = await deployTx.wait(2);
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      
      console.log("Waiting for network to settle...");
      await sleep(5000);
      
      // Verify owner
      try {
        const owner = await payOrPass.owner();
        console.log("✅ Contract owner verified:", owner);
      } catch (error) {
        console.warn("⚠️ Could not verify contract owner yet.");
      }
    }

    // Save deployment info
    const deploymentInfo = {
      contractName: "PayOrPass",
      address: contractAddress,
      deployer: deployer.address,
      network: network.name,
      chainId: network.chainId.toString(),
      transactionHash: deployTx?.hash || "N/A",
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      constructorArgs: [defaultTimeout, defaultMultiplier]
    };

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Contract Name: PayOrPass");
    console.log("Address:", contractAddress);
    console.log("Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");
    console.log("Deployer:", deployer.address);
    console.log("Transaction Hash:", deployTx?.hash || "N/A");
    console.log("Block Number:", deploymentInfo.blockNumber);
    console.log("=========================\n");

    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `${network.name}-${network.chainId}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Deployment info saved to:", deploymentFile);

    const rootDeploymentFile = path.join(__dirname, "../deployment.json");
    fs.writeFileSync(rootDeploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Deployment info also saved to: deployment.json");

    console.log("\n🎉 Deployment completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
