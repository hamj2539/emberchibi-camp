# Emberchibi Camp

Solo Alpha 9 survival roguelite RPG with long-term goals, optional run vows,
tier-two Legacy projects, local balance history, collections, and phased boss combat.
exploration decisions, idle management, and turn-based key encounters.

**Live build:** https://hamj2539.github.io/emberchibi-camp/

## Current Scope

- Four starter classes and three recruitable survivors.
- Idle camp jobs, offline progress, crafting, supplies, and three camp upgrades.
- Four camp pressure values and five deadline-based crises with choice-driven consequences.
- Twelve run-only equipment items across Tool, Charm, and Provision slots.
- Five biome/run modifiers with route forecasts and class or equipment counters.
- Eight data-driven route events with resource, stat, class, supply, and relic choices.
- Three lightweight normal encounters with one-choice tactical resolution.
- Four run modifiers that alter route risk, event odds, encounter odds, or Guardian pressure.
- Branched and delayed recruitment paths for Rook, Mira, and Bram.
- Five Beacon route chains with distinct Guardians and Core quality.
- Five two-phase Guardians with telegraphed intents, counters, and standardized statuses.
- Three-phase Night Herald final encounter with readable counter windows.
- Class identity actions for every starter and recruit combat class.
- Run victory, Run Collapse, score breakdown, and graded Legacy Chests.
- Permanent shard projects, unlock collections, and two relic loadout slots.
- Temporary run items track their source, trigger effects in the Camp Log, and reset at run end.
- Skippable seven-step first-run guide and recommended-action navigation.
- Local-only run summaries for pacing, failures, crises, Guardians, Cores, Gate, and chest results.
- Persistent Collection Journal covering relics, equipment, blueprints, survivors, Beacons, Guardians, endings, and route events.
- Lightweight survivor Bonds, four secret discoveries, four offline solo challenges, and cosmetic titles.
- Four three-step event chains with alternate outcomes and seven Bond-gated personal stories.
- Ten additional biome encounters and three repair approaches for every Beacon.
- Perfect Alignment, Herald Sealed, and Collapse-but-Saved ending variants.
- Animated milestone scenes, combat feedback, collectible Journal cards, and reward-focused end-run presentation.
- Generated item, chest, status, Core, and Beacon sprite sheets with reduced-motion support.
- Five optional Run Vows with score incentives and permanent completion records.
- Six long-term Journal goals for repairs, Core quality, Bonds, endings, challenges, and collections.
- Five Tier II Legacy projects that unlock route hints, modifier/loadout choices, chest protection, and item memory.
- Local aggregate balance history for duration, outcomes, chests, starters, and collapse causes.
- Local save migration, responsive layout, sound feedback, and PWA support.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The app is configured for GitHub Pages under `/emberchibi-camp/`.

## Test

```bash
npm run test
```

The suite currently covers 81 game-logic cases, including save migration,
offline progress, expeditions, combat, upgrades, meta progression, collapse,
route decisions, encounters, recruit branches, run modifiers, crisis triggers,
deadlines, choices, ignored consequences, run item acquisition, loadout limits,
biome counters, run-end reset, boss phases, telegraphs, counters, statuses,
Core quality performance, balance thresholds, onboarding, local metrics,
all four starter smoke paths, collection discovery, Bond progression, secrets,
challenge completion, event chains, personal stories, alternate repairs,
variant endings, progression costs, vows, reward scaling, long-term goals,
aggregate metrics, and a clean full-run Gate simulation.

## Save Data

Progress is stored locally in the browser under `emberchibiCamp.v1`, with the
previous valid save retained as a recovery backup. There is no online account
or backend.

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, build `dist/`, and deploy
the result to GitHub Pages.

## Assets

Prototype backgrounds and Guardian art live under `public/assets/`. They are
referenced from CSS using the GitHub Pages base path.

## Documentation

- [Current roadmap](docs/roadmap.md)
- [QA report](docs/qa-report.md)
- [Balance assumptions](docs/balance-assumptions.md)
- [Asset batch specification](docs/asset-batch-spec-v1.md)
