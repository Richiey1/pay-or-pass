import React, { useEffect, useState } from 'react';
import { X, Info, Shield, Swords, Trophy, Users, LogOut } from 'lucide-react';

interface GameGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryFee: string;
}

export const GameGuideModal: React.FC<GameGuideModalProps> = ({ isOpen, onClose, entryFee }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/20 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20">
              <Info className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest italic">PAY OR PASS</h2>
              <p className="text-xs text-white/50 font-mono">Lossless Arena Guide</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
          
          <div className="text-sm text-white/70 leading-relaxed text-center italic border-b border-white/5 pb-6">
            PayOrPass is an Elite Retail Onboarding play. A GameFi app designed to abstract away complex DeFi yield generation behind a fun, risk-free arcade game. Stake your CELO, fight for accrued yield, and keep your principal 100% safe.
          </div>

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">1</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" /> ENTER THE ARENA (100% SAFE)
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Connect your wallet and click to deposit the current entry fee (<strong className="text-white">{entryFee || "0.50"} CELO</strong>) set by the Admin. Your principal is securely vaulted and automatically begins earning yield.
              </p>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 mt-2 space-y-2">
                <p className="text-[11px] text-white/50"><strong className="text-orange-400">LOSSLESS GUARANTEE:</strong> The principal you stake is never put at risk. You are only fighting for the accumulated DeFi yield.</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 font-black text-xs shrink-0">2</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-500" /> STRATEGIC COMBAT
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Select an active opponent from the leaderboard. Instead of random outcomes, use the commit-reveal mechanism to secretly choose:
              </p>
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2 space-y-2">
                <ul className="text-[11px] text-red-200 list-disc pl-4 space-y-1">
                  <li><strong className="text-red-400">STRIKE:</strong> Drain opponent yield.</li>
                  <li><strong className="text-red-400">BLOCK:</strong> Stop an incoming strike.</li>
                  <li><strong className="text-red-400">YIELD:</strong> Grow cleanly unless hit by a strike.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-black text-xs shrink-0">3</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> THE 70/10/10 PRIZE SPLIT
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                When a fight resolves, the winner does not drain the entire global pool (which would kill momentum).
              </p>
              <ul className="text-[11px] text-white/50 list-disc pl-4 mt-2 space-y-1">
                <li><strong className="text-white">70-80%</strong> goes to the fight winner.</li>
                <li><strong className="text-white">10%</strong> returns to the Global Prize Pool to ensure it never empties.</li>
                <li><strong className="text-white">10%</strong> funds the Seasonal Leaderboard rewards.</li>
                <li><strong className="text-white">5%</strong> acts as a protocol sustainability fee.</li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-black text-xs shrink-0">4</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" /> VIRAL LOOPS & FREE FIGHTS
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Earn 1 Free Energy fight per day by sharing your Gladiator Profile on X (Twitter) or Farcaster. Inviting a friend via a referral link grants both players a Defense Buff for 24 hours.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">5</div>
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> AUTONOMOUS BOT NETWORK
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                The arena is actively populated by an autonomous volume driver bot operating as a state machine. It constantly enters the arena, stakes capital, initiates strikes, blocks, and eventually profit-takes to guarantee constant opponent availability and live combat volume 24/7!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/50">
          <button 
            onClick={onClose}
            className="w-full bg-white text-black font-black p-4 rounded-xl hover:bg-white/90 transition-all cursor-pointer"
          >
            I UNDERSTAND, LET'S FIGHT!
          </button>
        </div>

      </div>
    </div>
  );
};
