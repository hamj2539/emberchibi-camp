# Emberchibi Camp Prototype QA

Last updated: 2026-07-23

Build target: GitHub Pages static build

Validated commit: `98d7e51`

## Automated Checks

- `npm run test`: 26 passing game-logic tests.
- `npm run build`: production build passes.
- Full clean-run simulation reaches the Cinder Gate, defeats Night Herald, and awards an Ancient Chest.
- Collapse, camp upgrades, class skills, recruit events, relic slots, and shard projects have focused tests.
- GitHub Pages deployment completed successfully.
- Production page, manifest, and service worker return HTTP 200.

Vite reports expected build-time warnings for absolute asset paths under
`/emberchibi-camp/`; the assets resolve correctly at runtime.

## Browser Checks

- Starter selection opens Camp correctly.
- Camp resources, idle jobs, upgrades, Camp Log, and navigation render correctly.
- Meta screen shows shard projects, relic slots, and permanent collections.
- Desktop and 390x844 mobile layouts have no horizontal overflow.
- Buttons and text remain inside their containers.
- No browser console errors were observed in the production preview.

## Full Run Checklist

1. Choose a starter and confirm the Camp save is created.
2. Assign idle jobs and verify Rest, Forage, Craft, Guard, Cook, and Research.
3. Complete Mistwood Edge and resolve the Rook event.
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
- Boss AI and normal route encounters are intentionally simple.
- Camp crises and run-only relics are not implemented.
- Sound is lightweight synthesized UI feedback; there is no music system.
- PWA caching provides an offline shell, not cloud save or account sync.
- Browser checks are manual; there is no automated end-to-end browser suite yet.
