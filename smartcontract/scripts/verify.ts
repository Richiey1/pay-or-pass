import { run } from "hardhat";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Verifying PayOrPass contract...\n");

  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = network.chainId.toString();

  console.log("Network:", networkName, "(Chain ID:", chainId, ")\n");

  // Try to load deployment info
  const deploymentFile = path.join(__dirname, "../deployment.json");
  const deploymentsFile = path.join(__dirname, "../deployments", `${networkName}-${chainId}.json`);

  let contractAddress: string | null = null;
  let deploymentInfo: any = null;

  // Check for deployment file
  if (fs.existsSync(deploymentFile)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
    contractAddress = deploymentInfo.address;
    console.log("📋 Found deployment info in deployment.json");
  } else if (fs.existsSync(deploymentsFile)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentsFile, "utf-8"));
    contractAddress = deploymentInfo.address;
    console.log("📋 Found deployment info in deployments folder");
  } else {
    // Try to get from environment variable or command line argument
    contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];
    
    if (!contractAddress) {
      console.error("❌ Contract address not found!");
      console.error("\nPlease provide the contract address in one of these ways:");
      console.error("1. Set CONTRACT_ADDRESS environment variable");
      console.error("2. Pass as command line argument: npm run verify <address>");
      console.error("3. Ensure deployment.json exists in the project root");
      process.exit(1);
    }
  }

  if (!contractAddress) {
    console.error("❌ Contract address is required for verification!");
    process.exit(1);
  }

  console.log("Contract Address:", contractAddress);
  console.log("Network:", networkName);
  console.log();

  // PayOrPass contract has constructor arguments [3600, 12000]
  const constructorArgs = deploymentInfo?.constructorArgs || [3600, 12000];

  console.log("🚀 Starting verification process...\n");

  try {
    console.log(`🔍 Verifying PayOrPass contract at ${contractAddress}...`);
    
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    
    console.log(`\n✅ PayOrPass contract verified successfully!`);
    
    // Print explorer link
    const explorerUrls: Record<string, string> = {
      celoAlfajores: `https://alfajores.celoscan.io/address/${contractAddress}`,
      celo: `https://celoscan.io/address/${contractAddress}`,
    };

    const explorerUrl = explorerUrls[networkName] || `https://celoscan.io/address/${contractAddress}`;
    console.log(`🔗 View on Explorer: ${explorerUrl}`);
    console.log();

  } catch (error: any) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log(`✅ Contract is already verified!`);
      const explorerUrl = `https://alfajores.celoscan.io/address/${contractAddress}`;
      console.log(`🔗 View on Explorer: ${explorerUrl}`);
    } else {
      console.error(`❌ Failed to verify contract:`, error.message);
      throw error;
    }
  }

  console.log("\n🎉 Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
