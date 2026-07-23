# Emberchibi Camp Roadmap

Last updated: 2026-07-23

## Current Release

**Solo Alpha 9: Long-term Progression**

The solo loop now has optional difficulty, multi-run collection targets,
Tier II strategic projects, tuned chest value, and local aggregate metrics.

| Area | Status | Current implementation |
| --- | --- | --- |
| Project shell | Complete | Vite, React, TypeScript, reducer architecture |
| Save and offline | Complete | localStorage, backup recovery, migration, 8h offline cap |
| Camp | Alpha 2 | six idle jobs, three upgrades, four pressure values, five crises |
| Exploration | Alpha 3 | eleven routes, eight events, three encounters, temporary item drops |
| Run variation | Alpha 3 | five biome/run modifiers and twelve build-defining run items |
| Run loadout | Alpha 3 | Tool, Charm, and Provision slots with source and trigger history |
| Survivors | Alpha 1 | four starters plus branched/delayed Rook, Mira, and Bram recruitment |
| Crafting | Complete | six recipes and sequential craft queue |
| Guardians | Alpha 4 | five two-phase bosses, unique intents, counters, statuses |
| Beacon repair | Complete | assigned crew, costs, quality and tool modifiers |
| Final encounter | Alpha 4 | Gate Stability and three-phase Night Herald |
| Run ending | Alpha 2 | victory or pressure-driven collapse, partial score, graded chest |
| Onboarding | Alpha 5 | seven-step first-run guide, skippable and locally persisted |
| Instrumentation | Alpha 9 | latest 30 summaries plus local aggregate balance metrics |
| Meta progression | Alpha 9 | tuned shards, two project tiers, strategic unlock options |
| Collection Journal | Alpha 6 | eight discovery categories with hidden entries and flavor text |
| Survivor Bonds | Alpha 6 | route, recruit, and boss progress with four story-note levels |
| Secrets and challenges | Alpha 6 | four conditional secrets, four offline goals, cosmetic titles |
| Event chains | Alpha 7 | four three-step chains with two final outcomes each |
| Personal stories | Alpha 7 | Rook, Mira, Bram, and four starter stories |
| Alternate paths | Alpha 7 | standard, risky, and survivor/relic Beacon repair methods |
| Ending variants | Alpha 7 | perfect alignment, quiet seal, and saved collapse |
| Presentation | Alpha 8 | milestone overlays, particles, scene glow, contextual audio |
| UI assets | Alpha 8 | generated items, chests, statuses, Cores, and Beacon states |
| Combat feel | Alpha 8 | phase emphasis, telegraph pulse, counter flashes, downed styling |
| Long-term goals | Alpha 9 | six tracked goals covering variants, Bonds, endings, and collections |
| Run vows | Alpha 9 | five optional difficulty modifiers with score and Journal records |
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

### Alpha 3 - Run Builds and Biome Variation

- Added twelve data-driven run items across Tool, Charm, and Provision slots.
- Added acquisition from route events, encounters, Guardians, and crisis choices.
- Added build effects for failure recovery, crisis deadlines, injury prevention,
  route reward tradeoffs, Guardian pressure, Torch power, repair speed, and score.
- Added a fifth modifier, Restless Roots, and made modifiers biome-aware.
- Added Scout, Hunter, Herbalist, Tinker, supply, and loadout counters.
- Added route forecast status and Camp Log messages when effects trigger.
- Added a Run Loadout panel showing equipped slots, item source, effect, and trigger.
- Kept permanent Legacy relics separate and clear all run equipment at run end.
- Expanded the automated suite from 42 to 50 game-logic tests.

### Alpha 4 - Guardian Combat Depth

- Added data-driven phase and intent definitions for all five Guardians.
- Added three phases and three telegraphed intents for Night Herald.
- Added one-action counter windows with explicit worked/missed feedback.
- Gave Ember, Tidal, Gale, Root, and Lunar distinct damage/status patterns.
- Standardized Burn, Poison, Guarded, Exposed, Bound, Inspired, Cursed, and Focused.
- Added class identity actions for Scout, Hunter, Herbalist, and Tinker;
  recruits inherit actions from their class.
- Made class skills cleanse, disrupt, expose, guard, inspire, and counter intents.
- Updated Core quality to include failed attempts, counters, turns, and downed count.
- Added phase, intent, status, and counter UI plus safe battle-save migration.
- Expanded the automated suite from 50 to 58 game-logic tests.

### Alpha 5 - Balance and Playtest Readiness

- Set an active full-run pacing target of 10-15 minutes.
- Tuned route duration, route Stone income, counter-supply craft costs,
  crisis decay/deadlines, Gate HP floor, score thresholds, and chest rates.
- Added a lightweight seven-step guide covering every major run system.
- Added priority-aware recommended actions for crises, decisions, combat,
  repair, Gate, chest, and progression.
- Added explicit disabled reasons to route, craft, repair, supply, and skill actions.
- Added local-only run summaries and a clearer chest threshold explanation.
- Added mobile stacking, timer labels, status/relic tooltips, and keyboard-native controls.
- Added balance formula, onboarding, metrics, and four-starter smoke tests.
- Expanded the automated suite from 58 to 63 game-logic tests.

### Solo Alpha 6 - Collections and Replay Goals

- Added a persistent Collection Journal with unknown entries shown as `???`.
- Added survivor Bond progress from routes, recruit branches, and survived boss fights.
- Added four condition-based secrets with lore, score, and cosmetic title rewards.
- Added No Collapse, Low Campfire, Scout-only Opening, and No Repair Kit Gate challenges.
- Added safe migration for all journal and per-run challenge tracker fields.
- Expanded the automated suite from 63 to 69 game-logic tests.

### Solo Alpha 7 - Story Routes and Alternate Paths

- Added The Ash Map, Lost Caravan, Singing Roots, and Broken Bell event chains.
- Added personal route stories for Rook, Mira, Bram, Scout, Hunter, Herbalist, and Tinker.
- Added ten short biome encounters focused on observation, provisions, and tradeoffs.
- Added Standard, Risky Ritual, and class/relic repair paths for all five Beacons.
- Added Fivefold Dawn, Quiet Seal, and Carried by the Beacons ending variants.
- Added Journal chain progress, route story/relic hints, and end-run story outcomes.
- Expanded the automated suite from 69 to 75 game-logic tests.

### Solo Alpha 8 - Feel and Presentation

- Added milestone overlays for Beacons, Guardians, Gate, Herald, Collapse,
  chest rewards, secrets, and Bond levels.
- Added contextual cues for routes, crises, boss telegraphs, and counters.
- Integrated three generated sprite sheets for items, chest grades, statuses,
  Core quality, and all five lit/unlit Beacon states.
- Added combat portraits, phase emphasis, intent pulse, counter flashes,
  critical/downed states, and clearer battle log grouping.
- Polished Journal cards and end-run discovery, Bond, secret, and challenge rewards.
- Preserved keyboard controls, mute state, mobile layouts, and reduced motion.

### Solo Alpha 9 - Long-term Progression

- Added six persistent long-term goals to the Collection Journal.
- Added Low Flame, Scarce Food, No Retreat, Pristine Hunt, and Solo Guardian vows.
- Added five Tier II projects with prerequisites and strategic run options.
- Tuned shard payouts and added duplicate reward conversion.
- Expanded local run history to 30 summaries with aggregate balance reporting.
- Added safe migration and expanded the automated suite from 75 to 81 tests.

## Next Phase

### P1 - External Alpha Playtest

- Run 10+ fresh-save playtests and record local run summaries.
- Compare actual completion time against the 10-15 minute target.
- Measure first crisis timing, route failure rate, and Guardian attempts.
- Review where players ignore or skip onboarding steps.
- Tune chest distribution only after observing complete and collapsed runs.
- Record average run duration and resource bottlenecks.
- Measure route, Guardian, and Gate failure rates by starter class.
- Tune camp upgrade and Legacy Project costs.
- Review chest reward duplication and long-term shard pacing.

### P2 - Post-Alpha Candidates

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

All prototype criteria remain met in Solo Alpha 9.
