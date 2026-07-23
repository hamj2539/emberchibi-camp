import { crises, getCrisis, type CrisisChoice, type CrisisEffect, type CrisisTrigger } from "../data/crises.js";
import { calculateCollapseScore } from "./scoring.js";
import type {
  CampPressure,
  CampPressureKey,
  GameState,
  ItemId,
  ResourceKey,
} from "./state.js";

const RESOLVED_COOLDOWN_SECONDS = 90;
const IGNORED_COOLDOWN_SECONDS = 45;
export const COLLAPSE_THRESHOLD = 100;

export function advanceCampSystems(state: GameState, elapsedSeconds: number): GameState {
  if (!state.run.started || state.run.endRun || elapsedSeconds <= 0) return state;

  let next = {
    ...state,
    run: {
      ...state.run,
      campPressure: driftPressure(state, elapsedSeconds),
    },
  };

  const active = next.run.activeCrisis;
  if (active && next.run.daySeconds >= active.deadlineAt) {
    const definition = getCrisis(active.id);
    next = applyCrisisEffect(next, definition.ignoredEffect);
    next = {
      ...next,
      run: {
        ...next.run,
        activeCrisis: null,
        crisesIgnored: next.run.crisesIgnored + 1,
        crisisCooldowns: {
          ...next.run.crisisCooldowns,
          [active.id]: next.run.daySeconds + IGNORED_COOLDOWN_SECONDS,
        },
        log: [
          `${definition.name} expired: ${definition.consequence}`,
          ...next.run.log,
        ].slice(0, 12),
      },
    };
  }

  if (next.run.collapseMeter >= COLLAPSE_THRESHOLD) {
    return collapseFromCrises(next, "Ignored camp crises pushed the camp beyond recovery.");
  }

  if (!next.run.activeCrisis) {
    const definition = crises.find(
      (crisis) =>
        (next.run.crisisCooldowns[crisis.id] ?? 0) <= next.run.daySeconds &&
        crisis.triggers.some((trigger) => triggerMatches(next, trigger)),
    );
    if (definition) {
      next = {
        ...next,
        run: {
          ...next.run,
          screen: next.run.screen === "starter" ? "camp" : next.run.screen,
          activeCrisis: {
            id: definition.id,
            triggeredAt: next.run.daySeconds,
            deadlineAt: next.run.daySeconds + definition.deadlineSeconds,
            reason: triggerReason(next, definition.triggers),
          },
          log: [`Camp crisis: ${definition.name}. ${definition.warning}`, ...next.run.log].slice(0, 12),
        },
      };
    }
  }

  return next;
}

export function canResolveCrisisChoice(state: GameState, choice: CrisisChoice): boolean {
  if (!state.run.activeCrisis) return false;
  const requirement = choice.requirement;
  if (!requirement) return true;
  const available = state.run.survivors.filter((survivor) => !survivor.onExpedition && survivor.currentHp > 0);

  if (
    requirement.resources &&
    Object.entries(requirement.resources).some(
      ([key, amount]) => state.run.resources[key as ResourceKey] < (amount ?? 0),
    )
  ) return false;
  if (requirement.item && state.run.items[requirement.item] < 1) return false;
  if (requirement.classId && !available.some((survivor) => survivor.classId === requirement.classId)) return false;
  if (
    requirement.minStat &&
    !available.some((survivor) => survivor.stats[requirement.minStat!.stat] >= requirement.minStat!.value)
  ) return false;
  if (requirement.requiredJob && !available.some((survivor) => survivor.job === requirement.requiredJob)) return false;
  return true;
}

export function resolveCrisisChoice(state: GameState, choiceId: string): GameState {
  const active = state.run.activeCrisis;
  if (!active) return state;
  const definition = getCrisis(active.id);
  const choice = definition.choices.find((candidate) => candidate.id === choiceId);
  if (!choice || !canResolveCrisisChoice(state, choice)) return state;

  const resolved = applyCrisisEffect(state, choice.effect);
  const flag = `crisis-${definition.id}-${choice.id}`;
  const flags = resolved.run.crisisFlags.includes(flag)
    ? resolved.run.crisisFlags
    : [...resolved.run.crisisFlags, flag];
  const next = {
    ...resolved,
    run: {
      ...resolved.run,
      activeCrisis: null,
      crisisFlags: flags,
      crisesResolved: resolved.run.crisesResolved + 1,
      crisisCooldowns: {
        ...resolved.run.crisisCooldowns,
        [definition.id]: resolved.run.daySeconds + RESOLVED_COOLDOWN_SECONDS,
      },
      log: [`${definition.name} resolved: ${choice.result}`, ...resolved.run.log].slice(0, 12),
    },
  };

  return next.run.collapseMeter >= COLLAPSE_THRESHOLD
    ? collapseFromCrises(next, `${definition.name} was resolved too late to save the camp.`)
    : next;
}

export function applyCrisisEffect(state: GameState, effect: CrisisEffect): GameState {
  const resources = { ...state.run.resources };
  const items = { ...state.run.items };
  const pressure = { ...state.run.campPressure };

  for (const [key, amount] of Object.entries(effect.resources ?? {}) as [ResourceKey, number][]) {
    resources[key] = Math.max(0, resources[key] + amount);
  }
  for (const [key, amount] of Object.entries(effect.items ?? {}) as [ItemId, number][]) {
    items[key] = Math.max(0, items[key] + amount);
  }
  for (const [key, amount] of Object.entries(effect.pressure ?? {}) as [CampPressureKey, number][]) {
    pressure[key] = clamp(pressure[key] + amount);
  }

  const survivors = state.run.survivors.map((survivor) => ({
    ...survivor,
    fatigue: clamp(survivor.fatigue + (effect.fatigue ?? 0)),
    injury: clamp(survivor.injury + (effect.injury ?? 0)),
  }));
  const crisisFlags =
    effect.flag && !state.run.crisisFlags.includes(effect.flag)
      ? [...state.run.crisisFlags, effect.flag]
      : state.run.crisisFlags;

  return {
    ...state,
    run: {
      ...state.run,
      resources,
      items,
      survivors,
      campPressure: pressure,
      collapseMeter: clamp(state.run.collapseMeter + (effect.collapse ?? 0)),
      crisisRouteRisk: Math.max(0, Math.min(12, state.run.crisisRouteRisk + (effect.routeRisk ?? 0))),
      repairSpeedModifier: Math.max(0.5, Math.min(1.25, state.run.repairSpeedModifier + (effect.repairSpeed ?? 0))),
      crisisScore: state.run.crisisScore + (effect.score ?? 0),
      crisisFlags,
    },
  };
}

function driftPressure(state: GameState, elapsedSeconds: number): CampPressure {
  const pressure = { ...state.run.campPressure };
  const activeSurvivors = Math.max(1, state.run.survivors.length);
  const averageFatigue =
    state.run.survivors.reduce((sum, survivor) => sum + survivor.fatigue, 0) / activeSurvivors;
  const averageInjury =
    state.run.survivors.reduce((sum, survivor) => sum + survivor.injury, 0) / activeSurvivors;
  const fireDecay = state.run.runModifier === "emberWinds" ? 0.22 : 0.18;

  pressure.fire = clamp(pressure.fire - elapsedSeconds * fireDecay);
  pressure.supplies = clamp(
    pressure.supplies +
      elapsedSeconds * (state.run.resources.food <= 5 ? -0.12 : state.run.resources.food >= 12 ? 0.03 : -0.02),
  );
  pressure.morale = clamp(
    pressure.morale + elapsedSeconds * (averageFatigue >= 55 || averageInjury >= 30 ? -0.07 : 0.02),
  );
  pressure.shelter = clamp(
    Math.min(pressure.shelter, 88 - Math.min(48, state.run.routeFailures * 12)),
  );
  return pressure;
}

function triggerMatches(state: GameState, trigger: CrisisTrigger): boolean {
  if (trigger.type === "pressure") return state.run.campPressure[trigger.key] <= trigger.atOrBelow;
  if (trigger.type === "resource") return state.run.resources[trigger.key] <= trigger.atOrBelow;
  if (trigger.type === "routeFailures") return state.run.routeFailures >= trigger.atLeast;
  if (trigger.type === "flagPrefix") {
    return state.run.eventFlags.some((flag) => flag.startsWith(trigger.prefix) && flag.endsWith("-missed"));
  }
  if (trigger.type === "modifierAndFood") {
    return state.run.runModifier === trigger.modifier && state.run.resources.food <= trigger.foodAtOrBelow;
  }
  return state.run.survivors.some(
    (survivor) =>
      survivor.fatigue >= trigger.fatigueAtLeast ||
      survivor.injury >= trigger.injuryAtLeast,
  );
}

function triggerReason(state: GameState, triggers: CrisisTrigger[]): string {
  const trigger = triggers.find((candidate) => triggerMatches(state, candidate));
  if (!trigger) return "Camp pressure reached an unsafe level.";
  if (trigger.type === "pressure") return `${labelPressure(trigger.key)} fell to ${Math.round(state.run.campPressure[trigger.key])}.`;
  if (trigger.type === "resource") return `${trigger.key} fell to ${Math.floor(state.run.resources[trigger.key])}.`;
  if (trigger.type === "routeFailures") return `${state.run.routeFailures} expeditions have failed this run.`;
  if (trigger.type === "flagPrefix") return "An ignored recruit event damaged the camp's confidence.";
  if (trigger.type === "modifierAndFood") return `${state.run.runModifier} and low Food are straining the camp.`;
  return "A survivor crossed the safe Fatigue or Injury threshold.";
}

function collapseFromCrises(state: GameState, message: string): GameState {
  const result = calculateCollapseScore(state);
  return {
    ...state,
    run: {
      ...state.run,
      screen: "end",
      activeExpedition: null,
      activeRouteDecision: null,
      activeCrisis: null,
      survivors: state.run.survivors.map((survivor) => ({ ...survivor, onExpedition: false })),
      endRun: { outcome: "collapse", ...result, reward: null, claimed: false },
      log: [message, ...state.run.log].slice(0, 12),
    },
  };
}

function labelPressure(key: CampPressureKey): string {
  return key[0].toUpperCase() + key.slice(1);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
