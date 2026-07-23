# Emberchibi Camp Roadmap

Last updated: 2026-07-23

## Current Release

**Alpha 2: Camp Survival Pressure**

The camp now has explicit Fire, Morale, Shelter, and Supplies pressure. Gameplay
states trigger deadline-based crises whose choices or ignored consequences alter
the current run and can build toward Run Collapse.

| Area | Status | Current implementation |
| --- | --- | --- |
| Project shell | Complete | Vite, React, TypeScript, reducer architecture |
| Save and offline | Complete | localStorage, backup recovery, migration, 8h offline cap |
| Camp | Alpha 2 | six idle jobs, three upgrades, four pressure values, five crises |
| Exploration | Alpha 1 | eleven routes, eight events, three normal encounters |
| Run variation | Alpha 1 | four modifiers affecting risk, event odds, encounters, or boss prep |
| Survivors | Alpha 1 | four starters plus branched/delayed Rook, Mira, and Bram recruitment |
| Crafting | Complete | six recipes and sequential craft queue |
| Guardians | Complete | five bosses, distinct tuning, Core quality |
| Beacon repair | Complete | assigned crew, costs, quality and tool modifiers |
| Final encounter | Complete | Gate Stability and Night Herald |
| Run ending | Alpha 2 | victory or pressure-driven collapse, partial score, graded chest |
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

### Alpha 1 - Exploration Depth

- Added eight route events across Mistwood, Ember, Tidal, Gale, Root, and Lunar routes.
- Added choices gated by resources, items, survivor stats, classes, and equipped relics.
- Added three lightweight encounters: Ash Wolves, Mire Leeches, and Rootbound Raiders.
- Added Heavy Fog, Ember Winds, Hungry Night, and Old Trail Signs run modifiers.
- Added instant, delayed, missed, and delivery-based recruit outcomes.
- Added exploration score, event flags, pending-decision saves, and safe migration.
- Expanded the automated suite from 26 to 36 game-logic tests.

### Alpha 2 - Camp Survival Pressure

- Added five data-driven crises: Dying Fire, Empty Stores, Wounded Camp,
  Broken Shelter, and Camp Despair.
- Connected crisis triggers to camp pressure, food, survivor strain, route
  failures, Hungry Night, and ignored recruit events.
- Added 2-3 responses per crisis with resource, item, class, stat, and job checks.
- Added visible deadlines, trigger reasons, ignored consequences, and Camp Log entries.
- Added crisis effects for route risk, repair speed, injuries, fatigue, score,
  pressure, and collapse.
- Tuned crisis-chain collapse to retain partial score and award Broken or Faded Chests.
- Added safe migration defaults and expanded the automated suite from 36 to 42 tests.

## Next Phase

### P1 - Alpha 2 Playtest and Balance

- Measure crisis trigger frequency and time-to-response.
- Tune Fire and Supplies decay against the short prototype route timers.
- Verify every crisis always has at least one no-cost or achievable response.
- Review collapse-meter pacing after two and three ignored crises.
- Record average run duration and resource bottlenecks.
- Measure route, Guardian, and Gate failure rates by starter class.
- Tune camp upgrade and Legacy Project costs.
- Review chest reward duplication and long-term shard pacing.

### P2 - Alpha 3 Candidates

- Add run-only relic drops and three temporary equipment slots.
- Add event chains that react to flags from earlier choices.
- Add more biome-specific normal encounter variants.
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

All prototype criteria remain met in Alpha 2.
