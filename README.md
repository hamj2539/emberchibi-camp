# Emberchibi Camp

Playable prototype for a survival roguelite RPG with idle camp management and turn-based key encounters.

**Live build:** https://hamj2539.github.io/emberchibi-camp/

## Current Scope

- Four starter classes and three recruitable survivors.
- Idle camp jobs, offline progress, crafting, supplies, and three camp upgrades.
- Five Beacon route chains with distinct Guardians and Core quality.
- Cinder Gate and Night Herald final encounter.
- Run victory, Run Collapse, score breakdown, and graded Legacy Chests.
- Permanent shard projects, unlock collections, and two relic loadout slots.
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

The suite currently covers 26 game-logic cases, including save migration,
offline progress, expeditions, combat, upgrades, meta progression, collapse,
events, and a clean full-run Gate simulation.

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
- [Asset batch specification](docs/asset-batch-spec-v1.md)
