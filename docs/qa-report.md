# Emberchibi Camp Prototype QA

Date: 2026-07-22
Build target: GitHub Pages static build

## Smoke Checks

- `npm run build` passes.
- GitHub Pages workflow deploys `dist/`.
- App loads under `/emberchibi-camp/`.
- Save key remains `emberchibiCamp.v1`.
- Existing save migration covers `items`, `craftQueue`, `recruitEvent`, `bossBattle`, `beaconRepair`, `endRun`, and legacy collections.

## Full Run Checklist

1. Start from fresh save and choose any starter.
2. Confirm Camp loads with resources, idle jobs, Camp Log, and status chips.
3. Assign Rest after taking damage; HP should recover gradually.
4. Complete Mistwood Edge and resolve Rook recruit event.
5. Complete Burnt Grove and verify Ember Beacon Site unlocks.
6. Craft at least one prep item such as Stone Spear, Torch, Herb Salve, or Repair Kit.
7. Start Ember Beacon Site with 2 survivors and enter Cinder Stag battle.
8. Resolve boss battle through win or loss.
9. On win, verify Cinder Heart quality reflects boss failure count.
10. Start Ember Beacon repair with enough Wood and Stone.
11. Verify repair progress fills and then moves to End Run.
12. Open Legacy Chest and verify reward persists in legacy state.
13. Start Fresh Run and verify legacy values remain.

## Current QA Notes

- Prototype timers are intentionally short for testing.
- Camp Log overflow was fixed with an internal scroll region.
- Rest recovery now uses fractional per-second progress.
- Ancient Chest is reachable in a strong vertical-slice run after threshold tuning.
- Asset paths are absolute to the GitHub Pages base path; Vite build warns but runtime resolution is expected.

## Known Prototype Limits

- No automated browser regression suite yet.
- Boss AI is intentionally simple.
- Asset set is partial: backgrounds and portraits exist, icon/boss/chest sheets are still planned.
- Balance is tuned for fast prototype validation, not long-term progression.
