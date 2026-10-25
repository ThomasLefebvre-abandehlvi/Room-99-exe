import React from 'react';
import { Trophy, CheckCircle2, Gift, Sparkles, Target, Award } from 'lucide-react';
import { Quest } from '../types/game';
import { sound } from '../audio/sound';

export interface QuestsAppProps {
  quests: Quest[];
  onClaimQuest: (questId: string, reward: number) => void;
  playerCoins: number;
}

export function QuestsApp({ quests, onClaimQuest, playerCoins }: QuestsAppProps) {
  const completedCount = quests.filter(q => q.completed).length;
  const claimedCount = quests.filter(q => q.claimed).length;

  const handleClaim = (quest: Quest) => {
    if (!quest.completed || quest.claimed) return;
    sound.playChest();
    sound.playCoin();
    onClaimQuest(quest.id, quest.reward);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-amber-300 tracking-wide uppercase">
                SUBTERRANEAN BOUNTIES & QUESTS
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {claimedCount}/{quests.length} Completed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Fulfill expedition tasks to claim hefty Neno Coin caches from Room 99 contractors.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
          <div className="text-[9px] font-bold text-slate-400 uppercase">Available Coins</div>
          <div className="text-xs font-black text-amber-300 tabular-nums">{playerCoins} Ⓝ</div>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-2.5 flex-1 pr-1">
        {quests.map((quest) => {
          const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                quest.claimed
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  : quest.completed
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/60 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-slate-100">{quest.title}</span>
                  {quest.claimed ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CLAIMED
                    </span>
                  ) : quest.completed ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500 text-amber-950 animate-pulse">
                      READY TO CLAIM
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400">
                      {quest.current} / {quest.target}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-2">{quest.desc}</p>

                {/* Progress bar */}
                <div className="w-full sm:max-w-md h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      quest.claimed
                        ? 'bg-emerald-500'
                        : quest.completed
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'bg-sky-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reward & Claim Button */}
              <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{quest.reward} Ⓝ</span>
                </div>

                {quest.claimed ? (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Received</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(quest)}
                    disabled={!quest.completed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                      quest.completed
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/30 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim Reward</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
