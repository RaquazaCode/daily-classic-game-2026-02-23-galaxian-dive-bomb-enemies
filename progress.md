Original prompt: Unattended nightly classic web game automation for Galaxian with dive-bomb enemies twist.

## 2026-02-23
- Scaffolded Vite + TypeScript project structure.
- Implemented deterministic Galaxian-style fixed shooter with dive-bomb enemies.
- Added hooks: window.advanceTime(ms), window.render_game_to_text().
- Added vitest coverage for determinism and restart behavior.
- Planned Playwright captures + GIF exports.

## TODO
- Run pnpm install/test/build.
- Run Playwright capture and verify screenshots/state output.
- Generate GIF captures and update README media section.
- Initialize git repo, create GitHub repo, open PR, merge, deploy preview.
- Update automation records + catalog.

## 2026-02-23 (verification)
- pnpm test: pass
- pnpm build: pass
- Playwright capture complete (shots + state JSON).
- GIFs generated in assets/gifs/.
