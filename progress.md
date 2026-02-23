Original prompt: Unattended nightly classic web game automation for Galaxian with dive-bomb enemies twist.

## 2026-02-23 (baseline run)
- Scaffolded Vite + TypeScript project structure.
- Implemented deterministic Galaxian-style fixed shooter with dive-bomb enemies.
- Added hooks: window.advanceTime(ms), window.render_game_to_text().
- Added vitest coverage for determinism and restart behavior.
- Added Playwright captures and GIF clips.

## 2026-02-23 (shop progression expansion)
- Added full progression model up to wave 60 with block cadence every 5 waves.
- Implemented intermission shop with purchase rows (`1..9` / click) and continue action.
- Added permanent run upgrades: life cap, rapid fire, spread shot, piercing, speed, hull plating, drone unlock.
- Added timed power charges and activations:
  - `E` Infinity Lives
  - `Q` Double XP
- Added autonomous support drone and enemy projectile pressure.
- Added block-based difficulty scaling including canvas expansion and aggression escalation.
- Expanded snapshot payload with shop/economy/power/difficulty metadata while preserving original keys.

## Verification
- `pnpm test` pass (6 tests)
- `pnpm build` pass
- Playwright captures refreshed:
  - `playwright/main-actions/`
  - `playwright/shop-actions/`
- GIFs refreshed in `assets/gifs/`.

## TODO
- Tune late-block economy and projectile volume after broader playtesting.
- Add optional assist presets for accessibility-focused runs.
- Add seeded challenge presets for fixed-run competition mode.
