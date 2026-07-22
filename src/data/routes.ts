import type { ResourceKey, RouteId } from "../game/state";

export type RouteDefinition = {
  id: RouteId;
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
];

export function getRoute(id: RouteId): RouteDefinition {
  const route = routes.find((item) => item.id === id);
  if (!route) throw new Error(`Unknown route: ${id}`);
  return route;
}
