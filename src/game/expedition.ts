import type { RouteDefinition } from "../data/routes.js";
import type { GameState, Survivor } from "./state.js";

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
  return (
    party.reduce((sum, survivor) => sum + survivor.stats.surv + survivor.stats.spd + survivor.stats.luck, 0) +
    campGuards * 4 +
    (state.run.campUpgrades.includes("watchtower") ? 6 : 0) +
    (state.legacy.projects.includes("fieldManual") ? 3 : 0) +
    (supplies.useRation ? 6 : 0) +
    (supplies.useTorch && route.danger >= 35 ? 5 : 0)
  );
}

export function expeditionSuccessChance(safety: number, danger: number): number {
  let successfulRolls = 0;
  for (let roll = 1; roll <= 24; roll += 1) {
    if (safety + roll >= danger) successfulRolls += 1;
  }
  return Math.round((successfulRolls / 24) * 100);
}

export function calculateExpeditionDuration(route: RouteDefinition, party: Survivor[]): number {
  const hasScout = party.some((survivor) => survivor.classId === "scout");
  const bestSpeed = Math.max(0, ...party.map((survivor) => survivor.stats.spd));
  const reduction = Math.min(0.35, bestSpeed * 0.015 + (hasScout ? 0.08 : 0));
  return Math.max(6, Math.round(route.durationSeconds * (1 - reduction)));
}

export function labelSuccessChance(chance: number): string {
  if (chance >= 90) return "Safe";
  if (chance >= 70) return "Steady";
  if (chance >= 45) return "Risky";
  return "Severe";
}
