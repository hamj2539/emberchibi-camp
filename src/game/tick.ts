import { beacons, getBeaconByBossRoute, getBeaconByPrepRoute } from "../data/beacons.js";
import { getRecruitDefinition, getRecruitForRoute } from "../data/events.js";
import { getRunModifier } from "../data/routeContent.js";
import { getRoute } from "../data/routes.js";
import { createGuardianBattle } from "./combat.js";
import { calculateExpeditionSafety } from "./expedition.js";
import { advanceExpeditionJourney } from "./expeditionJourney.js";
import { addBond, discoverEntry, discoverSecret } from "./journal.js";
import { rollRouteDecision } from "./routeDecisions.js";
import { hasRunItemEquipped, triggerRunEffect } from "./runItems.js";
import type { GameState, ItemId, RecruitEvent, ResourceKey, Resources, Survivor } from "./state.js";

export function resolveIdleProgress(state: GameState, elapsedSeconds: number): GameState {
  if (!state.run.started || elapsedSeconds <= 0) return state;

  const resources = { ...state.run.resources };
  const items = { ...state.run.items };
  const log = [...state.run.log];
  const previousDaySeconds = state.run.daySeconds;
  const nextDaySeconds = previousDaySeconds + elapsedSeconds;
  const survivors = state.run.survivors.map((survivor) => {
    if (survivor.onExpedition) return survivor;
    if (survivor.job === "forage") {
      resources.food += elapsedSeconds / 20;
      resources.herb += elapsedSeconds / 45;
    }
    if (survivor.job === "rest") {
      const infirmaryMultiplier = state.run.campUpgrades.includes("infirmary") ? 2 : 1;
      return {
        ...survivor,
        currentHp: Math.min(survivor.stats.hp, survivor.currentHp + (elapsedSeconds / 15) * infirmaryMultiplier),
        fatigue: Math.max(0, survivor.fatigue - elapsedSeconds / 18),
        injury: Math.max(0, survivor.injury - (state.run.campUpgrades.includes("infirmary") ? elapsedSeconds / 60 : 0)),
      };
    }
    return survivor;
  });

  const cooks = survivors.filter((survivor) => !survivor.onExpedition && survivor.job === "cook").length;
  const cookCycles = crossedIntervals(previousDaySeconds, nextDaySeconds, 30) * cooks;
  const rationsProduced = Math.min(cookCycles, Math.floor(resources.food / 2));
  if (rationsProduced > 0) {
    resources.food -= rationsProduced * 2;
    items.ration += rationsProduced;
    log.unshift(`Camp cooks prepared ${rationsProduced} Ration${rationsProduced === 1 ? "" : "s"}.`);
  }

  const withCraft = resolveCraftProgress({
    ...state,
    run: {
      ...state.run,
      daySeconds: nextDaySeconds,
      resources,
      items,
      survivors,
      log: log.slice(0, 12),
    },
  }, elapsedSeconds);

  return resolveRepairProgress(withCraft, elapsedSeconds);
}

function resolveCraftProgress(state: GameState, elapsedSeconds: number): GameState {
  if (state.run.craftQueue.length === 0) return state;

  const craftPower = state.run.survivors
    .filter((survivor) => !survivor.onExpedition && survivor.job === "craft")
    .reduce((sum, survivor) => sum + 1 + Math.floor(survivor.stats.craft / 4), 0);
  const progressSeconds =
    elapsedSeconds * Math.max(1, craftPower) * (state.run.campUpgrades.includes("workshop") ? 1.35 : 1);
  const items = { ...state.run.items };
  const log = [...state.run.log];
  const remaining = state.run.craftQueue
    .map((task, index) => ({ ...task, remainingSeconds: task.remainingSeconds - (index === 0 ? progressSeconds : 0) }))
    .filter((task) => {
      if (task.remainingSeconds > 0) return true;
      items[task.recipeId] += 1;
      log.unshift(`Craft completed: ${labelItem(task.recipeId)}.`);
      return false;
    });

  return {
    ...state,
    run: {
      ...state.run,
      items,
      craftQueue: remaining,
      log: log.slice(0, 12),
    },
  };
}

function resolveRepairProgress(state: GameState, elapsedSeconds: number): GameState {
  const repair = state.run.beaconRepair;
  if (!repair || repair.status !== "active") return state;

  const assigned = state.run.survivors.filter((survivor) => repair.assignedSurvivorIds.includes(survivor.id));
  const repairPower = assigned.reduce(
    (sum, survivor) => sum + 1.2 + survivor.stats.craft * 0.22 + survivor.stats.wis * 0.08,
    0,
  );
  const qualityBonus = coreRepairBonus(repair.coreQuality);
  const workshopBonus = state.run.campUpgrades.includes("workshop") ? 1.35 : 1;
  const gaugeBonus =
    hasRunItemEquipped(state, "cinderGauge") && !state.run.triggeredRunEffects.includes("cinder-gauge-repair")
      ? 2
      : 1;
  const nextProgress = Math.min(
    repair.requiredProgress,
    repair.progress + elapsedSeconds * repairPower * qualityBonus * workshopBonus * state.run.repairSpeedModifier * gaugeBonus,
  );

  if (nextProgress < repair.requiredProgress) {
    return {
      ...state,
      run: {
        ...state.run,
        beaconRepair: { ...repair, progress: nextProgress },
      },
    };
  }

  const beaconsProgress = {
    ...state.run.beacons,
    [repair.beaconId]: {
      ...state.run.beacons[repair.beaconId],
      bossDefeated: true,
      repaired: true,
      coreQuality: repair.coreQuality,
    },
  };
  const allBeaconsLit = beacons.every((beacon) => beaconsProgress[beacon.id].repaired);

  let nextState: GameState = {
    ...state,
    run: {
      ...state.run,
      screen: allBeaconsLit ? "gate" : "camp",
      beacons: beaconsProgress,
      beaconRepair: { ...repair, progress: repair.requiredProgress, status: "lit" },
      bossBattle: null,
      gate: allBeaconsLit ? { ...state.run.gate, status: "open", log: ["The Cinder Gate opens under five Beacon lights."] } : state.run.gate,
      survivors: state.run.survivors.map((survivor) =>
        repair.assignedSurvivorIds.includes(survivor.id)
          ? { ...survivor, onExpedition: false, fatigue: Math.min(100, survivor.fatigue + 8) }
          : survivor,
      ),
      log: [
        allBeaconsLit ? `${repair.beaconName} is lit. The Cinder Gate opens.` : `${repair.beaconName} is lit.`,
        ...state.run.log,
      ].slice(0, 12),
    },
  };
  nextState = discoverEntry(nextState, "beacons", repair.beaconId);

  return gaugeBonus > 1
    ? triggerRunEffect(nextState, "cinder-gauge-repair", `Cinder Gauge doubled the repair speed of ${repair.beaconName}.`)
    : nextState;
}

export function resolveExpedition(state: GameState, now: number): GameState {
  const journey = advanceExpeditionJourney(state, now);
  if (!journey.completed) return journey.state;
  state = journey.state;
  const expedition = state.run.activeExpedition;
  if (!expedition) return state;

  const route = getRoute(expedition.routeId);
  const party = state.run.survivors.filter((survivor) => expedition.survivorIds.includes(survivor.id));
  const safety = calculateExpeditionSafety(state, expedition.survivorIds, route, {
    useRation: Boolean(expedition.usedRation),
    useTorch: Boolean(expedition.usedTorch),
  }) + expedition.nodeSafety;
  let failed = safety + roll(1, 24) < route.danger;
  const compassRecovery =
    failed &&
    route.kind !== "boss" &&
    hasRunItemEquipped(state, "oldCompass") &&
    !state.run.triggeredRunEffects.includes("old-compass-reroll");
  if (compassRecovery) failed = false;
  const resources: Resources = { ...state.run.resources };
  const items = { ...state.run.items };
  const routes = { ...state.run.routes };
  const progress = routes[route.id];
  const log = [...state.run.log];

  let survivors = state.run.survivors.map((survivor) => {
    if (!expedition.survivorIds.includes(survivor.id)) return survivor;
    const hasHerbalist = party.some((member) => member.classId === "herbalist");
    const restlessInjury =
      failed &&
      state.run.runModifier === "restlessRoots" &&
      getRunModifier(state.run.runModifier).routes?.includes(route.id) &&
      !party.some((member) => member.classId === "herbalist")
        ? getRunModifier(state.run.runModifier).injuryRisk ?? 0
        : 0;
    const tonicPreventsInjury =
      failed &&
      hasRunItemEquipped(state, "bitterTonic") &&
      !state.run.triggeredRunEffects.includes("bitter-tonic-injury");
    return {
      ...survivor,
      onExpedition: false,
      fatigue: Math.min(100, survivor.fatigue + (failed ? 18 : 10) - (expedition.usedRation ? 4 : 0) - (hasHerbalist ? 3 : 0)),
      injury: Math.min(
        100,
        survivor.injury +
          (tonicPreventsInjury
            ? 0
            : failed
              ? (expedition.usedTorch ? 6 : 12) - (hasHerbalist ? 4 : 0) + restlessInjury
              : 0),
      ),
      currentHp: Math.max(1, survivor.currentHp - (failed ? 5 : 1)),
      ...(tonicPreventsInjury ? { fatigue: Math.min(100, survivor.fatigue + 23) } : {}),
    };
  });

  if (failed) {
    routes[route.id] = { ...progress, failed: progress.failed + 1 };
    log.unshift(`${route.name} failed. The party returned early with burns and lost packs.`);
  } else {
    const bossBeacon = getBeaconByBossRoute(route.id);
    if (bossBeacon) {
      if (state.run.beacons[bossBeacon.id]?.repaired) {
        routes[route.id] = { ...progress, completed: progress.completed + 1 };
        log.unshift(`${bossBeacon.name} is already lit. The party gathers spare supplies instead.`);
      } else {
        log.unshift(`${route.name} opens into a guardian arena.`);
        const battleSurvivors = survivors.map((survivor) =>
          expedition.survivorIds.includes(survivor.id) ? { ...survivor, onExpedition: false } : survivor,
        );
        return {
          ...state,
          run: {
            ...state.run,
            resources,
            routes,
            survivors: battleSurvivors,
            activeExpedition: null,
            screen: "boss",
            eventScore: state.run.eventScore + expedition.scoreBonus,
            decisionsResolved: state.run.decisionsResolved + 1,
            bossBattle: createGuardianBattle(
              {
                ...state,
                run: {
                  ...state.run,
                  resources,
                  routes,
                  survivors: battleSurvivors,
                },
              },
              expedition.survivorIds,
              bossBeacon,
            ),
            log: log.slice(0, 12),
          },
        };
      }
    }

    for (const [key, range] of Object.entries(route.rewards) as [ResourceKey, [number, number]][]) {
      const reward = roll(range[0], range[1]);
      const hunterBonus = key === "food" && party.some((survivor) => survivor.classId === "hunter") ? Math.ceil(reward * 0.25) : 0;
      const emberPickMultiplier =
        hasRunItemEquipped(state, "emberPick") &&
        route.beaconId === "ember" &&
        (key === "stone" || key === "ore")
          ? 2
          : 1;
      const ashBellMultiplier = hasRunItemEquipped(state, "ashBell") ? 0.85 : 1;
      resources[key] += Math.max(
        0,
        Math.round((reward + hunterBonus) * getRunModifier(state.run.runModifier).rewardMultiplier * emberPickMultiplier * ashBellMultiplier * expedition.rewardMultiplier),
      );
    }
    routes[route.id] = { ...progress, completed: progress.completed + 1 };
    const prepBeacon = getBeaconByPrepRoute(route.id);
    if (prepBeacon) {
      routes[prepBeacon.bossRouteId] = { ...routes[prepBeacon.bossRouteId], discovered: true };
      log.unshift(`${route.name} revealed the ${prepBeacon.name} site.`);
    } else if (availableRecruit(state, route.id, survivors, state.run.recruitEvent)) {
      log.unshift(`The party encountered ${availableRecruit(state, route.id, survivors, state.run.recruitEvent)?.name}.`);
    } else {
      log.unshift(`${route.name} completed. Supplies were added to camp.`);
    }
  }

  let recruitEvent = state.run.recruitEvent;
  if (!failed && recruitEvent?.status === "waiting") {
    const definition = getRecruitDefinition(recruitEvent.id);
    const isDeliveryRoute = definition?.delayedRouteId === route.id;
    const hasDeliveryItem = !definition?.delayedItem || items[definition.delayedItem] > 0;
    if (definition && isDeliveryRoute && hasDeliveryItem) {
      if (definition.delayedItem) items[definition.delayedItem] -= 1;
      if (!survivors.some((survivor) => survivor.id === definition.survivor.id)) {
        survivors = [...survivors, { ...definition.survivor }];
      }
      recruitEvent = { ...recruitEvent, status: "resolved", branchNote: undefined };
      log.unshift(`${definition.survivor.name}'s delayed request is complete. They join the camp.`);
    }
  }

  const newRecruit = !failed ? availableRecruit(state, route.id, survivors, recruitEvent) : undefined;
  if (newRecruit) recruitEvent = { ...newRecruit, status: "available" };

  const decisionState = {
    ...state,
    run: { ...state.run, resources, items, survivors, recruitEvent },
  };
  const activeRouteDecision =
    !failed && route.kind !== "boss"
      ? rollRouteDecision(decisionState, route.id, expedition.survivorIds)
      : null;
  if (activeRouteDecision) {
    log.unshift(`Route decision: ${activeRouteDecision.kind === "event" ? "an event" : "an encounter"} blocks the path.`);
  }

  let result: GameState = {
    ...state,
    run: {
      ...state.run,
      resources,
      items,
      routes,
      survivors,
      activeExpedition: null,
      activeRouteDecision,
      recruitEvent,
      routeFailures: state.run.routeFailures + (failed ? 1 : 0),
      eventScore: state.run.eventScore + expedition.scoreBonus,
      decisionsResolved: state.run.decisionsResolved + 1,
      campPressure: failed
        ? {
            ...state.run.campPressure,
            morale: Math.max(0, state.run.campPressure.morale - 8),
            shelter: Math.max(0, state.run.campPressure.shelter - 7),
            supplies: Math.max(0, state.run.campPressure.supplies - 6),
          }
          : {
            ...state.run.campPressure,
            morale: Math.min(100, state.run.campPressure.morale + 2),
            supplies: Math.min(100, state.run.campPressure.supplies + 3),
          },
      challengeState:
        !failed && route.kind !== "boss" && state.run.challengeState.openingRoutes < 2
          ? {
              ...state.run.challengeState,
              openingRoutes: state.run.challengeState.openingRoutes + 1,
              openingUsedNonScout:
                state.run.challengeState.openingUsedNonScout ||
                party.some((survivor) => survivor.classId !== "scout"),
            }
          : state.run.challengeState,
      log: log.slice(0, 12),
    },
  };
  for (const survivor of survivors) {
    if (!state.run.survivors.some((existing) => existing.id === survivor.id)) {
      result = discoverEntry(result, "survivors", survivor.id);
      result = addBond(result, [survivor.id], 2);
    }
  }
  if (!failed) result = addBond(result, expedition.survivorIds, 1);
  if (
    !failed &&
    route.id === "moonwellPath" &&
    state.legacy.equippedRelics.includes("Coalglass Charm")
  ) {
    result = discoverSecret(result, "coalglassEcho");
  }
  if (compassRecovery) result = triggerRunEffect(result, "old-compass-reroll", `Old Compass recovered the failed ${route.name} expedition.`);
  if (
    hasRunItemEquipped(state, "bitterTonic") &&
    failed &&
    !state.run.triggeredRunEffects.includes("bitter-tonic-injury")
  ) {
    result = triggerRunEffect(result, "bitter-tonic-injury", "Bitter Tonic prevented route injuries and added Fatigue.");
  }
  if (hasRunItemEquipped(state, "emberPick") && route.beaconId === "ember") {
    result = triggerRunEffect(result, `ember-pick-${route.id}-${progress.completed}`, "Ember Pick doubled Stone and Ore, adding 3 Fatigue.");
    result = {
      ...result,
      run: {
        ...result.run,
        survivors: result.run.survivors.map((survivor) =>
          expedition.survivorIds.includes(survivor.id)
            ? { ...survivor, fatigue: Math.min(100, survivor.fatigue + 3) }
            : survivor,
        ),
      },
    };
  }
  return result;
}

function availableRecruit(
  state: GameState,
  routeId: Parameters<typeof getRecruitForRoute>[0],
  survivors: Survivor[],
  current: RecruitEvent | null,
) {
  if (current && (current.status === "available" || current.status === "waiting")) return undefined;
  const definition = getRecruitForRoute(routeId);
  if (
    !definition ||
    survivors.some((survivor) => survivor.id === definition.survivor.id) ||
    state.run.eventFlags.includes(`recruit-${definition.id}-missed`)
  ) return undefined;
  return definition;
}

function labelItem(itemId: ItemId): string {
  const labels: Record<ItemId, string> = {
    torch: "Torch",
    ration: "Ration",
    stoneSpear: "Stone Spear",
    herbSalve: "Herb Salve",
    warmCloak: "Warm Cloak",
    repairKit: "Repair Kit",
  };
  return labels[itemId];
}

function coreRepairBonus(quality: NonNullable<GameState["run"]["beaconRepair"]>["coreQuality"]): number {
  const bonuses = {
    pristine: 1.18,
    stable: 1.08,
    cracked: 0.95,
    faded: 0.82,
  };
  return bonuses[quality];
}

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function crossedIntervals(previous: number, next: number, interval: number): number {
  return Math.max(0, Math.floor(next / interval) - Math.floor(previous / interval));
}
