import React from 'react';
import { Share2 } from 'lucide-react';

interface VictoryCardProps {
  myAddress: string;
  opponentAddress: string;
  yieldEarned: string;
  streak: number;
}

export function VictoryCard({ myAddress, opponentAddress, yieldEarned, streak }: VictoryCardProps) {
  const shortMyAddr = `${myAddress.slice(0, 6)}...${myAddress.slice(-4)}`;
  const shortOppAddr = `${opponentAddress.slice(0, 6)}...${opponentAddress.slice(-4)}`;

  const textToShare = `⚔️ PayOrPass Victory\n\n@${shortMyAddr} defeated @${shortOppAddr}\nYield earned: +${yieldEarned} CELO\nWin Streak: 🔥 ${streak}\n\nPlay at payorpass.app`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  const handleShareFarcaster = () => {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-black/80 border-2 border-yellow-500/50 rounded-2xl p-6 font-mono text-white text-center max-w-sm mx-auto shadow-[0_0_30px_rgba(234,179,8,0.3)] mt-6">
      <h3 className="text-xl font-black italic text-yellow-500 mb-4 tracking-widest uppercase">
        VICTORY SECURED
      </h3>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono text-sm mb-6 whitespace-pre-line text-white/80 leading-relaxed shadow-inner">
        {textToShare}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleShareTwitter}
          className="flex-1 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/40 text-[#1DA1F2] border border-[#1DA1F2]/50 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4" /> TWITTER
        </button>
        <button 
          onClick={handleShareFarcaster}
          className="flex-1 bg-[#8a63d2]/20 hover:bg-[#8a63d2]/40 text-[#8a63d2] border border-[#8a63d2]/50 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4" /> WARPCAST
        </button>
      </div>
    </div>
  );
}
