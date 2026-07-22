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
