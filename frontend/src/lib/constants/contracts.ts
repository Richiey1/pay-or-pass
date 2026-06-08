// Standardized Contract Constants for LosslessArena on Celo
export const CONTRACT_ADDRESS = '0x9b932E9B16202760F4e3173B9Dbe060924857329'; // Newly deployed Celo Mainnet contract address

export const LOSSLESS_ARENA_ABI = [
  "function enterArena() external payable",
  "function fight(address opponent) external",
  "function exitArena() external",
  "function gladiators(address) view returns (address player, uint256 principalStaked, uint256 totalYieldWon, uint256 wins, uint256 losses, uint256 lastFightAt, bool isActive)",
  "function totalArenaStake() view returns (uint256)",
  "function apyBasisPoints() view returns (uint256)",
  "function accumulatedPrizePool() view returns (uint256)",
  "function getActivePlayers() view returns (address[])",
  "function getCurrentPrizePool() view returns (uint256)",
  "function owner() view returns (address)",
  "function setApyBasisPoints(uint256 newApy) external",
  "function entryFee() view returns (uint256)",
  "function isAdmin(address) view returns (bool)"
];
