import { beacons } from "../data/beacons.js";
import type { ChestGrade, CoreQuality, GameState, ScoreLine } from "./state.js";
import { hasRunItemEquipped } from "./runItems.js";

const repairPoints: Record<CoreQuality, number> = {
  pristine: 140,
  stable: 120,
  cracked: 90,
  faded: 60,
};

export function calculateScore(state: GameState): { score: number; lines: ScoreLine[]; chestGrade: ChestGrade } {
  const lines: ScoreLine[] = [];

  for (const beacon of beacons) {
    const progress = state.run.beacons[beacon.id];
    if (state.run.routes[beacon.bossRouteId].discovered) {
      lines.push({ label: `Discovered ${beacon.name} Site`, points: 20 });
    }
    if (progress.bossDefeated) {
      lines.push({ label: `Defeated ${beacon.bossName}`, points: 60 });
    }
    if (progress.repaired && progress.coreQuality) {
      lines.push({
        label: `Repaired ${beacon.name} (${progress.coreQuality})`,
        points: repairPoints[progress.coreQuality],
      });
    }
  }
  if (state.run.survivors.some((survivor) => survivor.id === "survivor-rook")) {
    lines.push({ label: "Recruited Rook", points: 50 });
  }
  if (state.run.gate.status === "cleared") {
    lines.push({ label: "Defeated Night Herald", points: 220 });
    lines.push({ label: "Opened the Cinder Gate", points: 80 });
  }
  if (state.run.eventScore > 0) {
    lines.push({ label: `Exploration decisions (${state.run.decisionsResolved})`, points: state.run.eventScore });
  }
  if (state.run.crisisScore > 0) {
    lines.push({ label: `Camp crises resolved (${state.run.crisesResolved})`, points: state.run.crisisScore });
  }
  if (state.run.crisesIgnored > 0) {
    lines.push({ label: "Camp crises ignored", points: state.run.crisesIgnored * -20 });
  }
  if (state.run.routeFailures > 0) {
    lines.push({ label: "Route failures", points: state.run.routeFailures * -15 });
  }
  if (state.run.bossFailures > 0) {
    lines.push({ label: "Boss failures", points: state.run.bossFailures * -10 });
  }

  const downed = state.run.survivors.filter((survivor) => survivor.currentHp <= 0).length;
  if (downed > 0) lines.push({ label: "Survivors downed", points: downed * -30 });
  if (downed === 0 && hasRunItemEquipped(state, "moonThread")) {
    lines.push({ label: "Moon Thread: no survivor downed", points: 120 });
  }

  const score = Math.max(0, lines.reduce((sum, line) => sum + line.points, 0));
  return { score, lines, chestGrade: chestGradeForScore(score) };
}

export function calculateCollapseScore(state: GameState): { score: number; lines: ScoreLine[]; chestGrade: ChestGrade } {
  const result = calculateScore(state);
  const penalty = -Math.ceil(result.score / 2);
  return {
    score: Math.max(0, result.score + penalty),
    lines: [...result.lines, { label: "Run Collapse (score x0.5)", points: penalty }],
    chestGrade: Math.max(0, result.score + penalty) >= 550 ? "faded" : "broken",
  };
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
  if (score >= 1300) return "ancient";
  if (score >= 1000) return "iron";
  if (score >= 550) return "faded";
  return "broken";
}
