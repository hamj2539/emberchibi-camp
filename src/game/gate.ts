import { getIntent, heraldCombat, nextIntent, phaseForHp } from "../data/bossCombat.js";
import { calculateScore } from "./scoring.js";
import { appendRunHistory, buildRunMetrics } from "./metrics.js";
import type {
  CombatStatuses,
  CoreQuality,
  GameState,
  GateAction,
  GateProgress,
  StarterClassId,
  Survivor,
} from "./state.js";

export function openGate(state: GameState, partyIds: string[]): GameState {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  if (party.length < 2 || party.length > 3 || !allBeaconsLit(state) || state.run.gate.status === "cleared") return state;
  const stability = calculateGateStability(state);
  const heraldMaxHp = Math.max(120, 160 - stability * 3);
  const startingPressure = Math.max(2, 5 - Math.floor(stability / 4));
  const phase = heraldCombat.phases[0];
  const intent = getIntent(heraldCombat, phase.intentIds[0]);

  return {
    ...state,
    run: {
      ...state.run,
      screen: "gate",
      gate: {
        status: "active",
        heraldHp: heraldMaxHp,
        heraldMaxHp,
        guardStacks: 0,
        nightPressure: startingPressure,
        turn: 1,
        partyIds: party.map((survivor) => survivor.id),
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
          `Night Herald enters ${phase.name}.`,
          `Beacon Stability ${stability}/15 weakens the Herald to ${heraldMaxHp} HP and ${startingPressure} Night pressure.`,
        ],
      },
      survivors: state.run.survivors.map((survivor) =>
        partyIds.includes(survivor.id) ? { ...survivor, onExpedition: true } : survivor,
      ),
      log: ["The five Beacons open the Cinder Gate.", ...state.run.log].slice(0, 12),
    },
  };
}

export function resolveGateAction(state: GameState, action: GateAction): GameState {
  const gate = state.run.gate;
  if (gate.status !== "active") return state;
  const intent = getIntent(heraldCombat, gate.pendingIntentId);
  const party = state.run.survivors.filter((survivor) => gate.partyIds.includes(survivor.id));
  const items = { ...state.run.items };
  const log = [...gate.log];
  let heraldHp = gate.heraldHp;
  let guardStacks = gate.guardStacks;
  let nightPressure = gate.nightPressure;
  let usedSkills = gate.usedSkills ?? [];
  let survivors = state.run.survivors;
  let partyStatuses = { ...(gate.partyStatuses ?? {}) };
  let bossStatuses = { ...(gate.bossStatuses ?? {}) };
  let skillClass: StarterClassId | null = null;

  if (action === "attack") {
    const damage = Math.max(
      8,
      partyResolve(party) +
        (bossStatuses.exposed ?? 0) * 5 +
        (partyStatuses.inspired ?? 0) * 4 +
        (partyStatuses.focused ?? 0) * 3 -
        (partyStatuses.bound ?? 0) * 3,
    );
    heraldHp = Math.max(0, heraldHp - damage);
    log.unshift(`The party strikes the Herald for ${damage}.`);
  }

  if (action === "guard") {
    guardStacks += 3;
    partyStatuses.guarded = Math.max(partyStatuses.guarded ?? 0, 2);
    log.unshift("The party anchors itself in Beacon light.");
  }

  if (action === "skill") {
    const user = party.find((survivor) => survivor.currentHp > 0 && !usedSkills.includes(survivor.id));
    if (!user) return state;
    skillClass = user.classId;
    usedSkills = [...usedSkills, user.id];
    if (user.classId === "scout") {
      heraldHp = Math.max(0, heraldHp - 12);
      bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
      partyStatuses.focused = Math.max(partyStatuses.focused ?? 0, 2);
      log.unshift(`${user.name} uses Shadowstep: the cast is disrupted and the Herald is Exposed.`);
    } else if (user.classId === "hunter") {
      const damage = 20 + user.stats.atk;
      heraldHp = Math.max(0, heraldHp - damage);
      partyStatuses.inspired = Math.max(partyStatuses.inspired ?? 0, 2);
      log.unshift(`${user.name} lands a Marked Shot for ${damage} and inspires the party.`);
    } else if (user.classId === "herbalist") {
      survivors = healParty(survivors, gate.partyIds);
      partyStatuses = clearStatuses(partyStatuses, ["burn", "poison", "cursed"]);
      nightPressure = Math.max(1, nightPressure - 2);
      log.unshift(`${user.name} uses Cleansing Bloom against every harmful status.`);
    } else {
      heraldHp = Math.max(0, heraldHp - 10);
      guardStacks += 3;
      partyStatuses.guarded = Math.max(partyStatuses.guarded ?? 0, 3);
      bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
      log.unshift(`${user.name} anchors an Ember Brace: Guarded and Herald Exposed.`);
    }
  }

  if (action === "useTorch") {
    if (items.torch <= 0) return state;
    items.torch -= 1;
    heraldHp = Math.max(0, heraldHp - 10);
    nightPressure = Math.max(1, nightPressure - 2);
    partyStatuses = clearStatuses(partyStatuses, ["burn", "cursed"]);
    log.unshift("Torchlight tears the veil and clears Burn/Curse.");
  }

  if (action === "useSalve") {
    if (items.herbSalve <= 0) return state;
    items.herbSalve -= 1;
    survivors = healParty(survivors, gate.partyIds);
    partyStatuses = clearStatuses(partyStatuses, ["burn", "poison"]);
    log.unshift("Herb Salve heals the party and clears Burn/Poison.");
  }

  if (heraldHp <= 0) {
    const actionState = { ...state, run: { ...state.run, items, survivors } };
    const cleared = finishGate(actionState, {
      ...gate,
      heraldHp,
      guardStacks,
      nightPressure,
      usedSkills,
      partyStatuses,
      bossStatuses,
      status: "cleared",
      log,
    });
    return {
      ...cleared,
      run: {
        ...cleared.run,
        screen: "end",
        log: ["Night Herald defeated. The run is complete.", ...cleared.run.log].slice(0, 12),
      },
    };
  }

  const countered =
    Boolean(intent.counter.actions?.includes(action)) ||
    Boolean(skillClass && intent.counter.classes?.includes(skillClass));
  let counterSuccesses = gate.counterSuccesses ?? 0;
  let counterFailures = gate.counterFailures ?? 0;
  let feedback: string;

  if (countered) {
    counterSuccesses += 1;
    bossStatuses.exposed = Math.max(bossStatuses.exposed ?? 0, 2);
    nightPressure = Math.max(1, nightPressure - 1);
    feedback = `Counter worked: ${intent.name} was stopped by ${skillClass ? `${skillClass} skill` : action}.`;
    log.unshift(feedback);
  } else {
    counterFailures += 1;
    const result = resolveHeraldIntent(
      survivors,
      gate.partyIds,
      guardStacks,
      nightPressure,
      partyStatuses,
      intent,
    );
    survivors = result.survivors;
    guardStacks = result.guardStacks;
    nightPressure = result.pressure;
    partyStatuses = result.statuses;
    feedback = `Counter missed: ${intent.name} resolved. Needed ${intent.counter.label}.`;
    log.unshift(feedback, result.message);
  }

  const dot = applyStatusDamage(survivors, gate.partyIds, partyStatuses);
  survivors = dot.survivors;
  if (dot.damage > 0) log.unshift(`Statuses deal ${dot.damage} total damage.`);
  partyStatuses = decayStatuses(partyStatuses);
  bossStatuses = decayStatuses(bossStatuses);
  const downedCount = Math.max(gate.downedCount ?? 0, countDowned(survivors, gate.partyIds));

  if (partyDefeated(survivors, gate.partyIds)) {
    return finishGate(
      { ...state, run: { ...state.run, items, survivors, bossFailures: state.run.bossFailures + 1 } },
      {
        ...gate,
        heraldHp,
        guardStacks,
        nightPressure,
        usedSkills,
        partyStatuses,
        bossStatuses,
        counterSuccesses,
        counterFailures,
        downedCount,
        lastCounterFeedback: feedback,
        turn: gate.turn + 1,
        status: "lost",
        log: ["The Night Herald breaks the final campfire line.", ...log].slice(0, 14),
      },
    );
  }

  const phase = phaseForHp(heraldCombat, heraldHp, gate.heraldMaxHp);
  const next = nextIntent(heraldCombat, phase, gate.turn + 1);
  if (phase.id !== gate.phaseId) log.unshift(`Phase changed: ${phase.name}.`);
  log.unshift(`Intent: ${next.name}. ${next.telegraph}`);

  return {
    ...state,
    run: {
      ...state.run,
      items,
      survivors,
      gate: {
        ...gate,
        heraldHp,
        guardStacks,
        nightPressure,
        usedSkills,
        turn: gate.turn + 1,
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
}

export function finishGate(state: GameState, gate: GateProgress): GameState {
  const nextState = {
    ...state,
    run: {
      ...state.run,
      gate,
      survivors: state.run.survivors.map((survivor) =>
        gate.partyIds.includes(survivor.id)
          ? { ...survivor, onExpedition: false, fatigue: Math.min(100, survivor.fatigue + 14) }
          : survivor,
      ),
    },
  };
  if (gate.status !== "cleared") return nextState;
  const result = calculateScore(nextState);
  const metrics = buildRunMetrics(nextState, result.chestGrade, null);
  return {
    ...nextState,
    legacy: appendRunHistory(nextState, metrics),
    run: {
      ...nextState.run,
      runItems: [],
      runLoadout: { tool: null, charm: null, provision: null },
      endRun: { outcome: "victory", ...result, reward: null, claimed: false, metrics },
    },
  };
}

export function calculateGateStability(state: GameState): number {
  const qualityPoints: Record<CoreQuality, number> = { pristine: 3, stable: 2, cracked: 1, faded: 0 };
  return Object.values(state.run.beacons).reduce(
    (total, beacon) => total + (beacon.coreQuality ? qualityPoints[beacon.coreQuality] : 0),
    0,
  );
}

function allBeaconsLit(state: GameState): boolean {
  return Object.values(state.run.beacons).every((beacon) => beacon.repaired);
}

function resolveHeraldIntent(
  survivors: Survivor[],
  partyIds: string[],
  guardStacks: number,
  pressure: number,
  statuses: CombatStatuses,
  intent: ReturnType<typeof getIntent>,
) {
  const target = survivors.find((survivor) => partyIds.includes(survivor.id) && survivor.currentHp > 0);
  if (!target) return { survivors, guardStacks, pressure, statuses, message: `${intent.name} finds no target.` };
  const guarded = guardStacks * 3 + (statuses.guarded ?? 0) * 2;
  const damage = Math.max(
    3,
    intent.damage +
      pressure +
      (statuses.cursed ?? 0) * 2 +
      (statuses.exposed ?? 0) * 2 -
      guarded -
      Math.floor(target.stats.def / 2),
  );
  const nextSurvivors = survivors.map((survivor) =>
    survivor.id === target.id
      ? {
          ...survivor,
          currentHp: Math.max(0, survivor.currentHp - damage),
          fatigue: Math.min(100, survivor.fatigue + pressure),
          injury: survivor.currentHp - damage <= 0 ? Math.min(100, survivor.injury + 24) : survivor.injury,
        }
      : survivor,
  );
  const nextStatuses = { ...statuses };
  if (intent.status) nextStatuses[intent.status] = Math.min(5, (nextStatuses[intent.status] ?? 0) + (intent.statusStacks ?? 1));
  return {
    survivors: nextSurvivors,
    guardStacks: Math.max(0, guardStacks - 1),
    pressure: Math.min(10, pressure + intent.pressure),
    statuses: nextStatuses,
    message: `${intent.name} hits ${target.name} for ${damage}. ${intent.consequence}`,
  };
}

function healParty(survivors: Survivor[], partyIds: string[]): Survivor[] {
  return survivors.map((survivor) =>
    partyIds.includes(survivor.id)
      ? { ...survivor, currentHp: Math.min(survivor.stats.hp, survivor.currentHp + 12), injury: Math.max(0, survivor.injury - 10) }
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

function partyDefeated(survivors: Survivor[], partyIds: string[]): boolean {
  return survivors.filter((survivor) => partyIds.includes(survivor.id)).every((survivor) => survivor.currentHp <= 0);
}

function countDowned(survivors: Survivor[], partyIds: string[]): number {
  return survivors.filter((survivor) => partyIds.includes(survivor.id) && survivor.currentHp <= 0).length;
}

function partyResolve(party: Survivor[]): number {
  return party.reduce(
    (sum, survivor) => sum + survivor.stats.atk + Math.floor(survivor.stats.wis / 2) + Math.floor(survivor.stats.luck / 2),
    0,
  );
}
