# Emberchibi Camp

Alpha 5 survival roguelite RPG with guided onboarding, tuned pacing, phased boss combat, temporary run builds, camp crises,
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

The suite currently covers 63 game-logic cases, including save migration,
offline progress, expeditions, combat, upgrades, meta progression, collapse,
route decisions, encounters, recruit branches, run modifiers, crisis triggers,
deadlines, choices, ignored consequences, run item acquisition, loadout limits,
biome counters, run-end reset, boss phases, telegraphs, counters, statuses,
Core quality performance, balance thresholds, onboarding, local metrics,
all four starter smoke paths, and a clean full-run Gate simulation.

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
