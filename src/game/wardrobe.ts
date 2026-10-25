export interface WardrobeSkin {
  id: string;
  name: string;
  desc: string;
  suitColor: string;
  accentColor: string;
  visorColor: string;
  helmetColor: string;
  isUnlocked: boolean;
  cost: number;
  badge?: string;
}

export interface SwingTrail {
  id: string;
  name: string;
  desc: string;
  color: string;
  glow: string;
  cost: number;
}

export const SKINS_CONFIG: WardrobeSkin[] = [
  {
    id: 'default',
    name: 'Courier Standard',
    desc: 'Regulation subterranean heavy duty jumpsuit with reinforced titanium shoulder pads.',
    suitColor: '#0284c7',
    accentColor: '#0369a1',
    visorColor: '#38bdf8',
    helmetColor: '#0f172a',
    isUnlocked: true,
    cost: 0
  },
  {
    id: 'hazmat',
    name: 'Hazmat Sector 9',
    desc: 'Heavy anti-radiation ballistic suit designed for toxic subterranean vents.',
    suitColor: '#ea580c',
    accentColor: '#c2410c',
    visorColor: '#fde047',
    helmetColor: '#1c1917',
    isUnlocked: false,
    cost: 500,
    badge: 'Popular'
  },
  {
    id: 'cyber',
    name: 'Cyber Nexus',
    desc: 'High-frequency carbon fiber suit with bioluminescent pulse trim.',
    suitColor: '#06b6d4',
    accentColor: '#0891b2',
    visorColor: '#f43f5e',
    helmetColor: '#09090b',
    isUnlocked: false,
    cost: 1000
  },
  {
    id: 'void',
    name: 'Void Stalker',
    desc: 'Stealth nano-weave armor that blends into dark subterranean shadows.',
    suitColor: '#475569',
    accentColor: '#334155',
    visorColor: '#a855f7',
    helmetColor: '#020617',
    isUnlocked: false,
    cost: 1800
  },
  {
    id: 'aurum',
    name: 'Aurum Sovereign',
    desc: 'Gilded ceremonial armor infused with pure molten Neno gold.',
    suitColor: '#d97706',
    accentColor: '#b45309',
    visorColor: '#fef08a',
    helmetColor: '#1c1917',
    isUnlocked: false,
    cost: 3000,
    badge: 'Prestige'
  },
  {
    id: 'astronaut',
    name: 'Lunar Astronaut EVA',
    desc: 'Classified Apollo-grade vacuum suit with gold-plated reflective visor. Unlocked via secret terminal override.',
    suitColor: '#f1f5f9',
    accentColor: '#94a3b8',
    visorColor: '#fbbf24',
    helmetColor: '#ffffff',
    isUnlocked: false,
    cost: 0,
    badge: 'Secret Cheat'
  }
];

export const TRAILS_CONFIG: SwingTrail[] = [
  {
    id: 'sparks',
    name: 'Kinetic Sparks',
    desc: 'Standard mechanical sparks and friction dust upon swinging.',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.6)',
    cost: 0
  },
  {
    id: 'plasma',
    name: 'Cyan Plasma',
    desc: 'Superheated ionized gas arcs following your hammer trajectory.',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.7)',
    cost: 400
  },
  {
    id: 'gold',
    name: 'Aurum Embers',
    desc: 'Golden solar flare particles that scatter along the floor.',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.7)',
    cost: 750
  },
  {
    id: 'void',
    name: 'Ultraviolet Void',
    desc: 'Dark dimensional distortion sparks and amethyst shockwave rings.',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.7)',
    cost: 1200
  },
  {
    id: 'rainbow',
    name: 'Chroma Glitch',
    desc: 'Shifting prismatic rainbow light that distorts subterranean space.',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.7)',
    cost: 2000
  }
];
