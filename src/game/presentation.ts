import type { ExpeditionNodeType, PartyActivity } from "./state";

export type PresentationCue = "calm" | "discovery" | "hazard" | "threat" | "triumph";

export function expeditionCue(type: ExpeditionNodeType, activity: PartyActivity): PresentationCue {
  if (type === "bossGate" || activity === "reacting") return "threat";
  if (type === "hazard" || type === "encounter") return "hazard";
  if (type === "resource" || type === "shrine" || type === "shortcut") return "discovery";
  return "calm";
}

export function combatCue(feedback: string): PresentationCue {
  if (feedback.startsWith("Counter worked") || feedback.includes("defeated")) return "triumph";
  if (feedback.startsWith("Counter missed") || feedback.includes("down")) return "threat";
  return "calm";
}
