import { getStarterClass } from "../data/classes";
import { getRoute } from "../data/routes";
import { resolveExpedition, resolveIdleProgress } from "./tick";
import type { GameAction, GameState, IdleJob, Survivor } from "./state";
import { createInitialState } from "./state";

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

      return stamp({
        ...state,
        run: {
          ...state.run,
          started: true,
          screen: "camp",
          survivors: [survivor],
          log: [`${starter.name} raises the first ember at camp.`, ...state.run.log],
        },
      });
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
      const now = Date.now();
      const selected = new Set(action.survivorIds);
      return stamp({
        ...state,
        run: {
          ...state.run,
          screen: "explore",
          activeExpedition: {
            id: `expedition-${now}`,
            routeId: action.routeId,
            survivorIds: action.survivorIds,
            startedAt: now,
            endsAt: now + route.durationSeconds * 1000,
          },
          survivors: state.run.survivors.map((survivor) =>
            selected.has(survivor.id) ? { ...survivor, onExpedition: true } : survivor,
          ),
          log: [`Expedition started: ${route.name}.`, ...state.run.log].slice(0, 12),
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
