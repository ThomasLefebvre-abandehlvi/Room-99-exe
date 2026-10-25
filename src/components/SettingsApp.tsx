import React, { useState } from 'react';
import { Settings as SettingsIcon, Image, Volume2, VolumeX, Smartphone, RotateCcw, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { WALLPAPERS, Wallpaper } from '../game/wallpapers';
import { sound } from '../audio/sound';

export interface SettingsAppProps {
  currentWallpaperId: string;
  onSelectWallpaper: (wallpaperId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  mobileControls: boolean;
  onToggleMobileControls: () => void;
  stats: {
    vaultsBroken: number;
    swings: number;
    cratesOpened: number;
    chestsFound: number;
    waterSortWins: number;
  };
  onResetProgress: () => void;
}

export function SettingsApp({
  currentWallpaperId,
  onSelectWallpaper,
  soundEnabled,
  onToggleSound,
  mobileControls,
  onToggleMobileControls,
  stats,
  onResetProgress
}: SettingsAppProps) {
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'audio' | 'stats' | 'system'>('wallpaper');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleApplyWallpaper = (wp: Wallpaper) => {
    onSelectWallpaper(wp.id);
    sound.playClick();
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Settings Navigation Sidebar */}
      <div className="w-full sm:w-48 bg-slate-900/90 border-b sm:border-b-0 sm:border-r border-slate-800 p-2.5 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-2 mb-2 border-b border-slate-800">
          <SettingsIcon className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">Settings</span>
        </div>

        <button
          onClick={() => { setActiveTab('wallpaper'); sound.playClick(); }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
            activeTab === 'wallpaper'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Wallpapers (11)</span>
        </button>

        <button
          onClick={() => { setActiveTab('audio'); sound.playClick(); }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
            activeTab === 'audio'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Audio & Sound</span>
        </button>

        <button
          onClick={() => { setActiveTab('stats'); sound.playClick(); }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
            activeTab === 'stats'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Telemetry & Stats</span>
        </button>

        <button
          onClick={() => { setActiveTab('system'); sound.playClick(); }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
            activeTab === 'system'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>System & Reset</span>
        </button>
      </div>

      {/* Main Settings Content Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* TAB 1: WALLPAPER GALLERY */}
        {activeTab === 'wallpaper' && (
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-black text-sky-200 uppercase tracking-wide">
                DESKTOP WALLPAPER GALLERY
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Choose from 11 custom procedural themes. High-definition cybernetic, retro, and subterranean gradients.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {WALLPAPERS.map((wp, index) => {
                const isSelected = currentWallpaperId === wp.id;

                return (
                  <div
                    key={wp.id}
                    onClick={() => handleApplyWallpaper(wp)}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition relative overflow-hidden group ${
                      isSelected
                        ? 'border-2 border-sky-400 bg-slate-900 shadow-lg shadow-sky-950/60'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Thumbnail swatch */}
                    <div
                      className="w-full h-20 rounded-lg mb-2 relative overflow-hidden border border-slate-700/60 flex items-end p-2 transition-transform group-hover:scale-[1.02]"
                      style={{ background: wp.previewGradient }}
                    >
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm border border-white/20">
                        {wp.category}
                      </span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center font-bold shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{wp.name}</span>
                        {index === 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {wp.desc}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Theme #{index + 1}</span>
                      <span className={`font-bold ${isSelected ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {isSelected ? 'ACTIVE' : 'Apply'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO & SOUND */}
        {activeTab === 'audio' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="text-sm font-black text-sky-200 uppercase tracking-wide">AUDIO & ACOUSTICS</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure subterranean acoustic reverberation and synthesizers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-100">Sound Effects & Synthesizers</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Footsteps, vault impacts, lucky crate spins, and ambient audio cues.
                </div>
              </div>
              <button
                onClick={onToggleSound}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  soundEnabled
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'ENABLED' : 'MUTED'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-100">Mobile On-Screen Controls</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Displays left/right movement pad and radial 4-quarter action wheel.
                </div>
              </div>
              <button
                onClick={onToggleMobileControls}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  mobileControls
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{mobileControls ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: TELEMETRY & STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="text-sm font-black text-sky-200 uppercase tracking-wide">
                SUBTERRANEAN EXPEDITION TELEMETRY
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verified logs recorded by your workstation's black box.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Vaults Breached</div>
                <div className="text-xl font-black text-sky-400 mt-1">{stats.vaultsBroken}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Impact Swings</div>
                <div className="text-xl font-black text-amber-400 mt-1">{stats.swings}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Lucky Crates Opened</div>
                <div className="text-xl font-black text-rose-400 mt-1">{stats.cratesOpened}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Hidden Chests Unlocked</div>
                <div className="text-xl font-black text-emerald-400 mt-1">{stats.chestsFound}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Water Sorter Puzzles Solved</div>
                <div className="text-xl font-black text-cyan-400 mt-1">{stats.waterSortWins}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM & RESET (Safe in-UI confirmation) */}
        {activeTab === 'system' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <h3 className="text-sm font-black text-rose-300 uppercase tracking-wide">SYSTEM & DATA RESET</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Erase local storage save files and start fresh in Chamber 000.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">Danger Zone</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Resetting will clear all accumulated Neno Coins, equipped hammers, purchased tools, and quest progress.
                This action cannot be undone.
              </p>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition"
                >
                  Reset All Save Data...
                </button>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950 border border-rose-500 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-rose-200">Are you completely sure?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setConfirmReset(false);
                        onResetProgress();
                      }}
                      className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs text-white font-black shadow transition"
                    >
                      Yes, Wipe All Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
