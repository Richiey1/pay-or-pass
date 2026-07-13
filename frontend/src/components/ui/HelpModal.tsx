import React from 'react';

export function HelpModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black tracking-widest text-white">
            HOW TO PLAY: LOSSLESS ARENA
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white font-bold text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-8 text-zinc-300 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-white mb-3 tracking-widest border-l-4 border-emerald-500 pl-3">1. ENTER THE ARENA (100% SAFE)</h3>
            <p className="leading-relaxed">
              Connect your wallet and click to deposit the entry fee. Your principal is securely vaulted and automatically begins earning yield. 
              <br/><br/>
              <span className="text-emerald-400 font-bold">LOSSLESS GUARANTEE:</span> The principal you stake is <em>never</em> put at risk. You are only fighting for the accumulated DeFi yield.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3 tracking-widest border-l-4 border-rose-500 pl-3">2. STRATEGIC COMBAT</h3>
            <p className="leading-relaxed">
              Select an active opponent from the leaderboard. Instead of random outcomes, use the commit-reveal mechanism to secretly choose:
            </p>
            <ul className="mt-4 space-y-3 pl-4">
              <li className="flex gap-3"><span className="text-rose-500 font-black w-20">STRIKE</span> Drain opponent yield.</li>
              <li className="flex gap-3"><span className="text-blue-500 font-black w-20">BLOCK</span> Stop an incoming strike.</li>
              <li className="flex gap-3"><span className="text-emerald-500 font-black w-20">YIELD</span> Grow cleanly unless hit by a strike.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3 tracking-widest border-l-4 border-amber-500 pl-3">3. THE 70/10/10 PRIZE SPLIT</h3>
            <p className="leading-relaxed">
              When a fight resolves, the winner does not drain the entire global pool (which would kill momentum).
            </p>
            <ul className="mt-4 space-y-2 pl-4 text-sm list-disc">
              <li><strong>70-80%</strong> goes to the fight winner.</li>
              <li><strong>10%</strong> returns to the Global Prize Pool to ensure it never empties.</li>
              <li><strong>10%</strong> funds the Seasonal Leaderboard rewards.</li>
              <li><strong>5%</strong> acts as a protocol sustainability fee.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3 tracking-widest border-l-4 border-purple-500 pl-3">4. VIRAL LOOPS & FREE FIGHTS</h3>
            <p className="leading-relaxed">
              Earn <strong>1 Free Energy fight per day</strong> by sharing your Gladiator Profile on X (Twitter) or Farcaster. Inviting a friend via a referral link grants both players a Defense Buff for 24 hours.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3 tracking-widest border-l-4 border-zinc-500 pl-3">5. AUTONOMOUS BOT NETWORK</h3>
            <p className="leading-relaxed text-zinc-400">
              The arena is actively populated by an autonomous volume driver bot operating as a state machine. It constantly enters the arena, stakes capital, initiates strikes, blocks, and eventually profit-takes to guarantee constant opponent availability and live combat volume 24/7!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6 flex justify-end z-10">
          <button onClick={onClose} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
            ACKNOWLEDGE
          </button>
        </div>

      </div>
    </div>
  );
}
