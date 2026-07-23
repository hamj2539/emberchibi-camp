# Emberchibi Camp Roadmap

Last updated: 2026-07-23

## Current Release

The repository contains a complete playable prototype beyond the original
single-Beacon vertical slice.

| Area | Status | Current implementation |
| --- | --- | --- |
| Project shell | Complete | Vite, React, TypeScript, reducer architecture |
| Save and offline | Complete | localStorage, backup recovery, migration, 8h offline cap |
| Camp | Complete | six idle jobs and three run upgrades |
| Exploration | Complete | eleven routes across five Beacon chains |
| Survivors | Complete | four starters plus Rook, Mira, and Bram |
| Crafting | Complete | six recipes and sequential craft queue |
| Guardians | Complete | five bosses, distinct tuning, Core quality |
| Beacon repair | Complete | assigned crew, costs, quality and tool modifiers |
| Final encounter | Complete | Gate Stability and Night Herald |
| Run ending | Complete | victory, collapse, score, chest grade and reward |
| Meta progression | Complete | shards, projects, blueprints, unlocks, relic loadout |
| Assets and UI | Complete for prototype | route art, Guardian art, responsive layouts |
| Production | Complete for prototype | GitHub Pages workflow and installable PWA shell |

## Version History

### v0.2 - Five Beacon Skeleton

- Expanded the Ember pattern to Tidal, Gale, Root, and Lunar Beacons.
- Added route, Guardian, Core, repair, and bonus data for each chain.

### v0.3 - Gate and Night Herald

- Added the final Gate workflow and win condition.
- Added full-run score lines and meaningful chest grades.
- Linked Core quality to Gate Stability.

### v0.4 - Meta Progression

- Added persistent chest rewards, blueprints, relics, class/survivor unlocks, and shards.
- Added shard projects and a two-slot equipped relic loadout.

### v0.5 - Balance and Polish

- Added route forecasts, supplies, class route identity, offline progress, and save recovery.
- Added class combat skills, camp upgrades, Run Collapse, and more recruit events.
- Added generated assets, responsive fixes, sound feedback, animation, and PWA support.
- Added 26 automated game-logic tests and full-run simulation.

## Next Phase

### P1 - Playtest and Balance

- Record average run duration and resource bottlenecks.
- Measure route, Guardian, and Gate failure rates by starter class.
- Tune camp upgrade and Legacy Project costs.
- Review chest reward duplication and long-term shard pacing.

### P2 - Missing Game Systems

- Add camp crises with explicit deadlines and consequences.
- Add run-only relic drops and three temporary equipment slots.
- Add more route events, recruit branches, and normal encounters.
- Expand boss behavior beyond pressure scaling and single-target attacks.

### P3 - Production Depth

- Add music, layered sound effects, and dedicated encounter animation.
- Add automated end-to-end browser tests.
- Add accessibility review and install/offline testing across browsers.
- Consider analytics, cloud save, and accounts only after the offline loop is stable.

## Definition of Prototype Complete

The current prototype is complete when:

- A fresh player can finish or collapse a run without developer tools.
- Save migration preserves existing progress.
- A clean run can reach every Beacon and the final Gate.
- Legacy rewards visibly affect the next run.
- Automated tests and production build pass.
- GitHub Pages serves the app, manifest, and service worker successfully.

All criteria are currently met at commit `98d7e51`.
