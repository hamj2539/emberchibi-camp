import { beacons } from "../data/beacons.js";
import type { GameState } from "./state.js";

export type Objective = {
  title: string;
  detail: string;
  progress: number;
};

export function getCurrentObjective(state: GameState): Objective {
  if (!state.run.started) {
    return {
      title: "Choose a starter",
      detail: "Pick the survivor who will carry the first ember.",
      progress: 0,
    };
  }

  if (state.run.survivors.length < 2) {
    const rookMissed = state.run.eventFlags.includes("recruit-rook-missed");
    return {
      title: "Recruit a second survivor",
      detail: rookMissed
        ? "Rook moved on. Search Saltmarsh Run or Windscar Cliffs for another recruit."
        : "Run Mistwood Edge and help Rook when the event appears.",
      progress:
        state.run.recruitEvent?.status === "waiting"
          ? 80
          : state.run.recruitEvent?.status === "available"
            ? 70
            : 30,
    };
  }

  if (!state.run.routes.emberBeaconSite.discovered) {
    return {
      title: "Find the Ember Beacon Site",
      detail: "Clear Burnt Grove to reveal the Guardian route.",
      progress: state.run.routes.burntGrove.completed > 0 ? 90 : 45,
    };
  }

  const litCount = beacons.filter((beacon) => state.run.beacons[beacon.id].repaired).length;
  const nextBeacon = beacons.find((beacon) => !state.run.beacons[beacon.id].repaired);

  if (nextBeacon && state.run.bossBattle?.beaconId !== nextBeacon.id && !state.run.beacons[nextBeacon.id].bossDefeated) {
    return {
      title: `Defeat ${nextBeacon.bossName}`,
      detail: `Clear ${nextBeacon.name}'s prep route, then challenge its Guardian site.`,
      progress: 55 + litCount * 8,
    };
  }

  if (nextBeacon && !state.run.beacons[nextBeacon.id].repaired) {
    return {
      title: `Repair ${nextBeacon.name}`,
      detail: "Spend Wood and Stone, then assign a repair crew.",
      progress:
        state.run.beaconRepair?.status === "active"
          ? Math.round((state.run.beaconRepair.progress / state.run.beaconRepair.requiredProgress) * 100)
          : 70 + litCount * 5,
    };
  }

  if (state.run.gate.status !== "cleared") {
    return {
      title: "Defeat Night Herald",
      detail: "Enter the Cinder Gate with 2-3 survivors to finish the run.",
      progress: state.run.gate.status === "active" ? 90 : 82,
    };
  }

  if (!state.run.endRun?.claimed) {
    return {
      title: "Open the Legacy Chest",
      detail: "Claim the run reward and save it to legacy progress.",
      progress: 95,
    };
  }

  return {
    title: "Run complete",
    detail: "Start a fresh run while keeping legacy rewards.",
    progress: 100,
  };
}
