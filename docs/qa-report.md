# Emberchibi Camp Alpha 1 QA

Last updated: 2026-07-23

Build target: GitHub Pages static build

## Automated Checks

- `npm run test`: 36 passing game-logic tests.
- `npm run build`: production build passes.
- Full clean-run simulation reaches the Cinder Gate, defeats Night Herald, and awards an Ancient Chest.
- Route events, choice requirements/effects, normal encounters, all four modifiers,
  recruit branches, malformed pending decisions, and pre-Alpha saves have focused tests.
- GitHub Pages deployment completed successfully.
- Production page, manifest, and service worker return HTTP 200.

Vite reports expected build-time warnings for absolute asset paths under
`/emberchibi-camp/`; the assets resolve correctly at runtime.

## Browser Checks

- Starter selection opens Camp correctly.
- Camp resources, idle jobs, upgrades, Camp Log, and navigation render correctly.
- Meta screen shows shard projects, relic slots, and permanent collections.
- Explore shows the run modifier and pending route decisions lock new expeditions.
- Route Event and Normal Encounter choices resolve back into the existing route flow.
- Desktop and 390x844 mobile layouts have no horizontal overflow.
- Buttons and text remain inside their containers.
- No browser console errors were observed in the production preview.

## Alpha 1 Exploration Checklist

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
15. Test Abandon Run and an all-survivors-downed collapse; both must award half score and a Broken Chest.
16. Reload online and offline to verify local save recovery and PWA shell behavior.

## Known Limits

- Prototype timers are intentionally short.
- Boss AI remains intentionally simple.
- Normal encounters use one tactical decision and do not have a separate combat screen.
- Route events are single-step decisions; multi-event chains are deferred.
- Camp crises and run-only relics are not implemented.
- Sound is lightweight synthesized UI feedback; there is no music system.
- PWA caching provides an offline shell, not cloud save or account sync.
- Browser checks are manual; there is no automated end-to-end browser suite yet.
