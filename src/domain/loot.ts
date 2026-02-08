import { InventoryItem } from './types';
import { SeededRng } from './rng';

const RARITY_TABLE: { rarity: InventoryItem['rarity']; weight: number }[] = [
  { rarity: 'Common', weight: 0.7 },
  { rarity: 'Rare', weight: 0.2 },
  { rarity: 'Epic', weight: 0.08 },
  { rarity: 'Legendary', weight: 0.02 }
];

const COSMETIC_TYPES: InventoryItem['type'][] = ['theme', 'badge', 'avatar_frame', 'profile_title'];

export type LootResult = {
  item?: InventoryItem;
  pityCounter: number;
};

export function rollLoot(
  rng: SeededRng,
  pityCounter: number
): LootResult {
  const dropChance = 0.08;
  const shouldDrop = rng.next() < dropChance;
  const pityHit = pityCounter >= 15;

  if (!shouldDrop && !pityHit) {
    return { pityCounter: pityCounter + 1 };
  }

  const rarity = pityHit ? 'Rare' : weightedRarity(rng);
  const id = `loot-${Date.now()}-${Math.floor(rng.next() * 10000)}`;
  const type = COSMETIC_TYPES[rng.int(0, COSMETIC_TYPES.length - 1)];
  const item: InventoryItem = {
    id,
    name: `${rarity} ${type.replace('_', ' ')}`,
    rarity,
    type,
    acquiredAt: new Date().toISOString()
  };

  return { item, pityCounter: 0 };
}

function weightedRarity(rng: SeededRng): InventoryItem['rarity'] {
  const roll = rng.next();
  let cumulative = 0;
  for (const entry of RARITY_TABLE) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.rarity;
    }
  }
  return 'Common';
}
