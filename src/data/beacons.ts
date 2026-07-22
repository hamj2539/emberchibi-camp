import type { BeaconId, RouteId } from "../game/state.js";

export type BeaconDefinition = {
  id: BeaconId;
  name: string;
  prepRouteId: RouteId;
  bossRouteId: RouteId;
  bossId: string;
  bossName: string;
  coreName: string;
  repairName: string;
  repairCost: {
    wood: number;
    stone: number;
  };
  bonus: string;
  placeholder: boolean;
};

export const beacons: BeaconDefinition[] = [
  {
    id: "ember",
    name: "Ember Beacon",
    prepRouteId: "burntGrove",
    bossRouteId: "emberBeaconSite",
    bossId: "cinderStag",
    bossName: "Cinder Stag",
    coreName: "Cinder Heart",
    repairName: "Ember Beacon repair",
    repairCost: { wood: 8, stone: 6 },
    bonus: "Legacy Chest grade gains full score value.",
    placeholder: false,
  },
  {
    id: "tidal",
    name: "Tidal Beacon",
    prepRouteId: "saltmarshRun",
    bossRouteId: "tidalBeaconSite",
    bossId: "brineWarden",
    bossName: "Brine Warden",
    coreName: "Tide Core",
    repairName: "Tidal lens alignment",
    repairCost: { wood: 7, stone: 7 },
    bonus: "Future runs start with bonus food.",
    placeholder: true,
  },
  {
    id: "gale",
    name: "Gale Beacon",
    prepRouteId: "windscarCliffs",
    bossRouteId: "galeBeaconSite",
    bossId: "hollowRoc",
    bossName: "Hollow Roc",
    coreName: "Gale Core",
    repairName: "Storm vane reset",
    repairCost: { wood: 6, stone: 8 },
    bonus: "Future expeditions resolve faster.",
    placeholder: true,
  },
  {
    id: "root",
    name: "Root Beacon",
    prepRouteId: "rootwarrenTrail",
    bossRouteId: "rootBeaconSite",
    bossId: "briarColossus",
    bossName: "Briar Colossus",
    coreName: "Root Core",
    repairName: "Ancient root graft",
    repairCost: { wood: 10, stone: 5 },
    bonus: "Future camps gain passive wood.",
    placeholder: true,
  },
  {
    id: "lunar",
    name: "Lunar Beacon",
    prepRouteId: "moonwellPath",
    bossRouteId: "lunarBeaconSite",
    bossId: "nightHerald",
    bossName: "Night Herald",
    coreName: "Moon Core",
    repairName: "Moonwell prism repair",
    repairCost: { wood: 8, stone: 8 },
    bonus: "Unlocks the v0.3 Night Herald win-condition track.",
    placeholder: true,
  },
];

export function getBeacon(id: BeaconId): BeaconDefinition {
  const beacon = beacons.find((item) => item.id === id);
  if (!beacon) throw new Error(`Unknown beacon: ${id}`);
  return beacon;
}

export function getBeaconByBossRoute(routeId: RouteId): BeaconDefinition | undefined {
  return beacons.find((beacon) => beacon.bossRouteId === routeId);
}

export function getBeaconByPrepRoute(routeId: RouteId): BeaconDefinition | undefined {
  return beacons.find((beacon) => beacon.prepRouteId === routeId);
}
