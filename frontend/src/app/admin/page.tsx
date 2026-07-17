'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits, parseAbi } from 'viem';

const PAYORPASS_ADDRESS = "0x6B667D149a8B0AF00C3880fE0f09a6D9D8Cb62C7";
const CELO_ERC20 = "0x471EcE3750Da237f93B8E339c536989b8978a438";

const PAYORPASS_ABI = parseAbi([
  "function isAdmin(address) external view returns (bool)",
  "function setTokenSupport(address token, bool isSupported, uint256 fee) external",
  "function setApyBasisPoints(uint256 newApy) external",
  "function setFightCooldown(uint256 _fightCooldown) external",
  "function setDistributionBPs(uint256 _winner, uint256 _poolSeed, uint256 _seasonal, uint256 _protocol) external"
]);

export default function AdminConsole() {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  const [apy, setApy] = useState('800');
  const [cooldownMins, setCooldownMins] = useState('1');
  const [tokenAddress, setTokenAddress] = useState(CELO_ERC20);
  const [minEntry, setMinEntry] = useState('0.05');

  // Distribution
  const [winnerBP, setWinnerBP] = useState('7000');
  const [poolSeedBP, setPoolSeedBP] = useState('1000');
  const [seasonalBP, setSeasonalBP] = useState('1000');
  const [protocolBP, setProtocolBP] = useState('1000');

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: isAdminWallet } = useReadContract({
    address: PAYORPASS_ADDRESS,
    abi: PAYORPASS_ABI,
    functionName: 'isAdmin',
    args: address ? [address as `0x${string}`] : undefined,
  });

  if (!mounted) return null;

  const handleSetApy = () => {
    writeContract({ address: PAYORPASS_ADDRESS, abi: PAYORPASS_ABI, functionName: 'setApyBasisPoints', args: [BigInt(apy)] });
  };

  const handleSetCooldown = () => {
    writeContract({ address: PAYORPASS_ADDRESS, abi: PAYORPASS_ABI, functionName: 'setFightCooldown', args: [BigInt(parseFloat(cooldownMins) * 60)] });
  };

  const handleSetToken = () => {
    const isStable = tokenAddress.toLowerCase() === "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e".toLowerCase() || tokenAddress.toLowerCase() === "0xcebA9300f2b948710d2653dD7B07f33A8B32118C".toLowerCase();
    writeContract({ address: PAYORPASS_ADDRESS, abi: PAYORPASS_ABI, functionName: 'setTokenSupport', args: [tokenAddress as `0x${string}`, true, parseUnits(minEntry, isStable ? 6 : 18)] });
  };

  const handleSetDist = () => {
    writeContract({ address: PAYORPASS_ADDRESS, abi: PAYORPASS_ABI, functionName: 'setDistributionBPs', args: [BigInt(winnerBP), BigInt(poolSeedBP), BigInt(seasonalBP), BigInt(protocolBP)] });
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <h1 className="text-2xl text-emerald-500 font-bold tracking-widest animate-pulse">CONNECT WALLET TO ACCESS DOMINUS TERMINAL</h1>
      </div>
    );
  }

  if (!isAdminWallet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] gap-4">
        <h1 className="text-4xl text-rose-500 font-black tracking-widest drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">ARENA ACCESS DENIED</h1>
        <p className="text-zinc-400 font-mono text-sm">Only the Dominus may access the control parameters.</p>
        <p className="text-zinc-600 font-mono text-xs mt-2">Connected: {address}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 pt-32 font-sans relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-4 border-b border-emerald-500/30 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-[0.3em] text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">DOMINUS TERMINAL</h1>
            <p className="text-emerald-500/60 text-xs font-mono tracking-widest mt-1">ARENA OMNI-CONTROL PROTOCOL ACTIVATED</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Economy Controls */}
          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
            <h2 className="text-xl font-bold tracking-widest mb-6 text-white border-b border-white/10 pb-2">ECONOMICS & PARAMS</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-mono text-zinc-400 mb-1">SIMULATED APY (Basis Points)</label>
                  <input type="number" value={apy} onChange={e => setApy(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <button onClick={handleSetApy} disabled={isPending || isWaiting} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">UPDATE</button>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-mono text-zinc-400 mb-1">FIGHT COOLDOWN (MINUTES)</label>
                  <input type="number" value={cooldownMins} onChange={e => setCooldownMins(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <button onClick={handleSetCooldown} disabled={isPending || isWaiting} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">UPDATE</button>
              </div>

              <div className="border border-white/10 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-mono text-emerald-400 font-bold mb-2">UPDATE TOKEN SUPPORT & FEE</label>
                <input type="text" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} placeholder="Token Address" className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white text-xs focus:outline-none focus:border-emerald-500" />
                <div className="flex gap-4">
                  <div className="flex-1">
                     <input type="number" value={minEntry} step="0.01" onChange={e => setMinEntry(e.target.value)} placeholder="Entry Fee (Ether)" className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white text-xs focus:outline-none focus:border-emerald-500" />
                  </div>
                  <button onClick={handleSetToken} disabled={isPending || isWaiting} className="px-4 py-2 bg-purple-500 text-white font-bold text-xs rounded-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]">SET SUPPORT</button>
                </div>
              </div>

            </div>
          </div>

          {/* Distribution */}
          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
            <h2 className="text-xl font-bold tracking-widest mb-6 text-white border-b border-white/10 pb-2">PRIZE DISTRIBUTION (SUM = 10000)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">WINNER BP</label>
                <input type="number" value={winnerBP} onChange={e => setWinnerBP(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">POOL SEED BP</label>
                <input type="number" value={poolSeedBP} onChange={e => setPoolSeedBP(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">SEASONAL BP</label>
                <input type="number" value={seasonalBP} onChange={e => setSeasonalBP(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">PROTOCOL BP</label>
                <input type="number" value={protocolBP} onChange={e => setProtocolBP(e.target.value)} className="w-full bg-black/50 border border-emerald-500/30 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <button onClick={handleSetDist} disabled={isPending || isWaiting} className="w-full bg-emerald-500/10 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black font-bold tracking-widest py-3 rounded-xl transition-all">
                UPDATE DISTRIBUTION SPLIT
              </button>
            </div>
          </div>
          
        </div>

        {(isPending || isWaiting) && (
          <div className="mt-8 bg-amber-500/20 border border-amber-500 p-4 rounded-xl flex items-center justify-center gap-3 text-amber-500 font-mono animate-pulse">
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-amber-500 animate-spin" />
            TRANSACTION IN PROGRESS... PLEASE WAIT
          </div>
        )}

      </div>
    </div>
  );
}
