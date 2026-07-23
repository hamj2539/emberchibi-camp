import type {
  ItemId,
  NormalEncounterId,
  ResourceKey,
  RouteEventId,
  RouteId,
  RunModifierId,
  RunItemId,
  StarterClassId,
  StatKey,
} from "../game/state.js";

export type ChoiceRequirement = {
  resources?: Partial<Record<ResourceKey, number>>;
  item?: ItemId;
  minStat?: { stat: StatKey; value: number };
  classId?: StarterClassId;
  relic?: string;
};

export type ChoiceEffect = {
  resources?: Partial<Record<ResourceKey, number>>;
  items?: Partial<Record<ItemId, number>>;
  fatigue?: number;
  injury?: number;
  hp?: number;
  routeProgress?: number;
  score?: number;
  flag?: string;
  runItem?: RunItemId;
  bond?: number;
};

export type RouteChoice = {
  id: string;
  label: string;
  detail: string;
  requirement?: ChoiceRequirement;
  effect: ChoiceEffect;
  result: string;
  chainOutcome?: string;
};

export type RouteDecisionDefinition = {
  id: RouteEventId | NormalEncounterId;
  kind: "event" | "encounter";
  name: string;
  description: string;
  routes: RouteId[];
  choices: RouteChoice[];
  chainId?: import("../game/state.js").EventChainId;
  chainStep?: number;
  storyFor?: string;
  minBond?: number;
  storyId?: string;
};

export type RunModifierDefinition = {
  id: RunModifierId;
  name: string;
  description: string;
  safety: number;
  rewardMultiplier: number;
  eventChance: number;
  encounterChance: number;
  bossPressure: number;
  routes?: RouteId[];
  durationMultiplier?: number;
  injuryRisk?: number;
  counterClass?: StarterClassId;
  forecast: string;
};

export const runModifiers: RunModifierDefinition[] = [
  {
    id: "heavyFog",
    name: "Heavy Fog",
    description: "Routes lose 4 Safety, but hidden events are more common.",
    safety: -4,
    rewardMultiplier: 1,
    eventChance: 15,
    encounterChance: 0,
    bossPressure: 0,
    routes: ["mistwoodEdge", "saltmarshRun", "moonwellPath"],
    durationMultiplier: 1.25,
    counterClass: "scout",
    forecast: "Affected routes take 25% longer; a Scout cancels the delay.",
  },
  {
    id: "emberWinds",
    name: "Ember Winds",
    description: "Hot winds leave routes unchanged, but Guardians begin with +1 pressure.",
    safety: 0,
    rewardMultiplier: 1,
    eventChance: 0,
    encounterChance: 0,
    bossPressure: 1,
    routes: ["burntGrove", "emberBeaconSite"],
    counterClass: "tinker",
    forecast: "Ember Guardian pressure rises; Warm Cloak, Torch, or Ash Bell counters it.",
  },
  {
    id: "hungryNight",
    name: "Hungry Night",
    description: "Normal encounters are much more common while the campfire burns low.",
    safety: 0,
    rewardMultiplier: 1,
    eventChance: 0,
    encounterChance: 20,
    bossPressure: 0,
    routes: ["mistwoodEdge", "saltmarshRun", "rootwarrenTrail"],
    counterClass: "hunter",
    forecast: "Low Food drains Supplies faster; a Hunter or Salted Rations counters it.",
  },
  {
    id: "oldTrailSigns",
    name: "Old Trail Signs",
    description: "Old markings add 3 Safety and reveal more route events.",
    safety: 3,
    rewardMultiplier: 1,
    eventChance: 20,
    encounterChance: 0,
    bossPressure: 0,
    forecast: "Old markings improve Safety and reveal route events.",
  },
  {
    id: "restlessRoots",
    name: "Restless Roots",
    description: "Root routes inflict more Injury when they fail unless an Herbalist is present.",
    safety: -1,
    rewardMultiplier: 1.1,
    eventChance: 5,
    encounterChance: 5,
    bossPressure: 0,
    routes: ["rootwarrenTrail", "rootBeaconSite"],
    injuryRisk: 8,
    counterClass: "herbalist",
    forecast: "Failed Root routes add 8 Injury; an Herbalist cancels it.",
  },
];

const baseRouteEvents: RouteDecisionDefinition[] = [
  {
    id: "oldTrailMarkers",
    kind: "event",
    name: "Old Trail Markers",
    description: "Carved arrows point toward a cache and a safer ridge.",
    routes: ["mistwoodEdge"],
    choices: [
      { id: "follow", label: "Follow the signs", detail: "Requires SURV 7.", requirement: { minStat: { stat: "surv", value: 7 } }, effect: { resources: { food: 3, wood: 2 }, score: 8, flag: "followed-old-signs", runItem: "oldCompass" }, result: "The markings lead to a dry cache and an Old Compass." },
      { id: "scout", label: "Read the shortcuts", detail: "Scout only; advances the route record.", requirement: { classId: "scout" }, effect: { routeProgress: 1, score: 10, flag: "mapped-mistwood" }, result: "The Scout maps paths hidden beneath the moss." },
      { id: "ignore", label: "Keep moving", detail: "Avoid the detour.", effect: { fatigue: -2 }, result: "The party saves its strength and stays on course." },
    ],
  },
  {
    id: "ashOrchard",
    kind: "event",
    name: "Ash Orchard",
    description: "Black fruit glows between heat-split branches.",
    routes: ["burntGrove"],
    choices: [
      { id: "harvest", label: "Harvest carefully", detail: "Requires WIS 6.", requirement: { minStat: { stat: "wis", value: 6 } }, effect: { resources: { herb: 4, food: 2 }, score: 10, flag: "ash-fruit", runItem: "bitterTonic" }, result: "The fruit cools into medicine and a Bitter Tonic." },
      { id: "burn", label: "Burn a clear path", detail: "Consumes 1 Torch.", requirement: { item: "torch" }, effect: { items: { torch: -1 }, resources: { wood: 5 }, fatigue: -3, flag: "cleared-ash-path" }, result: "Torchfire exposes seasoned wood beneath the ash." },
      { id: "risk", label: "Grab what you can", detail: "Fast, but causes burns.", effect: { resources: { food: 3 }, injury: 5 }, result: "The party escapes with fruit and fresh burns." },
    ],
  },
  {
    id: "drownedShrine",
    kind: "event",
    name: "Drowned Shrine",
    description: "A tide altar hums below dark water.",
    routes: ["saltmarshRun", "tidalBeaconSite"],
    choices: [
      { id: "decode", label: "Decode the tide runes", detail: "Requires WIS 7.", requirement: { minStat: { stat: "wis", value: 7 } }, effect: { resources: { relicShard: 2 }, score: 12, flag: "tide-runes", runItem: "hollowCoin" }, result: "The runes release relic shards and a Hollow Coin." },
      { id: "offer", label: "Leave an offering", detail: "Costs 2 Food.", requirement: { resources: { food: 2 } }, effect: { resources: { food: -2, herb: 4 }, fatigue: -4 }, result: "The returning tide leaves medicinal reeds." },
      { id: "wade", label: "Search the lower steps", detail: "No cost, high strain.", effect: { resources: { stone: 4 }, fatigue: 7, injury: 3 }, result: "The party recovers carved stone from the flooded steps." },
    ],
  },
  {
    id: "stormBridge",
    kind: "event",
    name: "Broken Storm Bridge",
    description: "A shattered span swings above the Windscar gorge.",
    routes: ["windscarCliffs"],
    choices: [
      { id: "leap", label: "Leap the span", detail: "Requires SPD 7.", requirement: { minStat: { stat: "spd", value: 7 } }, effect: { routeProgress: 1, score: 10, fatigue: 2, flag: "crossed-storm-bridge", runItem: "cinderGauge" }, result: "The fastest survivor secures a line and recovers a Cinder Gauge." },
      { id: "brace", label: "Build a brace", detail: "Costs 3 Wood; Tinker can improvise.", requirement: { resources: { wood: 3 } }, effect: { resources: { wood: -3, ore: 3 }, flag: "braced-storm-bridge" }, result: "A stable crossing reveals ore in the broken supports." },
      { id: "turn", label: "Take the long ledge", detail: "Safe but tiring.", effect: { fatigue: 6 }, result: "The party reaches the far side after a long climb." },
    ],
  },
  {
    id: "rootWhispers",
    kind: "event",
    name: "Root Whispers",
    description: "Living roots repeat the names of lost travelers.",
    routes: ["rootwarrenTrail", "rootBeaconSite"],
    choices: [
      { id: "listen", label: "Listen to the roots", detail: "Herbalist only.", requirement: { classId: "herbalist" }, effect: { resources: { herb: 5 }, injury: -4, score: 10, flag: "root-memory", runItem: "boneNeedle" }, result: "The roots share medicine and a Bone Needle." },
      { id: "cut", label: "Cut through", detail: "Requires ATK 7.", requirement: { minStat: { stat: "atk", value: 7 } }, effect: { resources: { wood: 6 }, injury: 2 }, result: "The party cuts a direct path through the warren." },
      { id: "feed", label: "Feed the roots", detail: "Costs 2 Food.", requirement: { resources: { food: 2 } }, effect: { resources: { food: -2 }, fatigue: -6, flag: "fed-the-roots" }, result: "The roots lift aside and leave a sheltered rest hollow." },
    ],
  },
  {
    id: "moonMirror",
    kind: "event",
    name: "Moon Mirror",
    description: "A silver pool reflects paths that do not exist yet.",
    routes: ["moonwellPath", "lunarBeaconSite"],
    choices: [
      { id: "study", label: "Study the reflection", detail: "Requires WIS 8.", requirement: { minStat: { stat: "wis", value: 8 } }, effect: { resources: { relicShard: 2 }, score: 14, flag: "moon-vision", runItem: "moonThread" }, result: "A future route settles into memory around a Moon Thread." },
      { id: "charm", label: "Lower a relic", detail: "Requires an equipped Coalglass Charm.", requirement: { relic: "Coalglass Charm" }, effect: { resources: { ore: 5 }, score: 8 }, result: "The charm draws moon-ore from the reflection." },
      { id: "touch", label: "Touch the water", detail: "Recover fatigue but risk injury.", effect: { fatigue: -8, injury: 3 }, result: "Cold moonwater clears the mind and numbs the hands." },
    ],
  },
  {
    id: "cinderCache",
    kind: "event",
    name: "Cinder Cache",
    description: "A sealed ranger box rests beneath warm stones.",
    routes: ["emberBeaconSite", "burntGrove"],
    choices: [
      { id: "tool", label: "Open with tools", detail: "Tinker only.", requirement: { classId: "tinker" }, effect: { items: { repairKit: 1 }, score: 8, flag: "opened-cinder-cache", runItem: "emberPick" }, result: "The lock yields around a repair kit and Ember Pick." },
      { id: "pry", label: "Pry it open", detail: "Requires ATK 7.", requirement: { minStat: { stat: "atk", value: 7 } }, effect: { resources: { ore: 3, stone: 2 }, injury: 2 }, result: "The lid breaks, but the raw materials survive." },
      { id: "mark", label: "Mark it for later", detail: "Leave a useful camp clue.", effect: { score: 5, flag: "cinder-cache-clue" }, result: "The cache location is added to the camp map." },
    ],
  },
  {
    id: "galeNest",
    kind: "event",
    name: "Abandoned Gale Nest",
    description: "Metal and bright cloth are woven into a giant empty nest.",
    routes: ["galeBeaconSite", "windscarCliffs"],
    choices: [
      { id: "climb", label: "Climb into the nest", detail: "Requires SPD 6.", requirement: { minStat: { stat: "spd", value: 6 } }, effect: { resources: { ore: 4 }, fatigue: 4, score: 8, runItem: "wayfinderKnot" }, result: "The climber recovers ore and a Wayfinder Knot." },
      { id: "lure", label: "Leave a Ration", detail: "Consumes 1 Ration and reveals a safe approach.", requirement: { item: "ration" }, effect: { items: { ration: -1 }, routeProgress: 1, flag: "gale-safe-approach" }, result: "Scavenger birds expose a sheltered route to the altar." },
      { id: "strip", label: "Strip the lower weave", detail: "Reliable materials.", effect: { resources: { wood: 4 }, fatigue: 3 }, result: "The lower nest yields dry timber." },
    ],
  },
];

const baseNormalEncounters: RouteDecisionDefinition[] = [
  {
    id: "ashWolves",
    kind: "encounter",
    name: "Ash Wolves",
    description: "A hungry pack circles the expedition through smoke.",
    routes: ["mistwoodEdge", "burntGrove", "emberBeaconSite"],
    choices: [
      { id: "hunt", label: "Break the pack", detail: "Hunter only.", requirement: { classId: "hunter" }, effect: { resources: { food: 5 }, fatigue: 3, score: 8, runItem: "saltedRations" }, result: "The Hunter drives off the pack and preserves Salted Rations." },
      { id: "flare", label: "Raise a Torch", detail: "Consumes 1 Torch.", requirement: { item: "torch" }, effect: { items: { torch: -1 }, fatigue: -2 }, result: "The wolves scatter from the sudden flame." },
      { id: "retreat", label: "Give ground", detail: "Avoid wounds but lose time.", effect: { fatigue: 7, routeProgress: -1 }, result: "The party escapes along a longer trail." },
    ],
  },
  {
    id: "mireLeeches",
    kind: "encounter",
    name: "Mire Leeches",
    description: "Black water erupts with grasping leeches.",
    routes: ["saltmarshRun", "tidalBeaconSite", "moonwellPath"],
    choices: [
      { id: "cleanse", label: "Herbal cleanse", detail: "Herbalist only.", requirement: { classId: "herbalist" }, effect: { resources: { herb: 3 }, injury: -3, score: 8, runItem: "mossCrown" }, result: "The Herbalist turns the swarm into reagents and a Moss Crown." },
      { id: "salve", label: "Use Herb Salve", detail: "Consumes 1 Herb Salve.", requirement: { item: "herbSalve" }, effect: { items: { herbSalve: -1 }, injury: -5 }, result: "The salve forces the leeches to release their grip." },
      { id: "push", label: "Push through", detail: "Fast, but painful.", effect: { hp: -4, injury: 5 }, result: "The party reaches dry ground bleeding and exhausted." },
    ],
  },
  {
    id: "rootboundRaiders",
    kind: "encounter",
    name: "Rootbound Raiders",
    description: "Masked scavengers demand supplies at a root barricade.",
    routes: ["rootwarrenTrail", "rootBeaconSite", "windscarCliffs"],
    choices: [
      { id: "bargain", label: "Share provisions", detail: "Costs 2 Food.", requirement: { resources: { food: 2 } }, effect: { resources: { food: -2, wood: 3 }, score: 5, flag: "raider-truce" }, result: "The raiders trade timber and let the party pass." },
      { id: "challenge", label: "Challenge their leader", detail: "Requires ATK 8.", requirement: { minStat: { stat: "atk", value: 8 } }, effect: { resources: { ore: 4 }, injury: 2, score: 10, runItem: "ashBell" }, result: "The leader yields the salvage and an Ash Bell." },
      { id: "detour", label: "Find a detour", detail: "Avoid conflict at a fatigue cost.", effect: { fatigue: 8 }, result: "The party slips around the barricade through tangled roots." },
    ],
  },
];

import { alpha7Encounters, alpha7Events } from "./alpha7Content.js";

export const routeEvents: RouteDecisionDefinition[] = [...baseRouteEvents, ...alpha7Events];
export const normalEncounters: RouteDecisionDefinition[] = [...baseNormalEncounters, ...alpha7Encounters];

export function getRunModifier(id: RunModifierId): RunModifierDefinition {
  return runModifiers.find((modifier) => modifier.id === id) ?? runModifiers[0];
}

export function getRouteDecision(id: RouteEventId | NormalEncounterId): RouteDecisionDefinition {
  const definition = [...routeEvents, ...normalEncounters].find((entry) => entry.id === id);
  if (!definition) throw new Error(`Unknown route decision: ${id}`);
  return definition;
}
