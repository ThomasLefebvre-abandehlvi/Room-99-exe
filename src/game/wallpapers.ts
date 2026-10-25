export interface Wallpaper {
  id: string;
  name: string;
  category: string;
  desc: string;
  accent: string;
  backgroundCss: string;
  previewGradient: string;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'default-quantum-core',
    name: 'Quantum Core (Default)',
    category: 'Cybernetic',
    desc: 'The official Room 99 operating system wallpaper. Deep cyan aerospace grid with glowing nexus rings.',
    accent: '#06b6d4',
    previewGradient: 'linear-gradient(135deg, #020b14 0%, #083344 50%, #0e7490 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 40%, rgba(6, 182, 212, 0.28) 0%, transparent 60%),
      radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 15% 85%, rgba(14, 116, 144, 0.22) 0%, transparent 50%),
      linear-gradient(135deg, #020617 0%, #031525 35%, #082f49 70%, #041f32 100%)
    `
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    category: 'Hacker',
    desc: 'Bioluminescent subterranean code currents streaming through ancient vault circuits.',
    accent: '#10b981',
    previewGradient: 'linear-gradient(135deg, #021a10 0%, #064e3b 50%, #059669 100%)',
    backgroundCss: `
      radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 55%),
      radial-gradient(circle at 80% 70%, rgba(52, 211, 153, 0.18) 0%, transparent 45%),
      linear-gradient(145deg, #02120b 0%, #042f20 40%, #064e3b 80%, #021910 100%)
    `
  },
  {
    id: 'solar-magma',
    name: 'Solar Magma Forge',
    category: 'Industrial',
    desc: 'Superheated subterranean volcanic fissures powering the heavy foundry hammers.',
    accent: '#f97316',
    previewGradient: 'linear-gradient(135deg, #1f0803 0%, #7c2d12 50%, #ea580c 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 65%, rgba(249, 115, 22, 0.35) 0%, transparent 60%),
      radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.22) 0%, transparent 45%),
      linear-gradient(160deg, #180502 0%, #391107 45%, #7c2d12 85%, #2a0b04 100%)
    `
  },
  {
    id: 'deep-slate-obsidian',
    name: 'Deepslate Obsidian',
    category: 'Minimal',
    desc: 'Monolithic stealth carbon and polished volcanic glass with subtle azure edge refraction.',
    accent: '#94a3b8',
    previewGradient: 'linear-gradient(135deg, #090d16 0%, #1e293b 50%, #334155 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 30%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
      linear-gradient(135deg, #05070c 0%, #0d131f 45%, #182232 80%, #090e18 100%)
    `
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave 1984',
    category: 'Retro',
    desc: 'Neon magenta horizon grid inspired by vintage cyberpunk synthesizers and cathode rays.',
    accent: '#ec4899',
    previewGradient: 'linear-gradient(135deg, #2e0854 0%, #831843 50%, #db2777 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 85%, rgba(244, 63, 94, 0.35) 0%, transparent 60%),
      radial-gradient(circle at 50% 20%, rgba(147, 51, 234, 0.25) 0%, transparent 55%),
      linear-gradient(180deg, #18042b 0%, #3b0764 45%, #701a75 75%, #4a044e 100%)
    `
  },
  {
    id: 'hyperion-violet',
    name: 'Hyperion Violet',
    category: 'Cosmic',
    desc: 'Deep space anomaly with ultraviolet radiation halos and crystallized nebula clouds.',
    accent: '#a855f7',
    previewGradient: 'linear-gradient(135deg, #130722 0%, #4c1d95 50%, #7e22ce 100%)',
    backgroundCss: `
      radial-gradient(circle at 35% 45%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
      radial-gradient(circle at 75% 75%, rgba(217, 70, 239, 0.2) 0%, transparent 45%),
      linear-gradient(135deg, #090214 0%, #20083b 40%, #4c1d95 80%, #17042a 100%)
    `
  },
  {
    id: 'architect-blueprint',
    name: 'Architect Blueprint',
    category: 'Technical',
    desc: 'Schematic technical grid detailing the subterranean engineering blueprints of Room 99.',
    accent: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #02203a 0%, #075985 50%, #0284c7 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.2) 0%, transparent 65%),
      linear-gradient(135deg, #031c33 0%, #07385f 50%, #0c4a6e 100%)
    `
  },
  {
    id: 'gold-aurum-vault',
    name: 'Aurum Vault',
    category: 'Prestige',
    desc: 'Golden geometric facets and high-grade Neno bullion stored behind impenetrable blast bulkheads.',
    accent: '#eab308',
    previewGradient: 'linear-gradient(135deg, #221a02 0%, #713f12 50%, #ca8a04 100%)',
    backgroundCss: `
      radial-gradient(circle at 40% 35%, rgba(234, 179, 8, 0.3) 0%, transparent 55%),
      radial-gradient(circle at 85% 85%, rgba(245, 158, 11, 0.2) 0%, transparent 45%),
      linear-gradient(145deg, #171102 0%, #3e2808 45%, #713f12 80%, #241804 100%)
    `
  },
  {
    id: 'crimson-hazard',
    name: 'Sub-Level Hazard',
    category: 'Alert',
    desc: 'High-security alert sector with pulse crimson illumination and ballistic blast shields.',
    accent: '#ef4444',
    previewGradient: 'linear-gradient(135deg, #200407 0%, #7f1d1d 50%, #b91c1c 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 40%, rgba(239, 68, 68, 0.3) 0%, transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.18) 0%, transparent 45%),
      linear-gradient(140deg, #170305 0%, #3d070e 45%, #7f1d1d 80%, #290509 100%)
    `
  },
  {
    id: 'polar-borealis',
    name: 'Polar Borealis',
    category: 'Atmospheric',
    desc: 'Luminous ribbons of glacial turquoise and emerald dancing across frozen subterranean permafrost.',
    accent: '#14b8a6',
    previewGradient: 'linear-gradient(135deg, #021e21 0%, #115e59 50%, #0d9488 100%)',
    backgroundCss: `
      radial-gradient(circle at 60% 30%, rgba(20, 184, 166, 0.28) 0%, transparent 55%),
      radial-gradient(circle at 20% 70%, rgba(45, 212, 191, 0.2) 0%, transparent 50%),
      linear-gradient(150deg, #021517 0%, #083332 40%, #134e4a 80%, #031e1d 100%)
    `
  },
  {
    id: 'starfield-nebula',
    name: 'Starfield Deep Deep',
    category: 'Cosmic',
    desc: 'Infinite stellar expanse with scattered pulsar clusters and galactic dust lanes.',
    accent: '#818cf8',
    previewGradient: 'linear-gradient(135deg, #06081e 0%, #1e1b4b 50%, #3730a3 100%)',
    backgroundCss: `
      radial-gradient(circle at 50% 30%, rgba(129, 140, 248, 0.25) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.18) 0%, transparent 40%),
      linear-gradient(160deg, #040514 0%, #0f1033 45%, #1e1b4b 80%, #0b0c26 100%)
    `
  }
];
