import React, { useEffect, useRef, useState } from 'react';
import { SKINS_CONFIG, TRAILS_CONFIG, WardrobeSkin, SwingTrail } from '../game/wardrobe';
import { Tool } from '../types/game';
import { sound } from '../audio/sound';
import { Sparkles, Check, Lock, Shield, Eye, Flame } from 'lucide-react';

export interface WardrobeAppProps {
  playerCoins: number;
  equippedSkin: string;
  equippedTrail: string;
  unlockedSkins: string[];
  unlockedTrails: string[];
  currentTool: Tool | null;
  onEquipSkin: (skinId: string) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onEquipTrail: (trailId: string) => void;
  onUnlockTrail: (trailId: string, cost: number) => void;
}

export function WardrobeApp({
  playerCoins,
  equippedSkin,
  equippedTrail,
  unlockedSkins,
  unlockedTrails,
  currentTool,
  onEquipSkin,
  onUnlockSkin,
  onEquipTrail,
  onUnlockTrail
}: WardrobeAppProps) {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails'>('skins');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentSkinDef = SKINS_CONFIG.find(s => s.id === equippedSkin) || SKINS_CONFIG[0];
  const currentTrailDef = TRAILS_CONFIG.find(t => t.id === equippedTrail) || TRAILS_CONFIG[0];

  // Draw miniature animated preview of player character wearing equipped skin
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const renderPreview = (time: number) => {
      const elapsed = time - startTime;
      const breathe = Math.sin(elapsed / 300) * 2;
      const toolColor = currentTool?.color || '#38bdf8';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center character in preview
      ctx.translate(canvas.width / 2, canvas.height / 2 + 35);
      ctx.scale(1.7, 1.7);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Backpack / Power unit
      ctx.fillStyle = currentSkinDef.helmetColor;
      ctx.fillRect(-14, -40, 7, 24);
      ctx.fillStyle = currentSkinDef.visorColor;
      ctx.fillRect(-13, -36, 3, 5);

      // Legs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-4, -18); ctx.lineTo(-7, 0);
      ctx.moveTo(4, -18); ctx.lineTo(7, 0);
      ctx.stroke();

      // Boots
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(-10, -2, 7, 4, 1.5);
      ctx.roundRect(4, -2, 7, 4, 1.5);
      ctx.fill();

      // Torso / Suit
      ctx.fillStyle = currentSkinDef.suitColor;
      ctx.beginPath();
      ctx.roundRect(-8, -42 + breathe, 16, 26, 4);
      ctx.fill();

      // Belt
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -20 + breathe, 16, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -21 + breathe, 4, 5);

      // Tactical straps
      ctx.strokeStyle = currentSkinDef.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -40 + breathe); ctx.lineTo(0, -20 + breathe);
      ctx.moveTo(7, -40 + breathe); ctx.lineTo(0, -20 + breathe);
      ctx.stroke();

      // Head / Helmet
      ctx.fillStyle = currentSkinDef.helmetColor;
      ctx.beginPath();
      ctx.ellipse(0, -52 + breathe, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face / Visor
      ctx.fillStyle = currentSkinDef.visorColor;
      ctx.shadowColor = currentSkinDef.visorColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(2, -54 + breathe, 7, 5, 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Arm & Hammer
      ctx.strokeStyle = currentSkinDef.accentColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(3, -36 + breathe);
      ctx.lineTo(12, -26 + breathe);
      ctx.stroke();

      // Hammer handle
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(11, -27 + breathe);
      ctx.lineTo(18, -46 + breathe);
      ctx.stroke();

      // Hammer head
      ctx.fillStyle = toolColor;
      ctx.shadowColor = toolColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(14, -51 + breathe, 13, 8, 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Special Astronaut Apollo patch or crest
      if (currentSkinDef.id === 'astronaut') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-2, -34 + breathe, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [currentSkinDef, currentTool]);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Left Column: Live Character Holographic Preview */}
      <div className="w-full md:w-64 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col items-center justify-between shrink-0">
        <div className="w-full text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-sky-300 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Hologram Preview</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Live Vault Suit Fitting</div>
        </div>

        {/* Character Preview Canvas */}
        <div className="relative w-44 h-48 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 shadow-inner flex items-center justify-center my-2 overflow-hidden">
          {/* Cybernetic grid lines */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
          <canvas ref={previewCanvasRef} width={180} height={200} className="relative z-10" />

          {/* Hologram scanline */}
          <div className="absolute inset-x-0 h-1 bg-sky-400/30 blur-sm animate-pulse pointer-events-none" />
        </div>

        <div className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
          <div className="text-xs font-black text-slate-100">{currentSkinDef.name}</div>
          <div className="text-[10px] text-sky-400 flex items-center justify-center gap-1 font-semibold">
            <Flame className="w-3 h-3" />
            <span>Trail: {currentTrailDef.name}</span>
          </div>
          <div className="text-[10px] text-amber-300 font-bold">
            Balance: {playerCoins} Neno Coins
          </div>
        </div>
      </div>

      {/* Right Column: Wardrobe Catalog & Tabs */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {/* Tab switch */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('skins'); sound.playClick(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'skins'
                  ? 'bg-sky-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Suits & Skins ({SKINS_CONFIG.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('trails'); sound.playClick(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'trails'
                  ? 'bg-sky-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Swing Trails ({TRAILS_CONFIG.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Skins Catalog */}
        {activeTab === 'skins' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {SKINS_CONFIG.map((skin) => {
              const isUnlocked = unlockedSkins.includes(skin.id) || skin.cost === 0;
              const isEquipped = equippedSkin === skin.id;
              const canAfford = playerCoins >= skin.cost;

              return (
                <div
                  key={skin.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isEquipped
                      ? 'bg-sky-950/60 border-sky-400 shadow-md shadow-sky-950/50'
                      : isUnlocked
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Skin Color Palette Swatch */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 border border-slate-700 bg-slate-950 shrink-0">
                      <div
                        className="w-full h-full rounded-lg flex items-center justify-center font-black text-xs shadow-inner"
                        style={{ backgroundColor: skin.suitColor, color: skin.visorColor }}
                      >
                        ●
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100">{skin.name}</span>
                        {skin.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {skin.badge}
                          </span>
                        )}
                        {isEquipped && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-sky-500 text-slate-950">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-md leading-relaxed">
                        {skin.desc}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isEquipped ? (
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          onEquipSkin(skin.id);
                          sound.playClick();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-white font-bold text-xs transition shadow"
                      >
                        Equip Suit
                      </button>
                    ) : skin.id === 'astronaut' ? (
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Type 'neondepths' in NMD Prompt</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            onUnlockSkin(skin.id, skin.cost);
                            sound.playChest();
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock {skin.cost} Ⓝ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Swing Trails Catalog */}
        {activeTab === 'trails' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {TRAILS_CONFIG.map((trail) => {
              const isUnlocked = unlockedTrails.includes(trail.id) || trail.cost === 0;
              const isEquipped = equippedTrail === trail.id;
              const canAfford = playerCoins >= trail.cost;

              return (
                <div
                  key={trail.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isEquipped
                      ? 'bg-sky-950/60 border-sky-400 shadow-md shadow-sky-950/50'
                      : isUnlocked
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-slate-700 shrink-0"
                      style={{ backgroundColor: `${trail.color}22`, color: trail.color }}
                    >
                      ✨
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100">{trail.name}</span>
                        {isEquipped && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-sky-500 text-slate-950">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-md">{trail.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isEquipped ? (
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => {
                          onEquipTrail(trail.id);
                          sound.playClick();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-white font-bold text-xs transition shadow"
                      >
                        Equip Trail
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            onUnlockTrail(trail.id, trail.cost);
                            sound.playChest();
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock {trail.cost} Ⓝ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
