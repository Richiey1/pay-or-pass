import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "hardhat";

const LOSSLESS_ARENA_ADDRESS = "0x0219aBDc1D2C84b027EC7046196Ae397f7FED703";
const LOSSLESS_ARENA_ABI = [
  "function setTokenSupport(address token, bool isSupported, uint256 fee) external",
  "function entryFees(address) view returns (uint256)"
];

const CELO_ERC20 = "0x471EcE3750Da237f93B8E339c536989b8978a438";
const USDM_TOKEN = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

async function main() {
  const funderKey = process.env.ACCOUNT_PRIVATE_KEY;
  if (!funderKey) {
    throw new Error("ACCOUNT_PRIVATE_KEY not found in .env file");
  }

  const deployerSigner = new ethers.Wallet(funderKey, ethers.provider);
  console.log(`Connecting with admin wallet: ${deployerSigner.address}`);

  const contract = new ethers.Contract(LOSSLESS_ARENA_ADDRESS, LOSSLESS_ARENA_ABI, deployerSigner);

  const newFee = ethers.parseEther("0.005"); 
  
  console.log(`Setting new Entry Fee to 0.005 for USDm...`);
  const tx1 = await contract.setTokenSupport(USDM_TOKEN, true, newFee);
  console.log(`Transaction broadcasted: ${tx1.hash}`);
  await tx1.wait();
  console.log(`✅ USDm Entry Fee successfully updated to 0.005!`);
  
  console.log(`Setting new Entry Fee to 0.005 for CELO...`);
  const tx2 = await contract.setTokenSupport(CELO_ERC20, true, newFee);
  console.log(`Transaction broadcasted: ${tx2.hash}`);
  await tx2.wait();
  console.log(`✅ CELO Entry Fee successfully updated to 0.005!`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
