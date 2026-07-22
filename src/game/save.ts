import { createInitialState, type GameState } from "./state";

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
  return {
    ...state,
    run: {
      ...state.run,
      recruitEvent: state.run.recruitEvent ?? null,
    },
  };
}
