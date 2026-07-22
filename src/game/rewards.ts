import type { ChestGrade, ChestReward, GameState, RewardType } from "./state.js";

const rates: Record<ChestGrade, { type: RewardType; weight: number }[]> = {
  broken: [
    { type: "legacyShards", weight: 55 },
    { type: "blueprint", weight: 25 },
    { type: "relic", weight: 15 },
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
    { type: "legacyShards", weight: 15 },
    { type: "blueprint", weight: 30 },
    { type: "relic", weight: 30 },
    { type: "survivorUnlock", weight: 17 },
    { type: "classUnlock", weight: 8 },
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
  };

  if (reward.type === "legacyShards") legacy.shards += reward.amount ?? 0;
  if (reward.type === "blueprint" && !legacy.blueprints.includes(reward.label)) legacy.blueprints.push(reward.label);
  if (reward.type === "relic" && !legacy.relics.includes(reward.label)) legacy.relics.push(reward.label);
  if ((reward.type === "survivorUnlock" || reward.type === "classUnlock") && !legacy.unlocks.includes(reward.label)) {
    legacy.unlocks.push(reward.label);
  }

  return { ...state, legacy };
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

function shardAmount(grade: ChestGrade): number {
  const amounts: Record<ChestGrade, number> = {
    broken: 5,
    faded: 9,
    iron: 14,
    ancient: 22,
  };
  return amounts[grade];
}

function pick(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}
