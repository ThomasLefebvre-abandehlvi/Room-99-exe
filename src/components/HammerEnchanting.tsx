import React from 'react';
import { Sparkles, Zap, Shield, Flame, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { ENCHANTMENTS_CONFIG } from '../game/enchantments';
import { EnchantmentsState, Tool } from '../types/game';
import { sound } from '../audio/sound';

export interface HammerEnchantingProps {
  enchantments: EnchantmentsState;
  onUpgrade: (enchantId: keyof EnchantmentsState, cost: number) => void;
  playerCoins: number;
  currentTool: Tool | null;
  toolIndex: number;
}

export function HammerEnchanting({
  enchantments,
  onUpgrade,
  playerCoins,
  currentTool,
  toolIndex
}: HammerEnchantingProps) {
  const handleUpgradeClick = (id: keyof EnchantmentsState, cost: number) => {
    if (playerCoins < cost) {
      sound.playClick();
      return;
    }
    sound.playChest();
    onUpgrade(id, cost);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
      {/* Header & Anvil Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-900/50 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            ⚒️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-amber-300 tracking-wide uppercase">
                RUNIC HAMMER ENCHANTING ANVIL
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Tier IV Forge
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Imbue your equipped hammer with ancient subterranean runes to multiply kinetic impact and rewards.
            </p>
          </div>
        </div>

        {/* Current Hammer & Coin Display */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border"
              style={{
                backgroundColor: `${currentTool?.color || '#94a3b8'}22`,
                borderColor: currentTool?.color || '#94a3b8',
                color: currentTool?.color || '#94a3b8'
              }}
            >
              ×{currentTool?.power || 1}
            </div>
            <div className="text-left">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Equipped</div>
              <div className="text-xs font-black text-slate-100 truncate max-w-[110px]">
                {currentTool?.name || 'Fists'}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-lg text-right">
            <div className="text-[9px] font-bold text-amber-400 uppercase">Neno Coins</div>
            <div className="text-xs font-black text-amber-300 tabular-nums">{playerCoins} Ⓝ</div>
          </div>
        </div>
      </div>

      {/* Enchantment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {ENCHANTMENTS_CONFIG.map((enc) => {
          const currentLevel = enchantments[enc.id] || 0;
          const isMax = currentLevel >= enc.maxLevel;
          const nextCost = !isMax ? enc.costs[currentLevel] : 0;
          const canAfford = playerCoins >= nextCost;

          return (
            <div
              key={enc.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition relative overflow-hidden ${
                isMax
                  ? 'bg-gradient-to-br from-slate-900 to-amber-950/30 border-amber-500/60 shadow-md'
                  : currentLevel > 0
                    ? 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Subtle accent glow */}
              <div
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
                style={{ backgroundColor: enc.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{enc.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-100">{enc.name}</span>
                        {isMax && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-amber-950">
                            MASTERED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{enc.shortDesc}</div>
                    </div>
                  </div>

                  {/* Level Pips */}
                  <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400">LVL</span>
                    <span className="text-xs font-black" style={{ color: enc.color }}>
                      {currentLevel}/{enc.maxLevel}
                    </span>
                  </div>
                </div>

                {/* Level Effect Description */}
                <div className="my-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
                  {enc.effectDescs.map((desc, idx) => {
                    const isUnlocked = currentLevel > idx;
                    const isNext = currentLevel === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 ${
                          isUnlocked
                            ? 'text-emerald-400 font-bold'
                            : isNext
                              ? 'text-amber-300 font-semibold'
                              : 'text-slate-600'
                        }`}
                      >
                        {isUnlocked ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : isNext ? (
                          <ArrowUpCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span>{desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upgrade Action Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                {!isMax ? (
                  <>
                    <div className="text-[10px] text-slate-400">
                      Cost: <span className="font-bold text-amber-300">{nextCost} Neno Coins</span>
                    </div>
                    <button
                      onClick={() => handleUpgradeClick(enc.id, nextCost)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade to Lvl {currentLevel + 1}</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-xs font-bold text-amber-400 py-1 bg-amber-950/30 rounded border border-amber-500/30">
                    ✨ MAX RANK ENCHANTED ✨
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
