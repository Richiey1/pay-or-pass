import { parseAbi } from 'viem';

// Standardized Contract Constants for LosslessArena on Celo
export const CONTRACT_ADDRESS = '0x6B667D149a8B0AF00C3880fE0f09a6D9D8Cb62C7';

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
  REVEAL_CHOICE: "revealChoice",
  CURRENT_FIGHT: "currentFight",
  FIGHTS: "fights",
  JOIN_FIGHT: "joinFight"
} as const;

export const LOSSLESS_ARENA_ABI = parseAbi([
  "function enterArena(address token) external payable",
  "function submitChoice(address opponent, bytes32 commitHash) external",
  "function joinFight(uint256 fightId, bytes32 commitHash) external",
  "function revealChoice(uint256 fightId, uint8 choice, bytes32 salt) external",
  "function claimReferralBuff(address referee) external",
  "function currentFight(address) view returns (uint256)",
  "function fights(uint256) view returns (address player1, address player2, bytes32 commit1, bytes32 commit2, uint8 choice1, uint8 choice2, uint256 startTime, bool resolved, address token)",
  "function exitArena() external",
  "function gladiators(address) view returns (address player, uint256 principalStaked, uint256 totalYieldWon, uint256 wins, uint256 losses, uint256 lastFightAt, bool isActive, address stakeToken, bool inMoola)",
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
