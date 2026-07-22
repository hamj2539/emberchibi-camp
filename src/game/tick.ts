import { beacons, getBeaconByBossRoute, getBeaconByPrepRoute } from "../data/beacons.js";
import { getRoute } from "../data/routes.js";
import { createGuardianBattle } from "./combat.js";
import type { GameState, ItemId, ResourceKey, Resources } from "./state.js";

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
      return {
        ...survivor,
        currentHp: Math.min(survivor.stats.hp, survivor.currentHp + elapsedSeconds / 15),
        fatigue: Math.max(0, survivor.fatigue - elapsedSeconds / 18),
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
  const progressSeconds = elapsedSeconds * Math.max(1, craftPower);
  const items = { ...state.run.items };
  const log = [...state.run.log];
  const remaining = state.run.craftQueue
    .map((task) => ({ ...task, remainingSeconds: task.remainingSeconds - progressSeconds }))
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
  const nextProgress = Math.min(repair.requiredProgress, repair.progress + elapsedSeconds * repairPower * qualityBonus);

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

  const nextState: GameState = {
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

  return nextState;
}

export function resolveExpedition(state: GameState, now: number): GameState {
  const expedition = state.run.activeExpedition;
  if (!expedition || now < expedition.endsAt) return state;

  const route = getRoute(expedition.routeId);
  const party = state.run.survivors.filter((survivor) => expedition.survivorIds.includes(survivor.id));
  const campGuards = state.run.survivors.filter(
    (survivor) => !expedition.survivorIds.includes(survivor.id) && !survivor.onExpedition && survivor.job === "guard",
  ).length;
  const safety =
    party.reduce((sum, survivor) => sum + survivor.stats.surv + survivor.stats.spd + survivor.stats.luck, 0) +
    campGuards * 4 +
    (expedition.usedRation ? 6 : 0) +
    (expedition.usedTorch && route.danger >= 35 ? 5 : 0);
  const failed = safety + roll(1, 24) < route.danger;
  const resources: Resources = { ...state.run.resources };
  const routes = { ...state.run.routes };
  const progress = routes[route.id];
  const log = [...state.run.log];

  const survivors = state.run.survivors.map((survivor) => {
    if (!expedition.survivorIds.includes(survivor.id)) return survivor;
    return {
      ...survivor,
      onExpedition: false,
      fatigue: Math.min(100, survivor.fatigue + (failed ? 18 : 10) - (expedition.usedRation ? 4 : 0)),
      injury: Math.min(100, survivor.injury + (failed ? (expedition.usedTorch ? 6 : 12) : 0)),
      currentHp: Math.max(1, survivor.currentHp - (failed ? 5 : 1)),
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
      resources[key] += roll(range[0], range[1]);
    }
    routes[route.id] = { ...progress, completed: progress.completed + 1 };
    const prepBeacon = getBeaconByPrepRoute(route.id);
    if (prepBeacon) {
      routes[prepBeacon.bossRouteId] = { ...routes[prepBeacon.bossRouteId], discovered: true };
      log.unshift(`${route.name} revealed the ${prepBeacon.name} site.`);
    } else if (route.id === "mistwoodEdge" && !hasRook(state) && !state.run.recruitEvent) {
      log.unshift("The party found a wounded hunter near a burned trail.");
    } else {
      log.unshift(`${route.name} completed. Supplies were added to camp.`);
    }
  }

  return {
    ...state,
    run: {
      ...state.run,
      resources,
      routes,
      survivors,
      activeExpedition: null,
      recruitEvent:
        !failed && route.id === "mistwoodEdge" && !hasRook(state) && !state.run.recruitEvent
          ? { id: "rook", status: "available" }
          : state.run.recruitEvent,
      routeFailures: state.run.routeFailures + (failed ? 1 : 0),
      log: log.slice(0, 12),
    },
  };
}

function hasRook(state: GameState): boolean {
  return state.run.survivors.some((survivor) => survivor.id === "survivor-rook");
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
