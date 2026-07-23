import type { GameState, Inventory, LegacyState, Resources, Stats } from "./state.js";
import { getRunItem } from "../data/runItems.js";

export type LegacyBonus = {
  source: string;
  effect: string;
};

export function getLegacyBonuses(legacy: LegacyState): LegacyBonus[] {
  const bonuses: LegacyBonus[] = [];

  addIfOwned(bonuses, legacy.blueprints, "Torch Blueprint", "+1 Torch at the start of each run");
  addIfOwned(bonuses, legacy.blueprints, "Repair Kit Blueprint", "+1 Repair Kit at the start of each run");
  addIfOwned(bonuses, legacy.blueprints, "Warm Cloak Blueprint", "+1 Warm Cloak at the start of each run");
  addIfOwned(bonuses, legacy.equippedRelics, "Coalglass Charm", "+4 starting Wood");
  addIfOwned(bonuses, legacy.equippedRelics, "Ashen Compass", "+3 starting Food");
  addIfOwned(bonuses, legacy.equippedRelics, "Stagbone Token", "+1 Stone Spear at the start of each run");
  addIfOwned(bonuses, legacy.unlocks, "Rook Camp Trait", "+3 HP and +1 ATK for the first survivor");
  addIfOwned(bonuses, legacy.unlocks, "Mistwood Scout Rumor", "+2 starting Herb");
  addIfOwned(bonuses, legacy.unlocks, "Ember Adept Class", "+1 WIS and +1 Relic Shard");
  addIfOwned(bonuses, legacy.unlocks, "Warden Class", "+1 DEF and +4 starting Stone");
  addIfOwned(bonuses, legacy.projects, "fieldManual", "+3 route safety");
  addIfOwned(bonuses, legacy.projects, "deepPockets", "+1 Ration and +1 Torch");
  addIfOwned(bonuses, legacy.projects, "hearthstone", "+5 HP for the first survivor");
  addIfOwned(bonuses, legacy.projects, "trailArchive", "Story leads appear in route forecasts");
  addIfOwned(bonuses, legacy.projects, "weatherDial", "Choose the run modifier");
  addIfOwned(bonuses, legacy.projects, "chestLens", "Legacy Chests keep the rarer of two rolls");
  addIfOwned(bonuses, legacy.projects, "memoryReliquary", "One equipped run item carries into the next run");
  addIfOwned(bonuses, legacy.projects, "starterSatchel", "Choose an alternate starting loadout");

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
  if (legacy.equippedRelics.includes("Coalglass Charm")) resources.wood += 4;
  if (legacy.equippedRelics.includes("Ashen Compass")) resources.food += 3;
  if (legacy.equippedRelics.includes("Stagbone Token")) items.stoneSpear += 1;
  if (legacy.projects.includes("deepPockets")) {
    items.ration += 1;
    items.torch += 1;
  }
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
  if (legacy.projects.includes("hearthstone")) statBonuses.hp = (statBonuses.hp ?? 0) + 5;
  if (state.run.starterLoadout === "trail" && legacy.projects.includes("starterSatchel")) {
    resources.wood = Math.max(0, resources.wood - 3);
    items.ration += 1;
    items.torch += 1;
  }
  if (state.run.starterLoadout === "workshop" && legacy.projects.includes("starterSatchel")) {
    resources.food = Math.max(0, resources.food - 3);
    resources.stone += 3;
    items.repairKit += 1;
  }
  if (state.run.vows.includes("scarceFood")) resources.food = Math.max(0, resources.food - 5);
  const campPressure = {
    ...state.run.campPressure,
    fire: state.run.vows.includes("lowFlame") ? 45 : state.run.campPressure.fire,
    supplies: state.run.vows.includes("scarceFood") ? 55 : state.run.campPressure.supplies,
  };
  const remembered = legacy.projects.includes("memoryReliquary") ? legacy.rememberedRunItem : null;
  const rememberedDefinition = remembered ? getRunItem(remembered) : null;

  return {
    ...state,
    run: {
      ...state.run,
      resources,
      items,
      campPressure,
      runItems: remembered
        ? [{ id: remembered, source: "Memory Reliquary" }, ...state.run.runItems.filter((entry) => entry.id !== remembered)]
        : state.run.runItems,
      runLoadout: rememberedDefinition
        ? { ...state.run.runLoadout, [rememberedDefinition.slot]: rememberedDefinition.id }
        : state.run.runLoadout,
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
