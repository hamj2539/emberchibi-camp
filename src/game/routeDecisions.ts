import {
  getRouteDecision,
  normalEncounters,
  routeEvents,
  runModifiers,
  type RouteChoice,
} from "../data/routeContent.js";
import type {
  ActiveRouteDecision,
  GameState,
  ItemId,
  ResourceKey,
  RouteId,
  RunModifierId,
} from "./state.js";
import { getRunModifier } from "../data/routeContent.js";
import { addBond, discoverEntry } from "./journal.js";
import { acquireRunItem, hasRunItemEquipped } from "./runItems.js";

const BASE_EVENT_CHANCE = 35;
const BASE_ENCOUNTER_CHANCE = 20;

export function modifierFromRoll(roll: number): RunModifierId {
  const index = Math.min(runModifiers.length - 1, Math.max(0, Math.floor(roll * runModifiers.length)));
  return runModifiers[index].id;
}

export function rollRouteDecision(
  state: GameState,
  routeId: RouteId,
  partyIds: string[],
  chanceRoll = Math.random(),
  contentRoll = Math.random(),
): ActiveRouteDecision | null {
  const modifier = getRunModifier(state.run.runModifier);
  const knot = hasRunItemEquipped(state, "wayfinderKnot");
  const encounterChance = BASE_ENCOUNTER_CHANCE + modifier.encounterChance - (knot ? 10 : 0);
  const eventChance = BASE_EVENT_CHANCE + modifier.eventChance + (knot ? 20 : 0);
  const percentile = chanceRoll * 100;
  const kind = percentile < encounterChance ? "encounter" : percentile < encounterChance + eventChance ? "event" : null;
  if (!kind) return null;

  const pool = (kind === "event" ? routeEvents : normalEncounters).filter((entry) => entry.routes.includes(routeId));
  if (pool.length === 0) return null;
  const selected = pool[Math.min(pool.length - 1, Math.floor(contentRoll * pool.length))];
  return { kind, id: selected.id, routeId, partyIds };
}

export function canResolveRouteChoice(state: GameState, choice: RouteChoice): boolean {
  const decision = state.run.activeRouteDecision;
  if (!decision) return false;
  const party = state.run.survivors.filter((survivor) => decision.partyIds.includes(survivor.id));
  const requirement = choice.requirement;
  if (!requirement) return true;

  if (
    requirement.resources &&
    Object.entries(requirement.resources).some(
      ([key, amount]) => state.run.resources[key as ResourceKey] < (amount ?? 0),
    )
  ) return false;
  if (requirement.item && state.run.items[requirement.item] < 1) return false;
  if (requirement.classId && !party.some((survivor) => survivor.classId === requirement.classId)) return false;
  if (
    requirement.minStat &&
    !party.some((survivor) => survivor.stats[requirement.minStat!.stat] >= requirement.minStat!.value)
  ) return false;
  if (requirement.relic && !state.legacy.equippedRelics.includes(requirement.relic)) return false;
  return true;
}

export function resolveRouteChoice(state: GameState, choiceId: string): GameState {
  const decision = state.run.activeRouteDecision;
  if (!decision) return state;
  const definition = getRouteDecision(decision.id);
  const choice = definition.choices.find((entry) => entry.id === choiceId);
  if (!choice || !canResolveRouteChoice(state, choice)) return state;

  const resources = { ...state.run.resources };
  const items = { ...state.run.items };
  for (const [key, amount] of Object.entries(choice.effect.resources ?? {}) as [ResourceKey, number][]) {
    resources[key] = Math.max(0, resources[key] + amount);
  }
  for (const [key, amount] of Object.entries(choice.effect.items ?? {}) as [ItemId, number][]) {
    items[key] = Math.max(0, items[key] + amount);
  }

  const routes = { ...state.run.routes };
  if (choice.effect.routeProgress) {
    const progress = routes[decision.routeId];
    routes[decision.routeId] = {
      ...progress,
      completed: Math.max(0, progress.completed + choice.effect.routeProgress),
    };
  }

  const survivors = state.run.survivors.map((survivor) => {
    if (!decision.partyIds.includes(survivor.id)) return survivor;
    return {
      ...survivor,
      currentHp: Math.max(1, Math.min(survivor.stats.hp, survivor.currentHp + (choice.effect.hp ?? 0))),
      fatigue: Math.max(0, Math.min(100, survivor.fatigue + (choice.effect.fatigue ?? 0))),
      injury: Math.max(0, Math.min(100, survivor.injury + (choice.effect.injury ?? 0))),
    };
  });

  const outcomeFlag = `decision-${definition.id}-${choice.id}`;
  const firstResolution = !state.run.eventFlags.includes(outcomeFlag);
  const eventFlags = [...state.run.eventFlags];
  if (choice.effect.flag && !eventFlags.includes(choice.effect.flag)) eventFlags.push(choice.effect.flag);
  if (firstResolution) eventFlags.push(outcomeFlag);

  let resolved: GameState = {
    ...state,
    run: {
      ...state.run,
      resources,
      items,
      routes,
      survivors,
      activeRouteDecision: null,
      eventFlags,
      eventScore: state.run.eventScore + (firstResolution ? (choice.effect.score ?? 0) : 0),
      decisionsResolved: state.run.decisionsResolved + 1,
      log: [`${definition.name}: ${choice.result}`, ...state.run.log].slice(0, 12),
    },
  };
  resolved = discoverEntry(resolved, "routeEvents", definition.id);
  resolved = addBond(resolved, decision.partyIds, 1);
  return choice.effect.runItem
    ? acquireRunItem(resolved, choice.effect.runItem, `${definition.kind === "event" ? "Route event" : "Encounter"}: ${definition.name}`)
    : resolved;
}
