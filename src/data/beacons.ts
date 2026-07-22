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
  bossHp: number;
  pressure: number;
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
    bossHp: 90,
    pressure: 2,
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
    bonus: "Tide Core quality contributes to the Legacy Chest.",
    placeholder: false,
    bossHp: 100,
    pressure: 2,
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
    bonus: "Gale Core quality contributes to the Legacy Chest.",
    placeholder: false,
    bossHp: 110,
    pressure: 3,
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
    bonus: "Root Core quality contributes to the Legacy Chest.",
    placeholder: false,
    bossHp: 120,
    pressure: 3,
  },
  {
    id: "lunar",
    name: "Lunar Beacon",
    prepRouteId: "moonwellPath",
    bossRouteId: "lunarBeaconSite",
    bossId: "lunarSentinel",
    bossName: "Lunar Sentinel",
    coreName: "Moon Core",
    repairName: "Moonwell prism repair",
    repairCost: { wood: 8, stone: 8 },
    bonus: "The final Beacon opens the Cinder Gate.",
    placeholder: false,
    bossHp: 130,
    pressure: 4,
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
