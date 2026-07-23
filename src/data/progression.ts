import type { CampUpgradeId, LegacyProjectId, ResourceKey } from "../game/state.js";

export type CampUpgrade = {
  id: CampUpgradeId;
  name: string;
  description: string;
  cost: Partial<Record<ResourceKey, number>>;
};

export const campUpgrades: CampUpgrade[] = [
  {
    id: "infirmary",
    name: "Field Infirmary",
    description: "Rest heals twice as fast and slowly treats Injury.",
    cost: { wood: 8, herb: 5 },
  },
  {
    id: "workshop",
    name: "Ember Workshop",
    description: "All craft and Beacon repair progress is 35% faster.",
    cost: { wood: 10, stone: 6 },
  },
  {
    id: "watchtower",
    name: "Watchtower",
    description: "Adds +6 safety to every expedition.",
    cost: { wood: 12, stone: 4 },
  },
];

export type LegacyProject = {
  id: LegacyProjectId;
  name: string;
  description: string;
  cost: number;
};

export const legacyProjects: LegacyProject[] = [
  { id: "fieldManual", name: "Field Manual", description: "+3 safety on every route.", cost: 8 },
  { id: "deepPockets", name: "Deep Pockets", description: "Start each run with +1 Ration and +1 Torch.", cost: 12 },
  { id: "hearthstone", name: "Hearthstone", description: "The first survivor starts with +5 max HP.", cost: 18 },
];

