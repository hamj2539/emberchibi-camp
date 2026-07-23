import type { CollectionCategory, EndingId, GameState } from "./state.js";

export function discoverEntry(state: GameState, category: CollectionCategory, id: string): GameState {
  if (state.legacy.collection[category].includes(id)) return state;
  return {
    ...state,
    legacy: {
      ...state.legacy,
      collection: {
        ...state.legacy.collection,
        [category]: [...state.legacy.collection[category], id],
      },
    },
  };
}

export function addBond(state: GameState, survivorIds: string[], points: number): GameState {
  if (points <= 0 || survivorIds.length === 0) return state;
  const bonds = { ...state.legacy.bonds };
  for (const id of survivorIds) bonds[id] = Math.min(12, (bonds[id] ?? 0) + points);
  return { ...state, legacy: { ...state.legacy, bonds } };
}

export function bondLevel(points: number): number {
  if (points >= 9) return 3;
  if (points >= 5) return 2;
  if (points >= 2) return 1;
  return 0;
}

export function discoverSecret(state: GameState, id: string): GameState {
  if (state.legacy.discoveredSecrets.includes(id)) return state;
  const titles = [...state.legacy.titles];
  if (id === "fivefoldConcord" && !titles.includes("Pristine Keeper")) titles.push("Pristine Keeper");
  if (id === "unbrokenDawn" && !titles.includes("Dawn Unbroken")) titles.push("Dawn Unbroken");
  return {
    ...state,
    legacy: {
      ...state.legacy,
      discoveredSecrets: [...state.legacy.discoveredSecrets, id],
      titles,
    },
    run: {
      ...state.run,
      secretsFound: [...state.run.secretsFound, id],
      log: [`Secret discovered: ${labelSecret(id)}.`, ...state.run.log].slice(0, 12),
    },
  };
}

export function evaluateEndRunDiscoveries(state: GameState, endingId?: EndingId): GameState {
  let next = discoverEntry(state, "endings", endingId ?? (state.run.gate.status === "cleared" ? "victory" : "collapse"));
  if (Object.values(next.run.beacons).every((beacon) => beacon.repaired) &&
      Object.values(next.run.beacons).filter((beacon) => beacon.coreQuality === "pristine").length >= 3) {
    next = discoverSecret(next, "fivefoldConcord");
  }
  if (next.run.gate.status === "cleared" && next.run.gate.downedCount === 0) {
    next = discoverSecret(next, "unbrokenDawn");
  }
  const completed = [...next.legacy.completedChallenges];
  const add = (id: string) => {
    if (!completed.includes(id)) completed.push(id);
  };
  if (next.run.gate.status === "cleared") {
    add("noCollapse");
    if (next.run.challengeState.minFire <= 25) add("lowCampfire");
    if (next.run.challengeState.openingRoutes >= 2 && !next.run.challengeState.openingUsedNonScout) add("scoutOpening");
    if (!next.run.challengeState.usedRepairKit) add("noRepairKitGate");
  }
  return { ...next, legacy: { ...next.legacy, completedChallenges: completed } };
}

function labelSecret(id: string): string {
  const labels: Record<string, string> = {
    fivefoldConcord: "Fivefold Concord",
    unbrokenDawn: "Unbroken Dawn",
    emptyHandsMercy: "Empty Hands, Full Hearts",
    coalglassEcho: "Coalglass Echo",
  };
  return labels[id] ?? id;
}
