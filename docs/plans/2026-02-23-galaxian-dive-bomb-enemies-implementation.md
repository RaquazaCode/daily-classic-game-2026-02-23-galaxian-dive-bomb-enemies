# Implementation Plan - 2026-02-23 Galaxian: Dive Bomb Enemies

## Goals
- Build a deterministic fixed shooter inspired by Galaxian.
- Add a dive-bomb enemy twist with predictable timing.
- Ship required hooks, pause/restart, and automated capture artifacts.

## Steps
1. Scaffold Vite + TypeScript project with canvas renderer.
2. Implement deterministic game state, formation movement, dive-bomb behavior, and collisions.
3. Add input handling, pause, restart, and fullscreen toggle.
4. Wire automation hooks and render-to-text snapshot.
5. Add tests for determinism and restart behavior.
6. Run Playwright capture and generate GIF assets.
7. Finalize README/design docs and publish.
