import type { BeaconId, RunEquipmentSlot, RunItemId } from "../game/state.js";

export type RunItemDefinition = {
  id: RunItemId;
  name: string;
  slot: RunEquipmentSlot;
  effect: string;
  trigger: string;
};

export const runItems: RunItemDefinition[] = [
  { id: "oldCompass", name: "Old Compass", slot: "tool", effect: "Turns the first failed non-Guardian route into a narrow success.", trigger: "Route failure" },
  { id: "emberPick", name: "Ember Pick", slot: "tool", effect: "Doubles Stone and Ore found on Ember routes, but adds 3 Fatigue.", trigger: "Ember route reward" },
  { id: "boneNeedle", name: "Bone Needle", slot: "tool", effect: "Crisis responses also remove 4 Injury from available survivors.", trigger: "Crisis resolution" },
  { id: "cinderGauge", name: "Cinder Gauge", slot: "tool", effect: "Doubles repair progress for the first Beacon repaired.", trigger: "Beacon repair" },
  { id: "mossCrown", name: "Moss Crown", slot: "charm", effect: "Extends the first crisis deadline by 25 seconds.", trigger: "Crisis trigger" },
  { id: "ashBell", name: "Ash Bell", slot: "charm", effect: "Guardians start with 1 less pressure, but route rewards fall by 15%.", trigger: "Guardian and route rewards" },
  { id: "moonThread", name: "Moon Thread", slot: "charm", effect: "Adds 120 score if no survivor is downed when the run ends.", trigger: "Run score" },
  { id: "hollowCoin", name: "Hollow Coin", slot: "charm", effect: "Each resolved crisis grants 6 extra score; ignored crises add 4 more collapse.", trigger: "Crisis outcome" },
  { id: "saltedRations", name: "Salted Rations", slot: "provision", effect: "Hungry Night no longer drains Supplies faster at low Food.", trigger: "Camp pressure" },
  { id: "resinTorchBundle", name: "Resin Torch Bundle", slot: "provision", effect: "The first Torch used against a Guardian gains +6 damage and +1 pressure relief.", trigger: "Guardian Torch" },
  { id: "bitterTonic", name: "Bitter Tonic", slot: "provision", effect: "Prevents the first route Injury increase, then adds 5 Fatigue.", trigger: "Route injury" },
  { id: "wayfinderKnot", name: "Wayfinder Knot", slot: "provision", effect: "Route events are 20% more likely and encounters 10% less likely.", trigger: "Route decision roll" },
];

export const guardianRunItemRewards: Record<BeaconId, RunItemId> = {
  ember: "emberPick",
  tidal: "saltedRations",
  gale: "wayfinderKnot",
  root: "mossCrown",
  lunar: "moonThread",
};

export function getRunItem(id: RunItemId): RunItemDefinition {
  const item = runItems.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown run item: ${id}`);
  return item;
}
