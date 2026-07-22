import { getCurrentObjective } from "../src/game/objectives.js";
import { getBeacon } from "../src/data/beacons.js";
import { createGuardianBattle, resolveBossAction } from "../src/game/combat.js";
import { gameReducer } from "../src/game/reducer.js";
import { migrateV1 } from "../src/game/save.js";
import { applyReward } from "../src/game/rewards.js";
import { calculateScore } from "../src/game/scoring.js";
import { resolveExpedition, resolveIdleProgress } from "../src/game/tick.js";
import { createInitialState, type GameState } from "../src/game/state.js";

const tests: { name: string; run: () => void }[] = [
  {
    name: "Expedition supplies are consumed and improve route safety",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const supplied = {
        ...started,
        run: { ...started.run, items: { ...started.run.items, ration: 1, torch: 1 } },
      };
      const launched = gameReducer(supplied, {
        type: "startExpedition",
        routeId: "burntGrove",
        survivorIds: ["survivor-scout"],
        useRation: true,
        useTorch: true,
      });
      assertEqual(launched.run.items.ration, 0);
      assertEqual(launched.run.items.torch, 0);
      assertEqual(launched.run.activeExpedition?.usedRation, true);
      assertEqual(launched.run.activeExpedition?.usedTorch, true);
      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        const resolved = resolveExpedition(launched, launched.run.activeExpedition?.endsAt ?? 0);
        assertEqual(resolved.run.routes.burntGrove.completed, 1);
        assertEqual(resolved.run.routes.burntGrove.failed, 0);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "Cook converts Food into Rations across timer boundaries",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "herbalist" });
      const cooking = {
        ...started,
        run: {
          ...started.run,
          daySeconds: 29,
          survivors: started.run.survivors.map((survivor) => ({ ...survivor, job: "cook" as const })),
        },
      };
      const next = resolveIdleProgress(cooking, 1);
      assertEqual(next.run.resources.food, 8);
      assertEqual(next.run.items.ration, 1);
    },
  },
  {
    name: "Research lowers Guardian starting pressure",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const researcher = { ...started.run.survivors[0], id: "researcher", job: "research" as const };
      const prepared = { ...started, run: { ...started.run, survivors: [...started.run.survivors, researcher] } };
      const battle = createGuardianBattle(prepared, ["survivor-scout"], getBeacon("gale"));
      assertEqual(battle.burnPressure, 2);
    },
  },
  {
    name: "Camp Guards add safety to an active expedition",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const scout = { ...started.run.survivors[0], onExpedition: true };
      const guardOne = { ...started.run.survivors[0], id: "guard-one", job: "guard" as const };
      const guardTwo = { ...started.run.survivors[0], id: "guard-two", job: "guard" as const };
      const exploring = {
        ...started,
        run: {
          ...started.run,
          survivors: [scout, guardOne, guardTwo],
          activeExpedition: {
            id: "guard-test",
            routeId: "burntGrove" as const,
            survivorIds: [scout.id],
            startedAt: 0,
            endsAt: 1,
          },
        },
      };
      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        const next = resolveExpedition(exploring, 1);
        assertEqual(next.run.routes.burntGrove.completed, 1);
        assertEqual(next.run.routes.burntGrove.failed, 0);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "party Guard protects without reducing the next attack",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const battle = createGuardianBattle(started, ["survivor-hunter"], getBeacon("ember"));
      const fighting = { ...started, run: { ...started.run, bossBattle: battle } };
      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        const guarded = resolveBossAction(fighting, "guard");
        const attacked = resolveBossAction(guarded, "attack");
        assertEqual(attacked.run.bossBattle?.bossHp, 81);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "old encounter saves recover to camp instead of crashing",
    run: () => {
      const state = createInitialState();
      const migrated = migrateV1({
        ...state,
        run: {
          ...state.run,
          started: true,
          screen: "boss",
          bossBattle: { beaconId: undefined } as unknown as GameState["run"]["bossBattle"],
        },
      });
      assertEqual(migrated.run.screen, "camp");
      assertEqual(migrated.run.bossBattle, null);
    },
  },
  {
    name: "legacy collection grants permanent bonuses to the next starter",
    run: () => {
      const state = createInitialState();
      const next = gameReducer({
        ...state,
        legacy: {
          ...state.legacy,
          blueprints: ["Torch Blueprint"],
          relics: ["Coalglass Charm"],
          unlocks: ["Rook Camp Trait", "Warden Class"],
        },
      }, { type: "chooseStarter", classId: "scout" });
      assertEqual(next.run.items.torch, 1);
      assertEqual(next.run.resources.wood, 16);
      assertEqual(next.run.resources.stone, 4);
      assertEqual(next.run.survivors[0].stats.hp, 27);
      assertEqual(next.run.survivors[0].stats.atk, 5);
      assertEqual(next.run.survivors[0].stats.def, 4);
    },
  },
  {
    name: "score grants Ancient chest for a strong clean prototype run",
    run: () => {
      const state = gateClearedRun("pristine", 0, 0);
      const result = calculateScore(state);
      assertEqual(result.score, 1450);
      assertEqual(result.chestGrade, "ancient");
    },
  },
  {
    name: "score downgrades when boss failures damage core quality",
    run: () => {
      const state = gateClearedRun("cracked", 1, 2);
      const result = calculateScore(state);
      assertEqual(result.score, 1165);
      assertEqual(result.chestGrade, "iron");
    },
  },
  {
    name: "legacy shard reward is applied without resetting unlock collections",
    run: () => {
      const state = createInitialState();
      const next = applyReward(
        {
          ...state,
          legacy: { ...state.legacy, blueprints: ["Torch Blueprint"], relics: [], unlocks: [] },
        },
        { type: "legacyShards", label: "Legacy Shards", amount: 9 },
      );
      assertEqual(next.legacy.shards, 9);
      assertEqual(next.legacy.blueprints.length, 1);
    },
  },
  {
    name: "claiming a chest records run history and keeps the best result",
    run: () => {
      const state = gateClearedRun("stable", 0, 0);
      const next = gameReducer({
        ...state,
        legacy: { ...state.legacy, runsCompleted: 2, bestScore: 1500, bestChestGrade: "ancient" },
        run: {
          ...state.run,
          endRun: { score: 1200, lines: [], chestGrade: "iron", reward: null, claimed: false },
        },
      }, { type: "claimChest" });
      assertEqual(next.legacy.runsCompleted, 3);
      assertEqual(next.legacy.bestScore, 1500);
      assertEqual(next.legacy.bestChestGrade, "ancient");
      assertEqual(next.run.endRun?.claimed, true);
    },
  },
  {
    name: "objective advances to Gate after all five Beacons are lit",
    run: () => {
      const state = allBeaconsCompletedRun("stable");
      const objective = getCurrentObjective(state);
      assertEqual(objective.title, "Defeat Night Herald");
    },
  },
  {
    name: "objective advances to chest after Night Herald is defeated",
    run: () => {
      const state = gateClearedRun("stable", 0, 0);
      const objective = getCurrentObjective(state);
      assertEqual(objective.title, "Open the Legacy Chest");
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`ok - ${test.name}`);
}

function completedRun(coreQuality: "pristine" | "stable" | "cracked" | "faded", routeFailures: number, bossFailures: number): GameState {
  const state = createInitialState();
  return {
    ...state,
    run: {
      ...state.run,
      started: true,
      routes: {
        ...state.run.routes,
        burntGrove: { discovered: true, completed: 1, failed: routeFailures },
        emberBeaconSite: { discovered: true, completed: 0, failed: 0 },
      },
      beacons: {
        ...state.run.beacons,
        ember: {
          ...state.run.beacons.ember,
          bossDefeated: true,
          repaired: true,
          coreQuality,
        },
      },
      survivors: [
        {
          id: "survivor-scout",
          name: "Scout",
          classId: "scout",
          role: "Exploration",
          stats: { hp: 24, atk: 4, def: 3, spd: 8, wis: 4, craft: 3, surv: 7, luck: 6 },
          currentHp: 24,
          fatigue: 0,
          injury: 0,
          job: "forage",
          onExpedition: false,
        },
        {
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
      ],
      bossBattle: {
        beaconId: "ember",
        bossId: "cinderStag",
        bossName: "Cinder Stag",
        coreName: "Cinder Heart",
        bossHp: 0,
        bossMaxHp: 100,
        guardStacks: 0,
        burnPressure: 3,
        partyIds: ["survivor-scout", "survivor-rook"],
        turn: 5,
        status: "won",
        coreQuality,
        log: [],
      },
      beaconRepair: {
        beaconId: "ember",
        beaconName: "Ember Beacon",
        status: "lit",
        assignedSurvivorIds: ["survivor-scout", "survivor-rook"],
        progress: 35,
        requiredProgress: 35,
        coreQuality,
        usedRepairKit: false,
      },
      gate: {
        ...state.run.gate,
        status: "sealed",
      },
      routeFailures,
      bossFailures,
    },
  };
}

function gateClearedRun(
  coreQuality: "pristine" | "stable" | "cracked" | "faded",
  routeFailures: number,
  bossFailures: number,
): GameState {
  const state = allBeaconsCompletedRun(coreQuality);
  return {
    ...state,
    run: {
      ...state.run,
      routeFailures,
      bossFailures,
      gate: {
        status: "cleared",
        heraldHp: 0,
        heraldMaxHp: 160,
        guardStacks: 0,
        nightPressure: 5,
        turn: 8,
        partyIds: ["survivor-scout", "survivor-rook"],
        log: [],
      },
    },
  };
}

function allBeaconsCompletedRun(coreQuality: "pristine" | "stable" | "cracked" | "faded"): GameState {
  const state = completedRun(coreQuality, 0, 0);
  return {
    ...state,
    run: {
      ...state.run,
      routes: {
        ...state.run.routes,
        tidalBeaconSite: { discovered: true, completed: 0, failed: 0 },
        galeBeaconSite: { discovered: true, completed: 0, failed: 0 },
        rootBeaconSite: { discovered: true, completed: 0, failed: 0 },
        lunarBeaconSite: { discovered: true, completed: 0, failed: 0 },
      },
      beacons: {
        ember: { ...state.run.beacons.ember, bossDefeated: true, repaired: true, coreQuality },
        tidal: { ...state.run.beacons.tidal, bossDefeated: true, repaired: true, coreQuality },
        gale: { ...state.run.beacons.gale, bossDefeated: true, repaired: true, coreQuality },
        root: { ...state.run.beacons.root, bossDefeated: true, repaired: true, coreQuality },
        lunar: { ...state.run.beacons.lunar, bossDefeated: true, repaired: true, coreQuality },
      },
    },
  };
}

function assertEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}
