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

function migrateV1(state: GameState): GameState {
  const defaults = createInitialState(state.savedAt);
  return {
    ...state,
    legacy: {
      shards: state.legacy.shards ?? 0,
      unlocks: state.legacy.unlocks ?? [],
      relics: state.legacy.relics ?? [],
      blueprints: state.legacy.blueprints ?? [],
    },
    run: {
      ...state.run,
      items: { ...emptyInventory, ...(state.run.items ?? {}) },
      routes: { ...defaults.run.routes, ...(state.run.routes ?? {}) },
      beacons: { ...emptyBeaconProgress, ...(state.run.beacons ?? {}) },
      craftQueue: state.run.craftQueue ?? [],
      recruitEvent: state.run.recruitEvent ?? null,
      bossBattle: state.run.bossBattle ?? null,
      beaconRepair: state.run.beaconRepair ?? null,
      endRun: state.run.endRun ?? null,
    },
  };
}
