export const TOKENS = {
  CELO: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "CELO",
    entryFee: "10"
  },
  USDM: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    symbol: "USDm",
    entryFee: "5"
  },
  EURM: {
    address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    symbol: "EURm",
    entryFee: "5"
  },
  USDT: {
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    symbol: "USDT",
    entryFee: "5"
  },
  USDC: {
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    symbol: "USDC",
    entryFee: "5"
  }
};
export type TokenSymbol = keyof typeof TOKENS;
