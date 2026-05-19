'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'e3582ec1375cdfc243e00465c77cb9d5'

const metadata = {
  name: 'PayOrPass',
  description: 'Social Game Theory Payment Protocol on Celo',
  url: 'https://payorpass.vercel.app',
  icons: ['/paynpass-logo.png'],
}

const wagmiAdapter = new WagmiAdapter({
  networks: [celo, celoAlfajores],
  projectId,
  ssr: true,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo, celoAlfajores],
  defaultNetwork: celo,
  projectId,
  metadata,
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
  },
  themeMode: 'dark',
})

export function Web3Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
