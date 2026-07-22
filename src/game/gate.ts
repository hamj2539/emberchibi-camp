import { calculateScore } from "./scoring.js";
import type { GameState, GateAction, GateProgress, Survivor } from "./state.js";

export function openGate(state: GameState, partyIds: string[]): GameState {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  if (party.length < 2 || !allBeaconsLit(state) || state.run.gate.status === "cleared") return state;

  return {
    ...state,
    run: {
      ...state.run,
      screen: "gate",
      gate: {
        status: "active",
        heraldHp: 160,
        heraldMaxHp: 160,
        guardStacks: 0,
        nightPressure: 4,
        turn: 1,
        partyIds: party.map((survivor) => survivor.id),
        log: [`Night Herald steps through the Cinder Gate. Party resolve ${partyResolve(party)}.`],
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
  let survivors = state.run.survivors;

  if (action === "attack") {
    const damage = Math.max(8, partyResolve(party) + roll(0, 10) - guardStacks * 2);
    heraldHp = Math.max(0, heraldHp - damage);
    guardStacks = Math.max(0, guardStacks - 1);
    log.unshift(`The party strikes the Herald for ${damage}.`);
  }

  if (action === "guard") {
    guardStacks += 2;
    log.unshift("The party anchors itself in Beacon light.");
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
    const cleared = finishGate(state, { ...gate, heraldHp, guardStacks, nightPressure, status: "cleared", log });
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
    return finishGate(state, {
      ...gate,
      heraldHp,
      guardStacks,
      nightPressure,
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
      gate: { ...gate, heraldHp, guardStacks, nightPressure, turn: gate.turn + 1, log: log.slice(0, 12) },
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
  return { ...nextState, run: { ...nextState.run, endRun: { ...result, reward: null, claimed: false } } };
}

function allBeaconsLit(state: GameState): boolean {
  return Object.values(state.run.beacons).every((beacon) => beacon.repaired);
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
