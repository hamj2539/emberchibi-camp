import type { RunVowId, StarterLoadoutId } from "../game/state.js";

export type RunVowDefinition = {
  id: RunVowId;
  name: string;
  description: string;
  reward: string;
  scoreBonus: number;
};

export const runVows: RunVowDefinition[] = [
  { id: "lowFlame", name: "Low Flame", description: "Begin with Fire at 45 instead of 80.", reward: "+80 score · 3 Shards first clear", scoreBonus: 80 },
  { id: "scarceFood", name: "Scarce Food", description: "Begin with 5 less Food and lower Supplies.", reward: "+80 score · 3 Shards first clear", scoreBonus: 80 },
  { id: "noRetreat", name: "No Retreat", description: "The run cannot be abandoned after it begins.", reward: "+100 score · 3 Shards first clear", scoreBonus: 100 },
  { id: "pristineHunt", name: "Pristine Hunt", description: "Recover at least three Pristine Cores or lose 80 score.", reward: "+120 score · 3 Shards first clear", scoreBonus: 120 },
  { id: "soloGuardian", name: "Solo Guardian", description: "Guardian sites require exactly one survivor.", reward: "+140 score · 3 Shards first clear", scoreBonus: 140 },
];

export const starterLoadouts: { id: StarterLoadoutId; name: string; description: string }[] = [
  { id: "balanced", name: "Balanced Pack", description: "Standard camp supplies." },
  { id: "trail", name: "Trail Pack", description: "+1 Ration and +1 Torch, but -3 Wood." },
  { id: "workshop", name: "Workshop Pack", description: "+1 Repair Kit and +3 Stone, but -3 Food." },
];

export function getRunVow(id: RunVowId): RunVowDefinition {
  const vow = runVows.find((entry) => entry.id === id);
  if (!vow) throw new Error(`Unknown run vow: ${id}`);
  return vow;
}
