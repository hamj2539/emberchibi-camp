# Emberchibi Camp Alpha 4 QA

Last updated: 2026-07-23

Build target: GitHub Pages static build

## Automated Checks

- `npm run test`: 58 passing game-logic tests.
- `npm run build`: production build passes.
- Full clean-run simulation reaches the Cinder Gate, defeats Night Herald, and awards an Ancient Chest.
- Route events, choice requirements/effects, normal encounters, all four modifiers,
  recruit branches, malformed pending decisions, and pre-Alpha saves have focused tests.
- Crisis definitions, triggers, requirements, resolution, expiry, collapse,
  and pre-Alpha 2 migration have focused tests.
- Run item definitions, acquisition, slot replacement, biome counters, Guardian
  rewards, effect triggers, end-run reset, and migration have focused tests.
- Guardian/Herald phases, intent counters, missed consequences, status damage,
  class cleanse interaction, Core quality, and battle migration have focused tests.
- GitHub Pages deployment completed successfully.
- Production page, manifest, and service worker return HTTP 200.

Vite reports expected build-time warnings for absolute asset paths under
`/emberchibi-camp/`; the assets resolve correctly at runtime.

## Browser Checks

- Starter selection opens Camp correctly.
- Camp resources, idle jobs, upgrades, Camp Log, and navigation render correctly.
- Camp shows Fire, Morale, Shelter, Supplies, and Collapse pressure without overflow.
- Crisis panel shows severity, deadline, trigger reason, consequence, and 2-3 responses.
- Run Loadout shows three slots plus each item's source, effect, and trigger.
- Route cards show whether the active biome modifier is active or countered.
- Combat screens show phase, incoming intent, counter hint, missed consequence,
  active statuses, class actions, and counter feedback.
- Meta screen shows shard projects, relic slots, and permanent collections.
- Explore shows the run modifier and pending route decisions lock new expeditions.
- Route Event and Normal Encounter choices resolve back into the existing route flow.
- Desktop and 390x844 mobile layouts have no horizontal overflow.
- Buttons and text remain inside their containers.
- No browser console errors were observed in the production preview.

## Alpha 2 Crisis Checklist

1. Let Fire fall below 30 and verify The Fire Is Dying appears.
2. Verify the crisis shows its trigger reason, countdown, and ignored consequence.
3. Verify unavailable resource/class/stat/item/job responses are disabled.
4. Resolve a crisis and confirm pressure, inventory, score, and Camp Log update.
5. Let a crisis expire and confirm its visible consequence and collapse increase.
6. Fail two routes and verify Broken Shelter can trigger.
7. Raise survivor Fatigue or Injury and verify Wounded Camp can trigger.
8. Ignore a recruit event and verify Morale falls and Camp Despair can trigger.
9. Verify crisis route-risk and repair-speed effects alter their real calculations.
10. Ignore multiple severe crises and verify Run Collapse retains partial score
    and awards a Broken or Faded Chest.
11. Reload during an active crisis and confirm its deadline and reason persist.
12. Load a pre-Alpha 2 save and confirm pressure defaults appear without reset.

## Alpha 3 Run Build Checklist

1. Acquire temporary equipment from a route event and verify its source is shown.
2. Acquire equipment from a normal encounter, Guardian, and crisis response.
3. Equip one Tool, Charm, and Provision; verify the fourth item replaces only its slot.
4. Verify legacy relic loadout remains unchanged and visually separate.
5. Trigger Old Compass, Moss Crown, Bone Needle, and Cinder Gauge once each.
6. Verify Ash Bell lowers Guardian pressure while reducing route rewards.
7. Verify Ember Pick doubles Ember Stone/Ore but adds Fatigue.
8. Verify Resin Torch Bundle improves the first Guardian Torch.
9. Verify Bitter Tonic prevents one route injury and then adds Fatigue.
10. Verify Moon Thread adds score only when no survivor is downed.
11. Verify Wayfinder Knot changes event and encounter odds.
12. Verify Heavy Fog duration is countered by Scout.
13. Verify Hungry Night pressure is countered by Hunter or Salted Rations.
14. Verify Ember Winds is countered by Tinker, Warm Cloak, or Ash Bell.
15. Verify Restless Roots injury risk is countered by Herbalist.
16. End the run and verify all temporary items clear while legacy relics remain.
17. Load a pre-Alpha 3 save and verify empty valid slots are migrated safely.

## Alpha 4 Combat Checklist

1. Enter each Guardian fight and verify phase name plus incoming intent appears.
2. Let every Guardian intent resolve once and verify its distinct consequence.
3. Counter Ember Charge with Guard or Tinker and Burn Wave with Torch/Herbalist.
4. Counter Tidal poison/drain with cleanse, Salve, Guard, or Tinker.
5. Counter Gale ambush/rush with Scout, Guard, attack, or Hunter.
6. Counter Root Poison Bloom and Grasping Root with cleanse, Salve, attack, or Tinker.
7. Counter Lunar curse/burst with Torch, Scout, Guard, or Tinker.
8. Verify Counter worked/missed feedback explains the action and requirement.
9. Verify all eight statuses appear with a tooltip and change combat values.
10. Use Shadowstep, Marked Shot, Cleansing Bloom, and Ember Brace.
11. Verify phase two starts at the configured Guardian HP threshold.
12. Enter Night Herald and verify Veil, Unbound, and Last Dark phases.
13. Resolve or counter Night Mark, Shadow Cast, and Beacon Rend.
14. Win with different attempt/counter/turn/downed combinations and compare Core quality.
15. Reload during a fight and verify phase, intent, statuses, and counters persist.
16. Load a pre-Alpha 4 battle save and verify combat state migrates safely.

## Alpha 1 Exploration Regression Checklist

1. Start a fresh run and open Explore; confirm the active Run Modifier is visible.
2. Finish successful non-boss routes until both a Route Event and Normal Encounter appear.
3. Confirm another expedition cannot start while a route decision is pending.
4. Verify each decision has 2-3 choices and at least one enabled fallback.
5. Verify disabled choices explain their stat, class, resource, item, or relic requirement.
6. Resolve choices that gain and spend resources or supplies.
7. Resolve choices that change fatigue, injury, HP, route clears, flags, and exploration score.
8. Save/reload during a pending decision and confirm the same decision remains available.
9. Verify Heavy Fog changes Safety, Ember Winds changes Guardian pressure,
   Hungry Night increases encounter odds, and Old Trail Signs improves Safety/event odds.
10. Test Rook's delayed Mistwood lead, Mira's Moonwell request, and Bram's
    Windscar delivery with a Repair Kit.
11. Decline Rook and verify the objective points toward Mira or Bram instead of becoming blocked.

## Full Run Checklist

1. Choose a starter and confirm the Camp save is created.
2. Assign idle jobs and verify Rest, Forage, Craft, Guard, Cook, and Research.
3. Complete Mistwood Edge and resolve an instant or delayed Rook branch.
4. Complete prep routes to reveal all five Beacon sites.
5. Recruit Mira from Saltmarsh Run and Bram from Windscar Cliffs when offered.
6. Craft and consume a Ration, Torch, Herb Salve, and Repair Kit.
7. Build Field Infirmary, Ember Workshop, and Watchtower during a funded run.
8. Defeat each Guardian and verify failed attempts lower only that Beacon's Core quality.
9. Use each class skill once per survivor during boss encounters.
10. Repair all five Beacons and verify Gate Stability totals 0-15.
11. Enter the Cinder Gate with 2-3 survivors and defeat Night Herald.
12. Verify score lines, chest grade, reward claim, and permanent legacy values.
13. Spend Legacy Shards on a project and equip no more than two relics.
14. Start a new run and verify equipped relic and project bonuses apply.
15. Test Abandon Run and all-survivors-downed collapse; both must award partial score.
16. Reload online and offline to verify local save recovery and PWA shell behavior.

## Known Limits

- Prototype timers are intentionally short.
- Boss AI remains intentionally simple.
- Normal encounters use one tactical decision and do not have a separate combat screen.
- Route events are single-step decisions; multi-event chains are deferred.
- Crisis tuning is intentionally simple; only one crisis is active at a time.
- Temporary equipment applies to the whole run, not individual survivors.
- Item drops are deterministic from matching content; weighted loot tables are deferred.
- Boss target selection is deterministic and positioning/grid movement is intentionally absent.
- Class identity actions remain once per survivor per encounter.
- Sound is lightweight synthesized UI feedback; there is no music system.
- PWA caching provides an offline shell, not cloud save or account sync.
- Browser checks are manual; there is no automated end-to-end browser suite yet.
