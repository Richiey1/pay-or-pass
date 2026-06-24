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
                <Shield className="w-4 h-4 text-orange-500" /> Enter the Arena
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                To join the GameFi experience, players must stake exactly <span className="text-white font-bold">{entryFee || "0.50"} CELO</span> into the secure vault. <span className="text-orange-400">This principal is never put at risk.</span>
              </p>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 mt-2 space-y-2">
                <p className="text-[11px] text-white/50"><strong className="text-white">Dual Yield Strategies:</strong> You have the power to choose where your principal lives.</p>
                <ul className="text-[11px] text-white/50 list-disc pl-4 space-y-1">
                  <li><strong className="text-white">Simulated Yield:</strong> The UI tracks the combined TVL of all simulated gladiators and applies an 8% APY.</li>
                  <li><strong className="text-white">Moola Market:</strong> Alternatively, route your deposit natively into Moola Market to earn real decentralized yield.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-black text-xs shrink-0">2</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-500" /> View Active Gladiators
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Once inside the arena, you can view the live HUD (heads-up display) of all other players who are currently staked in the game. You can click on any gladiator in the roster to open their Target HUD and view their win/loss ratios and their total yield won.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 font-black text-xs shrink-0">3</div>
              <div className="w-px h-full bg-white/5 mt-2" />
            </div>
            <div className="space-y-2 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-500" /> Initiate Combat
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Select any opponent from the active gladiator roster. Clicking <strong>Initiate Combat</strong> engages a pseudo-random resolution.
              </p>
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2">
                <p className="text-[11px] text-red-200"><strong className="text-red-400">The Twist:</strong> The winner absorbs the ENTIRE accrued "Global Prize Pool" yield (both Simulated AND real Moola Market interest) that has accumulated since the last fight. The loser simply records a loss on their ledger, but their <span className="text-white font-bold">{entryFee || "0.50"} CELO</span> principal remains 100% intact.</p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center mt-1">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 font-black text-xs shrink-0">4</div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-white/50" /> Exit Arena
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                If you decide to stop fighting, you simply click <strong>Withdraw Principal & Exit</strong>. You receive your <span className="text-white font-bold">{entryFee || "0.50"} CELO</span> back instantly and are removed from the active gladiator roster.
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
