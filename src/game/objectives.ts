import type { GameState } from "./state";

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

  if (!state.run.survivors.some((survivor) => survivor.id === "survivor-rook")) {
    return {
      title: "Recruit a second survivor",
      detail: "Run Mistwood Edge and help Rook when the event appears.",
      progress: state.run.recruitEvent?.status === "available" ? 70 : 30,
    };
  }

  if (!state.run.routes.emberBeaconSite.discovered) {
    return {
      title: "Find the Ember Beacon Site",
      detail: "Clear Burnt Grove to reveal the Guardian route.",
      progress: state.run.routes.burntGrove.completed > 0 ? 90 : 45,
    };
  }

  if (state.run.bossBattle?.status !== "won") {
    return {
      title: "Defeat Cinder Stag",
      detail: "Craft prep items, then send 2 survivors to Ember Beacon Site.",
      progress: state.run.bossBattle ? 80 : 60,
    };
  }

  if (state.run.beaconRepair?.status !== "lit") {
    return {
      title: "Repair Ember Beacon",
      detail: "Spend Wood and Stone, then assign a repair crew.",
      progress:
        state.run.beaconRepair?.status === "active"
          ? Math.round((state.run.beaconRepair.progress / state.run.beaconRepair.requiredProgress) * 100)
          : 85,
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
