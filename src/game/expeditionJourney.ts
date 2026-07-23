import { generateExpeditionNodes, moodForRoute } from "../data/expeditionNodes.js";
import { getRoute } from "../data/routes.js";
import type {
  Expedition,
  ExpeditionNode,
  ExpeditionNodeChoice,
  GameState,
  PartyActivity,
  ResourceKey,
  RouteId,
} from "./state.js";

export function createExpeditionJourney(
  routeId: RouteId,
  survivorIds: string[],
  startedAt: number,
  durationSeconds: number,
  mode: Expedition["mode"],
  supplies: { usedRation: boolean; usedTorch: boolean },
): Expedition {
  const nodes = generateExpeditionNodes(routeId);
  const stepMs = nodeStepDurationSeconds(durationSeconds, nodes.length) * 1000;
  return {
    id: `expedition-${startedAt}`,
    routeId,
    survivorIds,
    startedAt,
    endsAt: startedAt + durationSeconds * 1000,
    usedRation: supplies.usedRation,
    usedTorch: supplies.usedTorch,
    nodes,
    currentNodeIndex: 0,
    nextNodeAt: startedAt + stepMs,
    paused: false,
    mode,
    activity: "walking",
    nodeSafety: 0,
    rewardMultiplier: 1,
    scoreBonus: 0,
    resolvedNodeIds: [],
    teasers: [`The party enters ${moodForRoute(routeId).name}.`],
    biomeMood: moodForRoute(routeId).id,
  };
}

export function migrateExpeditionJourney(expedition: Expedition): Expedition {
  if (Array.isArray(expedition.nodes) && expedition.nodes.length >= 4) return expedition;
  const route = getRoute(expedition.routeId);
  const durationSeconds = Math.max(6, Math.round((expedition.endsAt - expedition.startedAt) / 1000) || route.durationSeconds);
  return createExpeditionJourney(
    expedition.routeId,
    expedition.survivorIds,
    expedition.startedAt,
    durationSeconds,
    "autoSafe",
    { usedRation: Boolean(expedition.usedRation), usedTorch: Boolean(expedition.usedTorch) },
  );
}

export function advanceExpeditionJourney(state: GameState, now: number): { state: GameState; completed: boolean } {
  let next = state;
  let expedition = state.run.activeExpedition ? migrateExpeditionJourney(state.run.activeExpedition) : null;
  if (!expedition) return { state, completed: false };
  if (expedition !== state.run.activeExpedition) {
    next = { ...state, run: { ...state.run, activeExpedition: expedition } };
  }
  if (expedition.paused) return { state: next, completed: false };

  while (
    expedition.currentNodeIndex < expedition.nodes.length &&
    (now >= expedition.nextNodeAt || (expedition.mode === "autoSafe" && now >= expedition.endsAt))
  ) {
    const node = expedition.nodes[expedition.currentNodeIndex];
    if (node.major && expedition.mode === "manual") {
      expedition = { ...expedition, paused: true, activity: activityForNode(node) };
      next = withExpedition(next, expedition);
      return { state: next, completed: false };
    }
    const choice = node.choices.find((entry) => entry.id === "safe") ?? node.choices[0];
    next = choice ? applyNodeChoice(next, node, choice) : recordNode(next, node, `${node.title}: the party moves on.`);
    expedition = next.run.activeExpedition!;
    const nextIndex = expedition.currentNodeIndex + 1;
    expedition = {
      ...expedition,
      currentNodeIndex: nextIndex,
      nextNodeAt: expedition.nextNodeAt + journeyStepMs(expedition),
      paused: false,
      activity: nextIndex < expedition.nodes.length ? activityForNode(expedition.nodes[nextIndex]) : "walking",
    };
    next = withExpedition(next, expedition);
  }

  return { state: next, completed: expedition.currentNodeIndex >= expedition.nodes.length };
}

export function resolveExpeditionNodeChoice(
  state: GameState,
  choiceId: ExpeditionNodeChoice["id"],
  now = Date.now(),
): GameState {
  const expedition = state.run.activeExpedition;
  if (!expedition || !expedition.paused) return state;
  const node = expedition.nodes[expedition.currentNodeIndex];
  const choice = node?.choices.find((entry) => entry.id === choiceId);
  if (!node || !choice || !canUseNodeChoice(state, choice)) return state;
  let next = applyNodeChoice(state, node, choice);
  const current = next.run.activeExpedition!;
  const nextIndex = current.currentNodeIndex + 1;
  return withExpedition(next, {
    ...current,
    currentNodeIndex: nextIndex,
    nextNodeAt: now + journeyStepMs(current),
    paused: false,
    activity: nextIndex < current.nodes.length ? activityForNode(current.nodes[nextIndex]) : "walking",
  });
}

export function canUseNodeChoice(state: GameState, choice: ExpeditionNodeChoice): boolean {
  const expedition = state.run.activeExpedition;
  if (!expedition) return false;
  const requirement = choice.requirement;
  if (!requirement) return true;
  const party = state.run.survivors.filter((survivor) => expedition.survivorIds.includes(survivor.id));
  const identityRequirements = [
    requirement.classId ? party.some((survivor) => survivor.classId === requirement.classId) : false,
    requirement.relic ? state.legacy.equippedRelics.includes(requirement.relic) : false,
    requirement.survivorId ? party.some((survivor) => survivor.id === requirement.survivorId) : false,
  ];
  if (identityRequirements.some(Boolean)) return true;
  if (requirement.supply === "ration") return Boolean(expedition.usedRation);
  if (requirement.supply === "torch") return Boolean(expedition.usedTorch);
  return false;
}

export function setExpeditionMode(state: GameState, mode: Expedition["mode"]): GameState {
  const expedition = state.run.activeExpedition;
  if (!expedition) return state;
  const next = withExpedition(state, { ...expedition, mode });
  if (mode === "autoSafe" && expedition.paused) {
    const node = expedition.nodes[expedition.currentNodeIndex];
    const safe = node?.choices.find((choice) => choice.id === "safe");
    return safe ? resolveExpeditionNodeChoice(next, safe.id) : next;
  }
  return next;
}

export function activityForNode(node: ExpeditionNode): PartyActivity {
  if (node.type === "resource") return "gathering";
  if (node.type === "hazard" || node.type === "bossGate") return "bracing";
  if (node.type === "clue" || node.type === "shrine" || node.type === "shortcut") return "inspecting";
  if (node.type === "rest") return "resting";
  if (node.type === "encounter" || node.type === "event") return "reacting";
  return "walking";
}

function applyNodeChoice(state: GameState, node: ExpeditionNode, choice: ExpeditionNodeChoice): GameState {
  const expedition = state.run.activeExpedition;
  if (!expedition) return state;
  const resources = { ...state.run.resources };
  for (const [key, amount] of Object.entries(choice.effect.resources ?? {}) as [ResourceKey, number][]) {
    resources[key] = Math.max(0, resources[key] + amount);
  }
  const survivors = state.run.survivors.map((survivor) =>
    expedition.survivorIds.includes(survivor.id)
      ? {
          ...survivor,
          fatigue: clamp(survivor.fatigue + (choice.effect.fatigue ?? 0), 0, 100),
          injury: clamp(survivor.injury + (choice.effect.injury ?? 0), 0, 100),
        }
      : survivor,
  );
  const preparedHazardBonus =
    node.type === "hazard" && (expedition.usedRation || expedition.usedTorch) ? 2 : 0;
  const updated: Expedition = {
    ...expedition,
    nodeSafety: expedition.nodeSafety + (choice.effect.safety ?? 0) + preparedHazardBonus,
    rewardMultiplier: expedition.rewardMultiplier * (choice.effect.rewardMultiplier ?? 1),
    scoreBonus: expedition.scoreBonus + (choice.effect.score ?? 0),
    resolvedNodeIds: expedition.resolvedNodeIds.includes(node.id)
      ? expedition.resolvedNodeIds
      : [...expedition.resolvedNodeIds, node.id],
    teasers: [
      preparedHazardBonus ? `${choice.result} Prepared supplies add +2 Safety.` : choice.result,
      ...expedition.teasers,
    ].slice(0, 4),
    activity: activityForNode(node),
  };
  return {
    ...state,
    run: {
      ...state.run,
      resources,
      survivors,
      activeExpedition: updated,
      log: [`${node.title}: ${choice.result}`, ...state.run.log].slice(0, 12),
    },
  };
}

function recordNode(state: GameState, node: ExpeditionNode, message: string): GameState {
  const expedition = state.run.activeExpedition!;
  return {
    ...state,
    run: {
      ...state.run,
      activeExpedition: {
        ...expedition,
        resolvedNodeIds: [...expedition.resolvedNodeIds, node.id],
        teasers: [message, ...expedition.teasers].slice(0, 4),
        activity: activityForNode(node),
      },
      log: [message, ...state.run.log].slice(0, 12),
    },
  };
}

function withExpedition(state: GameState, expedition: Expedition): GameState {
  return { ...state, run: { ...state.run, activeExpedition: expedition } };
}

function journeyStepMs(expedition: Expedition): number {
  const total = Math.max(6000, expedition.endsAt - expedition.startedAt);
  return nodeStepDurationSeconds(total / 1000, expedition.nodes.length) * 1000;
}

function nodeStepDurationSeconds(durationSeconds: number, nodeCount: number): number {
  return Math.max(1, Math.round(durationSeconds / Math.max(1, nodeCount)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
