import type { BeaconId, BossAction, CombatStatusId, StarterClassId } from "../game/state.js";

export type CounterRule = {
  actions?: BossAction[];
  classes?: StarterClassId[];
  label: string;
};

export type BossIntentDefinition = {
  id: string;
  name: string;
  telegraph: string;
  consequence: string;
  counter: CounterRule;
  damage: number;
  pressure: number;
  status?: CombatStatusId;
  statusStacks?: number;
  drainItem?: "torch" | "ration" | "herbSalve";
};

export type BossPhaseDefinition = {
  id: string;
  name: string;
  hpAtOrBelow: number;
  intentIds: string[];
};

export type BossCombatDefinition = {
  phases: BossPhaseDefinition[];
  intents: BossIntentDefinition[];
};

export const guardianCombat: Record<BeaconId, BossCombatDefinition> = {
  ember: {
    phases: [
      { id: "kindling", name: "Kindling Hunt", hpAtOrBelow: 1, intentIds: ["emberCharge", "burnWave"] },
      { id: "wildfire", name: "Wildfire Crown", hpAtOrBelow: 0.5, intentIds: ["burnWave", "emberCharge"] },
    ],
    intents: [
      { id: "emberCharge", name: "Cinder Charge", telegraph: "The Stag lowers its antlers for a crushing charge.", consequence: "Heavy damage and Burn.", counter: { actions: ["guard"], classes: ["tinker"], label: "Guard or Tinker brace" }, damage: 15, pressure: 1, status: "burn", statusStacks: 1 },
      { id: "burnWave", name: "Crownfire Wave", telegraph: "Fire gathers across the Stag's crown.", consequence: "Party-wide Burn pressure.", counter: { actions: ["useTorch"], classes: ["herbalist"], label: "Torch or Herbalist cleanse" }, damage: 8, pressure: 2, status: "burn", statusStacks: 2 },
    ],
  },
  tidal: {
    phases: [
      { id: "highTide", name: "High Tide", hpAtOrBelow: 1, intentIds: ["undertow", "brineDrain"] },
      { id: "drownedCourt", name: "Drowned Court", hpAtOrBelow: 0.55, intentIds: ["brineDrain", "undertow"] },
    ],
    intents: [
      { id: "undertow", name: "Black Undertow", telegraph: "The Warden draws poisoned tidewater inward.", consequence: "Poison and sustained damage.", counter: { actions: ["useSalve"], classes: ["herbalist"], label: "Salve or Herbalist cleanse" }, damage: 7, pressure: 1, status: "poison", statusStacks: 2 },
      { id: "brineDrain", name: "Brine Levy", telegraph: "Salt sigils close around the party's supplies.", consequence: "Drains a Torch and leaves the party Exposed.", counter: { actions: ["guard"], classes: ["tinker"], label: "Guard or Tinker brace" }, damage: 9, pressure: 1, status: "exposed", statusStacks: 1, drainItem: "torch" },
    ],
  },
  gale: {
    phases: [
      { id: "circling", name: "Circling Storm", hpAtOrBelow: 1, intentIds: ["skyAmbush", "talonRush"] },
      { id: "eyeBreak", name: "Eye of the Gale", hpAtOrBelow: 0.5, intentIds: ["talonRush", "skyAmbush"] },
    ],
    intents: [
      { id: "skyAmbush", name: "Sky Ambush", telegraph: "The Roc vanishes above the cloud line.", consequence: "Fast burst and Bound.", counter: { actions: ["guard"], classes: ["scout"], label: "Guard or Scout disrupt" }, damage: 14, pressure: 1, status: "bound", statusStacks: 1 },
      { id: "talonRush", name: "Talon Rush", telegraph: "Wind folds behind a descending talon strike.", consequence: "Heavy damage unless interrupted.", counter: { actions: ["attack"], classes: ["hunter"], label: "Attack or Hunter shot" }, damage: 16, pressure: 1, status: "exposed", statusStacks: 1 },
    ],
  },
  root: {
    phases: [
      { id: "oldBark", name: "Old Bark", hpAtOrBelow: 1, intentIds: ["poisonBloom", "rootBind"] },
      { id: "heartwood", name: "Heartwood Awake", hpAtOrBelow: 0.6, intentIds: ["rootBind", "poisonBloom"] },
    ],
    intents: [
      { id: "poisonBloom", name: "Poison Bloom", telegraph: "Violet pods open along the Colossus.", consequence: "Party Poison spreads each turn.", counter: { actions: ["useSalve"], classes: ["herbalist"], label: "Salve or Herbalist cleanse" }, damage: 6, pressure: 1, status: "poison", statusStacks: 2 },
      { id: "rootBind", name: "Grasping Root", telegraph: "Roots knot around the party's feet.", consequence: "Bound lowers outgoing damage.", counter: { actions: ["attack"], classes: ["tinker"], label: "Attack or Tinker brace" }, damage: 10, pressure: 1, status: "bound", statusStacks: 2 },
    ],
  },
  lunar: {
    phases: [
      { id: "waxing", name: "Waxing Reflection", hpAtOrBelow: 1, intentIds: ["moonCurse", "delayedBurst"] },
      { id: "eclipse", name: "Total Eclipse", hpAtOrBelow: 0.55, intentIds: ["delayedBurst", "moonCurse"] },
    ],
    intents: [
      { id: "moonCurse", name: "Moon Curse", telegraph: "Silver script circles the party's shadows.", consequence: "Cursed increases pressure and damage.", counter: { actions: ["useTorch"], classes: ["scout"], label: "Torch or Scout disrupt" }, damage: 8, pressure: 2, status: "cursed", statusStacks: 2 },
      { id: "delayedBurst", name: "Falling Moon", telegraph: "A false moon hangs motionless above the arena.", consequence: "Delayed party-wide burst.", counter: { actions: ["guard"], classes: ["tinker"], label: "Guard or Tinker brace" }, damage: 18, pressure: 1, status: "burn", statusStacks: 1 },
    ],
  },
};

export const heraldCombat: BossCombatDefinition = {
  phases: [
    { id: "veil", name: "Veil of Night", hpAtOrBelow: 1, intentIds: ["nightMark", "shadowCast"] },
    { id: "unbound", name: "Herald Unbound", hpAtOrBelow: 0.66, intentIds: ["shadowCast", "beaconRend"] },
    { id: "lastDark", name: "The Last Dark", hpAtOrBelow: 0.33, intentIds: ["beaconRend", "nightMark"] },
  ],
  intents: [
    { id: "nightMark", name: "Night Mark", telegraph: "The Herald marks one heartbeat for extinction.", consequence: "Heavy Cursed damage.", counter: { actions: ["guard"], classes: ["tinker"], label: "Guard or Tinker brace" }, damage: 15, pressure: 1, status: "cursed", statusStacks: 1 },
    { id: "shadowCast", name: "Shadow Cast", telegraph: "A second shadow begins casting behind the Herald.", consequence: "Party-wide curse and pressure.", counter: { actions: ["useTorch"], classes: ["scout"], label: "Torch or Scout disrupt" }, damage: 10, pressure: 2, status: "cursed", statusStacks: 2 },
    { id: "beaconRend", name: "Beacon Rend", telegraph: "The Herald reaches toward all five Beacon flames.", consequence: "Massive delayed burst and Burn.", counter: { actions: ["useSalve"], classes: ["herbalist", "hunter"], label: "Salve, Herbalist cleanse, or Hunter burst" }, damage: 20, pressure: 2, status: "burn", statusStacks: 2 },
  ],
};

export function phaseForHp(definition: BossCombatDefinition, hp: number, maxHp: number): BossPhaseDefinition {
  const ratio = maxHp <= 0 ? 0 : hp / maxHp;
  return [...definition.phases].reverse().find((phase) => ratio <= phase.hpAtOrBelow) ?? definition.phases[0];
}

export function getIntent(definition: BossCombatDefinition, id: string): BossIntentDefinition {
  return definition.intents.find((intent) => intent.id === id) ?? definition.intents[0];
}

export function nextIntent(definition: BossCombatDefinition, phase: BossPhaseDefinition, turn: number): BossIntentDefinition {
  const id = phase.intentIds[(turn - 1) % phase.intentIds.length];
  return getIntent(definition, id);
}
