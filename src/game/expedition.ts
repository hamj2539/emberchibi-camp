import type { RouteDefinition } from "../data/routes.js";
import { getRunModifier } from "../data/routeContent.js";
import type { GameState, Survivor } from "./state.js";
import { hasRunItemEquipped } from "./runItems.js";

export type ExpeditionSupplyPlan = {
  useRation: boolean;
  useTorch: boolean;
};

export function calculateExpeditionSafety(
  state: GameState,
  partyIds: string[],
  route: RouteDefinition,
  supplies: ExpeditionSupplyPlan,
): number {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  const campGuards = state.run.survivors.filter(
    (survivor) => !partyIds.includes(survivor.id) && !survivor.onExpedition && survivor.job === "guard",
  ).length;
  const modifier = getRunModifier(state.run.runModifier);
  const affected = !modifier.routes || modifier.routes.includes(route.id);
  const countered = Boolean(modifier.counterClass && party.some((survivor) => survivor.classId === modifier.counterClass));
  return (
    party.reduce((sum, survivor) => sum + survivor.stats.surv + survivor.stats.spd + survivor.stats.luck, 0) +
    campGuards * 4 +
    (state.run.campUpgrades.includes("watchtower") ? 6 : 0) +
    (state.legacy.projects.includes("fieldManual") ? 3 : 0) +
    (affected && !countered ? modifier.safety : 0) +
    (supplies.useRation ? 6 : 0) +
    (supplies.useTorch && route.danger >= 35 ? 5 : 0) -
    state.run.crisisRouteRisk
  );
}

export function expeditionSuccessChance(safety: number, danger: number): number {
  let successfulRolls = 0;
  for (let roll = 1; roll <= 24; roll += 1) {
    if (safety + roll >= danger) successfulRolls += 1;
  }
  return Math.round((successfulRolls / 24) * 100);
}

export function calculateExpeditionDuration(route: RouteDefinition, party: Survivor[], state?: GameState): number {
  const hasScout = party.some((survivor) => survivor.classId === "scout");
  const bestSpeed = Math.max(0, ...party.map((survivor) => survivor.stats.spd));
  const reduction = Math.min(0.35, bestSpeed * 0.015 + (hasScout ? 0.08 : 0));
  const modifier = state ? getRunModifier(state.run.runModifier) : null;
  const modifierApplies =
    modifier?.durationMultiplier &&
    modifier.routes?.includes(route.id) &&
    !party.some((survivor) => survivor.classId === modifier.counterClass);
  const itemReduction = state && hasRunItemEquipped(state, "oldCompass") ? 0.05 : 0;
  return Math.max(6, Math.round(route.durationSeconds * (modifierApplies ? modifier.durationMultiplier ?? 1 : 1) * (1 - reduction - itemReduction)));
}

export function labelSuccessChance(chance: number): string {
  if (chance >= 90) return "Safe";
  if (chance >= 70) return "Steady";
  if (chance >= 45) return "Risky";
  return "Severe";
}
