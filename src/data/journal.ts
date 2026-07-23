import { beacons } from "./beacons.js";
import { routeEvents } from "./routeContent.js";
import { runItems } from "./runItems.js";
import type { CollectionCategory } from "../game/state.js";

export type JournalEntry = {
  id: string;
  name: string;
  flavor: string;
};

export const legacyRelicEntries: JournalEntry[] = [
  { id: "Coalglass Charm", name: "Coalglass Charm", flavor: "Black glass that warms near forgotten paths." },
  { id: "Ashen Compass", name: "Ashen Compass", flavor: "Its needle points toward unfinished promises." },
  { id: "Stagbone Token", name: "Stagbone Token", flavor: "A Guardian's mercy carved into pale antler." },
];

export const blueprintEntries: JournalEntry[] = [
  { id: "Torch Blueprint", name: "Torch Blueprint", flavor: "A resin wrap designed to hold flame against Ember Winds." },
  { id: "Repair Kit Blueprint", name: "Repair Kit Blueprint", flavor: "Field braces copied from Bram's oldest tools." },
  { id: "Warm Cloak Blueprint", name: "Warm Cloak Blueprint", flavor: "Layered cloth carrying the scent of cedar smoke." },
];

export const survivorEntries: JournalEntry[] = [
  { id: "survivor-scout", name: "Nia", flavor: "The trail appears when Nia decides someone must find it." },
  { id: "survivor-hunter", name: "Taro", flavor: "Taro counts meals, arrows, and reasons to come home." },
  { id: "survivor-herbalist", name: "Sena", flavor: "Every remedy begins with listening to what still grows." },
  { id: "survivor-tinker", name: "Pip", flavor: "Pip trusts a repaired hinge more than a lucky omen." },
  { id: "survivor-rook", name: "Rook", flavor: "Rook remembers every safe branch in Mistwood." },
  { id: "survivor-mira", name: "Mira", flavor: "Mira hears the marsh change before the tide admits it." },
  { id: "survivor-bram", name: "Bram", flavor: "Bram builds as if the next storm is already visible." },
];

export const journalCollections: Record<CollectionCategory, JournalEntry[]> = {
  relics: legacyRelicEntries,
  runItems: runItems.map((item) => ({ id: item.id, name: item.name, flavor: item.effect })),
  blueprints: blueprintEntries,
  survivors: survivorEntries,
  beacons: beacons.map((beacon) => ({ id: beacon.id, name: beacon.name, flavor: `${beacon.repairName} returns this chain to the living forest.` })),
  guardians: beacons.map((beacon) => ({ id: beacon.id, name: beacon.bossName, flavor: `${beacon.bossName} guarded the ${beacon.coreName} long after its purpose was forgotten.` })),
  endings: [
    { id: "victory", name: "Dawn Beyond the Gate", flavor: "Five lights hold while the Night Herald retreats." },
    { id: "collapse", name: "The Last Coal", flavor: "The run ended, but something was carried back." },
  ],
  routeEvents: routeEvents.map((event) => ({ id: event.id, name: event.name, flavor: event.description })),
};

export const secretDefinitions = [
  { id: "fivefoldConcord", name: "Fivefold Concord", hint: "Light every Beacon with at least three Pristine Cores.", reward: "Title: Pristine Keeper" },
  { id: "unbrokenDawn", name: "Unbroken Dawn", hint: "Defeat the Night Herald without a survivor being downed.", reward: "Title: Dawn Unbroken" },
  { id: "emptyHandsMercy", name: "Empty Hands, Full Hearts", hint: "Resolve a crisis without spending resources or supplies.", reward: "Lore: The Shared Ember" },
  { id: "coalglassEcho", name: "Coalglass Echo", hint: "Carry the Coalglass Charm through Moonwell Path.", reward: "Relic lore and 40 run score" },
] as const;

export const challengeDefinitions = [
  { id: "noCollapse", name: "No Collapse Run", description: "Complete the run without collapsing." },
  { id: "lowCampfire", name: "Low Campfire Run", description: "Win after Fire falls to 25 or lower." },
  { id: "scoutOpening", name: "Scout-only Opening", description: "Complete the first two non-boss routes using only a Scout." },
  { id: "noRepairKitGate", name: "No Repair Kit Gate", description: "Reach victory without using a Repair Kit on any Beacon." },
] as const;

export const bondNotes = [
  "New arrival.",
  "Trust: shares a private camp memory.",
  "Kindred: reveals an alternate perspective on route events.",
  "Hearthbound: carries the story of this camp into future runs.",
];
