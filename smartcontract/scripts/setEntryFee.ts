import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "hardhat";

const LOSSLESS_ARENA_ADDRESS = "0x9b932E9B16202760F4e3173B9Dbe060924857329";
const LOSSLESS_ARENA_ABI = [
  "function setEntryFee(uint256 _entryFee) external",
  "function entryFee() view returns (uint256)"
];

async function main() {
  const funderKey = process.env.ACCOUNT_PRIVATE_KEY;
  if (!funderKey) {
    throw new Error("ACCOUNT_PRIVATE_KEY not found in .env file");
  }

  const deployerSigner = new ethers.Wallet(funderKey, ethers.provider);
  console.log(`Connecting with admin wallet: ${deployerSigner.address}`);

  const contract = new ethers.Contract(LOSSLESS_ARENA_ADDRESS, LOSSLESS_ARENA_ABI, deployerSigner);

  const currentFee = await contract.entryFee();
  console.log(`Current Entry Fee: ${ethers.formatEther(currentFee)} CELO`);

  const newFee = ethers.parseEther("0.5"); // Lowering to 0.5 CELO
  console.log(`Setting new Entry Fee to 0.5 CELO...`);

  const tx = await contract.setEntryFee(newFee);
  console.log(`Transaction broadcasted: ${tx.hash}`);

  await tx.wait();
  console.log(`✅ Entry Fee successfully updated to 0.5 CELO!`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
