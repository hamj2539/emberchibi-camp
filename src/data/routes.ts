import type { BeaconId, ResourceKey, RouteId } from "../game/state";

export type RouteDefinition = {
  id: RouteId;
  beaconId?: BeaconId;
  kind: "resource" | "prep" | "boss";
  name: string;
  purpose: string;
  durationSeconds: number;
  danger: number;
  rewards: Partial<Record<ResourceKey, [number, number]>>;
  requirement: string;
};

export const routes: RouteDefinition[] = [
  {
    id: "mistwoodEdge",
    kind: "resource",
    name: "Mistwood Edge",
    purpose: "Early resource route with a chance to find Rook.",
    durationSeconds: 10,
    danger: 20,
    rewards: {
      wood: [4, 8],
      food: [3, 7],
      herb: [1, 4],
    },
    requirement: "1 survivor",
  },
  {
    id: "burntGrove",
    beaconId: "ember",
    kind: "prep",
    name: "Burnt Grove",
    purpose: "Ember prep route that reveals the Beacon site.",
    durationSeconds: 14,
    danger: 28,
    rewards: {
      wood: [3, 7],
      stone: [4, 7],
      herb: [0, 2],
    },
    requirement: "1 survivor",
  },
  {
    id: "emberBeaconSite",
    beaconId: "ember",
    kind: "boss",
    name: "Ember Beacon Site",
    purpose: "Boss route leading to the Cinder Stag.",
    durationSeconds: 18,
    danger: 40,
    rewards: {
      stone: [3, 6],
      relicShard: [1, 2],
    },
    requirement: "2 survivors recommended",
  },
  {
    id: "saltmarshRun",
    beaconId: "tidal",
    kind: "prep",
    name: "Saltmarsh Run",
    purpose: "Placeholder prep route that reveals the Tidal Beacon.",
    durationSeconds: 12,
    danger: 24,
    rewards: {
      food: [4, 8],
      herb: [1, 3],
      stone: [1, 3],
    },
    requirement: "1 survivor",
  },
  {
    id: "tidalBeaconSite",
    beaconId: "tidal",
    kind: "boss",
    name: "Tidal Beacon Site",
    purpose: "Placeholder boss route leading to the Brine Warden.",
    durationSeconds: 18,
    danger: 38,
    rewards: {
      stone: [2, 5],
      relicShard: [1, 2],
    },
    requirement: "2 survivors recommended",
  },
  {
    id: "windscarCliffs",
    beaconId: "gale",
    kind: "prep",
    name: "Windscar Cliffs",
    purpose: "Placeholder prep route that reveals the Gale Beacon.",
    durationSeconds: 13,
    danger: 30,
    rewards: {
      wood: [2, 5],
      ore: [1, 3],
      herb: [0, 2],
    },
    requirement: "1 survivor",
  },
  {
    id: "galeBeaconSite",
    beaconId: "gale",
    kind: "boss",
    name: "Gale Beacon Site",
    purpose: "Placeholder boss route leading to the Hollow Roc.",
    durationSeconds: 19,
    danger: 42,
    rewards: {
      ore: [1, 3],
      relicShard: [1, 2],
    },
    requirement: "2 survivors recommended",
  },
  {
    id: "rootwarrenTrail",
    beaconId: "root",
    kind: "prep",
    name: "Rootwarren Trail",
    purpose: "Placeholder prep route that reveals the Root Beacon.",
    durationSeconds: 15,
    danger: 32,
    rewards: {
      wood: [6, 10],
      food: [1, 4],
      herb: [1, 3],
    },
    requirement: "1 survivor",
  },
  {
    id: "rootBeaconSite",
    beaconId: "root",
    kind: "boss",
    name: "Root Beacon Site",
    purpose: "Placeholder boss route leading to the Briar Colossus.",
    durationSeconds: 20,
    danger: 44,
    rewards: {
      wood: [4, 8],
      relicShard: [1, 2],
    },
    requirement: "2 survivors recommended",
  },
  {
    id: "moonwellPath",
    beaconId: "lunar",
    kind: "prep",
    name: "Moonwell Path",
    purpose: "Placeholder prep route that reveals the Lunar Beacon.",
    durationSeconds: 16,
    danger: 34,
    rewards: {
      stone: [3, 6],
      ore: [1, 2],
      herb: [1, 3],
    },
    requirement: "1 survivor",
  },
  {
    id: "lunarBeaconSite",
    beaconId: "lunar",
    kind: "boss",
    name: "Lunar Beacon Site",
    purpose: "Placeholder boss route leading to the Night Herald.",
    durationSeconds: 22,
    danger: 48,
    rewards: {
      ore: [2, 4],
      relicShard: [2, 3],
    },
    requirement: "2 survivors recommended",
  },
];

export function getRoute(id: RouteId): RouteDefinition {
  const route = routes.find((item) => item.id === id);
  if (!route) throw new Error(`Unknown route: ${id}`);
  return route;
}
