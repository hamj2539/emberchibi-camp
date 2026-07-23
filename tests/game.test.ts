import { getCurrentObjective } from "../src/game/objectives.js";
import { getBeacon } from "../src/data/beacons.js";
import { getRoute } from "../src/data/routes.js";
import { getRecruitDefinition } from "../src/data/events.js";
import { normalEncounters, routeEvents, runModifiers } from "../src/data/routeContent.js";
import { crises, getCrisis } from "../src/data/crises.js";
import { runItems } from "../src/data/runItems.js";
import { createGuardianBattle, resolveBossAction } from "../src/game/combat.js";
import { advanceCampSystems, canResolveCrisisChoice, resolveCrisisChoice } from "../src/game/crises.js";
import { calculateIdleElapsed, gameReducer, MAX_OFFLINE_SECONDS } from "../src/game/reducer.js";
import { calculateGateStability, openGate } from "../src/game/gate.js";
import { migrateV1, parseGame } from "../src/game/save.js";
import { applyReward } from "../src/game/rewards.js";
import { calculateScore } from "../src/game/scoring.js";
import { resolveExpedition, resolveIdleProgress } from "../src/game/tick.js";
import { calculateExpeditionDuration, calculateExpeditionSafety, expeditionSuccessChance } from "../src/game/expedition.js";
import {
  canResolveRouteChoice,
  modifierFromRoll,
  resolveRouteChoice,
  rollRouteDecision,
} from "../src/game/routeDecisions.js";
import { createInitialState, type GameState } from "../src/game/state.js";
import { acquireRunItem } from "../src/game/runItems.js";

const tests: { name: string; run: () => void }[] = [
  {
    name: "Guardian failures only reduce Core quality for that Beacon",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const fragile = {
        ...started,
        run: { ...started.run, survivors: started.run.survivors.map((survivor) => ({ ...survivor, currentHp: 2 })) },
      };
      const emberBattle = createGuardianBattle(fragile, ["survivor-hunter"], getBeacon("ember"));
      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        const failed = resolveBossAction({ ...fragile, run: { ...fragile.run, bossBattle: emberBattle } }, "attack");
        assertEqual(failed.run.beacons.ember.failedAttempts, 1);
        assertEqual(failed.run.beacons.tidal.failedAttempts, 0);
        const recovered = {
          ...failed,
          run: {
            ...failed.run,
            survivors: failed.run.survivors.map((survivor) => ({ ...survivor, currentHp: survivor.stats.hp })),
          },
        };
        const tidalBattle = { ...createGuardianBattle(recovered, ["survivor-hunter"], getBeacon("tidal")), bossHp: 1 };
        const won = resolveBossAction({ ...recovered, run: { ...recovered.run, bossBattle: tidalBattle } }, "attack");
        assertEqual(won.run.bossBattle?.coreQuality, "pristine");
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "Core quality creates Gate Stability and weakens the Night Herald",
    run: () => {
      const state = allBeaconsCompletedRun("pristine");
      assertEqual(calculateGateStability(state), 15);
      const opened = openGate(state, ["survivor-scout", "survivor-rook"]);
      assertEqual(opened.run.gate.heraldMaxHp, 115);
      assertEqual(opened.run.gate.nightPressure, 2);
    },
  },
  {
    name: "save parser rejects corrupt data without throwing",
    run: () => {
      assertEqual(parseGame("not-json"), null);
      assertEqual(parseGame(JSON.stringify({ version: 99 })), null);
      assertEqual(parseGame(JSON.stringify(createInitialState()))?.version, 1);
    },
  },
  {
    name: "offline progress uses ten percent efficiency with an eight hour cap",
    run: () => {
      assertEqual(calculateIdleElapsed(30), 30);
      assertEqual(calculateIdleElapsed(3600), 360);
      assertEqual(calculateIdleElapsed(MAX_OFFLINE_SECONDS * 2), 2880);
      const started = gameReducer(createInitialState(0), { type: "chooseStarter", classId: "scout" });
      const saved = { ...started, savedAt: 0 };
      const next = gameReducer(saved, { type: "tick", now: MAX_OFFLINE_SECONDS * 2 * 1000 });
      assertEqual(next.run.daySeconds, 2880);
      assertEqual(next.run.log[0].includes("8h offline cap"), true);
    },
  },
  {
    name: "Scout shortens routes and forecast reports exact success chance",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      assertEqual(calculateExpeditionDuration(getRoute("rootBeaconSite"), started.run.survivors), 16);
      assertEqual(expeditionSuccessChance(20, 30), 63);
    },
  },
  {
    name: "Hunter boosts Food while Herbalist reduces failed-route injuries",
    run: () => {
      const hunter = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const suppliedHunter = { ...hunter, run: { ...hunter.run, items: { ...hunter.run.items, ration: 1 } } };
      const hunterRun = gameReducer(suppliedHunter, {
        type: "startExpedition",
        routeId: "mistwoodEdge",
        survivorIds: ["survivor-hunter"],
        useRation: true,
      });
      const herbalist = gameReducer(createInitialState(), { type: "chooseStarter", classId: "herbalist" });
      const herbalistRun = gameReducer(herbalist, {
        type: "startExpedition",
        routeId: "burntGrove",
        survivorIds: ["survivor-herbalist"],
      });
      const originalRandom = Math.random;
      Math.random = () => 0;
      try {
        const hunterResult = resolveExpedition(hunterRun, hunterRun.run.activeExpedition?.endsAt ?? 0);
        const herbalistResult = resolveExpedition(herbalistRun, herbalistRun.run.activeExpedition?.endsAt ?? 0);
        assertEqual(hunterResult.run.resources.food, 14);
        assertEqual(herbalistResult.run.survivors[0].injury, 8);
        assertEqual(herbalistResult.run.survivors[0].fatigue, 15);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "Expedition validation rejects locked routes and incomplete boss crews",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const locked = gameReducer(started, {
        type: "startExpedition",
        routeId: "emberBeaconSite",
        survivorIds: ["survivor-scout"],
      });
      assertEqual(locked.run.activeExpedition, null);
      const discovered = {
        ...started,
        run: {
          ...started.run,
          routes: { ...started.run.routes, emberBeaconSite: { discovered: true, completed: 0, failed: 0 } },
        },
      };
      const incomplete = gameReducer(discovered, {
        type: "startExpedition",
        routeId: "emberBeaconSite",
        survivorIds: ["survivor-scout"],
      });
      assertEqual(incomplete.run.activeExpedition, null);
    },
  },
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
          equippedRelics: ["Coalglass Charm"],
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
          endRun: { outcome: "victory", score: 1200, lines: [], chestGrade: "iron", reward: null, claimed: false },
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
  {
    name: "camp upgrades spend resources once and improve idle recovery",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "herbalist" });
      const funded = {
        ...started,
        run: {
          ...started.run,
          resources: { ...started.run.resources, wood: 20, herb: 10 },
          survivors: started.run.survivors.map((survivor) => ({
            ...survivor,
            currentHp: 10,
            injury: 20,
            job: "rest" as const,
          })),
        },
      };
      const upgraded = gameReducer(funded, { type: "buyCampUpgrade", upgradeId: "infirmary" });
      assertEqual(upgraded.run.resources.wood, 12);
      const recovered = resolveIdleProgress(upgraded, 60);
      assertEqual(recovered.run.survivors[0].currentHp, 18);
      assertEqual(recovered.run.survivors[0].injury, 19);
      assertEqual(gameReducer(upgraded, { type: "buyCampUpgrade", upgradeId: "infirmary" }), upgraded);
    },
  },
  {
    name: "Legacy Shards buy projects and relic loadout is limited to two slots",
    run: () => {
      const initial = createInitialState();
      const state = {
        ...initial,
        legacy: {
          ...initial.legacy,
          shards: 30,
          relics: ["Coalglass Charm", "Ashen Compass", "Stagbone Token"],
        },
      };
      const project = gameReducer(state, { type: "buyLegacyProject", projectId: "fieldManual" });
      assertEqual(project.legacy.shards, 22);
      const first = gameReducer(project, { type: "toggleRelic", relic: "Coalglass Charm" });
      const second = gameReducer(first, { type: "toggleRelic", relic: "Ashen Compass" });
      const blocked = gameReducer(second, { type: "toggleRelic", relic: "Stagbone Token" });
      assertEqual(blocked.legacy.equippedRelics.length, 2);
    },
  },
  {
    name: "class skills can be used once per survivor in a Guardian battle",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const battle = createGuardianBattle(started, ["survivor-hunter"], getBeacon("ember"));
      const fighting = { ...started, run: { ...started.run, bossBattle: battle } };
      const skilled = resolveBossAction(fighting, "skill");
      assertEqual(skilled.run.bossBattle?.usedSkills.length, 1);
      assertEqual(skilled.run.bossBattle?.bossHp, 64);
      assertEqual(resolveBossAction(skilled, "skill"), skilled);
    },
  },
  {
    name: "abandoning a run produces half score and a Broken Chest",
    run: () => {
      const state = completedRun("pristine", 0, 0);
      const fullScore = calculateScore(state).score;
      const collapsed = gameReducer(state, { type: "abandonRun" });
      assertEqual(collapsed.run.endRun?.outcome, "collapse");
      assertEqual(collapsed.run.endRun?.score, Math.floor(fullScore / 2));
      assertEqual(collapsed.run.endRun?.chestGrade, "broken");
      assertEqual(collapsed.run.screen, "end");
    },
  },
  {
    name: "event routes offer distinct survivors across the run",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const expedition = {
        id: "event-test",
        routeId: "saltmarshRun" as const,
        survivorIds: ["survivor-scout"],
        startedAt: 0,
        endsAt: 1,
      };
      const originalRandom = Math.random;
      Math.random = () => 0.999;
      try {
        const resolved = resolveExpedition({ ...started, run: { ...started.run, activeExpedition: expedition } }, 2);
        assertEqual(resolved.run.recruitEvent?.id, "mira");
        const recruited = gameReducer(
          { ...resolved, run: { ...resolved.run, resources: { ...resolved.run.resources, food: 20 } } },
          { type: "resolveRecruit", choice: "food" },
        );
        assertEqual(recruited.run.survivors.some((survivor) => survivor.id === "survivor-mira"), true);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "full clean run opens a balanced Gate and records a victory result",
    run: () => {
      const ready = allBeaconsCompletedRun("pristine");
      let state = openGate(ready, ["survivor-scout", "survivor-rook"]);
      const originalRandom = Math.random;
      Math.random = () => 0.999;
      try {
        for (let turn = 0; turn < 20 && state.run.gate.status === "active"; turn += 1) {
          state = gameReducer(state, { type: "gateAction", action: turn < 2 ? "skill" : "attack" });
        }
        assertEqual(state.run.gate.status, "cleared");
        assertEqual(state.run.endRun?.outcome, "victory");
        assertEqual(state.run.endRun?.chestGrade, "ancient");
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "Alpha content includes eight events, three encounters, and five modifiers",
    run: () => {
      assertEqual(routeEvents.length, 8);
      assertEqual(normalEncounters.length, 3);
      assertEqual(runModifiers.length, 5);
      assertEqual(new Set(routeEvents.flatMap((event) => event.routes)).size >= 5, true);
    },
  },
  {
    name: "route event choices enforce stats and apply resources, flags, and score",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const decision = {
        kind: "event" as const,
        id: "oldTrailMarkers" as const,
        routeId: "mistwoodEdge" as const,
        partyIds: ["survivor-scout"],
      };
      const deciding = { ...started, run: { ...started.run, activeRouteDecision: decision } };
      const definition = routeEvents.find((event) => event.id === "oldTrailMarkers")!;
      const follow = definition.choices.find((choice) => choice.id === "follow")!;
      assertEqual(canResolveRouteChoice(deciding, follow), true);
      const resolved = resolveRouteChoice(deciding, "follow");
      assertEqual(resolved.run.resources.food, 13);
      assertEqual(resolved.run.resources.wood, 14);
      assertEqual(resolved.run.eventFlags.includes("followed-old-signs"), true);
      assertEqual(resolved.run.eventScore, 8);
      assertEqual(resolved.run.decisionsResolved, 1);
      assertEqual(resolved.run.activeRouteDecision, null);
      const repeated = resolveRouteChoice(
        { ...resolved, run: { ...resolved.run, activeRouteDecision: decision } },
        "follow",
      );
      assertEqual(repeated.run.eventScore, 8);
      assertEqual(repeated.run.decisionsResolved, 2);
    },
  },
  {
    name: "unmet route choice requirements cannot mutate the run",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const deciding = {
        ...started,
        run: {
          ...started.run,
          activeRouteDecision: {
            kind: "event" as const,
            id: "moonMirror" as const,
            routeId: "moonwellPath" as const,
            partyIds: ["survivor-hunter"],
          },
        },
      };
      const blocked = resolveRouteChoice(deciding, "study");
      assertEqual(blocked, deciding);
    },
  },
  {
    name: "normal encounters auto-select from route data and resolve one tactical choice",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const supplied = {
        ...started,
        run: { ...started.run, items: { ...started.run.items, torch: 1 } },
      };
      const decision = rollRouteDecision(supplied, "burntGrove", ["survivor-hunter"], 0, 0);
      assertEqual(decision?.kind, "encounter");
      assertEqual(decision?.id, "ashWolves");
      const resolved = resolveRouteChoice(
        { ...supplied, run: { ...supplied.run, activeRouteDecision: decision } },
        "flare",
      );
      assertEqual(resolved.run.items.torch, 0);
      assertEqual(resolved.run.decisionsResolved, 1);
    },
  },
  {
    name: "run modifier rolls cover all variants and Heavy Fog changes route safety",
    run: () => {
      assertEqual(modifierFromRoll(0), "heavyFog");
      assertEqual(modifierFromRoll(0.21), "emberWinds");
      assertEqual(modifierFromRoll(0.41), "hungryNight");
      assertEqual(modifierFromRoll(0.61), "oldTrailSigns");
      assertEqual(modifierFromRoll(0.99), "restlessRoots");
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const heavy = { ...started, run: { ...started.run, runModifier: "heavyFog" as const } };
      const signs = { ...started, run: { ...started.run, runModifier: "oldTrailSigns" as const } };
      const route = getRoute("mistwoodEdge");
      const heavySafety = calculateExpeditionSafety(heavy, ["survivor-hunter"], route, { useRation: false, useTorch: false });
      const signsSafety = calculateExpeditionSafety(signs, ["survivor-hunter"], route, { useRation: false, useTorch: false });
      assertEqual(signsSafety - heavySafety, 7);
    },
  },
  {
    name: "Rook delayed branch joins after another Mistwood route",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const definition = getRecruitDefinition("rook");
      const offered = {
        ...started,
        run: {
          ...started.run,
          resources: { ...started.run.resources, food: 20 },
          recruitEvent: { ...definition, status: "available" as const },
        },
      };
      const waiting = gameReducer(offered, { type: "resolveRecruit", choice: "food" });
      assertEqual(waiting.run.recruitEvent?.status, "waiting");
      const expedition = {
        id: "rook-delay",
        routeId: "mistwoodEdge" as const,
        survivorIds: ["survivor-scout"],
        startedAt: 0,
        endsAt: 1,
      };
      const originalRandom = Math.random;
      Math.random = () => 0.999;
      try {
        const resolved = resolveExpedition({ ...waiting, run: { ...waiting.run, activeExpedition: expedition } }, 2);
        assertEqual(resolved.run.recruitEvent?.status, "resolved");
        assertEqual(resolved.run.survivors.some((survivor) => survivor.id === "survivor-rook"), true);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "Mira and Bram delayed branches require their route and Bram's Repair Kit",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const mira = getRecruitDefinition("mira");
      const miraWaiting = gameReducer({
        ...started,
        run: {
          ...started.run,
          resources: { ...started.run.resources, herb: 20 },
          recruitEvent: { ...mira, status: "available" as const },
        },
      }, { type: "resolveRecruit", choice: "herb" });
      const originalRandom = Math.random;
      Math.random = () => 0.999;
      try {
        const miraResolved = resolveExpedition({
          ...miraWaiting,
          run: {
            ...miraWaiting.run,
            activeExpedition: {
              id: "mira-delay",
              routeId: "moonwellPath",
              survivorIds: ["survivor-scout"],
              startedAt: 0,
              endsAt: 1,
            },
          },
        }, 2);
        assertEqual(miraResolved.run.survivors.some((survivor) => survivor.id === "survivor-mira"), true);

        const bram = getRecruitDefinition("bram");
        const bramWaiting = gameReducer({
          ...started,
          run: {
            ...started.run,
            resources: { ...started.run.resources, herb: 20 },
            recruitEvent: { ...bram, status: "available" as const },
          },
        }, { type: "resolveRecruit", choice: "herb" });
        const withoutKit = resolveExpedition({
          ...bramWaiting,
          run: {
            ...bramWaiting.run,
            activeExpedition: {
              id: "bram-delay-1",
              routeId: "windscarCliffs",
              survivorIds: ["survivor-scout"],
              startedAt: 0,
              endsAt: 1,
            },
          },
        }, 2);
        assertEqual(withoutKit.run.recruitEvent?.status, "waiting");
        const withKit = resolveExpedition({
          ...withoutKit,
          run: {
            ...withoutKit.run,
            items: { ...withoutKit.run.items, repairKit: 1 },
            activeExpedition: {
              id: "bram-delay-2",
              routeId: "windscarCliffs",
              survivorIds: ["survivor-scout"],
              startedAt: 0,
              endsAt: 1,
            },
          },
        }, 2);
        assertEqual(withKit.run.survivors.some((survivor) => survivor.id === "survivor-bram"), true);
        assertEqual(withKit.run.items.repairKit, 0);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "pre-Alpha save migration adds route decision and variation defaults",
    run: () => {
      const old = JSON.parse(JSON.stringify(createInitialState())) as GameState;
      delete (old.run as Partial<GameState["run"]>).activeRouteDecision;
      delete (old.run as Partial<GameState["run"]>).eventFlags;
      delete (old.run as Partial<GameState["run"]>).eventScore;
      delete (old.run as Partial<GameState["run"]>).decisionsResolved;
      delete (old.run as Partial<GameState["run"]>).runModifier;
      const migrated = migrateV1(old);
      assertEqual(migrated.run.activeRouteDecision, null);
      assertEqual(migrated.run.eventFlags.length, 0);
      assertEqual(migrated.run.eventScore, 0);
      assertEqual(migrated.run.decisionsResolved, 0);
      assertEqual(migrated.run.runModifier, "hungryNight");
    },
  },
  {
    name: "save migration drops malformed route decisions safely",
    run: () => {
      const state = createInitialState();
      const malformed = {
        ...state,
        run: {
          ...state.run,
          activeRouteDecision: {
            kind: "event",
            id: "missing-event",
            routeId: "mistwoodEdge",
            partyIds: [],
          },
        },
      } as unknown as GameState;
      assertEqual(migrateV1(malformed).run.activeRouteDecision, null);
    },
  },
  {
    name: "recruit objective recovers after Rook is missed",
    run: () => {
      const state = createInitialState();
      const missed = {
        ...state,
        run: {
          ...state.run,
          started: true,
          survivors: [{
            id: "survivor-scout",
            name: "Scout",
            classId: "scout" as const,
            role: "Exploration",
            stats: { hp: 24, atk: 4, def: 3, spd: 8, wis: 4, craft: 3, surv: 7, luck: 6 },
            currentHp: 24,
            fatigue: 0,
            injury: 0,
            job: "forage" as const,
            onExpedition: false,
          }],
          eventFlags: ["recruit-rook-missed"],
        },
      };
      assertEqual(getCurrentObjective(missed).detail.includes("Saltmarsh"), true);
    },
  },
  {
    name: "five data-driven crises cover gameplay pressure triggers",
    run: () => {
      assertEqual(crises.length, 5);
      const triggerTypes = new Set(crises.flatMap((crisis) => crisis.triggers.map((trigger) => trigger.type)));
      assertEqual(triggerTypes.has("pressure"), true);
      assertEqual(triggerTypes.has("resource"), true);
      assertEqual(triggerTypes.has("survivorStrain"), true);
      assertEqual(triggerTypes.has("routeFailures"), true);
      assertEqual(crises.every((crisis) => crisis.choices.length >= 2 && crisis.deadlineSeconds > 0), true);
    },
  },
  {
    name: "low fire triggers a visible crisis with a deadline and reason",
    run: () => {
      const started = gameReducer(createInitialState(0), { type: "chooseStarter", classId: "hunter" });
      const strained = {
        ...started,
        run: { ...started.run, campPressure: { ...started.run.campPressure, fire: 29 } },
      };
      const next = advanceCampSystems(strained, 1);
      assertEqual(next.run.activeCrisis?.id, "dyingFire");
      assertEqual(next.run.activeCrisis?.reason.includes("Fire fell"), true);
      assertEqual(next.run.activeCrisis?.deadlineAt, next.run.daySeconds + getCrisis("dyingFire").deadlineSeconds);
    },
  },
  {
    name: "crisis choices enforce requirements and apply resolution effects",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const active = {
        ...started,
        run: {
          ...started.run,
          resources: { ...started.run.resources, wood: 5 },
          campPressure: { ...started.run.campPressure, fire: 20 },
          activeCrisis: { id: "dyingFire" as const, triggeredAt: 0, deadlineAt: 50, reason: "Low fire." },
        },
      };
      const definition = getCrisis("dyingFire");
      assertEqual(canResolveCrisisChoice(active, definition.choices[0]), true);
      assertEqual(canResolveCrisisChoice(active, definition.choices[1]), false);
      const resolved = resolveCrisisChoice(active, "fuel");
      assertEqual(resolved.run.activeCrisis, null);
      assertEqual(resolved.run.resources.wood, 1);
      assertEqual(resolved.run.campPressure.fire, 65);
      assertEqual(resolved.run.crisesResolved, 1);
      assertEqual(resolved.run.log[0].includes("resolved"), true);
    },
  },
  {
    name: "expired crisis applies its visible consequence",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const active = {
        ...started,
        run: {
          ...started.run,
          daySeconds: 60,
          campPressure: { ...started.run.campPressure, fire: 20 },
          activeCrisis: { id: "dyingFire" as const, triggeredAt: 0, deadlineAt: 50, reason: "Low fire." },
        },
      };
      const expired = advanceCampSystems(active, 1);
      assertEqual(expired.run.crisesIgnored, 1);
      assertEqual(expired.run.collapseMeter, 32);
      assertEqual(expired.run.activeCrisis, null);
      assertEqual(expired.run.log[0].includes("expired"), true);
    },
  },
  {
    name: "multiple severe ignored crises cause partial-score Run Collapse",
    run: () => {
      const progressed = completedRun("pristine", 0, 0);
      const active = {
        ...progressed,
        run: {
          ...progressed.run,
          daySeconds: 80,
          collapseMeter: 76,
          campPressure: { ...progressed.run.campPressure, morale: 10 },
          activeCrisis: { id: "campDespair" as const, triggeredAt: 0, deadlineAt: 70, reason: "Low morale." },
        },
      };
      const collapsed = advanceCampSystems(active, 1);
      assertEqual(collapsed.run.endRun?.outcome, "collapse");
      assertEqual((collapsed.run.endRun?.score ?? 0) > 0, true);
      assertEqual(["broken", "faded"].includes(collapsed.run.endRun?.chestGrade ?? ""), true);
      assertEqual(collapsed.run.screen, "end");
    },
  },
  {
    name: "save migration fills Alpha 2 crisis state safely",
    run: () => {
      const old = createInitialState();
      delete (old.run as Partial<GameState["run"]>).campPressure;
      delete (old.run as Partial<GameState["run"]>).collapseMeter;
      delete (old.run as Partial<GameState["run"]>).activeCrisis;
      delete (old.run as Partial<GameState["run"]>).crisisCooldowns;
      delete (old.run as Partial<GameState["run"]>).crisisFlags;
      delete (old.run as Partial<GameState["run"]>).crisesResolved;
      delete (old.run as Partial<GameState["run"]>).crisesIgnored;
      delete (old.run as Partial<GameState["run"]>).crisisScore;
      delete (old.run as Partial<GameState["run"]>).crisisRouteRisk;
      delete (old.run as Partial<GameState["run"]>).repairSpeedModifier;
      const migrated = migrateV1(old);
      assertEqual(migrated.run.campPressure.fire, 80);
      assertEqual(migrated.run.collapseMeter, 0);
      assertEqual(migrated.run.activeCrisis, null);
      assertEqual(migrated.run.repairSpeedModifier, 1);
    },
  },
  {
    name: "Alpha 3 defines twelve temporary items across three slots and five modifiers",
    run: () => {
      assertEqual(runItems.length, 12);
      assertEqual(new Set(runItems.map((item) => item.slot)).size, 3);
      assertEqual(runModifiers.length, 5);
      assertEqual(runItems.every((item) => item.effect.length > 20 && item.trigger.length > 0), true);
    },
  },
  {
    name: "route decisions acquire run-only equipment with its source",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const deciding = {
        ...started,
        run: {
          ...started.run,
          activeRouteDecision: {
            kind: "event" as const,
            id: "oldTrailMarkers" as const,
            routeId: "mistwoodEdge" as const,
            partyIds: ["survivor-scout"],
          },
        },
      };
      const resolved = resolveRouteChoice(deciding, "follow");
      assertEqual(resolved.run.runItems[0].id, "oldCompass");
      assertEqual(resolved.run.runItems[0].source.includes("Old Trail Markers"), true);
      assertEqual(resolved.legacy.relics.length, 0);
    },
  },
  {
    name: "temporary loadout permits one item in each of three slots",
    run: () => {
      let state = createInitialState();
      state = acquireRunItem(state, "oldCompass", "test");
      state = acquireRunItem(state, "emberPick", "test");
      state = acquireRunItem(state, "mossCrown", "test");
      state = acquireRunItem(state, "saltedRations", "test");
      state = gameReducer(state, { type: "equipRunItem", itemId: "oldCompass" });
      state = gameReducer(state, { type: "equipRunItem", itemId: "mossCrown" });
      state = gameReducer(state, { type: "equipRunItem", itemId: "saltedRations" });
      assertEqual(Object.values(state.run.runLoadout).filter(Boolean).length, 3);
      state = gameReducer(state, { type: "equipRunItem", itemId: "emberPick" });
      assertEqual(state.run.runLoadout.tool, "emberPick");
      assertEqual(Object.values(state.run.runLoadout).filter(Boolean).length, 3);
    },
  },
  {
    name: "Heavy Fog slows affected routes while Scout counters the biome modifier",
    run: () => {
      const hunter = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const scout = gameReducer(createInitialState(), { type: "chooseStarter", classId: "scout" });
      const fogHunter = { ...hunter, run: { ...hunter.run, runModifier: "heavyFog" as const } };
      const fogScout = { ...scout, run: { ...scout.run, runModifier: "heavyFog" as const } };
      const route = getRoute("mistwoodEdge");
      assertEqual(calculateExpeditionDuration(route, fogHunter.run.survivors, fogHunter) > route.durationSeconds, true);
      assertEqual(calculateExpeditionDuration(route, fogScout.run.survivors, fogScout) < route.durationSeconds, true);
    },
  },
  {
    name: "Moss Crown extends only the first crisis deadline",
    run: () => {
      let started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      started = acquireRunItem(started, "mossCrown", "test");
      started = gameReducer(started, { type: "equipRunItem", itemId: "mossCrown" });
      const strained = {
        ...started,
        run: { ...started.run, campPressure: { ...started.run.campPressure, fire: 29 } },
      };
      const triggered = advanceCampSystems(strained, 1);
      assertEqual(triggered.run.activeCrisis?.deadlineAt, triggered.run.daySeconds + 75);
      assertEqual(triggered.run.triggeredRunEffects.includes("moss-crown-deadline"), true);
    },
  },
  {
    name: "Guardian victory grants a temporary item reward",
    run: () => {
      const started = gameReducer(createInitialState(), { type: "chooseStarter", classId: "hunter" });
      const battle = { ...createGuardianBattle(started, ["survivor-hunter"], getBeacon("ember")), bossHp: 1 };
      const originalRandom = Math.random;
      Math.random = () => 1;
      try {
        const won = resolveBossAction({ ...started, run: { ...started.run, bossBattle: battle } }, "attack");
        assertEqual(won.run.runItems.some((pickup) => pickup.id === "emberPick"), true);
      } finally {
        Math.random = originalRandom;
      }
    },
  },
  {
    name: "run-only items clear at Run Collapse while legacy relics remain",
    run: () => {
      let state = completedRun("pristine", 0, 0);
      state = acquireRunItem(state, "moonThread", "test");
      state = gameReducer(state, { type: "equipRunItem", itemId: "moonThread" });
      state = { ...state, legacy: { ...state.legacy, relics: ["Coalglass Charm"] } };
      const ended = gameReducer(state, { type: "abandonRun" });
      assertEqual(ended.run.runItems.length, 0);
      assertEqual(ended.run.runLoadout.charm, null);
      assertEqual(ended.legacy.relics[0], "Coalglass Charm");
    },
  },
  {
    name: "save migration adds and validates Alpha 3 loadout state",
    run: () => {
      const old = createInitialState();
      delete (old.run as Partial<GameState["run"]>).runItems;
      delete (old.run as Partial<GameState["run"]>).runLoadout;
      delete (old.run as Partial<GameState["run"]>).triggeredRunEffects;
      const migrated = migrateV1(old);
      assertEqual(migrated.run.runItems.length, 0);
      assertEqual(migrated.run.runLoadout.tool, null);
      assertEqual(migrated.run.runLoadout.charm, null);
      assertEqual(migrated.run.runLoadout.provision, null);
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
        usedSkills: [],
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
        usedSkills: [],
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
