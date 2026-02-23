# Galaxian: Dive Bomb Enemies - Design

## Concept
A deterministic fixed shooter inspired by Galaxian with run-based progression. The player fights through 60 waves in 5-wave blocks. After each block, gameplay pauses for an intermission shop where upgrades and timed power charges can be purchased.

## Core Loop
1. Survive and clear enemy formations while avoiding dive-bomb rushes and enemy bullets.
2. Earn score, credits, and XP from kills and wave clears.
3. Enter intermission every 5 waves to buy upgrades.
4. Start next block with higher difficulty.
5. Repeat until wave 60 victory or life depletion.

## Controls
- Move: Arrow Left / Arrow Right (`A` / `D`)
- Shoot: `Space`
- Start / Confirm: `Enter`
- Pause: `P`
- Restart: `R`
- Fullscreen: `F`
- Activate Double XP: `Q`
- Activate Infinity Lives: `E`
- Shop buy: `1..9` or click row

## Upgrade Economy (Run-Only)
Permanent upgrades:
- Extra life cap
- Rapid fire
- Spread shot
- Piercing rounds
- Engine boost
- Hull plating
- Support drone unlock

Timed consumables:
- Infinity Lives charge (manual activation)
- Double XP charge (manual activation)

No progression is persisted between runs.

## Difficulty Scaling
Difficulty is block-based (`blockIndex = floor((wave-1)/5)`) and increases by:
- Larger formations (rows/cols growth)
- Faster formation movement
- Faster and more frequent dive-bombs
- Enemy projectile pressure
- Expanded playfield dimensions

Target shape: most players struggle around wave 30-40, with wave 60 as endgame completion.

## Determinism Contract
- Seeded RNG drives target and timing choices.
- `window.advanceTime(ms)` advances deterministic simulation frames.
- `window.render_game_to_text()` returns compact gameplay state for automation.
- Snapshot payload keeps prior keys and adds progression/shop/power metadata.
