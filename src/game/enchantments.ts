export interface EnchantmentDef {
  id: 'overcharge' | 'seismic' | 'greed' | 'lightweight';
  name: string;
  icon: string;
  color: string;
  shortDesc: string;
  maxLevel: number;
  costs: number[]; // cost for level 1, 2, 3
  effectDescs: string[];
}

export const ENCHANTMENTS_CONFIG: EnchantmentDef[] = [
  {
    id: 'overcharge',
    name: 'Overcharge Core',
    icon: '⚡',
    color: '#38bdf8',
    shortDesc: 'Adds a critical strike chance to swing with 3.0× kinetic damage.',
    maxLevel: 3,
    costs: [350, 850, 1800],
    effectDescs: [
      'Rank 1: +15% Chance to deal 3.0× Critical Damage',
      'Rank 2: +30% Chance to deal 3.0× Critical Damage',
      'Rank 3: +45% Chance to deal 3.0× Critical Damage'
    ]
  },
  {
    id: 'seismic',
    name: 'Seismic Shockwave',
    icon: '💥',
    color: '#f59e0b',
    shortDesc: 'Generates subterranean ground tremors dealing flat bonus damage per hit.',
    maxLevel: 3,
    costs: [400, 950, 2000],
    effectDescs: [
      'Rank 1: +6 Flat Shockwave Bonus Damage per swing',
      'Rank 2: +14 Flat Shockwave Bonus Damage per swing',
      'Rank 3: +25 Flat Shockwave Bonus Damage per swing'
    ]
  },
  {
    id: 'greed',
    name: 'Greed Magnet',
    icon: '💰',
    color: '#10b981',
    shortDesc: 'Transmutes shattered vault debris into extra Neno Coin payouts.',
    maxLevel: 3,
    costs: [300, 750, 1600],
    effectDescs: [
      'Rank 1: +25% Extra Neno Coins from Vaults & Chests',
      'Rank 2: +55% Extra Neno Coins from Vaults & Chests',
      'Rank 3: +90% Extra Neno Coins from Vaults & Chests'
    ]
  },
  {
    id: 'lightweight',
    name: 'Aerosteel Shaft',
    icon: '🪶',
    color: '#ec4899',
    shortDesc: 'Ultralight alloy reducing stamina drain and speeding up recovery.',
    maxLevel: 3,
    costs: [250, 600, 1300],
    effectDescs: [
      'Rank 1: 25% Less Stamina Drain & 20% Faster Recovery',
      'Rank 2: 50% Less Stamina Drain & 40% Faster Recovery',
      'Rank 3: 75% Less Stamina Drain & 70% Faster Recovery'
    ]
  }
];

export function getEnchantmentCritChance(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 0.15;
  if (level === 2) return 0.30;
  return 0.45;
}

export function getEnchantmentSeismicBonus(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 6;
  if (level === 2) return 14;
  return 25;
}

export function getEnchantmentGreedMultiplier(level: number): number {
  if (level <= 0) return 1.0;
  if (level === 1) return 1.25;
  if (level === 2) return 1.55;
  return 1.90;
}

export function getEnchantmentStaminaEfficiency(level: number): { drainMultiplier: number; regenMultiplier: number } {
  if (level <= 0) return { drainMultiplier: 1.0, regenMultiplier: 1.0 };
  if (level === 1) return { drainMultiplier: 0.75, regenMultiplier: 1.20 };
  if (level === 2) return { drainMultiplier: 0.50, regenMultiplier: 1.40 };
  return { drainMultiplier: 0.25, regenMultiplier: 1.70 };
}
