// Standardized Contract Constants for PayOrPass on Celo
export const CONTRACT_ADDRESS = '0xa87103254B860E8ad2EAcD2EAcD2EAcD2EAcD2EA'; // Default fallback, customizable in env

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
];
