import { beacons } from "../data/beacons.js";
import type { BeaconId, GameState } from "./state.js";

export type CampMapAction = { id: string; label: string; glyph: string; screen: "explore" | "boss" | "repair" | "gate" | "end" };

export function mapBeaconStatus(state: GameState, id: BeaconId) {
  const progress = state.run.beacons[id];
  const beacon = beacons.find((entry) => entry.id === id)!;
  if (progress.repaired) return "lit";
  if (progress.bossDefeated) return "repair";
  if (progress.discovered) return "boss";
  return state.run.routes[beacon.prepRouteId].completed > 0 ? "found" : "hidden";
}

export function mapActionItems(state: GameState): CampMapAction[] {
  const actions: CampMapAction[] = [];
  if (state.run.activeCrisis) actions.push({ id: "crisis", label: "Crisis", glyph: "!", screen: "explore" });
  if (state.run.activeRouteDecision) actions.push({ id: "decision", label: "Route choice", glyph: "?", screen: "explore" });
  if (state.run.recruitEvent?.status === "available" || state.run.recruitEvent?.status === "waiting") actions.push({ id: "recruit", label: "Recruit", glyph: "+", screen: "explore" });
  if (state.run.bossBattle?.status === "active") actions.push({ id: "boss", label: "Boss", glyph: "B", screen: "boss" });
  if (state.run.bossBattle?.status === "won") actions.push({ id: "repair", label: "Repair", glyph: "FIX", screen: "repair" });
  if (state.run.gate.status === "open" || state.run.gate.status === "active") actions.push({ id: "gate", label: "Gate", glyph: "G", screen: "gate" });
  if (state.run.endRun && !state.run.endRun.claimed) actions.push({ id: "chest", label: "Chest", glyph: "$", screen: "end" });
  return actions;
}
