import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Shuffle, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { sound } from '../audio/sound';

export interface WaterSorterProps {
  onWinReward: (coins: number) => void;
  playerCoins: number;
}

// 3 Vibrant Liquid Types
const LIQUIDS = [
  { id: 'cyan', name: 'Quantum Coolant', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },
  { id: 'rose', name: 'Thermal Plasma', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },
  { id: 'amber', name: 'Aurum Catalyst', color: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' }
];

const TUBE_CAPACITY = 4;

// Generate a solvable shuffled configuration
function generateInitialTubes(): string[][] {
  // 3 liquids * 4 blocks = 12 total blocks
  const pool: string[] = [];
  LIQUIDS.forEach(liquid => {
    for (let i = 0; i < TUBE_CAPACITY; i++) {
      pool.push(liquid.id);
    }
  });

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 3 filled tubes, 1 empty buffer tube
  const t0 = pool.slice(0, 4);
  const t1 = pool.slice(4, 8);
  const t2 = pool.slice(8, 12);

  // If already sorted by chance, swap two items
  const isSorted = (t: string[]) => t.length === 4 && t.every(c => c === t[0]);
  if (isSorted(t0) && isSorted(t1) && isSorted(t2)) {
    const temp = t0[0];
    t0[0] = t1[0];
    t1[0] = temp;
  }

  return [t0, t1, t2, []];
}

export function WaterSorter({ onWinReward, playerCoins }: WaterSorterProps) {
  const [tubes, setTubes] = useState<string[][]>(generateInitialTubes);
  const [history, setHistory] = useState<string[][][]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Check victory condition
  const checkVictory = useCallback((currentTubes: string[][]) => {
    let completedCount = 0;
    for (const tube of currentTubes) {
      if (tube.length === 0) continue;
      if (tube.length === TUBE_CAPACITY) {
        const first = tube[0];
        if (tube.every(c => c === first)) {
          completedCount++;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return completedCount === LIQUIDS.length;
  }, []);

  const handleTubeClick = (targetIdx: number) => {
    if (won) return;

    // If no tube currently selected:
    if (selectedTube === null) {
      if (tubes[targetIdx].length > 0) {
        setSelectedTube(targetIdx);
        sound.playClick();
      }
      return;
    }

    // Deselect if tapping the same tube
    if (selectedTube === targetIdx) {
      setSelectedTube(null);
      sound.playClick();
      return;
    }

    // Attempt pour from selectedTube -> targetIdx
    const sourceTube = [...tubes[selectedTube]];
    const targetTube = [...tubes[targetIdx]];

    if (targetTube.length >= TUBE_CAPACITY) {
      // Target is full
      setSelectedTube(targetIdx);
      sound.playClick();
      return;
    }

    const sourceTopColor = sourceTube[sourceTube.length - 1];
    const targetTopColor = targetTube.length > 0 ? targetTube[targetTube.length - 1] : null;

    if (targetTopColor !== null && targetTopColor !== sourceTopColor) {
      // Color mismatch: switch selection to target if target has liquid
      if (targetTube.length > 0) {
        setSelectedTube(targetIdx);
      } else {
        setSelectedTube(null);
      }
      sound.playClick();
      return;
    }

    // Valid move! Count how many consecutive matching blocks we can pour
    let matchCount = 0;
    for (let i = sourceTube.length - 1; i >= 0; i--) {
      if (sourceTube[i] === sourceTopColor) {
        matchCount++;
      } else {
        break;
      }
    }

    const availableSpace = TUBE_CAPACITY - targetTube.length;
    const blocksToMove = Math.min(matchCount, availableSpace);

    // Save history for undo
    setHistory(prev => [...prev, tubes.map(t => [...t])]);

    for (let i = 0; i < blocksToMove; i++) {
      sourceTube.pop();
      targetTube.push(sourceTopColor);
    }

    const newTubes = tubes.map((t, idx) => {
      if (idx === selectedTube) return sourceTube;
      if (idx === targetIdx) return targetTube;
      return t;
    });

    setTubes(newTubes);
    setSelectedTube(null);
    setMoves(m => m + 1);
    sound.playCoin();

    // Check if won
    if (checkVictory(newTubes)) {
      setWon(true);
      sound.playCrateJackpot();
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || won) return;
    const previous = history[history.length - 1];
    setTubes(previous);
    setHistory(h => h.slice(0, -1));
    setSelectedTube(null);
    setMoves(m => Math.max(0, m - 1));
    sound.playClick();
  };

  const handleReset = () => {
    if (history.length === 0) return;
    setTubes(history[0]);
    setHistory([]);
    setSelectedTube(null);
    setMoves(0);
    setWon(false);
    setRewardClaimed(false);
    sound.playClick();
  };

  const handleNewGame = () => {
    const fresh = generateInitialTubes();
    setTubes(fresh);
    setHistory([]);
    setSelectedTube(null);
    setMoves(0);
    setWon(false);
    setRewardClaimed(false);
    sound.playClick();
  };

  const handleClaimReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    onWinReward(250);
    sound.playChest();
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-950 text-slate-100 select-none overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-cyan-300 tracking-wide">WATER SORTER LAB</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-full font-bold">
              Sub-Level 99 Puzzle
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pour liquids until each test tube contains exactly one pure chemical compound.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Moves</div>
            <div className="text-sm font-black text-amber-300">{moves}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Balance</div>
            <div className="text-sm font-black text-amber-300">{playerCoins} Ⓝ</div>
          </div>
        </div>
      </div>

      {/* Main Tubes Playing Field */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-[220px]">
        <div className="flex items-end justify-center gap-6 sm:gap-10">
          {tubes.map((tube, idx) => {
            const isSelected = selectedTube === idx;
            const isFullAndUniform =
              tube.length === TUBE_CAPACITY && tube.every(c => c === tube[0]);

            return (
              <div
                key={idx}
                onClick={() => handleTubeClick(idx)}
                className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                  isSelected ? '-translate-y-4 scale-105' : 'hover:-translate-y-1'
                }`}
              >
                {/* Tube Number / Label */}
                <span className="text-[10px] font-bold text-slate-500 mb-1">
                  Tube {idx + 1}
                </span>

                {/* Glass Tube Container */}
                <div
                  className={`relative w-14 sm:w-16 h-44 rounded-b-2xl border-2 flex flex-col-reverse p-1 overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] bg-slate-900/90'
                      : isFullAndUniform
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-slate-900/60'
                        : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-500'
                  }`}
                >
                  {/* Glass Highlights / Reflection */}
                  <div className="absolute top-0 right-2 w-1.5 h-full bg-white/10 rounded-full pointer-events-none z-10" />
                  <div className="absolute top-2 left-1.5 right-1.5 h-1 bg-white/20 rounded pointer-events-none z-10" />

                  {/* Graduated Measurement Marks */}
                  <div className="absolute left-1 inset-y-4 flex flex-col justify-between pointer-events-none z-10 opacity-40">
                    <div className="w-2 h-0.5 bg-slate-400" />
                    <div className="w-1.5 h-0.5 bg-slate-400" />
                    <div className="w-2 h-0.5 bg-slate-400" />
                    <div className="w-1.5 h-0.5 bg-slate-400" />
                  </div>

                  {/* Liquid Blocks (stacked from bottom to top) */}
                  {tube.map((liquidId, blockIdx) => {
                    const liquid = LIQUIDS.find(l => l.id === liquidId);
                    return (
                      <div
                        key={blockIdx}
                        className="w-full h-9 rounded transition-all duration-300 relative flex items-center justify-center my-0.5"
                        style={{
                          backgroundColor: liquid?.color || '#38bdf8',
                          boxShadow: `inset 0 0 10px ${liquid?.glow || 'rgba(0,0,0,0.5)'}`
                        }}
                      >
                        {/* Meniscus / Liquid Surface ripple on top layer */}
                        {blockIdx === tube.length - 1 && (
                          <div className="absolute -top-1 inset-x-0 h-2 rounded-t-full bg-white/25 pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Completed Checkmark Indicator */}
                {isFullAndUniform && (
                  <div className="mt-1 text-emerald-400 flex items-center gap-1 text-[10px] font-bold animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pure</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Victory Celebration Modal Banner */}
        {won && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-2 border-emerald-400/80 shadow-2xl flex flex-col items-center text-center max-w-md animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-black tracking-wider uppercase">SYNTHESIS COMPLETE!</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-300">
              All chemical compounds have been successfully isolated in {moves} moves!
            </p>

            <div className="mt-3 flex items-center gap-2">
              {!rewardClaimed ? (
                <button
                  onClick={handleClaimReward}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-emerald-950" />
                  <span>CLAIM +250 NENO COINS</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-lg">
                  ✓ +250 Neno Coins Deposited!
                </span>
              )}

              <button
                onClick={handleNewGame}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Next Puzzle →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || won}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Move</span>
          </button>
          <button
            onClick={handleReset}
            disabled={history.length === 0 || won}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition"
          >
            <span>Restart</span>
          </button>
        </div>

        <button
          onClick={handleNewGame}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>New Puzzle</span>
        </button>
      </div>
    </div>
  );
}
