import React from 'react';
import { X, Swords, Trophy, Skull, Zap, Crosshair } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS, FUNCTION_NAMES } from '@/lib/constants/contracts';

interface OpponentHUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentAddress: string | null;
  onSelect: (address: string) => void;
  isInArena: boolean;
}

export const OpponentHUDModal: React.FC<OpponentHUDModalProps> = ({ 
  isOpen, 
  onClose, 
  opponentAddress,
  onSelect,
  isInArena
}) => {
  const { data: gladiatorData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GLADIATORS,
    args: opponentAddress ? [opponentAddress] : undefined,
    query: {
      enabled: !!opponentAddress && isOpen,
    }
  });

  if (!isOpen || !opponentAddress) return null;

  const data = gladiatorData as any;
  const wins = data ? Number(data[3]) : 0;
  const losses = data ? Number(data[4]) : 0;
  const yieldWon = data ? formatEther(data[2]) : "0.0";
  const totalFights = wins + losses;
  const winRate = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-black border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/20 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 animate-pulse">
              <Crosshair className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest italic">TARGET HUD</h2>
              <p className="text-xs text-white/50 font-mono flex items-center gap-2">
                {opponentAddress.slice(0, 6)}...{opponentAddress.slice(-4)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-500/30 bg-red-950/20 overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.4)]">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${opponentAddress}`}
                alt="Gladiator Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-white/5 rounded-2xl" />
              <div className="h-16 bg-white/5 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs font-black text-white/50 tracking-widest">YIELD WON</span>
                </div>
                <div className="text-lg font-black text-yellow-500">{parseFloat(yieldWon).toFixed(4)} CELO</div>
              </div>

              <div className="bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 text-green-500 mb-2" />
                <div className="text-[10px] font-black text-white/50 tracking-widest">VICTORIES</div>
                <div className="text-2xl font-black text-white">{wins}</div>
              </div>

              <div className="bg-gradient-to-br from-red-500/5 to-transparent border border-red-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Skull className="w-5 h-5 text-red-500 mb-2" />
                <div className="text-[10px] font-black text-white/50 tracking-widest">DEFEATS</div>
                <div className="text-2xl font-black text-white">{losses}</div>
              </div>
              
              <div className="col-span-2 text-center text-xs text-white/40 mt-2">
                Win Rate: <span className="text-white font-bold">{winRate}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="p-6 border-t border-white/5 bg-black/50">
          <button 
            onClick={() => {
              onSelect(opponentAddress);
              onClose();
            }}
            disabled={!isInArena || isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black p-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Crosshair className="w-5 h-5" /> SELECT TARGET
          </button>
          {!isInArena && (
            <div className="text-center text-xs text-red-400 font-bold mt-3">You must be in the arena to select a target.</div>
          )}
        </div>

      </div>
    </div>
  );
};
