import type { BossAction, BossBattle, CoreQuality, GameState, Survivor } from "./state";

export function createCinderStagBattle(state: GameState, partyIds: string[]): BossBattle {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  const spearBonus = state.run.items.stoneSpear > 0 ? 12 : 0;
  const cloakBonus = state.run.items.warmCloak > 0 ? -1 : 0;

  return {
    bossId: "cinderStag",
    bossHp: 120,
    bossMaxHp: 120,
    guardStacks: 0,
    burnPressure: Math.max(1, 3 + cloakBonus),
    partyIds: party.map((survivor) => survivor.id),
    turn: 1,
    status: "active",
    coreQuality: null,
    log: [
      `Cinder Stag lowers its ember antlers. Party power ${partyPower(party) + spearBonus}.`,
      state.run.items.warmCloak > 0 ? "Warm Cloak softens the heat around the party." : "The grove heat presses close.",
    ],
  };
}

export function resolveBossAction(state: GameState, action: BossAction): GameState {
  const battle = state.run.bossBattle;
  if (!battle || battle.status !== "active") return state;

  const party = state.run.survivors.filter((survivor) => battle.partyIds.includes(survivor.id));
  const items = { ...state.run.items };
  const log = [...battle.log];
  let bossHp = battle.bossHp;
  let guardStacks = battle.guardStacks;
  let burnPressure = battle.burnPressure;
  let survivors = state.run.survivors;

  if (action === "attack") {
    const damage = partyDamage(party, state) - guardStacks * 3;
    bossHp = Math.max(0, bossHp - Math.max(6, damage));
    guardStacks = Math.max(0, guardStacks - 1);
    log.unshift(`Party attacks for ${Math.max(6, damage)} damage.`);
  }

  if (action === "guard") {
    guardStacks += 2;
    log.unshift("The party braces behind ash-black shields.");
  }

  if (action === "useTorch") {
    if (items.torch <= 0) return state;
    items.torch -= 1;
    burnPressure = Math.max(1, burnPressure - 2);
    bossHp = Math.max(0, bossHp - 8);
    log.unshift("A Torch flares. Burn pressure drops and the Stag recoils.");
  }

  if (action === "useSalve") {
    if (items.herbSalve <= 0) return state;
    items.herbSalve -= 1;
    survivors = healParty(state.run.survivors, battle.partyIds);
    log.unshift("Herb Salve closes the worst burns.");
  }

  if (bossHp <= 0) {
    const quality = coreQualityForFailures(state.run.bossFailures);
    return {
      ...state,
      run: {
        ...state.run,
        items,
        survivors,
        screen: "boss",
        bossBattle: {
          ...battle,
          bossHp,
          guardStacks,
          burnPressure,
          status: "won",
          coreQuality: quality,
          log: [`Cinder Stag falls. ${labelCoreQuality(quality)} recovered.`, ...log].slice(0, 12),
        },
        log: [`Cinder Stag defeated. ${labelCoreQuality(quality)} recovered.`, ...state.run.log].slice(0, 12),
      },
    };
  }

  const bossResult = resolveBossTurn(survivors, battle.partyIds, guardStacks, burnPressure);
  survivors = bossResult.survivors;
  guardStacks = bossResult.guardStacks;
  burnPressure = bossResult.burnPressure;
  log.unshift(bossResult.message);

  if (partyDefeated(survivors, battle.partyIds)) {
    return {
      ...state,
      run: {
        ...state.run,
        items,
        survivors,
        bossFailures: state.run.bossFailures + 1,
        bossBattle: {
          ...battle,
          bossHp,
          guardStacks,
          burnPressure,
          turn: battle.turn + 1,
          status: "lost",
          log: ["The party collapses under ember pressure.", ...log].slice(0, 12),
        },
        log: ["Boss attempt failed. Cinder Heart quality will drop.", ...state.run.log].slice(0, 12),
      },
    };
  }

  return {
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
        turn: battle.turn + 1,
        log: log.slice(0, 12),
      },
    },
  };
}

export function labelCoreQuality(quality: CoreQuality): string {
  const labels: Record<CoreQuality, string> = {
    pristine: "Pristine Cinder Heart",
    stable: "Stable Cinder Heart",
    cracked: "Cracked Cinder Heart",
    faded: "Faded Cinder Heart",
  };
  return labels[quality];
}

function resolveBossTurn(
  survivors: Survivor[],
  partyIds: string[],
  guardStacks: number,
  burnPressure: number,
): { survivors: Survivor[]; guardStacks: number; burnPressure: number; message: string } {
  const target = survivors.find((survivor) => partyIds.includes(survivor.id) && survivor.currentHp > 1);
  if (!target) return { survivors, guardStacks, burnPressure, message: "Cinder Stag circles through the ash." };

  const damage = Math.max(2, 11 + burnPressure * 2 - guardStacks * 3 - Math.floor(target.stats.def / 2));
  const nextSurvivors = survivors.map((survivor) =>
    survivor.id === target.id
      ? {
          ...survivor,
          currentHp: Math.max(0, survivor.currentHp - damage),
          fatigue: Math.min(100, survivor.fatigue + burnPressure),
          injury: survivor.currentHp - damage <= 0 ? Math.min(100, survivor.injury + 18) : survivor.injury,
        }
      : survivor,
  );

  return {
    survivors: nextSurvivors,
    guardStacks: Math.max(0, guardStacks - 1),
    burnPressure: Math.min(7, burnPressure + 1),
    message: `Cinder Stag scorches ${target.name} for ${damage} damage.`,
  };
}

function partyDamage(party: Survivor[], state: GameState): number {
  const base = party.reduce((sum, survivor) => sum + survivor.stats.atk + Math.floor(survivor.stats.spd / 3), 0);
  const spearBonus = state.run.items.stoneSpear > 0 ? 8 : 0;
  return base + spearBonus + roll(0, 8);
}

function partyPower(party: Survivor[]): number {
  return party.reduce((sum, survivor) => sum + survivor.stats.atk + survivor.stats.def + survivor.stats.spd, 0);
}

function healParty(survivors: Survivor[], partyIds: string[]): Survivor[] {
  return survivors.map((survivor) =>
    partyIds.includes(survivor.id)
      ? {
          ...survivor,
          currentHp: Math.min(survivor.stats.hp, survivor.currentHp + 10),
          injury: Math.max(0, survivor.injury - 8),
        }
      : survivor,
  );
}

function partyDefeated(survivors: Survivor[], partyIds: string[]): boolean {
  return survivors.filter((survivor) => partyIds.includes(survivor.id)).every((survivor) => survivor.currentHp <= 0);
}

function coreQualityForFailures(failures: number): CoreQuality {
  if (failures === 0) return "pristine";
  if (failures === 1) return "stable";
  if (failures === 2) return "cracked";
  return "faded";
}

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
