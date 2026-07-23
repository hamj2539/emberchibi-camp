import { beacons } from "../data/beacons.js";
import { blueprintEntries, challengeDefinitions, journalCollections } from "../data/journal.js";
import type { ChestGrade, GameState, RunMetrics, RunVowId, StarterClassId } from "./state.js";

export type LongTermGoal = {
  id: string;
  name: string;
  progress: number;
  target: number;
  detail: string;
};

export type AggregateMetrics = {
  runs: number;
  averageDurationSeconds: number;
  wins: number;
  collapses: number;
  chestDistribution: Record<ChestGrade, number>;
  starterDistribution: Record<StarterClassId, { runs: number; wins: number }>;
  commonFailureCauses: { cause: string; count: number }[];
};

export function getLongTermGoals(state: GameState): LongTermGoal[] {
  const maxBondCount = journalCollections.survivors.filter((entry) => (state.legacy.bonds[entry.id] ?? 0) >= 9).length;
  const totalCollectibles = journalCollections.relics.length + blueprintEntries.length;
  const collected = state.legacy.collection.relics.length + state.legacy.collection.blueprints.length;
  return [
    {
      id: "beaconVariants",
      name: "Every Way Home",
      progress: state.legacy.beaconRepairVariants.length,
      target: beacons.length * 3,
      detail: "Complete standard, ritual, and special repairs across all five Beacons.",
    },
    {
      id: "coreQualities",
      name: "Core Archivist",
      progress: state.legacy.coreQualityVariants.length,
      target: beacons.length * 4,
      detail: "Recover every Core quality for every Beacon.",
    },
    {
      id: "maxBonds",
      name: "Hearthbound Company",
      progress: maxBondCount,
      target: journalCollections.survivors.length,
      detail: "Reach maximum bond with every survivor.",
    },
    {
      id: "endings",
      name: "All Dawns Remembered",
      progress: state.legacy.collection.endings.length,
      target: journalCollections.endings.length,
      detail: "Discover every ending.",
    },
    {
      id: "challenges",
      name: "Keeper of Vows",
      progress: state.legacy.completedChallenges.length + state.legacy.completedVows.length,
      target: challengeDefinitions.length + 5,
      detail: "Clear every challenge and every run vow.",
    },
    {
      id: "legacyCollection",
      name: "Complete Legacy",
      progress: collected,
      target: totalCollectibles,
      detail: "Complete the Legacy Relic and Blueprint collections.",
    },
  ];
}

export function aggregateRunMetrics(history: RunMetrics[]): AggregateMetrics {
  const chestDistribution: AggregateMetrics["chestDistribution"] = { broken: 0, faded: 0, iron: 0, ancient: 0 };
  const starterDistribution = {
    scout: { runs: 0, wins: 0 },
    hunter: { runs: 0, wins: 0 },
    herbalist: { runs: 0, wins: 0 },
    tinker: { runs: 0, wins: 0 },
  };
  const failures = new Map<string, number>();
  for (const run of history) {
    chestDistribution[run.chestGrade] += 1;
    starterDistribution[run.starterClass].runs += 1;
    if (run.nightHeraldOutcome === "cleared") starterDistribution[run.starterClass].wins += 1;
    if (run.collapseReason) failures.set(run.collapseReason, (failures.get(run.collapseReason) ?? 0) + 1);
  }
  const wins = history.filter((run) => run.nightHeraldOutcome === "cleared").length;
  return {
    runs: history.length,
    averageDurationSeconds: history.length
      ? Math.round(history.reduce((sum, run) => sum + run.durationSeconds, 0) / history.length)
      : 0,
    wins,
    collapses: history.length - wins,
    chestDistribution,
    starterDistribution,
    commonFailureCauses: [...failures.entries()]
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
}

export function completedVows(state: GameState): RunVowId[] {
  if (state.run.gate.status !== "cleared") return [];
  return state.run.vows.filter((vow) => vow !== "pristineHunt" ||
    Object.values(state.run.beacons).filter((beacon) => beacon.coreQuality === "pristine").length >= 3);
}
