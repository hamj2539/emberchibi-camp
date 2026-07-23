import { getRoute, type RouteDefinition } from "./routes.js";
import type {
  BiomeMoodId,
  ExpeditionNode,
  ExpeditionNodeChoice,
  ExpeditionNodeType,
  RouteId,
  StarterClassId,
} from "../game/state.js";

export type BiomeMood = {
  id: BiomeMoodId;
  name: string;
  effect: "fog" | "embers" | "rain" | "wind" | "roots" | "moonlight";
  palette: string;
};

export const biomeMoods: BiomeMood[] = [
  { id: "mist", name: "Mistwood Hush", effect: "fog", palette: "moss" },
  { id: "ember", name: "Cinder Weather", effect: "embers", palette: "cinder" },
  { id: "tide", name: "Saltmarsh Rain", effect: "rain", palette: "tide" },
  { id: "gale", name: "Windscar Rush", effect: "wind", palette: "sky" },
  { id: "root", name: "Rootwarren Pulse", effect: "roots", palette: "grove" },
  { id: "lunar", name: "Moonwell Gleam", effect: "moonlight", palette: "moon" },
];

const shortcutClasses: Record<BiomeMoodId, StarterClassId> = {
  mist: "scout",
  ember: "tinker",
  tide: "herbalist",
  gale: "scout",
  root: "herbalist",
  lunar: "tinker",
};

const shortcutRelics: Record<BiomeMoodId, string> = {
  mist: "Ashen Compass",
  ember: "Coalglass Charm",
  tide: "Stagbone Token",
  gale: "Ashen Compass",
  root: "Stagbone Token",
  lunar: "Coalglass Charm",
};

const resourceByMood: Record<BiomeMoodId, "wood" | "food" | "herb" | "stone" | "ore"> = {
  mist: "food",
  ember: "stone",
  tide: "herb",
  gale: "ore",
  root: "wood",
  lunar: "stone",
};

export function moodForRoute(routeId: RouteId): BiomeMood {
  const mood = moodIdForRoute(routeId);
  return biomeMoods.find((entry) => entry.id === mood) ?? biomeMoods[0];
}

export function generateExpeditionNodes(routeId: RouteId): ExpeditionNode[] {
  const route = getRoute(routeId);
  const mood = moodForRoute(routeId);
  const nodes: ExpeditionNode[] = [
    node(route, 0, "clue", "Trailhead Signs", `${mood.name} leaves fresh marks along the first rise.`, "The party reads the route.", false, []),
    node(route, 1, "resource", "Wayside Find", `A small cache of ${resourceByMood[mood.id]} waits off the path.`, "The party gathers what the route offers.", false, [
      autoChoice("safe", "Gather carefully", "Take a modest find without losing time.", "The party gathers a useful bundle.", { resources: { [resourceByMood[mood.id]]: 2 } }),
    ]),
    branchNode(route, mood.id),
    node(route, 3, hazardType(mood.id), hazardTitle(mood.id), hazardFlavor(mood.id), "The route tests the party's preparation.", false, [
      autoChoice("safe", "Brace and continue", "Prepared supplies soften the route hazard.", "The party keeps formation through the hazard.", { safety: 2, fatigue: 2 }),
    ]),
    node(route, 4, route.kind === "resource" ? "rest" : "shrine", route.kind === "resource" ? "Sheltered Hollow" : "Old Waystone", route.kind === "resource" ? "A dry hollow offers a breath before the return." : "A weathered marker hums near the destination.", "The party steadies for the final stretch.", false, [
      autoChoice("safe", "Take a short rest", "Recover focus before the final beat.", "The party catches its breath.", { fatigue: -3 }),
    ]),
  ];
  if (route.kind === "boss") {
    nodes.push(node(route, 5, "bossGate", "Guardian Threshold", "The path darkens as the Beacon answers something enormous.", "The Guardian waits beyond the final light.", false, []));
  }
  return nodes;
}

function branchNode(route: RouteDefinition, mood: BiomeMoodId): ExpeditionNode {
  const classId = shortcutClasses[mood];
  const relic = shortcutRelics[mood];
  const choices: ExpeditionNodeChoice[] = [
    {
      id: "safe",
      label: "Take the sheltered path",
      detail: "Reliable progress with extra route safety.",
      result: "The party follows cover and avoids the worst ground.",
      effect: { safety: 5, fatigue: 1 },
    },
    {
      id: "risky",
      label: "Cross the bright path",
      detail: "More rewards and score, but the route becomes less safe.",
      result: "The party reaches a rich cache under dangerous exposure.",
      effect: { safety: -4, rewardMultiplier: 1.3, score: 14, injury: 2 },
    },
    {
      id: "shortcut",
      label: "Read the hidden way",
      detail: `Requires a ${classId}, ${relic}, or a biome survivor lead.`,
      result: "A hidden trail cuts past the hazard and reveals a valuable clue.",
      requirementLabel: `${classId} · ${relic} · survivor lead`,
      requirement: { classId, relic, survivorId: shortcutSurvivor(mood) },
      effect: { safety: 7, rewardMultiplier: 1.15, score: 20, fatigue: -2 },
    },
  ];
  return node(route, 2, "shortcut", "The Path Divides", "One trail stays under cover. Another shines with dangerous promise.", "Choose how the expedition crosses the biome.", true, choices);
}

function node(
  route: RouteDefinition,
  index: number,
  type: ExpeditionNodeType,
  title: string,
  flavor: string,
  beat: string,
  major: boolean,
  choices: ExpeditionNodeChoice[],
): ExpeditionNode {
  return { id: `${route.id}-node-${index}`, type, title, flavor, beat, major, choices };
}

function autoChoice(
  id: "safe",
  label: string,
  detail: string,
  result: string,
  effect: ExpeditionNodeChoice["effect"],
): ExpeditionNodeChoice {
  return { id, label, detail, result, effect };
}

function moodIdForRoute(routeId: RouteId): BiomeMoodId {
  if (routeId === "mistwoodEdge") return "mist";
  if (routeId === "burntGrove" || routeId === "emberBeaconSite") return "ember";
  if (routeId === "saltmarshRun" || routeId === "tidalBeaconSite") return "tide";
  if (routeId === "windscarCliffs" || routeId === "galeBeaconSite") return "gale";
  if (routeId === "rootwarrenTrail" || routeId === "rootBeaconSite") return "root";
  return "lunar";
}

function shortcutSurvivor(mood: BiomeMoodId): string {
  return { mist: "survivor-rook", ember: "survivor-bram", tide: "survivor-mira", gale: "survivor-bram", root: "survivor-rook", lunar: "survivor-mira" }[mood];
}

function hazardType(mood: BiomeMoodId): ExpeditionNodeType {
  return mood === "mist" || mood === "lunar" ? "event" : mood === "root" ? "encounter" : "hazard";
}

function hazardTitle(mood: BiomeMoodId): string {
  return { mist: "Moving Fog", ember: "Ember Squall", tide: "Rising Water", gale: "Broken Updraft", root: "Restless Thicket", lunar: "Moonlit Echo" }[mood];
}

function hazardFlavor(mood: BiomeMoodId): string {
  return {
    mist: "Fog folds over the trail and turns every tree into a false landmark.",
    ember: "Hot sparks race sideways through the grove.",
    tide: "Rain and black water erase the edge of the causeway.",
    gale: "The cliff path shudders under a sudden crosswind.",
    root: "Living roots rise to test each careful step.",
    lunar: "A second party appears in the silver light, walking backward.",
  }[mood];
}
