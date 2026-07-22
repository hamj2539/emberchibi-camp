export type Screen =
  | "starter"
  | "camp"
  | "explore"
  | "survivors"
  | "craft"
  | "boss"
  | "repair"
  | "end";

export type StatKey = "hp" | "atk" | "def" | "spd" | "wis" | "craft" | "surv" | "luck";
export type ResourceKey = "wood" | "food" | "herb" | "stone" | "ore" | "relicShard";
export type IdleJob = "rest" | "forage" | "craft" | "guard" | "cook" | "research";
export type StarterClassId = "scout" | "hunter" | "herbalist" | "tinker";
export type RouteId = "mistwoodEdge" | "burntGrove" | "emberBeaconSite";
export type ItemId = "torch" | "ration" | "stoneSpear" | "herbSalve" | "warmCloak" | "repairKit";
export type BossAction = "attack" | "guard" | "useTorch" | "useSalve";
export type CoreQuality = "pristine" | "stable" | "cracked" | "faded";

export type Stats = Record<StatKey, number>;
export type Resources = Record<ResourceKey, number>;

export type Survivor = {
  id: string;
  name: string;
  classId: StarterClassId;
  role: string;
  stats: Stats;
  currentHp: number;
  fatigue: number;
  injury: number;
  job: IdleJob;
  onExpedition: boolean;
};

export type Expedition = {
  id: string;
  routeId: RouteId;
  survivorIds: string[];
  startedAt: number;
  endsAt: number;
};

export type RouteProgress = {
  discovered: boolean;
  completed: number;
  failed: number;
};

export type Inventory = Record<ItemId, number>;

export type CraftTask = {
  id: string;
  recipeId: ItemId;
  startedAt: number;
  remainingSeconds: number;
};

export type RecruitEvent = {
  id: "rook";
  status: "available" | "resolved";
};

export type BossBattle = {
  bossId: "cinderStag";
  bossHp: number;
  bossMaxHp: number;
  guardStacks: number;
  burnPressure: number;
  partyIds: string[];
  turn: number;
  status: "active" | "won" | "lost";
  coreQuality: CoreQuality | null;
  log: string[];
};

export type BeaconRepair = {
  status: "idle" | "active" | "lit";
  assignedSurvivorIds: string[];
  progress: number;
  requiredProgress: number;
  coreQuality: CoreQuality;
  usedRepairKit: boolean;
};

export type RunState = {
  started: boolean;
  screen: Screen;
  daySeconds: number;
  resources: Resources;
  items: Inventory;
  survivors: Survivor[];
  routes: Record<RouteId, RouteProgress>;
  activeExpedition: Expedition | null;
  craftQueue: CraftTask[];
  recruitEvent: RecruitEvent | null;
  bossBattle: BossBattle | null;
  beaconRepair: BeaconRepair | null;
  log: string[];
  routeFailures: number;
  bossFailures: number;
};

export type LegacyState = {
  shards: number;
  unlocks: string[];
};

export type GameState = {
  version: 1;
  savedAt: number;
  run: RunState;
  legacy: LegacyState;
};

export type GameAction =
  | { type: "chooseStarter"; classId: StarterClassId }
  | { type: "setScreen"; screen: Screen }
  | { type: "assignJob"; survivorId: string; job: IdleJob }
  | { type: "startExpedition"; routeId: RouteId; survivorIds: string[] }
  | { type: "resolveRecruit"; choice: "herb" | "food" | "ignore" }
  | { type: "startCraft"; recipeId: ItemId }
  | { type: "bossAction"; action: BossAction }
  | { type: "leaveBossResult" }
  | { type: "startRepair"; survivorIds: string[]; useRepairKit: boolean }
  | { type: "tick"; now: number }
  | { type: "resetRun"; keepLegacy: boolean };

export const emptyResources: Resources = {
  wood: 0,
  food: 0,
  herb: 0,
  stone: 0,
  ore: 0,
  relicShard: 0,
};

export const emptyInventory: Inventory = {
  torch: 0,
  ration: 0,
  stoneSpear: 0,
  herbSalve: 0,
  warmCloak: 0,
  repairKit: 0,
};

export function createInitialState(now = Date.now()): GameState {
  return {
    version: 1,
    savedAt: now,
    run: {
      started: false,
      screen: "starter",
      daySeconds: 0,
      resources: { wood: 12, food: 10, herb: 4, stone: 0, ore: 0, relicShard: 0 },
      items: { ...emptyInventory },
      survivors: [],
      routes: {
        mistwoodEdge: { discovered: true, completed: 0, failed: 0 },
        burntGrove: { discovered: true, completed: 0, failed: 0 },
        emberBeaconSite: { discovered: false, completed: 0, failed: 0 },
      },
      activeExpedition: null,
      craftQueue: [],
      recruitEvent: null,
      bossBattle: null,
      beaconRepair: null,
      log: ["A cold ember waits under the campfire ash."],
      routeFailures: 0,
      bossFailures: 0,
    },
    legacy: {
      shards: 0,
      unlocks: [],
    },
  };
}
