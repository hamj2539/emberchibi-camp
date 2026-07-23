import { beacons } from "../data/beacons.js";
import type { GameState, Screen } from "./state.js";

export type Objective = {
  title: string;
  detail: string;
  progress: number;
  screen: Screen;
  actionLabel: string;
};

export function getCurrentObjective(state: GameState): Objective {
  if (!state.run.started) {
    return {
      title: "Choose a starter",
      detail: "Pick the survivor who will carry the first ember.",
      progress: 0,
      screen: "starter",
      actionLabel: "Choose Starter",
    };
  }

  if (state.run.activeCrisis) {
    return {
      title: "Resolve the camp crisis",
      detail: `${state.run.activeCrisis.reason} Respond before the deadline or accept its consequence.`,
      progress: 35,
      screen: "camp",
      actionLabel: "Open Crisis",
    };
  }

  if (state.run.activeRouteDecision) {
    return {
      title: "Make the route decision",
      detail: "Choose an outcome before starting another expedition.",
      progress: 50,
      screen: "explore",
      actionLabel: "View Decision",
    };
  }

  if (state.run.bossBattle?.status === "active") {
    return {
      title: `Counter ${state.run.bossBattle.bossName}`,
      detail: state.run.bossBattle.lastCounterFeedback,
      progress: 70,
      screen: "boss",
      actionLabel: "Return to Battle",
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
      screen: "explore",
      actionLabel: "Find a Recruit",
    };
  }

  if (!state.run.routes.emberBeaconSite.discovered) {
    return {
      title: "Find the Ember Beacon Site",
      detail: "Clear Burnt Grove to reveal the Guardian route.",
      progress: state.run.routes.burntGrove.completed > 0 ? 90 : 45,
      screen: "explore",
      actionLabel: "Explore Burnt Grove",
    };
  }

  const litCount = beacons.filter((beacon) => state.run.beacons[beacon.id].repaired).length;
  const nextBeacon = beacons.find((beacon) => !state.run.beacons[beacon.id].repaired);

  if (nextBeacon && state.run.bossBattle?.beaconId !== nextBeacon.id && !state.run.beacons[nextBeacon.id].bossDefeated) {
    return {
      title: `Defeat ${nextBeacon.bossName}`,
      detail: `Clear ${nextBeacon.name}'s prep route, then challenge its Guardian site.`,
      progress: 55 + litCount * 8,
      screen: "explore",
      actionLabel: "View Beacon Route",
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
      screen: "repair",
      actionLabel: "Repair Beacon",
    };
  }

  if (state.run.gate.status !== "cleared") {
    return {
      title: "Defeat Night Herald",
      detail: "Enter the Cinder Gate with 2-3 survivors to finish the run.",
      progress: state.run.gate.status === "active" ? 90 : 82,
      screen: "gate",
      actionLabel: "Open Cinder Gate",
    };
  }

  if (!state.run.endRun?.claimed) {
    return {
      title: "Open the Legacy Chest",
      detail: "Claim the run reward and save it to legacy progress.",
      progress: 95,
      screen: "end",
      actionLabel: "Open Chest",
    };
  }

  return {
    title: "Run complete",
    detail: "Start a fresh run while keeping legacy rewards.",
    progress: 100,
    screen: "end",
    actionLabel: "Review Run",
  };
}
