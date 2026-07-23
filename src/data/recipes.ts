import type { ItemId, ResourceKey } from "../game/state.js";

export type Recipe = {
  id: ItemId;
  name: string;
  cost: Partial<Record<ResourceKey, number>>;
  craftSeconds: number;
  effect: string;
};

export const recipes: Recipe[] = [
  {
    id: "torch",
    name: "Torch",
    cost: { wood: 2, herb: 1 },
    craftSeconds: 5,
    effect: "Reduces night and burn route risk.",
  },
  {
    id: "ration",
    name: "Ration",
    cost: { food: 2 },
    craftSeconds: 5,
    effect: "Improves expedition safety.",
  },
  {
    id: "stoneSpear",
    name: "Stone Spear",
    cost: { wood: 2, stone: 3 },
    craftSeconds: 8,
    effect: "Adds combat power.",
  },
  {
    id: "herbSalve",
    name: "Herb Salve",
    cost: { herb: 2 },
    craftSeconds: 6,
    effect: "Heals HP or injury.",
  },
  {
    id: "warmCloak",
    name: "Warm Cloak",
    cost: { food: 2, herb: 2 },
    craftSeconds: 9,
    effect: "Reduces Ember burn pressure.",
  },
  {
    id: "repairKit",
    name: "Repair Kit",
    cost: { wood: 3, stone: 3 },
    craftSeconds: 10,
    effect: "Improves Beacon repair efficiency.",
  },
];

export function getRecipe(id: ItemId): Recipe {
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) throw new Error(`Unknown recipe: ${id}`);
  return recipe;
}

export function formatCost(cost: Recipe["cost"]): string {
  return Object.entries(cost)
    .map(([resource, amount]) => `${labelResource(resource as ResourceKey)} ${amount}`)
    .join(", ");
}

function labelResource(resource: ResourceKey): string {
  const labels: Record<ResourceKey, string> = {
    wood: "Wood",
    food: "Food",
    herb: "Herb",
    stone: "Stone",
    ore: "Ore",
    relicShard: "Relic Shard",
  };
  return labels[resource];
}
