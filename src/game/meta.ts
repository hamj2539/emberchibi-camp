import type { GameState, Inventory, LegacyState, Resources, Stats } from "./state.js";

export type LegacyBonus = {
  source: string;
  effect: string;
};

export function getLegacyBonuses(legacy: LegacyState): LegacyBonus[] {
  const bonuses: LegacyBonus[] = [];

  addIfOwned(bonuses, legacy.blueprints, "Torch Blueprint", "+1 Torch at the start of each run");
  addIfOwned(bonuses, legacy.blueprints, "Repair Kit Blueprint", "+1 Repair Kit at the start of each run");
  addIfOwned(bonuses, legacy.blueprints, "Warm Cloak Blueprint", "+1 Warm Cloak at the start of each run");
  addIfOwned(bonuses, legacy.relics, "Coalglass Charm", "+4 starting Wood");
  addIfOwned(bonuses, legacy.relics, "Ashen Compass", "+3 starting Food");
  addIfOwned(bonuses, legacy.relics, "Stagbone Token", "+1 Stone Spear at the start of each run");
  addIfOwned(bonuses, legacy.unlocks, "Rook Camp Trait", "+3 HP and +1 ATK for the first survivor");
  addIfOwned(bonuses, legacy.unlocks, "Mistwood Scout Rumor", "+2 starting Herb");
  addIfOwned(bonuses, legacy.unlocks, "Ember Adept Class", "+1 WIS and +1 Relic Shard");
  addIfOwned(bonuses, legacy.unlocks, "Warden Class", "+1 DEF and +4 starting Stone");

  return bonuses;
}

export function applyLegacyStartBonuses(state: GameState): GameState {
  const resources: Resources = { ...state.run.resources };
  const items: Inventory = { ...state.run.items };
  const statBonuses: Partial<Stats> = {};
  const { legacy } = state;

  if (legacy.blueprints.includes("Torch Blueprint")) items.torch += 1;
  if (legacy.blueprints.includes("Repair Kit Blueprint")) items.repairKit += 1;
  if (legacy.blueprints.includes("Warm Cloak Blueprint")) items.warmCloak += 1;
  if (legacy.relics.includes("Coalglass Charm")) resources.wood += 4;
  if (legacy.relics.includes("Ashen Compass")) resources.food += 3;
  if (legacy.relics.includes("Stagbone Token")) items.stoneSpear += 1;
  if (legacy.unlocks.includes("Mistwood Scout Rumor")) resources.herb += 2;
  if (legacy.unlocks.includes("Ember Adept Class")) {
    resources.relicShard += 1;
    statBonuses.wis = 1;
  }
  if (legacy.unlocks.includes("Warden Class")) {
    resources.stone += 4;
    statBonuses.def = 1;
  }
  if (legacy.unlocks.includes("Rook Camp Trait")) {
    statBonuses.hp = 3;
    statBonuses.atk = 1;
  }

  return {
    ...state,
    run: {
      ...state.run,
      resources,
      items,
      survivors: state.run.survivors.map((survivor, index) => {
        if (index !== 0) return survivor;
        const stats = { ...survivor.stats };
        for (const [key, amount] of Object.entries(statBonuses) as [keyof Stats, number][]) stats[key] += amount;
        return { ...survivor, stats, currentHp: stats.hp };
      }),
    },
  };
}

function addIfOwned(bonuses: LegacyBonus[], collection: string[], source: string, effect: string): void {
  if (collection.includes(source)) bonuses.push({ source, effect });
}
