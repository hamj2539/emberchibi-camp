import { getRunItem } from "../data/runItems.js";
import type { GameState, RunEquipmentSlot, RunItemId } from "./state.js";

export function hasRunItemEquipped(state: GameState, itemId: RunItemId): boolean {
  return Object.values(state.run.runLoadout).includes(itemId);
}

export function acquireRunItem(state: GameState, itemId: RunItemId, source: string): GameState {
  if (state.run.runItems.some((pickup) => pickup.id === itemId)) return state;
  const definition = getRunItem(itemId);
  return {
    ...state,
    run: {
      ...state.run,
      runItems: [...state.run.runItems, { id: itemId, source }],
      log: [`Run item found: ${definition.name} (${source}).`, ...state.run.log].slice(0, 12),
    },
  };
}

export function equipRunItem(state: GameState, itemId: RunItemId): GameState {
  if (!state.run.runItems.some((pickup) => pickup.id === itemId)) return state;
  const definition = getRunItem(itemId);
  return {
    ...state,
    run: {
      ...state.run,
      runLoadout: { ...state.run.runLoadout, [definition.slot]: itemId },
      log: [`Equipped ${definition.name} in the ${definition.slot} slot.`, ...state.run.log].slice(0, 12),
    },
  };
}

export function unequipRunItem(state: GameState, slot: RunEquipmentSlot): GameState {
  if (!state.run.runLoadout[slot]) return state;
  return {
    ...state,
    run: {
      ...state.run,
      runLoadout: { ...state.run.runLoadout, [slot]: null },
    },
  };
}

export function triggerRunEffect(state: GameState, key: string, message: string): GameState {
  if (state.run.triggeredRunEffects.includes(key)) return state;
  return {
    ...state,
    run: {
      ...state.run,
      triggeredRunEffects: [...state.run.triggeredRunEffects, key],
      log: [`Run effect: ${message}`, ...state.run.log].slice(0, 12),
    },
  };
}
