import type { ChestGrade, ChestReward, GameState, RewardType } from "./state.js";

const rates: Record<ChestGrade, { type: RewardType; weight: number }[]> = {
  broken: [
    { type: "legacyShards", weight: 65 },
    { type: "blueprint", weight: 20 },
    { type: "relic", weight: 10 },
    { type: "survivorUnlock", weight: 5 },
    { type: "classUnlock", weight: 0 },
  ],
  faded: [
    { type: "legacyShards", weight: 40 },
    { type: "blueprint", weight: 30 },
    { type: "relic", weight: 20 },
    { type: "survivorUnlock", weight: 8 },
    { type: "classUnlock", weight: 2 },
  ],
  iron: [
    { type: "legacyShards", weight: 25 },
    { type: "blueprint", weight: 32 },
    { type: "relic", weight: 25 },
    { type: "survivorUnlock", weight: 13 },
    { type: "classUnlock", weight: 5 },
  ],
  ancient: [
    { type: "legacyShards", weight: 10 },
    { type: "blueprint", weight: 28 },
    { type: "relic", weight: 32 },
    { type: "survivorUnlock", weight: 20 },
    { type: "classUnlock", weight: 10 },
  ],
};

export function rollChestReward(grade: ChestGrade): ChestReward {
  const type = weightedRoll(rates[grade]);
  if (type === "legacyShards") return { type, label: "Legacy Shards", amount: shardAmount(grade) };
  if (type === "blueprint") return { type, label: pick(["Torch Blueprint", "Repair Kit Blueprint", "Warm Cloak Blueprint"]) };
  if (type === "relic") return { type, label: pick(["Coalglass Charm", "Ashen Compass", "Stagbone Token"]) };
  if (type === "survivorUnlock") return { type, label: pick(["Rook Camp Trait", "Mistwood Scout Rumor"]) };
  return { type, label: pick(["Ember Adept Class", "Warden Class"]) };
}

export function rollBestChestReward(grade: ChestGrade, useChestLens: boolean): ChestReward {
  const first = rollChestReward(grade);
  if (!useChestLens) return first;
  const second = rollChestReward(grade);
  return rewardRank(second) > rewardRank(first) ? second : first;
}

export function describeChestGrade(grade: ChestGrade): string {
  const descriptions: Record<ChestGrade, string> = {
    broken: "Small shard payout with a low chance of collection unlocks.",
    faded: "Better shard payout and a real chance at blueprints or relics.",
    iron: "Strong collection odds with survivor and class unlock chances.",
    ancient: "Best shard payout and the highest relic, survivor, and class unlock odds.",
  };
  return descriptions[grade];
}

export function applyReward(state: GameState, reward: ChestReward): GameState {
  const legacy = {
    ...state.legacy,
    unlocks: [...state.legacy.unlocks],
    relics: [...state.legacy.relics],
    blueprints: [...state.legacy.blueprints],
    collection: {
      ...state.legacy.collection,
      relics: [...state.legacy.collection.relics],
      blueprints: [...state.legacy.collection.blueprints],
    },
  };

  if (reward.type === "legacyShards") legacy.shards += reward.amount ?? 0;
  const duplicate =
    (reward.type === "blueprint" && legacy.blueprints.includes(reward.label)) ||
    (reward.type === "relic" && legacy.relics.includes(reward.label)) ||
    ((reward.type === "survivorUnlock" || reward.type === "classUnlock") && legacy.unlocks.includes(reward.label));
  if (duplicate) legacy.shards += 6;
  if (reward.type === "blueprint" && !legacy.blueprints.includes(reward.label)) legacy.blueprints.push(reward.label);
  if (reward.type === "blueprint" && !legacy.collection.blueprints.includes(reward.label)) legacy.collection.blueprints.push(reward.label);
  if (reward.type === "relic" && !legacy.relics.includes(reward.label)) legacy.relics.push(reward.label);
  if (reward.type === "relic" && !legacy.collection.relics.includes(reward.label)) legacy.collection.relics.push(reward.label);
  if ((reward.type === "survivorUnlock" || reward.type === "classUnlock") && !legacy.unlocks.includes(reward.label)) {
    legacy.unlocks.push(reward.label);
  }

  return { ...state, legacy };
}

export function shardAmount(grade: ChestGrade): number {
  const amounts: Record<ChestGrade, number> = {
    broken: 6,
    faded: 10,
    iron: 16,
    ancient: 24,
  };
  return amounts[grade];
}

function rewardRank(reward: ChestReward): number {
  return { legacyShards: 0, blueprint: 1, relic: 2, survivorUnlock: 3, classUnlock: 4 }[reward.type];
}

function weightedRoll(options: { type: RewardType; weight: number }[]): RewardType {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option.type;
  }
  return "legacyShards";
}

function pick(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}
