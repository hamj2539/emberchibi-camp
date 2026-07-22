import type { ChestGrade, CoreQuality, GameState, ScoreLine } from "./state";

const repairPoints: Record<CoreQuality, number> = {
  pristine: 140,
  stable: 120,
  cracked: 90,
  faded: 60,
};

export function calculateScore(state: GameState): { score: number; lines: ScoreLine[]; chestGrade: ChestGrade } {
  const lines: ScoreLine[] = [];

  if (state.run.routes.emberBeaconSite.discovered) lines.push({ label: "Discovered Ember Beacon Site", points: 20 });
  if (state.run.bossBattle?.status === "won") lines.push({ label: "Defeated Cinder Stag", points: 60 });
  if (state.run.beaconRepair?.status === "lit") {
    lines.push({
      label: `Repaired Ember Beacon (${state.run.beaconRepair.coreQuality})`,
      points: repairPoints[state.run.beaconRepair.coreQuality],
    });
  }
  if (state.run.survivors.some((survivor) => survivor.id === "survivor-rook")) {
    lines.push({ label: "Recruited Rook", points: 50 });
  }
  if (state.run.routeFailures > 0) {
    lines.push({ label: "Route failures", points: state.run.routeFailures * -15 });
  }
  if (state.run.bossFailures > 0) {
    lines.push({ label: "Boss failures", points: state.run.bossFailures * -10 });
  }

  const downed = state.run.survivors.filter((survivor) => survivor.currentHp <= 0).length;
  if (downed > 0) lines.push({ label: "Survivors downed", points: downed * -30 });

  const score = Math.max(0, lines.reduce((sum, line) => sum + line.points, 0));
  return { score, lines, chestGrade: chestGradeForScore(score) };
}

export function labelChestGrade(grade: ChestGrade): string {
  const labels: Record<ChestGrade, string> = {
    broken: "Broken Legacy Chest",
    faded: "Faded Legacy Chest",
    iron: "Iron Legacy Chest",
    ancient: "Ancient Legacy Chest",
  };
  return labels[grade];
}

function chestGradeForScore(score: number): ChestGrade {
  if (score >= 350) return "ancient";
  if (score >= 200) return "iron";
  if (score >= 100) return "faded";
  return "broken";
}
