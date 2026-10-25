import { Layout, TerrainType, Tool } from '../types/game';

export const TOOLS: Tool[] = [
  { name: "Starter Hammer", cost: 10, power: 2, note: "Tx 00821: Delivered by OPERATOR_00 to Starting Chamber at 03:17.", color: "#9ca3af" },
  { name: "Old Hammer", cost: 50, power: 4, note: "A stubborn relic. Vibrates with the memory of what it broke.", color: "#9a8062" },
  { name: "Stone Hammer", cost: 150, power: 7, note: "Shatters early Echo Matter resonance across reinforced bulkheads.", color: "#a9a28e" },
  { name: "Copper Hammer", cost: 500, power: 12, note: "Conducts the facility's hidden residual currents.", color: "#c47b43" },
  { name: "Iron Hammer", cost: 750, power: 17, note: "Built for doors that do not exist on any official blueprint.", color: "#bec8d5" },
  { name: "BlackStone Hammer", cost: 1000, power: 22, note: "Forged in deep volcanic core shielding below sub-level 50.", color: "#252a34" },
  { name: "Malachite Hammer", cost: 1200, power: 28, note: "Crystallized lattice capable of splintering hardened Echo anomalies.", color: "#39a779" },
  { name: "Emerald Hammer", cost: 1500, power: 38, note: "Resonant green alloy that disrupts containment matrixes.", color: "#4ade80" },
  { name: "Red Gold Hammer", cost: 1750, power: 50, note: "Dense aurum compound designed to pierce Colossus warding.", color: "#d97732" },
  { name: "Deepslate Hammer", cost: 2250, power: 72, note: "Heavy subterranean alloy. Pierces the threshold of Room 99.", color: "#64748b" }
];

export const LAYOUTS: Layout[] = [
  { id: "chamber", name: "STONE CHAMBER", minLength: 1200, maxLength: 1550, stairs: 0 },
  { id: "hallway", name: "LONG HALLWAY", minLength: 2100, maxLength: 2850, stairs: 0 },
  { id: "stairs-up", name: "STAIRS UP TO THE VAULT", minLength: 1800, maxLength: 2350, stairs: -1 },
  { id: "stairs-down", name: "STAIRS DOWN TO THE VAULT", minLength: 1800, maxLength: 2350, stairs: 1 },
  { id: "long-stairs", name: "THE ENDLESS STAIR", minLength: 2500, maxLength: 3200, stairs: -1 },
  { id: "vent", name: "THE SERVICE VENT", minLength: 2200, maxLength: 2800, stairs: 0, vent: true }
];

export const TERRAIN_TYPES: TerrainType[] = [
  { name: "STONE", surface: "rgba(148,163,184,.14)", accent: "rgba(148,163,184,.35)" },
  { name: "MOSS", surface: "rgba(74,222,128,.13)", accent: "rgba(74,222,128,.32)" },
  { name: "SAND", surface: "rgba(251,191,36,.13)", accent: "rgba(251,191,36,.31)" },
  { name: "CRYSTAL", surface: "rgba(56,189,248,.14)", accent: "rgba(56,189,248,.36)" },
  { name: "RUST", surface: "rgba(251,146,60,.13)", accent: "rgba(251,146,60,.32)" }
];

export function vaultDurability(room: number): number {
  return Math.min(180, 24 + Math.min(room, 20) * 8);
}

export const SAVE_KEY = "room99-save-v3";
export const CANVAS_VIRTUAL_W = 960;
export const CANVAS_VIRTUAL_H = 600;
