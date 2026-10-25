import { BossState } from '../types/game';

export interface BossConfig {
  id: 'behemoth' | 'colossus' | 'warden';
  level: number;
  name: string;
  title: string;
  maxHp: number;
  coinReward: number;
  attackInterval: number;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  description: string;
}

export const BOSS_CONFIGS: Record<number, BossConfig> = {
  50: {
    id: 'behemoth',
    level: 50,
    name: 'GOLIATH BEHEMOTH',
    title: 'Sub-Level 50 Bulkhead Devourer',
    maxHp: 5000,
    coinReward: 2500,
    attackInterval: 3.2,
    primaryColor: '#e11d48', // Crimson Rose
    accentColor: '#9f1239',
    glowColor: '#f43f5e',
    description: 'An ancient hydraulic juggernaut constructed to crush subterranean fault lines.'
  },
  90: {
    id: 'colossus',
    level: 90,
    name: 'CYBER VOID COLOSSUS',
    title: 'Sub-Level 90 Singularity Overlord',
    maxHp: 18000,
    coinReward: 7500,
    attackInterval: 2.8,
    primaryColor: '#06b6d4', // Cyan / Void
    accentColor: '#7c3aed',
    glowColor: '#38bdf8',
    description: 'A levitating cybernetic construct channeling raw singularity energy.'
  },
  98: {
    id: 'warden',
    level: 98,
    name: 'OMEGA WARDEN 99',
    title: 'The Sovereign Aegis - Guardian Before Room 99',
    maxHp: 45000,
    coinReward: 25000,
    attackInterval: 2.3,
    primaryColor: '#f59e0b', // Gold / Sun / Obsidian
    accentColor: '#dc2626',
    glowColor: '#fbbf24',
    description: 'The supreme mechanical guardian stationed to seal Chamber 99 from intruders.'
  }
};

export function createBossForRoom(room: number, doorX: number, floorY: number): BossState | null {
  const cfg = BOSS_CONFIGS[room];
  if (!cfg) return null;

  return {
    active: true,
    id: cfg.id,
    name: cfg.name,
    title: cfg.title,
    level: cfg.level,
    hp: cfg.maxHp,
    maxHp: cfg.maxHp,
    x: doorX - 220, // Stands guarding in front of vault door
    y: floorY,
    facing: -1, // Facing left towards approaching player
    state: 'idle',
    attackTimer: 1.5,
    attackInterval: cfg.attackInterval,
    attackType: 'slam',
    windupProgress: 0,
    flash: 0,
    defeated: false,
    shockwaves: []
  };
}
