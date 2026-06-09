'use client'

import { useEffect, useState } from 'react'
import { useConnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false)
  const { connect } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    // Check if running inside MiniPay
    if (typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay) {
      setIsMiniPay(true)
      
      // Auto-connect if not already connected
      if (!isConnected) {
        connect({ connector: injected() })
      }
    }
  }, [connect, isConnected])

  return { isMiniPay }
}
