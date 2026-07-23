import { useEffect, useRef, useState } from "react";
import { beacons } from "../data/beacons";
import { bondLevel } from "../game/journal";
import type { GameState } from "../game/state";

type Milestone = {
  kind: string;
  eyebrow: string;
  title: string;
  detail: string;
};

export function MilestoneOverlay({ state, muted }: { state: GameState; muted: boolean }) {
  const previous = useRef(state);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    const before = previous.current;
    const next = detectMilestone(before, state);
    const cue = detectCue(before, state);
    previous.current = state;

    if (!muted && cue) playCue(cue);
    if (!next) return;
    setMilestone(next);
    const timer = window.setTimeout(() => setMilestone(null), 2800);
    return () => window.clearTimeout(timer);
  }, [state, muted]);

  if (!milestone) return null;
  return (
    <div className={`milestone-overlay milestone-${milestone.kind}`} role="status" aria-live="polite">
      <div className="milestone-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="milestone-card">
        <span className="milestone-mark" aria-hidden="true" />
        <p className="eyebrow">{milestone.eyebrow}</p>
        <h2>{milestone.title}</h2>
        <p>{milestone.detail}</p>
      </div>
    </div>
  );
}

function detectMilestone(before: GameState, state: GameState): Milestone | null {
  if (!before.run.endRun && state.run.endRun?.outcome === "collapse") {
    return { kind: "collapse", eyebrow: "Run Collapse", title: "The Last Coal", detail: "The run ends, but its story and partial reward remain." };
  }
  if (before.run.gate.status !== "cleared" && state.run.gate.status === "cleared") {
    return { kind: "herald", eyebrow: "Night Herald Defeated", title: "Dawn Holds", detail: "Five Beacon lights cut a path beyond the Cinder Gate." };
  }
  if (before.run.gate.status !== "open" && state.run.gate.status === "open") {
    return { kind: "gate", eyebrow: "Cinder Gate Opened", title: "The Final Path", detail: "All five Beacon flames answer as one." };
  }
  const lit = beacons.find((beacon) => !before.run.beacons[beacon.id].repaired && state.run.beacons[beacon.id].repaired);
  if (lit) return { kind: "beacon", eyebrow: "Beacon Lit", title: lit.name, detail: `${lit.coreName} returns its light to the forest.` };
  if (before.run.bossBattle?.status === "active" && state.run.bossBattle?.status === "won") {
    return { kind: "guardian", eyebrow: "Guardian Defeated", title: state.run.bossBattle.bossName, detail: `${state.run.bossBattle.coreName} recovered.` };
  }
  if (!before.run.endRun?.claimed && state.run.endRun?.claimed) {
    return { kind: "chest", eyebrow: "Legacy Chest Opened", title: state.run.endRun.reward?.label ?? "Legacy Reward", detail: "This discovery remains with every future camp." };
  }
  const secret = state.legacy.discoveredSecrets.find((id) => !before.legacy.discoveredSecrets.includes(id));
  if (secret) return { kind: "secret", eyebrow: "Secret Discovered", title: labelId(secret), detail: "A hidden page has opened in the Journal." };
  const bond = Object.entries(state.legacy.bonds).find(([id, points]) => bondLevel(points) > bondLevel(before.legacy.bonds[id] ?? 0));
  if (bond) {
    const survivor = state.run.survivors.find((entry) => entry.id === bond[0]);
    return { kind: "bond", eyebrow: "Bond Deepened", title: survivor?.name ?? "Survivor Bond", detail: `Bond Level ${bondLevel(bond[1])} story note unlocked.` };
  }
  return null;
}

function detectCue(before: GameState, state: GameState): string | null {
  if (detectMilestone(before, state)) return "milestone";
  if (before.run.activeCrisis?.id !== state.run.activeCrisis?.id && state.run.activeCrisis) return "warning";
  if (before.run.bossBattle?.pendingIntentId !== state.run.bossBattle?.pendingIntentId && state.run.bossBattle?.status === "active") return "telegraph";
  if (before.run.gate.pendingIntentId !== state.run.gate.pendingIntentId && state.run.gate.status === "active") return "telegraph";
  if (!before.run.bossBattle?.lastCounterFeedback.startsWith("Counter worked") && state.run.bossBattle?.lastCounterFeedback.startsWith("Counter worked")) return "success";
  if (!before.run.gate.lastCounterFeedback.startsWith("Counter worked") && state.run.gate.lastCounterFeedback.startsWith("Counter worked")) return "success";
  if (before.run.activeExpedition && !state.run.activeExpedition) return "route";
  return null;
}

function playCue(cue: string) {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const gain = context.createGain();
  const frequencies: Record<string, number[]> = {
    milestone: [330, 494, 659],
    warning: [180, 145],
    telegraph: [220, 277],
    success: [392, 587],
    route: [294, 440],
  };
  const notes = frequencies[cue] ?? [320];
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + notes.length * 0.14 + 0.08);
  gain.connect(context.destination);
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.12);
    oscillator.stop(context.currentTime + index * 0.12 + 0.16);
  });
  window.setTimeout(() => void context.close(), notes.length * 140 + 180);
}

function labelId(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}
