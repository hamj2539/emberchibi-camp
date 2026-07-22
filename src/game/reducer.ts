import { getBeacon } from "../data/beacons.js";
import { getStarterClass } from "../data/classes.js";
import { getRecipe } from "../data/recipes.js";
import { getRoute } from "../data/routes.js";
import { resolveBossAction } from "./combat.js";
import { openGate, resolveGateAction } from "./gate.js";
import { applyLegacyStartBonuses } from "./meta.js";
import { applyReward, rollChestReward } from "./rewards.js";
import { resolveExpedition, resolveIdleProgress } from "./tick.js";
import type { ChestGrade, GameAction, GameState, IdleJob, ResourceKey, Survivor } from "./state.js";
import { createInitialState } from "./state.js";

const jobLabels: Record<IdleJob, string> = {
  rest: "Rest",
  forage: "Forage",
  craft: "Craft",
  guard: "Guard",
  cook: "Cook",
  research: "Research",
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "chooseStarter": {
      const starter = getStarterClass(action.classId);
      const survivor: Survivor = {
        id: `survivor-${action.classId}`,
        name: starter.name,
        classId: starter.id,
        role: starter.role,
        stats: starter.stats,
        currentHp: starter.stats.hp,
        fatigue: 0,
        injury: 0,
        job: "forage",
        onExpedition: false,
      };

      return stamp(applyLegacyStartBonuses({
        ...state,
        run: {
          ...state.run,
          started: true,
          screen: "camp",
          survivors: [survivor],
          log: [`${starter.name} raises the first ember at camp.`, ...state.run.log],
        },
      }));
    }
    case "setScreen":
      return stamp({ ...state, run: { ...state.run, screen: action.screen } });
    case "assignJob":
      return stamp({
        ...state,
        run: {
          ...state.run,
          survivors: state.run.survivors.map((survivor) =>
            survivor.id === action.survivorId ? { ...survivor, job: action.job } : survivor,
          ),
          log: [`Assigned ${jobLabels[action.job]}.`, ...state.run.log].slice(0, 12),
        },
      });
    case "startExpedition": {
      if (state.run.activeExpedition) return state;
      const route = getRoute(action.routeId);
      if (!state.run.routes[action.routeId].discovered) return state;
      const validParty = state.run.survivors.filter(
        (survivor) => action.survivorIds.includes(survivor.id) && !survivor.onExpedition && survivor.currentHp > 0,
      );
      if (validParty.length !== action.survivorIds.length || validParty.length < 1 || validParty.length > 2) return state;
      if (route.kind === "boss" && validParty.length !== 2) return state;
      const now = Date.now();
      const selected = new Set(action.survivorIds);
      const useRation = Boolean(action.useRation && state.run.items.ration > 0);
      const useTorch = Boolean(action.useTorch && state.run.items.torch > 0);
      const items = {
        ...state.run.items,
        ration: state.run.items.ration - (useRation ? 1 : 0),
        torch: state.run.items.torch - (useTorch ? 1 : 0),
      };
      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: "explore",
          items,
          activeExpedition: {
            id: `expedition-${now}`,
            routeId: action.routeId,
            survivorIds: action.survivorIds,
            startedAt: now,
            endsAt: now + route.durationSeconds * 1000,
            usedRation: useRation,
            usedTorch: useTorch,
          },
          survivors: state.run.survivors.map((survivor) =>
            selected.has(survivor.id) ? { ...survivor, onExpedition: true } : survivor,
          ),
          log: [
            `Expedition started: ${route.name}${useRation || useTorch ? ` with ${[useRation ? "Ration" : "", useTorch ? "Torch" : ""].filter(Boolean).join(" and ")}` : ""}.`,
            ...state.run.log,
          ].slice(0, 12),
        },
      });
    }
    case "resolveRecruit": {
      if (state.run.recruitEvent?.id !== "rook" || state.run.recruitEvent.status !== "available") return state;

      const resources = { ...state.run.resources };
      const log = [...state.run.log];
      const survivors = [...state.run.survivors];

      if (action.choice === "herb") {
        if (resources.herb < 2) return state;
        resources.herb -= 2;
        survivors.push(createRook());
        log.unshift("Rook joins the camp after you bind his burned trail wounds.");
      }

      if (action.choice === "food") {
        if (resources.food < 4) return state;
        resources.food -= 4;
        survivors.push(createRook());
        log.unshift("Rook follows the scent of warm rations back to camp.");
      }

      if (action.choice === "ignore") {
        log.unshift("The party leaves the wounded hunter behind and presses deeper into the mist.");
      }

      return stamp({
        ...state,
        run: {
          ...state.run,
          resources,
          survivors,
          recruitEvent: { ...state.run.recruitEvent, status: "resolved" },
          log: log.slice(0, 12),
        },
      });
    }
    case "startCraft": {
      if (state.run.craftQueue.length >= 3) return state;
      const recipe = getRecipe(action.recipeId);
      if (!canAfford(state, recipe.cost)) return state;

      const resources = { ...state.run.resources };
      for (const [key, amount] of Object.entries(recipe.cost) as [ResourceKey, number][]) {
        resources[key] -= amount;
      }

      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: "craft",
          resources,
          craftQueue: [
            ...state.run.craftQueue,
            {
              id: `craft-${action.recipeId}-${Date.now()}`,
              recipeId: action.recipeId,
              startedAt: Date.now(),
              remainingSeconds: recipe.craftSeconds,
            },
          ],
          log: [`Craft started: ${recipe.name}.`, ...state.run.log].slice(0, 12),
        },
      });
    }
    case "bossAction":
      return stamp(resolveBossAction(state, action.action));
    case "startGate":
      return stamp(openGate(state, action.survivorIds));
    case "gateAction":
      return stamp(resolveGateAction(state, action.action));
    case "leaveGateResult":
      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: state.run.gate.status === "cleared" ? "end" : "camp",
          log: [
            state.run.gate.status === "cleared" ? "The Cinder Gate is quiet." : "The party falls back from the Cinder Gate.",
            ...state.run.log,
          ].slice(0, 12),
        },
      });
    case "leaveBossResult": {
      if (!state.run.bossBattle || state.run.bossBattle.status === "active") return state;
      const won = state.run.bossBattle.status === "won";
      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: won ? "repair" : "camp",
          bossBattle: won ? state.run.bossBattle : null,
          log: [
            won
              ? `${state.run.bossBattle.coreName} waits for ${getBeacon(state.run.bossBattle.beaconId).name} repair.`
              : "The party retreats to camp.",
            ...state.run.log,
          ].slice(0, 12),
        },
      });
    }
    case "startRepair": {
      const battle = state.run.bossBattle;
      const quality = battle?.coreQuality;
      if (!battle || !quality || state.run.beaconRepair?.status === "active" || action.survivorIds.length < 1) return state;
      const beacon = getBeacon(battle.beaconId);
      if (state.run.resources.wood < beacon.repairCost.wood || state.run.resources.stone < beacon.repairCost.stone) return state;
      if (action.useRepairKit && state.run.items.repairKit < 1) return state;

      const selected = new Set(action.survivorIds.slice(0, 2));
      const resources = {
        ...state.run.resources,
        wood: state.run.resources.wood - beacon.repairCost.wood,
        stone: state.run.resources.stone - beacon.repairCost.stone,
      };
      const items = { ...state.run.items, repairKit: state.run.items.repairKit - (action.useRepairKit ? 1 : 0) };

      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: "repair",
          resources,
          items,
          beaconRepair: {
            beaconId: beacon.id,
            beaconName: beacon.name,
            status: "active",
            assignedSurvivorIds: [...selected],
            progress: action.useRepairKit ? 18 : 0,
            requiredProgress: 35,
            coreQuality: quality,
            usedRepairKit: action.useRepairKit,
          },
          survivors: state.run.survivors.map((survivor) =>
            selected.has(survivor.id) ? { ...survivor, onExpedition: true } : survivor,
          ),
          log: [`${beacon.repairName} has begun.`, ...state.run.log].slice(0, 12),
        },
      });
    }
    case "claimChest": {
      const endRun = state.run.endRun;
      if (!endRun || endRun.claimed) return state;
      const reward = rollChestReward(endRun.chestGrade);
      const rewarded = applyReward(state, reward);
      return stamp({
        ...rewarded,
        legacy: {
          ...rewarded.legacy,
          runsCompleted: rewarded.legacy.runsCompleted + 1,
          bestScore: Math.max(rewarded.legacy.bestScore, endRun.score),
          bestChestGrade: betterChestGrade(rewarded.legacy.bestChestGrade, endRun.chestGrade),
        },
        run: {
          ...rewarded.run,
          endRun: { ...endRun, reward, claimed: true },
          log: [`Legacy Chest opened: ${reward.label}.`, ...rewarded.run.log].slice(0, 12),
        },
      });
    }
    case "tick": {
      const elapsedSeconds = Math.max(0, Math.floor((action.now - state.savedAt) / 1000));
      let next = resolveIdleProgress(state, elapsedSeconds);
      next = resolveExpedition(next, action.now);
      return stamp(next, action.now);
    }
    case "resetRun": {
      const fresh = createInitialState();
      return action.keepLegacy ? { ...fresh, legacy: state.legacy } : fresh;
    }
    default:
      return state;
  }
}

function stamp(state: GameState, savedAt = Date.now()): GameState {
  return { ...state, savedAt };
}

function canAfford(state: GameState, cost: Partial<Record<ResourceKey, number>>): boolean {
  return Object.entries(cost).every(([key, amount]) => state.run.resources[key as ResourceKey] >= amount);
}

function createRook(): Survivor {
  return {
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
  };
}

function betterChestGrade(current: ChestGrade | null, next: ChestGrade): ChestGrade {
  const rank = { broken: 0, faded: 1, iron: 2, ancient: 3 } as const;
  return current && rank[current] >= rank[next] ? current : next;
}
