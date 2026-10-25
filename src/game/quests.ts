import { Quest } from '../types/game';

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q_vault_3',
    title: 'Breach Initial Sector',
    desc: 'Smash through 3 subterranean vault doors.',
    reward: 250,
    target: 3,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_vault_10',
    title: 'Deep Infiltration',
    desc: 'Breach 10 subterranean vault doors.',
    reward: 750,
    target: 10,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_swings_50',
    title: 'Heavy Impact',
    desc: 'Strike the vault doors 50 times with your impact hammer.',
    reward: 300,
    target: 50,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_crates_2',
    title: 'Lucky Gambler',
    desc: 'Crack open 2 Lucky Mystery Crates in the workstation.',
    reward: 500,
    target: 2,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_water_1',
    title: 'Fluid Dynamics Master',
    desc: 'Solve 1 test tube puzzle in the Water Sorter app.',
    reward: 350,
    target: 1,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_enchant_1',
    title: 'Runic Infusion',
    desc: 'Upgrade any hammer enchantment to Level 1 or higher.',
    reward: 400,
    target: 1,
    current: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'q_chests_2',
    title: 'Subterranean Scavenger',
    desc: 'Discover and open 2 hidden treasure chests in the rooms.',
    reward: 450,
    target: 2,
    current: 0,
    completed: false,
    claimed: false
  }
];

export function updateQuestsProgress(
  quests: Quest[],
  stats: {
    vaultsBroken: number;
    swings: number;
    cratesOpened: number;
    chestsFound: number;
    waterSortWins: number;
  },
  totalEnchantmentLevels: number
): Quest[] {
  return quests.map(q => {
    let current = 0;
    if (q.id === 'q_vault_3' || q.id === 'q_vault_10') {
      current = stats.vaultsBroken;
    } else if (q.id === 'q_swings_50') {
      current = stats.swings;
    } else if (q.id === 'q_crates_2') {
      current = stats.cratesOpened;
    } else if (q.id === 'q_chests_2') {
      current = stats.chestsFound;
    } else if (q.id === 'q_water_1') {
      current = stats.waterSortWins;
    } else if (q.id === 'q_enchant_1') {
      current = totalEnchantmentLevels;
    }

    const completed = current >= q.target;
    return {
      ...q,
      current: Math.min(current, q.target),
      completed
    };
  });
}
