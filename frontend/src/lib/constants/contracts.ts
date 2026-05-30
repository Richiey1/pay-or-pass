// Standardized Contract Constants for PayOrPass on Celo
export const CONTRACT_ADDRESS = '0x954613CfCd0AA7281C6E59C960205218185a5543'; // Newly deployed Celo Mainnet contract address

export const PAY_OR_PASS_ABI = [
  "function createChain(address token, uint256 amount) external payable returns (uint256)",
  "function pay(uint256 chainId) external payable",
  "function pass(uint256 chainId, address to) external",
  "function chains(uint256) view returns (address originator, address currentHolder, uint256 amount, uint256 createdAt, uint256 lastActionAt, uint256 passCount, uint256 multiplier, address tokenAddress, uint8 status)",
  "function getNextAmount(uint256) view returns (uint256)",
  "function isTimeoutReached(uint256) view returns (bool)",
  "function supportedTokens(address) view returns (bool)",
  "function defaultTimeout() view returns (uint256)",
  "function defaultMultiplier() view returns (uint256)",
  "function getPasses(uint256) view returns (tuple(uint256 chainId, address from, address to, uint256 amount, uint256 timestamp)[])",
  "function getReputation(address) view returns (uint256)",
  "function claimableDividends(address, address) view returns (uint256)",
  "function claimDividends(address) external"
];
