import type {
  CampPressureKey,
  CrisisId,
  IdleJob,
  ItemId,
  ResourceKey,
  StarterClassId,
  StatKey,
} from "../game/state.js";

export type CrisisSeverity = "warning" | "severe" | "critical";

export type CrisisTrigger =
  | { type: "pressure"; key: CampPressureKey; atOrBelow: number }
  | { type: "resource"; key: ResourceKey; atOrBelow: number }
  | { type: "survivorStrain"; fatigueAtLeast: number; injuryAtLeast: number }
  | { type: "routeFailures"; atLeast: number }
  | { type: "flagPrefix"; prefix: string }
  | { type: "modifierAndFood"; modifier: "hungryNight"; foodAtOrBelow: number };

export type CrisisRequirement = {
  resources?: Partial<Record<ResourceKey, number>>;
  item?: ItemId;
  classId?: StarterClassId;
  minStat?: { stat: StatKey; value: number };
  requiredJob?: IdleJob;
};

export type CrisisEffect = {
  resources?: Partial<Record<ResourceKey, number>>;
  items?: Partial<Record<ItemId, number>>;
  pressure?: Partial<Record<CampPressureKey, number>>;
  fatigue?: number;
  injury?: number;
  collapse?: number;
  routeRisk?: number;
  repairSpeed?: number;
  score?: number;
  flag?: string;
};

export type CrisisChoice = {
  id: string;
  label: string;
  detail: string;
  requirement?: CrisisRequirement;
  effect: CrisisEffect;
  result: string;
};

export type CrisisDefinition = {
  id: CrisisId;
  name: string;
  severity: CrisisSeverity;
  deadlineSeconds: number;
  warning: string;
  consequence: string;
  triggers: CrisisTrigger[];
  choices: CrisisChoice[];
  ignoredEffect: CrisisEffect;
};

export const crises: CrisisDefinition[] = [
  {
    id: "dyingFire",
    name: "The Fire Is Dying",
    severity: "critical",
    deadlineSeconds: 50,
    warning: "The central ember has faded to a red pinprick.",
    consequence: "Cold drains Morale and pushes the camp toward collapse.",
    triggers: [{ type: "pressure", key: "fire", atOrBelow: 30 }],
    choices: [
      {
        id: "fuel",
        label: "Feed the fire",
        detail: "Spend 4 Wood.",
        requirement: { resources: { wood: 4 } },
        effect: { resources: { wood: -4 }, pressure: { fire: 45, morale: 5 }, score: 8 },
        result: "Dry timber restores the campfire.",
      },
      {
        id: "tinker",
        label: "Rebuild the firebox",
        detail: "Tinker only.",
        requirement: { classId: "tinker" },
        effect: { pressure: { fire: 32, shelter: 6 }, score: 10, flag: "reinforced-firebox" },
        result: "A vented firebox holds the heat.",
      },
      {
        id: "endure",
        label: "Endure the cold",
        detail: "No cost, but Morale and stability suffer.",
        effect: { pressure: { fire: 10, morale: -8 }, collapse: 8 },
        result: "The camp survives the night, but trust in the fire weakens.",
      },
    ],
    ignoredEffect: { pressure: { fire: -20, morale: -12 }, collapse: 32 },
  },
  {
    id: "emptyStores",
    name: "Empty Stores",
    severity: "severe",
    deadlineSeconds: 65,
    warning: "The ration shelf is nearly bare.",
    consequence: "Hunger raises Fatigue and accelerates collapse.",
    triggers: [
      { type: "pressure", key: "supplies", atOrBelow: 28 },
      { type: "resource", key: "food", atOrBelow: 2 },
      { type: "modifierAndFood", modifier: "hungryNight", foodAtOrBelow: 5 },
    ],
    choices: [
      {
        id: "ration",
        label: "Open emergency rations",
        detail: "Consume 1 Ration.",
        requirement: { item: "ration" },
        effect: { items: { ration: -1 }, pressure: { supplies: 38, morale: 5 }, score: 8 },
        result: "Measured portions steady the camp.",
      },
      {
        id: "forage",
        label: "Send camp foragers",
        detail: "Requires a survivor assigned to Forage.",
        requirement: { requiredJob: "forage" },
        effect: { resources: { food: 4 }, pressure: { supplies: 22 }, fatigue: 5, score: 6 },
        result: "The foragers return with roots and small game.",
      },
      {
        id: "tighten",
        label: "Tighten portions",
        detail: "No cost, but Morale falls.",
        effect: { pressure: { supplies: 12, morale: -10 }, collapse: 6 },
        result: "The stores last longer at a human cost.",
      },
    ],
    ignoredEffect: { pressure: { supplies: -20, morale: -8 }, fatigue: 10, collapse: 30 },
  },
  {
    id: "woundedCamp",
    name: "Wounded Camp",
    severity: "severe",
    deadlineSeconds: 70,
    warning: "Untreated wounds and exhaustion are spreading through the crew.",
    consequence: "Injuries worsen and Beacon repair slows.",
    triggers: [{ type: "survivorStrain", fatigueAtLeast: 70, injuryAtLeast: 38 }],
    choices: [
      {
        id: "salve",
        label: "Use Herb Salve",
        detail: "Consume 1 Herb Salve.",
        requirement: { item: "herbSalve" },
        effect: { items: { herbSalve: -1 }, injury: -12, pressure: { morale: 8 }, score: 8 },
        result: "The worst wounds are cleaned and bound.",
      },
      {
        id: "herbalist",
        label: "Organize a field clinic",
        detail: "Herbalist only.",
        requirement: { classId: "herbalist" },
        effect: { injury: -8, fatigue: -6, pressure: { morale: 10 }, score: 10 },
        result: "The Herbalist stabilizes the exhausted crew.",
      },
      {
        id: "push",
        label: "Keep everyone working",
        detail: "Avoid spending supplies; repair efficiency suffers.",
        effect: { pressure: { morale: -8 }, collapse: 10, repairSpeed: -0.1 },
        result: "Work continues, but the camp starts to fray.",
      },
    ],
    ignoredEffect: { injury: 10, pressure: { morale: -12 }, collapse: 26, repairSpeed: -0.12 },
  },
  {
    id: "brokenShelter",
    name: "Broken Shelter",
    severity: "warning",
    deadlineSeconds: 75,
    warning: "Failed expeditions have left the outer shelters exposed.",
    consequence: "Future routes become riskier and the camp loses protection.",
    triggers: [
      { type: "pressure", key: "shelter", atOrBelow: 32 },
      { type: "routeFailures", atLeast: 2 },
    ],
    choices: [
      {
        id: "rebuild",
        label: "Rebuild the wall",
        detail: "Spend 6 Wood.",
        requirement: { resources: { wood: 6 } },
        effect: { resources: { wood: -6 }, pressure: { shelter: 45, morale: 4 }, score: 8 },
        result: "A new timber wall seals the camp edge.",
      },
      {
        id: "tinker",
        label: "Brace the weak points",
        detail: "Requires CRAFT 8.",
        requirement: { minStat: { stat: "craft", value: 8 } },
        effect: { pressure: { shelter: 32 }, routeRisk: -2, score: 10 },
        result: "Careful bracing turns scraps into real protection.",
      },
      {
        id: "patch",
        label: "Patch with scraps",
        detail: "Spend 2 Wood; route risk increases slightly.",
        requirement: { resources: { wood: 2 } },
        effect: { resources: { wood: -2 }, pressure: { shelter: 18 }, routeRisk: 2 },
        result: "The patch holds, though the forest paths feel less secure.",
      },
    ],
    ignoredEffect: { pressure: { shelter: -22, morale: -6 }, routeRisk: 4, collapse: 28 },
  },
  {
    id: "campDespair",
    name: "Camp Despair",
    severity: "critical",
    deadlineSeconds: 55,
    warning: "Missed chances and repeated setbacks have broken the camp's confidence.",
    consequence: "Morale collapses and repair work slows.",
    triggers: [
      { type: "pressure", key: "morale", atOrBelow: 28 },
      { type: "flagPrefix", prefix: "recruit-" },
    ],
    choices: [
      {
        id: "feast",
        label: "Hold a shared meal",
        detail: "Spend 3 Food.",
        requirement: { resources: { food: 3 } },
        effect: { resources: { food: -3 }, pressure: { morale: 36, supplies: 5 }, score: 8 },
        result: "A hot meal gives the camp something to believe in.",
      },
      {
        id: "guard",
        label: "Call a night watch",
        detail: "Requires a survivor assigned to Guard.",
        requirement: { requiredJob: "guard" },
        effect: { pressure: { morale: 25, shelter: 5 }, score: 6 },
        result: "The steady watch restores a sense of control.",
      },
      {
        id: "silence",
        label: "Let the camp withdraw",
        detail: "No cost, but collapse pressure rises.",
        effect: { pressure: { morale: 6 }, collapse: 12 },
        result: "The camp goes quiet and survives without healing.",
      },
    ],
    ignoredEffect: { pressure: { morale: -20 }, collapse: 36, repairSpeed: -0.15 },
  },
];

export function getCrisis(id: CrisisId): CrisisDefinition {
  const definition = crises.find((crisis) => crisis.id === id);
  if (!definition) throw new Error(`Unknown crisis: ${id}`);
  return definition;
}
