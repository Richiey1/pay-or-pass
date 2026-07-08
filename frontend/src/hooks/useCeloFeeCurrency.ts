'use client'

import { useState, useEffect } from 'react'
import { useBalance, useAccount } from 'wagmi'

export const CELO_FEE_CURRENCIES = {
  USDm: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`,
  EURm: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73' as `0x${string}`,
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as `0x${string}`,
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as `0x${string}`,
  CELO: undefined, // native token — no feeCurrency field
} as const

export type CeloFeeCurrencyKey = keyof typeof CELO_FEE_CURRENCIES

/**
 * CIP-64 Fee Currency Hook
 *
 * Priority:
 * 1. Default → USDm (if user has USDm balance)
 * 2. Fallback → CELO native (if USDm balance is zero)
 * 3. User-selectable → USDm | EURm | USDC | USDT | CELO
 */
export function useCeloFeeCurrency() {
  const { address } = useAccount()
  const [selectedCurrency, setSelectedCurrency] = useState<CeloFeeCurrencyKey>('USDm')
  const [autoResolved, setAutoResolved] = useState(false)

  // Check USDm balance
  const { data: usdmBalance } = useBalance({
    address,
    token: CELO_FEE_CURRENCIES.USDm,
    query: { enabled: !!address },
  })

  // Auto-resolve: if user has no USDm, fall back to CELO
  useEffect(() => {
    if (usdmBalance !== undefined && !autoResolved) {
      if (usdmBalance.value === 0n) {
        setSelectedCurrency('CELO')
      } else {
        setSelectedCurrency('USDm')
      }
      setAutoResolved(true)
    }
  }, [usdmBalance, autoResolved])

  // The resolved feeCurrency address (undefined = pay in native CELO)
  const feeCurrency = CELO_FEE_CURRENCIES[selectedCurrency]

  return {
    feeCurrency,
    selectedCurrency,
    setSelectedCurrency,
    usdmBalance,
    currencies: Object.keys(CELO_FEE_CURRENCIES) as CeloFeeCurrencyKey[],
  }
}
