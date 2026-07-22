import { getCurrentObjective } from "../src/game/objectives.js";
import { applyReward } from "../src/game/rewards.js";
import { calculateScore } from "../src/game/scoring.js";
import { createInitialState, type GameState } from "../src/game/state.js";

const tests: { name: string; run: () => void }[] = [
  {
    name: "score grants Ancient chest for a strong clean prototype run",
    run: () => {
      const state = completedRun("pristine", 0, 0);
      const result = calculateScore(state);
      assertEqual(result.score, 270);
      assertEqual(result.chestGrade, "ancient");
    },
  },
  {
    name: "score downgrades when boss failures damage core quality",
    run: () => {
      const state = completedRun("cracked", 1, 2);
      const result = calculateScore(state);
      assertEqual(result.score, 185);
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
    name: "objective advances to chest after Beacon is lit",
    run: () => {
      const state = completedRun("stable", 0, 0);
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
        bossId: "cinderStag",
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
        status: "lit",
        assignedSurvivorIds: ["survivor-scout", "survivor-rook"],
        progress: 35,
        requiredProgress: 35,
        coreQuality,
        usedRepairKit: false,
      },
      routeFailures,
      bossFailures,
    },
  };
}

function assertEqual<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
}
