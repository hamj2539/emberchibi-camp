# Emberchibi Camp Asset Batch Spec v1

Alpha 8 integration status: generated and integrated.

Goal: generate one consistent asset pass for the playable prototype after gameplay settles.

## Style Direction

- Polished 2D chibi dark-fantasy RPG.
- Cozy survival tone: warm ember highlights, deep teal forest shadows, readable silhouettes.
- Cute but not childish; no gore, no horror shock, no modern clothing.
- No text, labels, logos, watermarks, or UI baked into assets.
- Keep assets high contrast enough for small cards and mobile screens.

## Existing Assets To Keep Or Regenerate As A Set

- Backgrounds:
  - Camp
  - Mistwood Edge
  - Burnt Grove
  - Ember Beacon Site
- Portraits:
  - Scout
  - Hunter
  - Herbalist
  - Tinker
  - Rook

## Required New Sheets

### Item Icon Sheet

Layout: 4 columns x 3 rows, equal square icons, transparent or clean dark vignette background.

Order:
1. Wood
2. Food
3. Herb
4. Stone
5. Ore
6. Relic Shard
7. Torch
8. Ration
9. Stone Spear
10. Herb Salve
11. Warm Cloak
12. Repair Kit

Prompt anchor:
`Create a 4x3 sprite sheet of square item icons for a polished 2D chibi dark-fantasy survival RPG. Consistent lighting, warm ember highlights, teal shadow accents, no text, no labels, no watermark.`

### Legacy Chest Sheet

Layout: 4 square icons in one horizontal row.

Order:
1. Broken Legacy Chest
2. Faded Legacy Chest
3. Iron Legacy Chest
4. Ancient Legacy Chest

Prompt anchor:
`Create four escalating fantasy treasure chest icons for a chibi dark-fantasy RPG, arranged left to right from broken to ancient. Same perspective and scale, no text, no labels, no watermark.`

### Core And Beacon Sheet

Layout: 3 columns x 2 rows.

Order:
1. Pristine Cinder Heart
2. Stable Cinder Heart
3. Cracked Cinder Heart
4. Faded Cinder Heart
5. Ember Beacon unlit
6. Ember Beacon lit

Prompt anchor:
`Create six square icons for Emberchibi Camp: four Cinder Heart quality variants and two Ember Beacon states. Polished chibi dark-fantasy RPG item art, readable at small size, no text, no labels.`

### Boss Art

Asset: Cinder Stag standalone boss art.

Requirements:
- Three-quarter view, full body, centered.
- Ember antlers, fire guardian identity, readable silhouette.
- No background text or UI.
- Prefer clean cutout or simple dark arena vignette.

Prompt anchor:
`Create a full-body Cinder Stag boss character for a polished 2D chibi dark-fantasy RPG. Ember antlers, ash-charcoal body, glowing rune marks, majestic guardian stance, cute-stylized but threatening, no text, no UI, no watermark.`

## File Plan

- `public/assets/ui/item-sheet.png` - 4x3 resources, supplies, and crafted items.
- `public/assets/ui/chest-status-sheet.png` - 4x3 chest grades and combat statuses.
- `public/assets/ui/core-beacon-sheet.png` - 4x4 Core qualities and five Beacon pairs.
- `public/assets/map/living-camp-sprites.png` - 4x3 transparent sheet for Camp stations, expedition marker, and elemental Beacon props.
- `public/assets/map/survivor-activity-sprites.png` - 4x6 transparent sheet with four-frame rest, forage, craft, guard, cook, and research cycles.
- `public/assets/characters/portrait-sheet.png`
- `public/assets/guardians/*.png`
- `public/assets/backgrounds/*.png`
- `public/assets/enemies/cinder-stag.png`

## Integration Plan

- Add reusable `GameIcon` component.
- Add sprite classes for resources, craft items, chest grades, core qualities, and beacon states.
- GameIcon and combat statuses use generated sprite cells with CSS fallbacks.
- Craft, Camp, Explore, Repair, combat, and End Run use integrated art.
- Guardian initials and inventory initials have been removed.
- Keep CSS color fallbacks for slow or failed image loads.
