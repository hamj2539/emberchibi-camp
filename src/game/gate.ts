import { calculateScore } from "./scoring.js";
import type { CoreQuality, GameState, GateAction, GateProgress, Survivor } from "./state.js";

export function openGate(state: GameState, partyIds: string[]): GameState {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  if (party.length < 2 || party.length > 3 || !allBeaconsLit(state) || state.run.gate.status === "cleared") return state;
  const stability = calculateGateStability(state);
  const heraldMaxHp = Math.max(115, 160 - stability * 3);
  const startingPressure = Math.max(2, 5 - Math.floor(stability / 4));

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
        log: [
          `Night Herald steps through the Cinder Gate. Party resolve ${partyResolve(party)}.`,
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

  const party = state.run.survivors.filter((survivor) => gate.partyIds.includes(survivor.id));
  const items = { ...state.run.items };
  const log = [...gate.log];
  let heraldHp = gate.heraldHp;
  let guardStacks = gate.guardStacks;
  let nightPressure = gate.nightPressure;
  let usedSkills = gate.usedSkills ?? [];
  let survivors = state.run.survivors;

  if (action === "attack") {
    const damage = Math.max(8, partyResolve(party) + roll(0, 10));
    heraldHp = Math.max(0, heraldHp - damage);
    log.unshift(`The party strikes the Herald for ${damage}.`);
  }

  if (action === "guard") {
    guardStacks += 2;
    log.unshift("The party anchors itself in Beacon light.");
  }

  if (action === "skill") {
    const user = party.find((survivor) => survivor.currentHp > 0 && !usedSkills.includes(survivor.id));
    if (!user) return state;
    usedSkills = [...usedSkills, user.id];
    if (user.classId === "scout") {
      heraldHp = Math.max(0, heraldHp - 12);
      guardStacks += 2;
      log.unshift(`${user.name} uses Shadowstep through the Gate.`);
    } else if (user.classId === "hunter") {
      const damage = 20 + user.stats.atk;
      heraldHp = Math.max(0, heraldHp - damage);
      log.unshift(`${user.name} lands a Marked Shot for ${damage}.`);
    } else if (user.classId === "herbalist") {
      survivors = healParty(survivors, gate.partyIds);
      nightPressure = Math.max(1, nightPressure - 2);
      log.unshift(`${user.name} uses Cleansing Bloom against the night.`);
    } else {
      heraldHp = Math.max(0, heraldHp - 10);
      guardStacks += 3;
      log.unshift(`${user.name} anchors an Ember Turret at the Gate.`);
    }
  }

  if (action === "useTorch") {
    if (items.torch <= 0) return state;
    items.torch -= 1;
    heraldHp = Math.max(0, heraldHp - 10);
    nightPressure = Math.max(1, nightPressure - 2);
    log.unshift("Torchlight tears a gap in the night veil.");
  }

  if (action === "useSalve") {
    if (items.herbSalve <= 0) return state;
    items.herbSalve -= 1;
    survivors = healParty(survivors, gate.partyIds);
    log.unshift("Herb Salve steadies the wounded party.");
  }

  if (heraldHp <= 0) {
    const actionState = { ...state, run: { ...state.run, items, survivors } };
    const cleared = finishGate(actionState, { ...gate, heraldHp, guardStacks, nightPressure, usedSkills, status: "cleared", log });
    return {
      ...cleared,
      run: {
        ...cleared.run,
        screen: "end",
        log: ["Night Herald defeated. The run is complete.", ...cleared.run.log].slice(0, 12),
      },
    };
  }

  const heraldTurn = resolveHeraldTurn(survivors, gate.partyIds, guardStacks, nightPressure);
  survivors = heraldTurn.survivors;
  guardStacks = heraldTurn.guardStacks;
  nightPressure = heraldTurn.nightPressure;
  log.unshift(heraldTurn.message);

  if (partyDefeated(survivors, gate.partyIds)) {
    return finishGate({ ...state, run: { ...state.run, items, survivors, bossFailures: state.run.bossFailures + 1 } }, {
      ...gate,
      heraldHp,
      guardStacks,
      nightPressure,
      usedSkills,
      turn: gate.turn + 1,
      status: "lost",
      log: ["The Night Herald breaks the final campfire line.", ...log].slice(0, 12),
    });
  }

  return {
    ...state,
    run: {
      ...state.run,
      items,
      survivors,
      gate: { ...gate, heraldHp, guardStacks, nightPressure, usedSkills, turn: gate.turn + 1, log: log.slice(0, 12) },
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
        gate.partyIds.includes(survivor.id) ? { ...survivor, onExpedition: false, fatigue: Math.min(100, survivor.fatigue + 14) } : survivor,
      ),
    },
  };

  if (gate.status !== "cleared") return nextState;
  const result = calculateScore(nextState);
  return {
    ...nextState,
    run: {
      ...nextState.run,
      runItems: [],
      runLoadout: { tool: null, charm: null, provision: null },
      endRun: { outcome: "victory", ...result, reward: null, claimed: false },
    },
  };
}

function allBeaconsLit(state: GameState): boolean {
  return Object.values(state.run.beacons).every((beacon) => beacon.repaired);
}

export function calculateGateStability(state: GameState): number {
  const qualityPoints: Record<CoreQuality, number> = { pristine: 3, stable: 2, cracked: 1, faded: 0 };
  return Object.values(state.run.beacons).reduce(
    (total, beacon) => total + (beacon.coreQuality ? qualityPoints[beacon.coreQuality] : 0),
    0,
  );
}

function resolveHeraldTurn(
  survivors: Survivor[],
  partyIds: string[],
  guardStacks: number,
  nightPressure: number,
): { survivors: Survivor[]; guardStacks: number; nightPressure: number; message: string } {
  const target = survivors.find((survivor) => partyIds.includes(survivor.id) && survivor.currentHp > 0);
  if (!target) return { survivors, guardStacks, nightPressure, message: "The Night Herald waits beyond the Gate." };
  const damage = Math.max(3, 11 + nightPressure * 2 - guardStacks * 3 - Math.floor(target.stats.def / 2));
  return {
    survivors: survivors.map((survivor) =>
      survivor.id === target.id
        ? {
            ...survivor,
            currentHp: Math.max(0, survivor.currentHp - damage),
            fatigue: Math.min(100, survivor.fatigue + nightPressure),
            injury: survivor.currentHp - damage <= 0 ? Math.min(100, survivor.injury + 24) : survivor.injury,
          }
        : survivor,
    ),
    guardStacks: Math.max(0, guardStacks - 1),
    nightPressure: Math.min(9, nightPressure + 1),
    message: `Night Herald marks ${target.name} for ${damage} damage.`,
  };
}

function healParty(survivors: Survivor[], partyIds: string[]): Survivor[] {
  return survivors.map((survivor) =>
    partyIds.includes(survivor.id)
      ? { ...survivor, currentHp: Math.min(survivor.stats.hp, survivor.currentHp + 12), injury: Math.max(0, survivor.injury - 10) }
      : survivor,
  );
}

function partyDefeated(survivors: Survivor[], partyIds: string[]): boolean {
  return survivors.filter((survivor) => partyIds.includes(survivor.id)).every((survivor) => survivor.currentHp <= 0);
}

function partyResolve(party: Survivor[]): number {
  return party.reduce((sum, survivor) => sum + survivor.stats.atk + Math.floor(survivor.stats.wis / 2) + Math.floor(survivor.stats.luck / 2), 0);
}

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
