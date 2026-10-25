export interface Tool {
  name: string;
  cost: number;
  power: number;
  note: string;
  color: string;
}

export interface Layout {
  id: string;
  name: string;
  minLength: number;
  maxLength: number;
  stairs: number;
  vent?: boolean;
  length?: number;
  ventStart?: number;
  ventEnd?: number;
}

export interface TerrainType {
  name: string;
  surface: string;
  accent: string;
}

export interface TerrainDetail {
  x: number;
  y: number;
  size: number;
}

export type LaptopApp =
  | 'home'
  | 'market'
  | 'crates'
  | 'nine-ai'
  | 'help'
  | 'enchant'
  | 'watersort'
  | 'quests'
  | 'settings'
  | 'doogle'
  | 'wardrobe'
  | 'prompt'
  | 'notepad'
  | 'nanoscanner'
  | 'clock'
  | 'calc';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity?: number;
  friction?: number;
  type?: 'spark' | 'dust' | 'coin' | 'confetti';
}

export interface TerminalMessage {
  sender: 'system' | 'user' | 'nine-ai';
  text: string;
  time: string;
}

export interface EnchantmentsState {
  overcharge: number; // Crit hit chance / multiplier
  seismic: number;    // Extra shockwave flat damage
  greed: number;      // Extra coin payout multiplier
  lightweight: number;// Stamina efficiency
}

export interface Quest {
  id: string;
  title: string;
  desc: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
}

export interface BossShockwave {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  color: string;
  damage: number;
}

export interface BossState {
  active: boolean;
  id: 'behemoth' | 'colossus' | 'warden';
  name: string;
  title: string;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  facing: number;
  state: 'idle' | 'walk' | 'windup' | 'attack' | 'hurt' | 'defeated';
  attackTimer: number;
  attackInterval: number;
  attackType: 'slam' | 'laser' | 'shockwave';
  windupProgress: number; // 0 to 1
  flash: number;
  defeated: boolean;
  shockwaves: BossShockwave[];
}

export interface GameState {
  room: number;
  coins: number;
  tool: number;
  inspected: boolean;
  caseOpen: boolean;
  doorHp: number;
  doorMax: number;
  tablet: boolean;
  strike: number;
  flash: number;
  fade: number;
  transition: boolean;
  nextRoomAt: number;
  shake: number;
  hitstop: number;
  message: string;
  messageUntil: number;
  playerX: number;
  facing: number;
  bought: boolean[];
  laptopApp: LaptopApp;
  appScroll: number;
  layout: Layout | null;
  doorX: number;
  terrain: TerrainType | null;
  terrainDetails: TerrainDetail[];
  chestX: number;
  chestActive: boolean;
  blueSheetX: number;
  hasBlueSheet: boolean;
  scannedCode: string | null;
  equippedSkin: string;
  equippedTrail: string;
  unlockedSkins: string[];
  unlockedTrails: string[];
  stamina: number;
  jumpHeight: number;
  jumpVelocity: number;
  landing: number;
  crouched: boolean;
  sprinting: boolean;
  soundEnabled: boolean;
  // Math Puzzle Chamber
  isPuzzleRoom: boolean;
  puzzleFormula: string;
  puzzleSolution: string;
  vaultCodeLocked: boolean;
  vaultCodeEntered: string;
  keypadOpen: boolean;
  mathNoteX: number;
  keypadTerminalX: number;
  // Boss Fights
  boss: BossState | null;
  enchantments: EnchantmentsState;
  stats: {
    vaultsBroken: number;
    swings: number;
    cratesOpened: number;
    chestsFound: number;
    waterSortWins: number;
    bossesDefeated?: number;
  };
}
