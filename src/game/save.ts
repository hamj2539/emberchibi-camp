import { createInitialState, emptyBeaconProgress, emptyInventory, type GameState } from "./state.js";

const SAVE_KEY = "emberchibiCamp.v1";

export function loadGame(): GameState {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== 1) return createInitialState();
    return migrateV1(parsed);
  } catch {
    return createInitialState();
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function migrateV1(state: GameState): GameState {
  const defaults = createInitialState(state.savedAt);
  const validBeaconIds = new Set(Object.keys(defaults.run.beacons));
  const bossBattle = state.run.bossBattle && validBeaconIds.has(state.run.bossBattle.beaconId)
    ? state.run.bossBattle
    : null;
  const beaconRepair = state.run.beaconRepair && validBeaconIds.has(state.run.beaconRepair.beaconId)
    ? state.run.beaconRepair
    : null;
  const unsafeEncounterScreen =
    (state.run.screen === "boss" && !bossBattle) ||
    (state.run.screen === "repair" && (!bossBattle || !beaconRepair));
  return {
    ...state,
    legacy: {
      shards: state.legacy.shards ?? 0,
      unlocks: state.legacy.unlocks ?? [],
      relics: state.legacy.relics ?? [],
      blueprints: state.legacy.blueprints ?? [],
      runsCompleted: state.legacy.runsCompleted ?? 0,
      bestScore: state.legacy.bestScore ?? 0,
      bestChestGrade: state.legacy.bestChestGrade ?? null,
    },
    run: {
      ...state.run,
      screen: unsafeEncounterScreen ? "camp" : state.run.screen,
      items: { ...emptyInventory, ...(state.run.items ?? {}) },
      routes: { ...defaults.run.routes, ...(state.run.routes ?? {}) },
      beacons: { ...emptyBeaconProgress, ...(state.run.beacons ?? {}) },
      craftQueue: state.run.craftQueue ?? [],
      recruitEvent: state.run.recruitEvent ?? null,
      bossBattle,
      beaconRepair,
      gate: state.run.gate ?? defaults.run.gate,
      endRun: state.run.endRun ?? null,
    },
  };
}
