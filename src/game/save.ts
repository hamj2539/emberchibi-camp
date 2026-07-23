import { createInitialState, emptyBeaconProgress, emptyInventory, type GameState } from "./state.js";
import { getRecruitDefinition } from "../data/events.js";
import { runModifiers } from "../data/routeContent.js";
import { getRouteDecision } from "../data/routeContent.js";
import { crises } from "../data/crises.js";
import { runItems } from "../data/runItems.js";
import { guardianCombat, heraldCombat } from "../data/bossCombat.js";
import { buildRunMetrics } from "./metrics.js";
import { runVows, starterLoadouts } from "../data/alpha9Progression.js";

const SAVE_KEY = "emberchibiCamp.v1";
const BACKUP_KEY = "emberchibiCamp.v1.backup";

export function loadGame(): GameState {
  return parseGame(localStorage.getItem(SAVE_KEY)) ?? parseGame(localStorage.getItem(BACKUP_KEY)) ?? createInitialState();
}

export function saveGame(state: GameState): void {
  const serialized = JSON.stringify(state);
  const current = localStorage.getItem(SAVE_KEY);
  if (current && isVersionOneSave(current)) localStorage.setItem(BACKUP_KEY, current);
  localStorage.setItem(SAVE_KEY, serialized);
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

export function parseGame(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    return parsed.version === 1 ? migrateV1(parsed) : null;
  } catch {
    return null;
  }
}

function isVersionOneSave(raw: string): boolean {
  try {
    return (JSON.parse(raw) as Partial<GameState>).version === 1;
  } catch {
    return false;
  }
}

export function migrateV1(state: GameState): GameState {
  const defaults = createInitialState(state.savedAt);
  const validBeaconIds = new Set(Object.keys(defaults.run.beacons));
  const bossBattle = state.run.bossBattle && validBeaconIds.has(state.run.bossBattle.beaconId)
    ? state.run.bossBattle
    : null;
  const beaconRepair = state.run.beaconRepair && validBeaconIds.has(state.run.beaconRepair.beaconId)
    ? { ...state.run.beaconRepair, method: state.run.beaconRepair.method ?? "standard" as const }
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
      equippedRelics: state.legacy.equippedRelics ?? [],
      blueprints: state.legacy.blueprints ?? [],
      projects: state.legacy.projects ?? [],
      runsCompleted: state.legacy.runsCompleted ?? 0,
      bestScore: state.legacy.bestScore ?? 0,
      bestChestGrade: state.legacy.bestChestGrade ?? null,
      onboardingStep: state.legacy.onboardingStep ?? 0,
      onboardingComplete: state.legacy.onboardingComplete ?? false,
      runHistory: state.legacy.runHistory ?? [],
      collection: {
        ...defaults.legacy.collection,
        ...(state.legacy.collection ?? {}),
        relics: state.legacy.collection?.relics ?? state.legacy.relics ?? [],
        blueprints: state.legacy.collection?.blueprints ?? state.legacy.blueprints ?? [],
      },
      bonds: state.legacy.bonds ?? {},
      discoveredSecrets: state.legacy.discoveredSecrets ?? [],
      completedChallenges: state.legacy.completedChallenges ?? [],
      completedVows: state.legacy.completedVows ?? [],
      coreQualityVariants: state.legacy.coreQualityVariants ?? [],
      beaconRepairVariants: state.legacy.beaconRepairVariants ?? [],
      rememberedRunItem:
        state.legacy.rememberedRunItem && runItems.some((item) => item.id === state.legacy.rememberedRunItem)
          ? state.legacy.rememberedRunItem
          : null,
      titles: state.legacy.titles ?? [],
    },
    run: {
      ...state.run,
      screen: unsafeEncounterScreen ? "camp" : state.run.screen,
      starterClass: state.run.starterClass ?? state.run.survivors?.[0]?.classId ?? null,
      items: { ...emptyInventory, ...(state.run.items ?? {}) },
      routes: { ...defaults.run.routes, ...(state.run.routes ?? {}) },
      beacons: migrateBeacons(state, defaults),
      craftQueue: state.run.craftQueue ?? [],
      activeRouteDecision: migrateRouteDecision(state, defaults),
      recruitEvent: migrateRecruitEvent(state),
      bossBattle: bossBattle ? migrateBossBattle(bossBattle) : null,
      beaconRepair,
      campUpgrades: state.run.campUpgrades ?? [],
      runModifier: runModifiers.some((modifier) => modifier.id === state.run.runModifier)
        ? state.run.runModifier
        : defaults.run.runModifier,
      vows: (state.run.vows ?? []).filter((id) => runVows.some((vow) => vow.id === id)),
      starterLoadout: starterLoadouts.some((loadout) => loadout.id === state.run.starterLoadout)
        ? state.run.starterLoadout
        : defaults.run.starterLoadout,
      runItems: (state.run.runItems ?? []).filter((pickup) => runItems.some((item) => item.id === pickup.id)),
      runLoadout: migrateRunLoadout(state, defaults),
      triggeredRunEffects: state.run.triggeredRunEffects ?? [],
      eventFlags: state.run.eventFlags ?? [],
      eventScore: state.run.eventScore ?? 0,
      decisionsResolved: state.run.decisionsResolved ?? 0,
      campPressure: { ...defaults.run.campPressure, ...(state.run.campPressure ?? {}) },
      collapseMeter: state.run.collapseMeter ?? 0,
      activeCrisis:
        state.run.activeCrisis && crises.some((crisis) => crisis.id === state.run.activeCrisis?.id)
          ? state.run.activeCrisis
          : null,
      crisisCooldowns: state.run.crisisCooldowns ?? {},
      crisisFlags: state.run.crisisFlags ?? [],
      crisesResolved: state.run.crisesResolved ?? 0,
      crisesIgnored: state.run.crisesIgnored ?? 0,
      crisisScore: state.run.crisisScore ?? 0,
      crisisRouteRisk: state.run.crisisRouteRisk ?? 0,
      repairSpeedModifier: state.run.repairSpeedModifier ?? 1,
      secretsFound: state.run.secretsFound ?? [],
      challengeState: {
        ...defaults.run.challengeState,
        ...(state.run.challengeState ?? {}),
      },
      eventChains: {
        ...defaults.run.eventChains,
        ...(state.run.eventChains ?? {}),
      },
      storyEventsSeen: state.run.storyEventsSeen ?? [],
      gate: state.run.gate ? migrateGate(state.run.gate) : defaults.run.gate,
      endRun: state.run.endRun
        ? {
            ...state.run.endRun,
            outcome: state.run.endRun.outcome ?? "victory",
            endingId:
              state.run.endRun.endingId ??
              (state.run.endRun.outcome === "collapse" ? "collapse" : "victory"),
            metrics:
              state.run.endRun.metrics
                ? { ...state.run.endRun.metrics, vows: state.run.endRun.metrics.vows ?? state.run.vows ?? [] }
                :
              buildRunMetrics(
                state,
                state.run.endRun.chestGrade,
                state.run.endRun.outcome === "collapse" ? "Migrated collapse result." : null,
              ),
          }
        : null,
    },
  };
}

function migrateBossBattle(battle: NonNullable<GameState["run"]["bossBattle"]>): NonNullable<GameState["run"]["bossBattle"]> {
  const definition = guardianCombat[battle.beaconId];
  const phase = definition.phases.find((entry) => entry.id === battle.phaseId) ?? definition.phases[0];
  const pendingIntentId = definition.intents.some((intent) => intent.id === battle.pendingIntentId)
    ? battle.pendingIntentId
    : phase.intentIds[0];
  return {
    ...battle,
    usedSkills: battle.usedSkills ?? [],
    phaseId: phase.id,
    pendingIntentId,
    partyStatuses: battle.partyStatuses ?? {},
    bossStatuses: battle.bossStatuses ?? {},
    counterSuccesses: battle.counterSuccesses ?? 0,
    counterFailures: battle.counterFailures ?? 0,
    downedCount: battle.downedCount ?? 0,
    lastCounterFeedback: battle.lastCounterFeedback ?? "The Guardian reveals its next intent.",
  };
}

function migrateGate(gate: GameState["run"]["gate"]): GameState["run"]["gate"] {
  const phase = heraldCombat.phases.find((entry) => entry.id === gate.phaseId) ?? heraldCombat.phases[0];
  const pendingIntentId = heraldCombat.intents.some((intent) => intent.id === gate.pendingIntentId)
    ? gate.pendingIntentId
    : phase.intentIds[0];
  return {
    ...gate,
    usedSkills: gate.usedSkills ?? [],
    phaseId: phase.id,
    pendingIntentId,
    partyStatuses: gate.partyStatuses ?? {},
    bossStatuses: gate.bossStatuses ?? {},
    counterSuccesses: gate.counterSuccesses ?? 0,
    counterFailures: gate.counterFailures ?? 0,
    downedCount: gate.downedCount ?? 0,
    lastCounterFeedback: gate.lastCounterFeedback ?? "The Herald reveals its next intent.",
  };
}

function migrateRunLoadout(state: GameState, defaults: GameState): GameState["run"]["runLoadout"] {
  const owned = new Set((state.run.runItems ?? []).map((pickup) => pickup.id));
  const loadout = { ...defaults.run.runLoadout, ...(state.run.runLoadout ?? {}) };
  for (const slot of ["tool", "charm", "provision"] as const) {
    const id = loadout[slot];
    if (!id || !owned.has(id) || !runItems.some((item) => item.id === id && item.slot === slot)) loadout[slot] = null;
  }
  return loadout;
}

function migrateRouteDecision(
  state: GameState,
  defaults: GameState,
): GameState["run"]["activeRouteDecision"] {
  const decision = state.run.activeRouteDecision;
  if (!decision || !defaults.run.routes[decision.routeId]) return null;
  try {
    const definition = getRouteDecision(decision.id);
    return definition.kind === decision.kind ? decision : null;
  } catch {
    return null;
  }
}

function migrateRecruitEvent(state: GameState): GameState["run"]["recruitEvent"] {
  if (!state.run.recruitEvent) return null;
  const definition = getRecruitDefinition(state.run.recruitEvent.id);
  return { ...definition, ...state.run.recruitEvent };
}

function migrateBeacons(state: GameState, defaults: GameState): GameState["run"]["beacons"] {
  return Object.fromEntries(
    Object.entries(defaults.run.beacons).map(([id, fallback]) => [
      id,
      { ...fallback, ...(state.run.beacons?.[id as keyof typeof state.run.beacons] ?? {}) },
    ]),
  ) as GameState["run"]["beacons"];
}
