import { parseAbi } from 'viem';

// Standardized Contract Constants for LosslessArena on Celo
export const CONTRACT_ADDRESS = '0x9b932E9B16202760F4e3173B9Dbe060924857329'; // Newly deployed Celo Mainnet contract address

export const FUNCTION_NAMES = {
  ENTER_ARENA: "enterArena",
  SUBMIT_CHOICE: "submitChoice",
  EXIT_ARENA: "exitArena",
  GLADIATORS: "gladiators",
  TOTAL_ARENA_STAKE: "totalArenaStake",
  APY_BASIS_POINTS: "apyBasisPoints",
  ACCUMULATED_PRIZE_POOL: "accumulatedPrizePools",
  GET_ACTIVE_PLAYERS: "getActivePlayers",
  GET_CURRENT_PRIZE_POOL: "getCurrentPrizePool",
  OWNER: "owner",
  SET_APY_BASIS_POINTS: "setApyBasisPoints",
  ENTRY_FEE: "entryFees",
  IS_ADMIN: "isAdmin",
  SET_ENTRY_FEE: "setEntryFee",
  SET_FIGHT_COOLDOWN: "setFightCooldown",
  FIGHT_COOLDOWN: "fightCooldown",
} as const;

export const LOSSLESS_ARENA_ABI = parseAbi([
  "function enterArena(address token) external payable",
  "function submitChoice(address opponent, bytes32 commitHash) external",
  "function exitArena() external",
  "function gladiators(address) view returns (address player, uint256 principalStaked, uint256 totalYieldWon, uint256 wins, uint256 losses, uint256 lastFightAt, bool isActive, address stakeToken)",
  "function totalArenaStake() view returns (uint256)",
  "function apyBasisPoints() view returns (uint256)",
  "function accumulatedPrizePools(address) view returns (uint256)",
  "function getActivePlayers() view returns (address[])",
  "function getCurrentPrizePool(address token) view returns (uint256)",
  "function owner() view returns (address)",
  "function setApyBasisPoints(uint256 newApy) external",
  "function setEntryFee(uint256 newFee) external",
  "function setFightCooldown(uint256 newCooldown) external",
  "function entryFees(address) view returns (uint256)",
  "function fightCooldown() view returns (uint256)",
  "function isAdmin(address) view returns (bool)"
]);
