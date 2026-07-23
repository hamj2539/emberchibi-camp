import { getBeacon, type BeaconDefinition } from "../data/beacons.js";
import { getIntent, guardianCombat, nextIntent, phaseForHp } from "../data/bossCombat.js";
import { getRunModifier } from "../data/routeContent.js";
import { guardianRunItemRewards } from "../data/runItems.js";
import type {
  BossAction,
  BossBattle,
  CombatStatuses,
  CoreQuality,
  GameState,
  StarterClassId,
  Survivor,
} from "./state.js";
import { acquireRunItem, hasRunItemEquipped, triggerRunEffect } from "./runItems.js";

export function createGuardianBattle(state: GameState, partyIds: string[], beacon: BeaconDefinition): BossBattle {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  const cloakBonus = state.run.items.warmCloak > 0 ? -1 : 0;
  const researchBonus = state.run.survivors.some(
    (survivor) => !partyIds.includes(survivor.id) && !survivor.onExpedition && survivor.job === "research",
  ) ? -1 : 0;
  const modifier = getRunModifier(state.run.runModifier);
  const modifierApplies = !modifier.routes || modifier.routes.includes(beacon.bossRouteId);
  const modifierCountered =
    party.some((survivor) => survivor.classId === modifier.counterClass) ||
    state.run.items.warmCloak > 0 ||
    hasRunItemEquipped(state, "ashBell");
  const definition = guardianCombat[beacon.id];
  const phase = definition.phases[0];
  const intent = getIntent(definition, phase.intentIds[0]);

  return {
    beaconId: beacon.id,
    bossId: beacon.bossId,
    bossName: beacon.bossName,
    coreName: beacon.coreName,
    bossHp: beacon.bossHp,
    bossMaxHp: beacon.bossHp,
    guardStacks: 0,
    burnPressure: Math.max(
      1,
      beacon.pressure + cloakBonus + researchBonus +
        (modifierApplies && !modifierCountered ? modifier.bossPressure : 0) -
        (hasRunItemEquipped(state, "ashBell") ? 1 : 0),
    ),
    partyIds: party.map((survivor) => survivor.id),
    turn: 1,
    status: "active",
    coreQuality: null,
    usedSkills: [],
    phaseId: phase.id,
    pendingIntentId: intent.id,
    partyStatuses: {},
    bossStatuses: {},
    counterSuccesses: 0,
    counterFailures: 0,
    downedCount: 0,
    lastCounterFeedback: `Respond with ${intent.counter.label}.`,
    log: [
      `Intent: ${intent.name}. ${intent.telegraph}`,
      `${beacon.bossName} enters ${phase.name}.`,
      `${beacon.bossName} takes shape before ${beacon.name}. Party power ${partyPower(party)}.`,
    ],
  };
}

export const createCinderStagBattle = createGuardianBattle;

export function resolveBossAction(state: GameState, action: BossAction): GameState {
  const battle = state.run.bossBattle;
  if (!battle || battle.status !== "active") return state;
  const beacon = getBeacon(battle.beaconId);
  const definition = guardianCombat[battle.beaconId];
  const intent = getIntent(definition, battle.pendingIntentId);
  const party = state.run.survivors.filter((survivor) => battle.partyIds.includes(survivor.id));
  const items = { ...state.run.items };
  const log = [...battle.log];
  let bossHp = battle.bossHp;
  let guardStacks = battle.guardStacks;
  let burnPressure = battle.burnPressure;
  let usedSkills = battle.usedSkills ?? [];
  let survivors = state.run.survivors;
  let partyStatuses = { ...(battle.partyStatuses ?? {}) };
  let bossStatuses = { ...(battle.bossStatuses ?? {}) };
  let skillClass: StarterClassId | null = null;

  if (action === "attack") {
    const damage = Math.max(
      6,
      partyDamage(party, state) + beacon.attackModifier +
        (bossStatuses.exposed ?? 0) * 5 +
        (partyStatuses.inspired ?? 0) * 4 +
        (partyStatuses.focused ?? 0) * 3 -
        (partyStatuses.bound ?? 0) * 3,
    );
    bossHp = Math.max(0, bossHp - damage);
    log.unshift(`Party attacks for ${damage} damage.`);
  }

  if (action === "guard") {
    guardStacks += beacon.guardGain;
    partyStatuses.guarded = Math.max(partyStatuses.guarded ?? 0, 2);
    log.unshift(`The party braces and gains ${beacon.guardGain} Guard.`);
  }

  if (action === "skill") {
    const user = party.find((survivor) => survivor.currentHp > 0 && !usedSkills.includes(survivor.id));
    if (!user) return state;
    skillClass = user.classId;
    usedSkills = [...usedSkills, user.id];
    if (user.classId === "scout") {
      bossHp = Math.max(0, bossHp - 10);
      bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
      partyStatuses.focused = Math.max(partyStatuses.focused ?? 0, 2);
      log.unshift(`${user.name} uses Shadowstep: intent disrupted and Guardian Exposed.`);
    } else if (user.classId === "hunter") {
      const damage = 18 + user.stats.atk;
      bossHp = Math.max(0, bossHp - damage);
      partyStatuses.inspired = Math.max(partyStatuses.inspired ?? 0, 2);
      log.unshift(`${user.name} uses Marked Shot for ${damage} damage and inspires the party.`);
    } else if (user.classId === "herbalist") {
      survivors = healParty(survivors, battle.partyIds);
      partyStatuses = clearStatuses(partyStatuses, ["burn", "poison", "cursed"]);
      burnPressure = Math.max(1, burnPressure - 2);
      log.unshift(`${user.name} uses Cleansing Bloom: party healed and harmful statuses cleansed.`);
    } else {
      bossHp = Math.max(0, bossHp - 8);
      guardStacks += 3;
      partyStatuses.guarded = Math.max(partyStatuses.guarded ?? 0, 3);
      bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
      log.unshift(`${user.name} deploys an Ember Brace: 8 damage, Guarded, and Guardian Exposed.`);
    }
  }

  if (action === "useTorch") {
    if (items.torch <= 0) return state;
    items.torch -= 1;
    const resinBonus =
      hasRunItemEquipped(state, "resinTorchBundle") &&
      !state.run.triggeredRunEffects.includes("resin-torch-guardian") ? 1 : 0;
    burnPressure = Math.max(1, burnPressure - beacon.torchRelief - resinBonus);
    bossHp = Math.max(0, bossHp - beacon.torchDamage - resinBonus * 6);
    partyStatuses = clearStatuses(partyStatuses, ["burn", "cursed"]);
    log.unshift(`Torchlight deals ${beacon.torchDamage + resinBonus * 6} and clears Burn/Curse.`);
  }

  if (action === "useSalve") {
    if (items.herbSalve <= 0) return state;
    items.herbSalve -= 1;
    survivors = healParty(survivors, battle.partyIds);
    partyStatuses = clearStatuses(partyStatuses, ["burn", "poison"]);
    log.unshift("Herb Salve heals the party and clears Burn/Poison.");
  }

  if (bossHp <= 0) {
    return finishGuardianVictory(state, {
      ...battle,
      bossHp,
      guardStacks,
      burnPressure,
      usedSkills,
      partyStatuses,
      bossStatuses,
    }, survivors, items, action);
  }

  const countered =
    Boolean(intent.counter.actions?.includes(action)) ||
    Boolean(skillClass && intent.counter.classes?.includes(skillClass));
  let counterSuccesses = battle.counterSuccesses ?? 0;
  let counterFailures = battle.counterFailures ?? 0;
  let feedback: string;

  if (countered) {
    counterSuccesses += 1;
    bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
    burnPressure = Math.max(1, burnPressure - 1);
    feedback = `Counter worked: ${intent.name} was stopped by ${skillClass ? `${skillClass} skill` : action}.`;
    log.unshift(feedback);
  } else {
    counterFailures += 1;
    const result = resolveIntent(
      survivors,
      battle.partyIds,
      guardStacks,
      burnPressure,
      partyStatuses,
      intent,
      items,
    );
    survivors = result.survivors;
    guardStacks = result.guardStacks;
    burnPressure = result.pressure;
    partyStatuses = result.statuses;
    feedback = `Counter missed: ${intent.name} resolved. Needed ${intent.counter.label}.`;
    log.unshift(feedback, result.message);
  }

  const dot = applyStatusDamage(survivors, battle.partyIds, partyStatuses);
  survivors = dot.survivors;
  if (dot.damage > 0) log.unshift(`Statuses deal ${dot.damage} total damage.`);
  partyStatuses = decayStatuses(partyStatuses);
  bossStatuses = decayStatuses(bossStatuses);
  const downedCount = Math.max(battle.downedCount ?? 0, countDowned(survivors, battle.partyIds));

  if (partyDefeated(survivors, battle.partyIds)) {
    return guardianDefeat(state, battle, survivors, items, {
      bossHp,
      guardStacks,
      burnPressure,
      usedSkills,
      partyStatuses,
      bossStatuses,
      counterSuccesses,
      counterFailures,
      downedCount,
      feedback,
      log,
    });
  }

  const phase = phaseForHp(definition, bossHp, battle.bossMaxHp);
  const next = nextIntent(definition, phase, battle.turn + 1);
  if (phase.id !== battle.phaseId) log.unshift(`Phase changed: ${phase.name}.`);
  log.unshift(`Intent: ${next.name}. ${next.telegraph}`);

  let nextState: GameState = {
    ...state,
    run: {
      ...state.run,
      items,
      survivors,
      bossBattle: {
        ...battle,
        bossHp,
        guardStacks,
        burnPressure,
        usedSkills,
        turn: battle.turn + 1,
        phaseId: phase.id,
        pendingIntentId: next.id,
        partyStatuses,
        bossStatuses,
        counterSuccesses,
        counterFailures,
        downedCount,
        lastCounterFeedback: feedback,
        log: log.slice(0, 14),
      },
    },
  };
  if (
    action === "useTorch" &&
    hasRunItemEquipped(state, "resinTorchBundle") &&
    !state.run.triggeredRunEffects.includes("resin-torch-guardian")
  ) {
    nextState = triggerRunEffect(nextState, "resin-torch-guardian", "Resin Torch Bundle empowered the first Guardian Torch.");
  }
  return nextState;
}

export function calculateCoreQuality(
  failedAttempts: number,
  counterSuccesses: number,
  turn: number,
  downedCount: number,
): CoreQuality {
  const qualities: CoreQuality[] = ["faded", "cracked", "stable", "pristine"];
  const baseRank = Math.max(0, 3 - failedAttempts);
  const performanceMarks =
    (counterSuccesses >= 2 ? 1 : 0) +
    (turn <= 7 ? 1 : 0) +
    (downedCount === 0 ? 1 : 0);
  const poorMarks =
    (counterSuccesses === 0 ? 1 : 0) +
    (turn > 10 ? 1 : 0) +
    (downedCount > 0 ? 1 : 0);
  const recovery = performanceMarks >= 2 && failedAttempts > 0 ? 1 : 0;
  const performancePenalty = poorMarks >= 2 ? 1 : 0;
  return qualities[Math.max(0, Math.min(3, baseRank + recovery - performancePenalty))];
}

export function labelCoreQuality(quality: CoreQuality, coreName = "Cinder Heart"): string {
  const labels: Record<CoreQuality, string> = {
    pristine: `Pristine ${coreName}`,
    stable: `Stable ${coreName}`,
    cracked: `Cracked ${coreName}`,
    faded: `Faded ${coreName}`,
  };
  return labels[quality];
}

function finishGuardianVictory(
  state: GameState,
  battle: BossBattle,
  survivors: Survivor[],
  items: GameState["run"]["items"],
  action: BossAction,
): GameState {
  const quality = calculateCoreQuality(
    state.run.beacons[battle.beaconId].failedAttempts ?? 0,
    battle.counterSuccesses ?? 0,
    battle.turn,
    battle.downedCount ?? 0,
  );
  let won: GameState = {
    ...state,
    run: {
      ...state.run,
      items,
      survivors,
      screen: "boss",
      bossBattle: {
        ...battle,
        status: "won",
        coreQuality: quality,
        log: [`${battle.bossName} falls. ${labelCoreQuality(quality, battle.coreName)} recovered.`, ...battle.log].slice(0, 14),
      },
      log: [`${battle.bossName} defeated. ${labelCoreQuality(quality, battle.coreName)} recovered.`, ...state.run.log].slice(0, 12),
    },
  };
  won = acquireRunItem(won, guardianRunItemRewards[battle.beaconId], `Guardian: ${battle.bossName}`);
  if (
    action === "useTorch" &&
    hasRunItemEquipped(state, "resinTorchBundle") &&
    !state.run.triggeredRunEffects.includes("resin-torch-guardian")
  ) {
    won = triggerRunEffect(won, "resin-torch-guardian", "Resin Torch Bundle empowered the first Guardian Torch.");
  }
  return won;
}

function resolveIntent(
  survivors: Survivor[],
  partyIds: string[],
  guardStacks: number,
  pressure: number,
  statuses: CombatStatuses,
  intent: ReturnType<typeof getIntent>,
  items: GameState["run"]["items"],
) {
  const target = survivors.find((survivor) => partyIds.includes(survivor.id) && survivor.currentHp > 0);
  if (!target) return { survivors, guardStacks, pressure, statuses, message: `${intent.name} finds no target.` };
  const guarded = guardStacks * 3 + (statuses.guarded ?? 0) * 2;
  const vulnerable = (statuses.cursed ?? 0) * 2 + (statuses.exposed ?? 0) * 2;
  const damage = Math.max(2, intent.damage + pressure + vulnerable - guarded - Math.floor(target.stats.def / 2));
  const nextSurvivors = survivors.map((survivor) =>
    survivor.id === target.id
      ? {
          ...survivor,
          currentHp: Math.max(0, survivor.currentHp - damage),
          fatigue: Math.min(100, survivor.fatigue + pressure),
          injury: survivor.currentHp - damage <= 0 ? Math.min(100, survivor.injury + 18) : survivor.injury,
        }
      : survivor,
  );
  const nextStatuses = { ...statuses };
  if (intent.status) nextStatuses[intent.status] = Math.min(5, (nextStatuses[intent.status] ?? 0) + (intent.statusStacks ?? 1));
  if (intent.drainItem && items[intent.drainItem] > 0) items[intent.drainItem] -= 1;
  return {
    survivors: nextSurvivors,
    guardStacks: Math.max(0, guardStacks - 1),
    pressure: Math.min(9, pressure + intent.pressure),
    statuses: nextStatuses,
    message: `${intent.name} hits ${target.name} for ${damage}. ${intent.consequence}`,
  };
}

function guardianDefeat(
  state: GameState,
  battle: BossBattle,
  survivors: Survivor[],
  items: GameState["run"]["items"],
  result: {
    bossHp: number;
    guardStacks: number;
    burnPressure: number;
    usedSkills: string[];
    partyStatuses: CombatStatuses;
    bossStatuses: CombatStatuses;
    counterSuccesses: number;
    counterFailures: number;
    downedCount: number;
    feedback: string;
    log: string[];
  },
): GameState {
  return {
    ...state,
    run: {
      ...state.run,
      items,
      survivors,
      bossFailures: state.run.bossFailures + 1,
      beacons: {
        ...state.run.beacons,
        [battle.beaconId]: {
          ...state.run.beacons[battle.beaconId],
          failedAttempts: (state.run.beacons[battle.beaconId].failedAttempts ?? 0) + 1,
        },
      },
      bossBattle: {
        ...battle,
        ...result,
        turn: battle.turn + 1,
        status: "lost",
        lastCounterFeedback: result.feedback,
        log: ["The party collapses under Guardian pressure.", ...result.log].slice(0, 14),
      },
      log: [`Boss attempt failed. ${battle.coreName} quality will drop.`, ...state.run.log].slice(0, 12),
    },
  };
}

function partyDamage(party: Survivor[], state: GameState): number {
  const base = party.reduce((sum, survivor) => sum + survivor.stats.atk + Math.floor(survivor.stats.spd / 3), 0);
  return base + (state.run.items.stoneSpear > 0 ? 8 : 0);
}

function partyPower(party: Survivor[]): number {
  return party.reduce((sum, survivor) => sum + survivor.stats.atk + survivor.stats.def + survivor.stats.spd, 0);
}

function healParty(survivors: Survivor[], partyIds: string[]): Survivor[] {
  return survivors.map((survivor) =>
    partyIds.includes(survivor.id)
      ? { ...survivor, currentHp: Math.min(survivor.stats.hp, survivor.currentHp + 10), injury: Math.max(0, survivor.injury - 8) }
      : survivor,
  );
}

function clearStatuses(statuses: CombatStatuses, ids: (keyof CombatStatuses)[]): CombatStatuses {
  const next = { ...statuses };
  for (const id of ids) delete next[id];
  return next;
}

function decayStatuses(statuses: CombatStatuses): CombatStatuses {
  return Object.fromEntries(
    Object.entries(statuses)
      .map(([id, stacks]) => [id, Math.max(0, (stacks ?? 0) - 1)])
      .filter(([, stacks]) => Number(stacks) > 0),
  ) as CombatStatuses;
}

function applyStatusDamage(survivors: Survivor[], partyIds: string[], statuses: CombatStatuses) {
  const perSurvivor = (statuses.burn ?? 0) * 2 + (statuses.poison ?? 0) * 2 + (statuses.cursed ?? 0);
  if (perSurvivor <= 0) return { survivors, damage: 0 };
  let damage = 0;
  return {
    survivors: survivors.map((survivor) => {
      if (!partyIds.includes(survivor.id) || survivor.currentHp <= 0) return survivor;
      damage += Math.min(survivor.currentHp, perSurvivor);
      return { ...survivor, currentHp: Math.max(0, survivor.currentHp - perSurvivor) };
    }),
    damage,
  };
}

function countDowned(survivors: Survivor[], partyIds: string[]): number {
  return survivors.filter((survivor) => partyIds.includes(survivor.id) && survivor.currentHp <= 0).length;
}

function partyDefeated(survivors: Survivor[], partyIds: string[]): boolean {
  return survivors.filter((survivor) => partyIds.includes(survivor.id)).every((survivor) => survivor.currentHp <= 0);
}
