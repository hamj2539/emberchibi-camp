export type Screen =
  | "starter"
  | "camp"
  | "explore"
  | "survivors"
  | "craft"
  | "boss"
  | "repair"
  | "gate"
  | "meta"
  | "journal"
  | "end";

export type StatKey = "hp" | "atk" | "def" | "spd" | "wis" | "craft" | "surv" | "luck";
export type ResourceKey = "wood" | "food" | "herb" | "stone" | "ore" | "relicShard";
export type IdleJob = "rest" | "forage" | "craft" | "guard" | "cook" | "research";
export type StarterClassId = "scout" | "hunter" | "herbalist" | "tinker";
export type BeaconId = "ember" | "tidal" | "gale" | "root" | "lunar";
export type RouteId =
  | "mistwoodEdge"
  | "burntGrove"
  | "emberBeaconSite"
  | "saltmarshRun"
  | "tidalBeaconSite"
  | "windscarCliffs"
  | "galeBeaconSite"
  | "rootwarrenTrail"
  | "rootBeaconSite"
  | "moonwellPath"
  | "lunarBeaconSite";
export type ItemId = "torch" | "ration" | "stoneSpear" | "herbSalve" | "warmCloak" | "repairKit";
export type BossAction = "attack" | "guard" | "skill" | "useTorch" | "useSalve";
export type GateAction = BossAction;
export type CombatStatusId = "burn" | "poison" | "guarded" | "exposed" | "bound" | "inspired" | "cursed" | "focused";
export type CombatStatuses = Partial<Record<CombatStatusId, number>>;
export type CoreQuality = "pristine" | "stable" | "cracked" | "faded";
export type ChestGrade = "broken" | "faded" | "iron" | "ancient";
export type RewardType = "legacyShards" | "blueprint" | "relic" | "survivorUnlock" | "classUnlock";
export type CampUpgradeId = "infirmary" | "workshop" | "watchtower";
export type LegacyProjectId =
  | "fieldManual"
  | "deepPockets"
  | "hearthstone"
  | "trailArchive"
  | "weatherDial"
  | "chestLens"
  | "memoryReliquary"
  | "starterSatchel";
export type RunVowId = "lowFlame" | "scarceFood" | "noRetreat" | "pristineHunt" | "soloGuardian";
export type StarterLoadoutId = "balanced" | "trail" | "workshop";
export type RunOutcome = "victory" | "collapse";
export type EndingId = "victory" | "collapse" | "perfectAlignment" | "savedFromCollapse" | "heraldSealed";
export type EventChainId = "ashMap" | "lostCaravan" | "singingRoots" | "brokenBell";
export type RepairMethod = "standard" | "ritual" | "special";
export type RunModifierId = "heavyFog" | "emberWinds" | "hungryNight" | "oldTrailSigns" | "restlessRoots";
export type RunEquipmentSlot = "tool" | "charm" | "provision";
export type ExpeditionNodeType =
  | "resource"
  | "event"
  | "encounter"
  | "hazard"
  | "rest"
  | "shrine"
  | "shortcut"
  | "clue"
  | "bossGate";
export type PartyActivity = "walking" | "gathering" | "bracing" | "inspecting" | "resting" | "reacting";
export type ExpeditionMode = "manual" | "autoSafe";
export type BiomeMoodId = "mist" | "ember" | "tide" | "gale" | "root" | "lunar";
export type RunItemId =
  | "oldCompass"
  | "emberPick"
  | "boneNeedle"
  | "cinderGauge"
  | "mossCrown"
  | "ashBell"
  | "moonThread"
  | "hollowCoin"
  | "saltedRations"
  | "resinTorchBundle"
  | "bitterTonic"
  | "wayfinderKnot";
export type RouteEventId =
  | "oldTrailMarkers"
  | "ashOrchard"
  | "drownedShrine"
  | "stormBridge"
  | "rootWhispers"
  | "moonMirror"
  | "cinderCache"
  | "galeNest"
  | "ashMap1" | "ashMap2" | "ashMap3"
  | "lostCaravan1" | "lostCaravan2" | "lostCaravan3"
  | "singingRoots1" | "singingRoots2" | "singingRoots3"
  | "brokenBell1" | "brokenBell2" | "brokenBell3"
  | "rookStory" | "miraStory" | "bramStory"
  | "scoutStory" | "hunterStory" | "herbalistStory" | "tinkerStory";
export type NormalEncounterId =
  | "ashWolves" | "mireLeeches" | "rootboundRaiders"
  | "fogLanterns" | "emberMoths" | "cinderPilgrims"
  | "tideCrabs" | "drownedCourier" | "galeKites"
  | "stormShepherds" | "sporeChoir" | "thornSnare" | "moonMoths";
export type CrisisId = "dyingFire" | "emptyStores" | "woundedCamp" | "brokenShelter" | "campDespair";
export type CampPressureKey = "fire" | "morale" | "shelter" | "supplies";
export type CollectionCategory =
  | "relics"
  | "runItems"
  | "blueprints"
  | "survivors"
  | "beacons"
  | "guardians"
  | "endings"
  | "routeEvents";

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
  usedRation?: boolean;
  usedTorch?: boolean;
  nodes: ExpeditionNode[];
  currentNodeIndex: number;
  nextNodeAt: number;
  paused: boolean;
  mode: ExpeditionMode;
  activity: PartyActivity;
  nodeSafety: number;
  rewardMultiplier: number;
  scoreBonus: number;
  resolvedNodeIds: string[];
  teasers: string[];
  biomeMood: BiomeMoodId;
};

export type ExpeditionNodeChoice = {
  id: "safe" | "risky" | "shortcut";
  label: string;
  detail: string;
  result: string;
  requirementLabel?: string;
  requirement?: {
    classId?: StarterClassId;
    relic?: string;
    survivorId?: string;
    supply?: "ration" | "torch";
  };
  effect: {
    safety?: number;
    rewardMultiplier?: number;
    score?: number;
    fatigue?: number;
    injury?: number;
    resources?: Partial<Record<ResourceKey, number>>;
  };
};

export type ExpeditionNode = {
  id: string;
  type: ExpeditionNodeType;
  title: string;
  flavor: string;
  beat: string;
  major: boolean;
  choices: ExpeditionNodeChoice[];
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
  id: "rook" | "mira" | "bram";
  name: string;
  description: string;
  herbCost: number;
  foodCost: number;
  status: "available" | "waiting" | "resolved" | "missed";
  branchNote?: string;
};

export type ActiveRouteDecision = {
  kind: "event" | "encounter";
  id: RouteEventId | NormalEncounterId;
  routeId: RouteId;
  partyIds: string[];
};

export type CampPressure = Record<CampPressureKey, number>;

export type ActiveCrisis = {
  id: CrisisId;
  triggeredAt: number;
  deadlineAt: number;
  reason: string;
};

export type RunItemPickup = {
  id: RunItemId;
  source: string;
};

export type RunLoadout = Record<RunEquipmentSlot, RunItemId | null>;

export type BossBattle = {
  beaconId: BeaconId;
  bossId: string;
  bossName: string;
  coreName: string;
  bossHp: number;
  bossMaxHp: number;
  guardStacks: number;
  burnPressure: number;
  partyIds: string[];
  turn: number;
  status: "active" | "won" | "lost";
  coreQuality: CoreQuality | null;
  usedSkills: string[];
  phaseId: string;
  pendingIntentId: string;
  partyStatuses: CombatStatuses;
  bossStatuses: CombatStatuses;
  counterSuccesses: number;
  counterFailures: number;
  downedCount: number;
  lastCounterFeedback: string;
  log: string[];
};

export type BeaconRepair = {
  beaconId: BeaconId;
  beaconName: string;
  status: "idle" | "active" | "lit";
  assignedSurvivorIds: string[];
  progress: number;
  requiredProgress: number;
  coreQuality: CoreQuality;
  usedRepairKit: boolean;
  method?: RepairMethod;
};

export type BeaconProgress = {
  discovered: boolean;
  bossDefeated: boolean;
  repaired: boolean;
  coreQuality: CoreQuality | null;
  repairBonusClaimed: boolean;
  failedAttempts: number;
};

export type ScoreLine = {
  label: string;
  points: number;
};

export type ChestReward = {
  type: RewardType;
  label: string;
  amount?: number;
};

export type EndRunResult = {
  outcome: RunOutcome;
  endingId?: EndingId;
  score: number;
  lines: ScoreLine[];
  chestGrade: ChestGrade;
  reward: ChestReward | null;
  claimed: boolean;
  metrics: RunMetrics;
};

export type RunMetrics = {
  durationSeconds: number;
  starterClass: StarterClassId;
  routeFailures: number;
  crisisCount: number;
  guardianAttempts: Record<BeaconId, number>;
  coreQualities: Record<BeaconId, CoreQuality | null>;
  gateStability: number;
  nightHeraldOutcome: "cleared" | "lost" | "notReached";
  chestGrade: ChestGrade;
  collapseReason: string | null;
  vows: RunVowId[];
};

export type GateProgress = {
  status: "sealed" | "open" | "active" | "cleared" | "lost";
  heraldHp: number;
  heraldMaxHp: number;
  guardStacks: number;
  nightPressure: number;
  turn: number;
  partyIds: string[];
  usedSkills: string[];
  phaseId: string;
  pendingIntentId: string;
  partyStatuses: CombatStatuses;
  bossStatuses: CombatStatuses;
  counterSuccesses: number;
  counterFailures: number;
  downedCount: number;
  lastCounterFeedback: string;
  log: string[];
};

export type RunState = {
  started: boolean;
  starterClass: StarterClassId | null;
  screen: Screen;
  daySeconds: number;
  resources: Resources;
  items: Inventory;
  survivors: Survivor[];
  routes: Record<RouteId, RouteProgress>;
  beacons: Record<BeaconId, BeaconProgress>;
  activeExpedition: Expedition | null;
  activeRouteDecision: ActiveRouteDecision | null;
  craftQueue: CraftTask[];
  recruitEvent: RecruitEvent | null;
  bossBattle: BossBattle | null;
  beaconRepair: BeaconRepair | null;
  campUpgrades: CampUpgradeId[];
  runModifier: RunModifierId;
  vows: RunVowId[];
  starterLoadout: StarterLoadoutId;
  runItems: RunItemPickup[];
  runLoadout: RunLoadout;
  triggeredRunEffects: string[];
  eventFlags: string[];
  eventScore: number;
  decisionsResolved: number;
  campPressure: CampPressure;
  collapseMeter: number;
  activeCrisis: ActiveCrisis | null;
  crisisCooldowns: Partial<Record<CrisisId, number>>;
  crisisFlags: string[];
  crisesResolved: number;
  crisesIgnored: number;
  crisisScore: number;
  crisisRouteRisk: number;
  repairSpeedModifier: number;
  gate: GateProgress;
  endRun: EndRunResult | null;
  log: string[];
  routeFailures: number;
  bossFailures: number;
  secretsFound: string[];
  challengeState: {
    minFire: number;
    openingRoutes: number;
    openingUsedNonScout: boolean;
    usedRepairKit: boolean;
  };
  eventChains: Record<EventChainId, { step: number; outcome: string | null }>;
  storyEventsSeen: string[];
};

export type LegacyState = {
  shards: number;
  unlocks: string[];
  relics: string[];
  equippedRelics: string[];
  blueprints: string[];
  projects: LegacyProjectId[];
  runsCompleted: number;
  bestScore: number;
  bestChestGrade: ChestGrade | null;
  onboardingStep: number;
  onboardingComplete: boolean;
  runHistory: RunMetrics[];
  collection: Record<CollectionCategory, string[]>;
  bonds: Record<string, number>;
  discoveredSecrets: string[];
  completedChallenges: string[];
  completedVows: RunVowId[];
  coreQualityVariants: string[];
  beaconRepairVariants: string[];
  rememberedRunItem: RunItemId | null;
  titles: string[];
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
  | { type: "buyCampUpgrade"; upgradeId: CampUpgradeId }
  | { type: "startExpedition"; routeId: RouteId; survivorIds: string[]; useRation?: boolean; useTorch?: boolean }
  | { type: "resolveRouteDecision"; choiceId: string }
  | { type: "resolveExpeditionNode"; choiceId: ExpeditionNodeChoice["id"] }
  | { type: "setExpeditionMode"; mode: ExpeditionMode }
  | { type: "resolveRecruit"; choice: "herb" | "food" | "ignore" }
  | { type: "resolveCrisis"; choiceId: string }
  | { type: "equipRunItem"; itemId: RunItemId }
  | { type: "unequipRunItem"; slot: RunEquipmentSlot }
  | { type: "startCraft"; recipeId: ItemId }
  | { type: "bossAction"; action: BossAction }
  | { type: "leaveBossResult" }
  | { type: "startRepair"; survivorIds: string[]; useRepairKit: boolean; method?: RepairMethod }
  | { type: "startGate"; survivorIds: string[] }
  | { type: "gateAction"; action: GateAction }
  | { type: "leaveGateResult" }
  | { type: "claimChest" }
  | { type: "buyLegacyProject"; projectId: LegacyProjectId }
  | { type: "toggleVow"; vowId: RunVowId }
  | { type: "selectRunModifier"; modifierId: RunModifierId }
  | { type: "selectStarterLoadout"; loadoutId: StarterLoadoutId }
  | { type: "toggleRelic"; relic: string }
  | { type: "advanceOnboarding" }
  | { type: "skipOnboarding" }
  | { type: "abandonRun" }
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

export const emptyBeaconProgress: Record<BeaconId, BeaconProgress> = {
  ember: { discovered: true, bossDefeated: false, repaired: false, coreQuality: null, repairBonusClaimed: false, failedAttempts: 0 },
  tidal: { discovered: true, bossDefeated: false, repaired: false, coreQuality: null, repairBonusClaimed: false, failedAttempts: 0 },
  gale: { discovered: true, bossDefeated: false, repaired: false, coreQuality: null, repairBonusClaimed: false, failedAttempts: 0 },
  root: { discovered: true, bossDefeated: false, repaired: false, coreQuality: null, repairBonusClaimed: false, failedAttempts: 0 },
  lunar: { discovered: true, bossDefeated: false, repaired: false, coreQuality: null, repairBonusClaimed: false, failedAttempts: 0 },
};

export function createInitialState(now = Date.now()): GameState {
  return {
    version: 1,
    savedAt: now,
    run: {
      started: false,
      starterClass: null,
      screen: "starter",
      daySeconds: 0,
      resources: { wood: 12, food: 10, herb: 4, stone: 0, ore: 0, relicShard: 0 },
      items: { ...emptyInventory },
      survivors: [],
      routes: {
        mistwoodEdge: { discovered: true, completed: 0, failed: 0 },
        burntGrove: { discovered: true, completed: 0, failed: 0 },
        emberBeaconSite: { discovered: false, completed: 0, failed: 0 },
        saltmarshRun: { discovered: true, completed: 0, failed: 0 },
        tidalBeaconSite: { discovered: false, completed: 0, failed: 0 },
        windscarCliffs: { discovered: true, completed: 0, failed: 0 },
        galeBeaconSite: { discovered: false, completed: 0, failed: 0 },
        rootwarrenTrail: { discovered: true, completed: 0, failed: 0 },
        rootBeaconSite: { discovered: false, completed: 0, failed: 0 },
        moonwellPath: { discovered: true, completed: 0, failed: 0 },
        lunarBeaconSite: { discovered: false, completed: 0, failed: 0 },
      },
      beacons: { ...emptyBeaconProgress },
      activeExpedition: null,
      activeRouteDecision: null,
      craftQueue: [],
      recruitEvent: null,
      bossBattle: null,
      beaconRepair: null,
      campUpgrades: [],
      runModifier: "hungryNight",
      vows: [],
      starterLoadout: "balanced",
      runItems: [],
      runLoadout: { tool: null, charm: null, provision: null },
      triggeredRunEffects: [],
      eventFlags: [],
      eventScore: 0,
      decisionsResolved: 0,
      campPressure: { fire: 80, morale: 75, shelter: 80, supplies: 75 },
      collapseMeter: 0,
      activeCrisis: null,
      crisisCooldowns: {},
      crisisFlags: [],
      crisesResolved: 0,
      crisesIgnored: 0,
      crisisScore: 0,
      crisisRouteRisk: 0,
      repairSpeedModifier: 1,
      gate: {
        status: "sealed",
        heraldHp: 160,
        heraldMaxHp: 160,
        guardStacks: 0,
        nightPressure: 4,
        turn: 1,
        partyIds: [],
        usedSkills: [],
        phaseId: "veil",
        pendingIntentId: "nightMark",
        partyStatuses: {},
        bossStatuses: {},
        counterSuccesses: 0,
        counterFailures: 0,
        downedCount: 0,
        lastCounterFeedback: "The Herald waits behind the sealed Gate.",
        log: ["The Cinder Gate is sealed behind five cold sockets."],
      },
      endRun: null,
      log: ["A cold ember waits under the campfire ash."],
      routeFailures: 0,
      bossFailures: 0,
      secretsFound: [],
      challengeState: {
        minFire: 80,
        openingRoutes: 0,
        openingUsedNonScout: false,
        usedRepairKit: false,
      },
      eventChains: {
        ashMap: { step: 0, outcome: null },
        lostCaravan: { step: 0, outcome: null },
        singingRoots: { step: 0, outcome: null },
        brokenBell: { step: 0, outcome: null },
      },
      storyEventsSeen: [],
    },
    legacy: {
      shards: 0,
      unlocks: [],
      relics: [],
      equippedRelics: [],
      blueprints: [],
      projects: [],
      runsCompleted: 0,
      bestScore: 0,
      bestChestGrade: null,
      onboardingStep: 0,
      onboardingComplete: false,
      runHistory: [],
      collection: {
        relics: [],
        runItems: [],
        blueprints: [],
        survivors: [],
        beacons: [],
        guardians: [],
        endings: [],
        routeEvents: [],
      },
      bonds: {},
      discoveredSecrets: [],
      completedChallenges: [],
      completedVows: [],
      coreQualityVariants: [],
      beaconRepairVariants: [],
      rememberedRunItem: null,
      titles: [],
    },
  };
}
