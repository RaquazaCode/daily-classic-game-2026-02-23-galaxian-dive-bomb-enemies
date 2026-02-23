import { expect, test } from "vitest";
import { createGame, getSnapshot, stepGame } from "./game";

test("deterministic dive selection", () => {
  const stateA = createGame(12345);
  stateA.mode = "playing";
  const stateB = createGame(12345);
  stateB.mode = "playing";

  for (let i = 0; i < 240; i += 1) {
    stepGame(stateA, { left: false, right: false, shoot: false, start: false, pause: false, restart: false }, 1 / 60);
    stepGame(stateB, { left: false, right: false, shoot: false, start: false, pause: false, restart: false }, 1 / 60);
  }

  const snapA = getSnapshot(stateA);
  const snapB = getSnapshot(stateB);
  expect(snapA.lastDiveEnemyId).toBe(snapB.lastDiveEnemyId);
  expect(snapA.enemies.filter((e) => e.diving).length).toBe(snapB.enemies.filter((e) => e.diving).length);
});

test("restart resets score and lives", () => {
  const state = createGame(4242);
  state.mode = "playing";
  state.score = 500;
  state.lives = 1;

  stepGame(state, { left: false, right: false, shoot: false, start: false, pause: false, restart: true }, 1 / 60);
  const snap = getSnapshot(state);

  expect(snap.score).toBe(0);
  expect(snap.lives).toBe(3);
  expect(snap.mode).toBe("playing");
});
