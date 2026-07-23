import type { EventChainId, NormalEncounterId, RouteEventId, RouteId, RunItemId } from "../game/state.js";
import type { RouteDecisionDefinition } from "./routeContent.js";

type ChainSpec = {
  id: EventChainId;
  title: string;
  routes: [RouteId, RouteId, RouteId];
  steps: [string, string, string];
  outcomes: [string, string];
  reward: RunItemId;
};

const chainSpecs: ChainSpec[] = [
  {
    id: "ashMap",
    title: "The Ash Map",
    routes: ["burntGrove", "emberBeaconSite", "moonwellPath"],
    steps: ["Charred Corner", "Lines Under Flame", "The Map's Last Mark"],
    outcomes: ["followed-the-ash-road", "sealed-the-ash-road"],
    reward: "oldCompass",
  },
  {
    id: "lostCaravan",
    title: "The Lost Caravan",
    routes: ["mistwoodEdge", "saltmarshRun", "windscarCliffs"],
    steps: ["Broken Axle", "Caravan Lantern", "The Last Wagon"],
    outcomes: ["caravan-rescued", "caravan-salvaged"],
    reward: "saltedRations",
  },
  {
    id: "singingRoots",
    title: "The Singing Roots",
    routes: ["rootwarrenTrail", "rootBeaconSite", "moonwellPath"],
    steps: ["A Note Below", "The Buried Chorus", "Heartwood Refrain"],
    outcomes: ["roots-harmonized", "roots-silenced"],
    reward: "mossCrown",
  },
  {
    id: "brokenBell",
    title: "The Broken Bell",
    routes: ["windscarCliffs", "galeBeaconSite", "lunarBeaconSite"],
    steps: ["A Clapper in the Dust", "Storm-Torn Bronze", "The Bell Tower"],
    outcomes: ["bell-restored", "bell-melted"],
    reward: "ashBell",
  },
];

export const eventChainDefinitions = chainSpecs.map((chain) => ({
  id: chain.id,
  name: chain.title,
  steps: chain.steps.length,
  outcomes: chain.outcomes,
}));

export const alpha7Events: RouteDecisionDefinition[] = chainSpecs.flatMap((chain) =>
  chain.steps.map((stepName, index) => {
    const final = index === chain.steps.length - 1;
    return {
      id: `${chain.id}${index + 1}` as RouteEventId,
      kind: "event" as const,
      name: `${chain.title}: ${stepName}`,
      description: final
        ? `The trail reaches its final choice. This will decide the fate of ${chain.title}.`
        : `A clue continues ${chain.title} beyond this route.`,
      routes: [chain.routes[index]],
      chainId: chain.id,
      chainStep: index,
      choices: final
        ? [
            {
              id: "preserve",
              label: "Preserve what remains",
              detail: "A careful ending with a lasting field reward.",
              effect: { score: 24, runItem: chain.reward, flag: chain.outcomes[0] },
              result: `${chain.title} is preserved and its promise survives.`,
              chainOutcome: chain.outcomes[0],
            },
            {
              id: "repurpose",
              label: "Use it for the camp",
              detail: "A practical ending with immediate supplies.",
              effect: { resources: { wood: 5, food: 5, relicShard: 1 }, score: 16, flag: chain.outcomes[1] },
              result: `${chain.title} ends in useful salvage and a different truth.`,
              chainOutcome: chain.outcomes[1],
            },
          ]
        : [
            {
              id: "study",
              label: "Study the clue",
              detail: "Gain insight and continue the chain.",
              effect: { score: 8, resources: { relicShard: 1 } },
              result: `The party records ${stepName} and finds the next lead.`,
            },
            {
              id: "press",
              label: "Follow it quickly",
              detail: "Continue at the cost of Fatigue.",
              effect: { score: 5, fatigue: 4, routeProgress: 1 },
              result: `The clue is followed before the trail can fade.`,
            },
          ],
    };
  }),
);

const storySpecs = [
  ["rookStory", "Rook", "survivor-rook", ["mistwoodEdge", "burntGrove"], "oldCompass"],
  ["miraStory", "Mira", "survivor-mira", ["saltmarshRun", "moonwellPath"], "moonThread"],
  ["bramStory", "Bram", "survivor-bram", ["windscarCliffs", "galeBeaconSite"], "cinderGauge"],
  ["scoutStory", "Scout", "survivor-scout", ["mistwoodEdge"], "wayfinderKnot"],
  ["hunterStory", "Hunter", "survivor-hunter", ["burntGrove"], "saltedRations"],
  ["herbalistStory", "Herbalist", "survivor-herbalist", ["rootwarrenTrail"], "boneNeedle"],
  ["tinkerStory", "Tinker", "survivor-tinker", ["emberBeaconSite"], "emberPick"],
] as const;

export const survivorStoryDefinitions = storySpecs.map(([id, name, survivorId]) => ({ id, name: `${name}'s Story`, survivorId }));

export const survivorStoryEvents: RouteDecisionDefinition[] = storySpecs.map(([id, name, survivorId, routes, reward]) => ({
  id: id as RouteEventId,
  kind: "event",
  name: `${name}'s Campfire Memory`,
  description: `${name} recognizes something on this route and asks the party to stop.`,
  routes: [...routes],
  storyFor: survivorId,
  minBond: 1,
  storyId: id,
  choices: [
    {
      id: "listen",
      label: "Stay and listen",
      detail: "Deepen the Bond and preserve the memory.",
      effect: { bond: 2, score: 12, runItem: reward },
      result: `${name} shares a memory that changes how the route feels.`,
    },
    {
      id: "act",
      label: "Help finish the old task",
      detail: "Gain supplies and a smaller Bond reward.",
      effect: { bond: 1, resources: { food: 3, wood: 3 }, score: 8 },
      result: `${name} closes one unfinished chapter through action.`,
    },
  ],
}));

alpha7Events.push(...survivorStoryEvents);

const encounterSpecs: [NormalEncounterId, string, RouteId[], string][] = [
  ["fogLanterns", "Fog Lanterns", ["mistwoodEdge"], "Cold lights imitate the camp's path markers."],
  ["emberMoths", "Ember Moth Swarm", ["burntGrove"], "Moths gather around every exposed flame."],
  ["cinderPilgrims", "Cinder Pilgrims", ["emberBeaconSite"], "Silent pilgrims offer a trade before the altar."],
  ["tideCrabs", "Tideglass Crabs", ["saltmarshRun"], "Glass-shelled crabs block the dry crossing."],
  ["drownedCourier", "Drowned Courier", ["tidalBeaconSite"], "A waterlogged satchel keeps drifting upstream."],
  ["galeKites", "Runaway Gale Kites", ["windscarCliffs"], "Signal kites pull loose supplies toward the gorge."],
  ["stormShepherds", "Storm Shepherds", ["galeBeaconSite"], "Cliff nomads ask for help grounding a storm herd."],
  ["sporeChoir", "Spore Choir", ["rootwarrenTrail"], "Singing spores react to breath and footsteps."],
  ["thornSnare", "Living Thorn Snare", ["rootBeaconSite"], "A thorn lattice closes behind the party."],
  ["moonMoths", "Moon Moth Vigil", ["moonwellPath", "lunarBeaconSite"], "Pale moths settle on one survivor's oldest scar."],
];

export const alpha7Encounters: RouteDecisionDefinition[] = encounterSpecs.map(([id, name, routes, description], index) => ({
  id,
  kind: "encounter",
  name,
  description,
  routes,
  choices: [
    {
      id: "observe",
      label: "Read the pattern",
      detail: index % 2 === 0 ? "Requires WIS 6." : "Requires SURV 6.",
      requirement: { minStat: { stat: index % 2 === 0 ? "wis" : "surv", value: 6 } },
      effect: { score: 7, resources: index % 3 === 0 ? { herb: 3 } : { ore: 2 } },
      result: "Patience reveals a useful pattern without a fight.",
    },
    {
      id: "trade",
      label: "Spend a provision",
      detail: "Spend 1 Food to turn the encounter aside.",
      requirement: { resources: { food: 1 } },
      effect: { resources: { food: -1 }, fatigue: -3, routeProgress: 1 },
      result: "A small provision buys a safer and shorter passage.",
    },
    {
      id: "adapt",
      label: "Adapt and continue",
      detail: "No cost; accept a small strain.",
      effect: { fatigue: 3, injury: index % 4 === 0 ? 2 : 0 },
      result: "The party changes formation and keeps moving.",
    },
  ],
}));
