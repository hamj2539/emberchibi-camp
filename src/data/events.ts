import type { RecruitEvent, RouteId, Survivor } from "../game/state.js";

type RecruitDefinition = Omit<RecruitEvent, "status"> & {
  routeId: RouteId;
  survivor: Survivor;
};

export const recruitDefinitions: RecruitDefinition[] = [
  {
    id: "rook",
    routeId: "mistwoodEdge",
    name: "Rook, Lost Hunter",
    description: "A wounded hunter watches the campfire from a burned trail.",
    herbCost: 2,
    foodCost: 4,
    survivor: {
      id: "survivor-rook",
      name: "Rook",
      classId: "hunter",
      role: "Lost Hunter",
      stats: { hp: 28, atk: 7, def: 4, spd: 5, wis: 3, craft: 3, surv: 8, luck: 4 },
      currentHp: 21,
      fatigue: 12,
      injury: 8,
      job: "rest",
      onExpedition: false,
    },
  },
  {
    id: "mira",
    routeId: "saltmarshRun",
    name: "Mira, Tide Herbalist",
    description: "A marsh healer offers her maps in exchange for a warm meal or medicine.",
    herbCost: 4,
    foodCost: 6,
    survivor: {
      id: "survivor-mira",
      name: "Mira",
      classId: "herbalist",
      role: "Tide Herbalist",
      stats: { hp: 27, atk: 3, def: 4, spd: 4, wis: 9, craft: 5, surv: 7, luck: 5 },
      currentHp: 24,
      fatigue: 8,
      injury: 4,
      job: "forage",
      onExpedition: false,
    },
  },
  {
    id: "bram",
    routeId: "windscarCliffs",
    name: "Bram, Cliff Tinker",
    description: "A stranded mechanic can restore the camp workshop if given supplies.",
    herbCost: 5,
    foodCost: 7,
    survivor: {
      id: "survivor-bram",
      name: "Bram",
      classId: "tinker",
      role: "Cliff Tinker",
      stats: { hp: 30, atk: 4, def: 7, spd: 3, wis: 6, craft: 9, surv: 5, luck: 3 },
      currentHp: 26,
      fatigue: 10,
      injury: 5,
      job: "craft",
      onExpedition: false,
    },
  },
];

export function getRecruitDefinition(id: RecruitEvent["id"]): RecruitDefinition {
  const definition = recruitDefinitions.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Unknown recruit event: ${id}`);
  return definition;
}

export function getRecruitForRoute(routeId: RouteId): RecruitDefinition | undefined {
  return recruitDefinitions.find((entry) => entry.routeId === routeId);
}
