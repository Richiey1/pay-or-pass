import { parseAbi } from 'viem';

// Standardized Contract Constants for LosslessArena on Celo
export const CONTRACT_ADDRESS = '0x90F24681A7b99cDa24B25E9f1bb2ce6E374786d7'; // Newly deployed Celo Mainnet contract address

export const FUNCTION_NAMES = {
  ENTER_ARENA: "enterArena",
  FIGHT: "fight",
  EXIT_ARENA: "exitArena",
  GLADIATORS: "gladiators",
  TOTAL_ARENA_STAKE: "totalArenaStake",
  APY_BASIS_POINTS: "apyBasisPoints",
  ACCUMULATED_PRIZE_POOL: "accumulatedPrizePool",
  GET_ACTIVE_PLAYERS: "getActivePlayers",
  GET_CURRENT_PRIZE_POOL: "getCurrentPrizePool",
  OWNER: "owner",
  SET_APY_BASIS_POINTS: "setApyBasisPoints",
  ENTRY_FEE: "entryFee",
  IS_ADMIN: "isAdmin",
  SET_ENTRY_FEE: "setEntryFee",
  SET_FIGHT_COOLDOWN: "setFightCooldown",
  FIGHT_COOLDOWN: "fightCooldown",
} as const;

export const LOSSLESS_ARENA_ABI = parseAbi([
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
  "function setEntryFee(uint256 newFee) external",
  "function setFightCooldown(uint256 newCooldown) external",
  "function entryFee() view returns (uint256)",
  "function fightCooldown() view returns (uint256)",
  "function isAdmin(address) view returns (bool)"
]);
