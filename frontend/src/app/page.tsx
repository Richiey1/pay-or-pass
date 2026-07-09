'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import CombatArena from '@/components/CombatArena';
import { Skull, Coins, ShieldAlert } from 'lucide-react';

export default function PayOrPassHome() {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Minimal */}
      <nav className="p-6 border-b border-gray-800 flex justify-between items-center relative z-10 bg-black/50 backdrop-blur-md">
        <h1 className="text-2xl font-black tracking-widest text-white flex items-center gap-3">
          <Skull className="text-red-500" />
          PAY OR PASS
        </h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm font-bold bg-gray-900 px-4 py-2 rounded-full border border-gray-700 flex items-center gap-2">
            <Coins size={16} className="text-yellow-500" />
            Prize Pool: <span className="text-white">1,245.50 CELO</span>
          </div>
          <w3m-button />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        {!address ? (
          <div className="text-center bg-gray-900/80 p-12 rounded-xl border border-gray-800 backdrop-blur-md max-w-lg">
            <ShieldAlert className="mx-auto text-red-500 mb-6" size={48} />
            <h2 className="text-3xl font-bold text-white mb-4">CONNECT TO ENTER</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Pay Or Pass is a lossless yield arena. Stake your principal safely, then battle others to win the generated yield.
            </p>
            <div className="flex justify-center">
              <w3m-button />
            </div>
          </div>
        ) : (
          <div className="w-full">
            <CombatArena />
          </div>
        )}
      </main>
    </div>
  );
}
