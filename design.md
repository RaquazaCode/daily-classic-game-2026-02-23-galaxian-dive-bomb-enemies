# Galaxian: Dive Bomb Enemies - Design

## Concept
A classic fixed shooter with a disciplined enemy formation that periodically breaks ranks to dive-bomb the player. Survive waves, shoot invaders, and avoid direct collisions.

## Core Loop
- Start in formation mode; enemies march horizontally and step down.
- Dive-bomb timer selects a random invader to swoop toward the player.
- Player dodges and shoots to score points.
- Clear the formation to advance the wave and speed up enemy movement.

## Controls
- Move: Arrow Left / Arrow Right (A / D)
- Shoot: Space
- Start: Enter (or click)
- Pause: P
- Restart: R
- Fullscreen: F

## Twist
Dive-bomb enemies accelerate toward the player at timed intervals. Dive kills score bonus points.

## Scoring
- Standard enemy: 100 points.
- Dive-bomb enemy: 150 points.

## Difficulty & Progression
- Each cleared wave increases formation speed.
- Dive cooldown varies deterministically using the seeded RNG.

## Determinism
- RNG seeded via `?seed=` query param.
- `window.advanceTime(ms)` steps the simulation at a fixed 60 FPS.
- `window.render_game_to_text()` returns a concise JSON snapshot with coordinates and entity state.
