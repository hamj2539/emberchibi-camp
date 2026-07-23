import { getBeacon, type BeaconDefinition } from "../data/beacons.js";
import { getRunModifier } from "../data/routeContent.js";
import type { BossAction, BossBattle, CoreQuality, GameState, Survivor } from "./state.js";

export function createGuardianBattle(state: GameState, partyIds: string[], beacon: BeaconDefinition): BossBattle {
  const party = state.run.survivors.filter((survivor) => partyIds.includes(survivor.id));
  const spearBonus = state.run.items.stoneSpear > 0 ? 12 : 0;
  const cloakBonus = state.run.items.warmCloak > 0 ? -1 : 0;
  const researchBonus = state.run.survivors.some(
    (survivor) => !partyIds.includes(survivor.id) && !survivor.onExpedition && survivor.job === "research",
  ) ? -1 : 0;

  return {
    beaconId: beacon.id,
    bossId: beacon.bossId,
    bossName: beacon.bossName,
    coreName: beacon.coreName,
    bossHp: beacon.bossHp,
    bossMaxHp: beacon.bossHp,
    guardStacks: 0,
    burnPressure: Math.max(1, beacon.pressure + cloakBonus + researchBonus + getRunModifier(state.run.runModifier).bossPressure),
    partyIds: party.map((survivor) => survivor.id),
    turn: 1,
    status: "active",
    coreQuality: null,
    usedSkills: [],
    log: [
      `${beacon.bossName} takes shape before ${beacon.name}. Party power ${partyPower(party) + spearBonus}.`,
      state.run.items.warmCloak > 0 ? "Warm Cloak softens the pressure around the party." : "Guardian pressure closes in.",
      researchBonus < 0 ? "Camp research reveals a weakness and lowers starting pressure." : "No research insight is ready.",
    ],
  };
}

export const createCinderStagBattle = createGuardianBattle;

export function resolveBossAction(state: GameState, action: BossAction): GameState {
  const battle = state.run.bossBattle;
  if (!battle || battle.status !== "active") return state;
  const beacon = getBattleBeacon(battle.beaconId);

  const party = state.run.survivors.filter((survivor) => battle.partyIds.includes(survivor.id));
  const items = { ...state.run.items };
  const log = [...battle.log];
  let bossHp = battle.bossHp;
  let guardStacks = battle.guardStacks;
  let burnPressure = battle.burnPressure;
  let usedSkills = battle.usedSkills ?? [];
  let survivors = state.run.survivors;

  if (action === "attack") {
    const damage = partyDamage(party, state) + beacon.attackModifier;
    bossHp = Math.max(0, bossHp - Math.max(6, damage));
    log.unshift(`Party attacks for ${Math.max(6, damage)} damage.`);
  }

  if (action === "guard") {
    guardStacks += beacon.guardGain;
    log.unshift(`The party braces and gains ${beacon.guardGain} Guard.`);
  }

  if (action === "skill") {
    const user = party.find((survivor) => survivor.currentHp > 0 && !usedSkills.includes(survivor.id));
    if (!user) return state;
    usedSkills = [...usedSkills, user.id];
    if (user.classId === "scout") {
      bossHp = Math.max(0, bossHp - 10);
      guardStacks += 2;
      log.unshift(`${user.name} uses Shadowstep: 10 damage and 2 Guard.`);
    } else if (user.classId === "hunter") {
      const damage = 18 + user.stats.atk;
      bossHp = Math.max(0, bossHp - damage);
      log.unshift(`${user.name} uses Marked Shot for ${damage} damage.`);
    } else if (user.classId === "herbalist") {
      survivors = healParty(survivors, battle.partyIds);
      burnPressure = Math.max(1, burnPressure - 2);
      log.unshift(`${user.name} uses Cleansing Bloom: party healed and pressure reduced.`);
    } else {
      bossHp = Math.max(0, bossHp - 8);
      guardStacks += 3;
      log.unshift(`${user.name} deploys an Ember Turret: 8 damage and 3 Guard.`);
    }
  }

  if (action === "useTorch") {
    if (items.torch <= 0) return state;
    items.torch -= 1;
    burnPressure = Math.max(1, burnPressure - beacon.torchRelief);
    bossHp = Math.max(0, bossHp - beacon.torchDamage);
    log.unshift(`A Torch flares for ${beacon.torchDamage} damage and cuts pressure by ${beacon.torchRelief}.`);
  }

  if (action === "useSalve") {
    if (items.herbSalve <= 0) return state;
    items.herbSalve -= 1;
    survivors = healParty(state.run.survivors, battle.partyIds);
    log.unshift("Herb Salve closes the worst burns.");
  }

  if (bossHp <= 0) {
    const quality = coreQualityForFailures(state.run.beacons[battle.beaconId].failedAttempts ?? 0);
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
          usedSkills,
          log: [`${battle.bossName} falls. ${labelCoreQuality(quality, battle.coreName)} recovered.`, ...log].slice(0, 12),
        },
        log: [`${battle.bossName} defeated. ${labelCoreQuality(quality, battle.coreName)} recovered.`, ...state.run.log].slice(
          0,
          12,
        ),
      },
    };
  }

  const bossResult = resolveBossTurn(survivors, battle.partyIds, guardStacks, burnPressure, beacon.incomingBase);
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
        beacons: {
          ...state.run.beacons,
          [battle.beaconId]: {
            ...state.run.beacons[battle.beaconId],
            failedAttempts: (state.run.beacons[battle.beaconId].failedAttempts ?? 0) + 1,
          },
        },
        bossBattle: {
          ...battle,
          bossHp,
          guardStacks,
          burnPressure,
          turn: battle.turn + 1,
          status: "lost",
          usedSkills,
          log: ["The party collapses under ember pressure.", ...log].slice(0, 12),
        },
        log: [`Boss attempt failed. ${battle.coreName} quality will drop.`, ...state.run.log].slice(0, 12),
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
        usedSkills,
        turn: battle.turn + 1,
        log: log.slice(0, 12),
      },
    },
  };
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

function resolveBossTurn(
  survivors: Survivor[],
  partyIds: string[],
  guardStacks: number,
  burnPressure: number,
  incomingBase: number,
): { survivors: Survivor[]; guardStacks: number; burnPressure: number; message: string } {
  const target = survivors.find((survivor) => partyIds.includes(survivor.id) && survivor.currentHp > 0);
  if (!target) return { survivors, guardStacks, burnPressure, message: "The guardian circles through the ash." };

  const damage = Math.max(2, incomingBase + burnPressure * 2 - guardStacks * 3 - Math.floor(target.stats.def / 2));
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
    message: `The guardian scorches ${target.name} for ${damage} damage.`,
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

function getBattleBeacon(beaconId: BossBattle["beaconId"]): BeaconDefinition {
  return getBeacon(beaconId);
}
