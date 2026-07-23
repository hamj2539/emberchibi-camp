import type { ChestGrade, GameState, RunMetrics } from "./state.js";

export function buildRunMetrics(
  state: GameState,
  chestGrade: ChestGrade,
  collapseReason: string | null,
): RunMetrics {
  const guardianAttempts = Object.fromEntries(
    Object.entries(state.run.beacons).map(([id, beacon]) => [
      id,
      (beacon.failedAttempts ?? 0) + (beacon.repaired || state.run.bossBattle?.beaconId === id ? 1 : 0),
    ]),
  ) as RunMetrics["guardianAttempts"];
  const coreQualities = Object.fromEntries(
    Object.entries(state.run.beacons).map(([id, beacon]) => [id, beacon.coreQuality]),
  ) as RunMetrics["coreQualities"];

  return {
    durationSeconds: Math.round(state.run.daySeconds),
    starterClass: state.run.starterClass ?? state.run.survivors[0]?.classId ?? "scout",
    routeFailures: state.run.routeFailures ?? 0,
    crisisCount: (state.run.crisesResolved ?? 0) + (state.run.crisesIgnored ?? 0),
    guardianAttempts,
    coreQualities,
    gateStability: Object.values(state.run.beacons).reduce(
      (total, beacon) =>
        total + (beacon.coreQuality ? { pristine: 3, stable: 2, cracked: 1, faded: 0 }[beacon.coreQuality] : 0),
      0,
    ),
    nightHeraldOutcome:
      state.run.gate.status === "cleared" ? "cleared" : state.run.gate.status === "lost" ? "lost" : "notReached",
    chestGrade,
    collapseReason,
  };
}

export function appendRunHistory(state: GameState, metrics: RunMetrics): GameState["legacy"] {
  return {
    ...state.legacy,
    runHistory: [metrics, ...(state.legacy.runHistory ?? [])].slice(0, 10),
  };
}
