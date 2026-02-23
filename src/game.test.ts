import { expect, test } from "vitest";
import { createGame, getShopItems, getSnapshot, stepGame, type GameState, type InputState } from "./game";

function emptyInput(overrides?: Partial<InputState>): InputState {
  return {
    left: false,
    right: false,
    shoot: false,
    start: false,
    pause: false,
    restart: false,
    confirm: false,
    shopBuyIndex: null,
    activateInfLives: false,
    activateDoubleXp: false,
    ...overrides
  };
}

function clearWave(state: GameState) {
  for (const enemy of state.enemies) {
    enemy.alive = false;
  }
  stepGame(state, emptyInput(), 1 / 60);
}

test("intermission triggers every 5 waves", () => {
  const state = createGame(1400);
  state.mode = "playing";

  for (let wave = 1; wave <= 4; wave += 1) {
    clearWave(state);
    expect(state.mode).toBe("playing");
  }

  clearWave(state);
  expect(state.mode).toBe("intermission");
  expect(state.wave).toBe(6);
  expect(getSnapshot(state).shop.available).toBe(true);
});

test("shop purchase spends credits and applies upgrade caps", () => {
  const state = createGame(2400);
  state.mode = "intermission";
  state.credits = 3000;

  const rapidIndex = getShopItems(state).findIndex((item) => item.id === "rapid_fire");
  expect(rapidIndex).toBeGreaterThanOrEqual(0);

  const beforeCredits = state.credits;
  stepGame(state, emptyInput({ shopBuyIndex: rapidIndex }), 1 / 60);
  expect(state.upgrades.rapidFire).toBe(1);
  expect(state.credits).toBeLessThan(beforeCredits);

  state.credits = 99999;
  for (let i = 0; i < 10; i += 1) {
    stepGame(state, emptyInput({ shopBuyIndex: rapidIndex }), 1 / 60);
  }
  expect(state.upgrades.rapidFire).toBe(5);
});

test("timed powers consume charges and expire", () => {
  const state = createGame(3600);
  state.mode = "playing";
  state.inventory.infLivesCharges = 1;
  state.inventory.doubleXpCharges = 1;

  stepGame(state, emptyInput({ activateInfLives: true, activateDoubleXp: true }), 1 / 60);
  expect(state.inventory.infLivesCharges).toBe(0);
  expect(state.inventory.doubleXpCharges).toBe(0);
  expect(state.timers.infLives).toBeGreaterThan(0);
  expect(state.timers.doubleXp).toBeGreaterThan(0);

  for (let i = 0; i < 1200; i += 1) {
    stepGame(state, emptyInput(), 1 / 60);
  }

  expect(state.timers.infLives).toBe(0);
  expect(state.timers.doubleXp).toBe(0);
});

test("difficulty profile scales after multiple intermission blocks", () => {
  const state = createGame(4800);
  state.mode = "playing";

  while (state.wave < 16) {
    if (getSnapshot(state).mode === "intermission") {
      stepGame(state, emptyInput({ confirm: true }), 1 / 60);
      continue;
    }
    clearWave(state);
  }

  if (getSnapshot(state).mode === "intermission") {
    stepGame(state, emptyInput({ confirm: true }), 1 / 60);
  }

  expect(state.waveBlock).toBe(3);
  expect(state.difficultyProfile.blockIndex).toBe(3);
  expect(state.width).toBeGreaterThan(480);
  expect(state.height).toBeGreaterThan(720);
  expect(state.difficultyProfile.rows).toBeGreaterThanOrEqual(6);
});

test("clearing wave 60 enters victory state", () => {
  const state = createGame(5600);
  state.mode = "playing";
  state.wave = 60;
  state.waveBlock = 11;
  clearWave(state);

  expect(state.mode).toBe("victory");
  expect(getSnapshot(state).victoryReached).toBe(true);
});

function runScript(seed: number) {
  const state = createGame(seed);
  state.mode = "playing";

  for (let tick = 0; tick < 80; tick += 1) {
    if (state.mode === "playing") {
      clearWave(state);
      continue;
    }

    if (state.mode === "intermission") {
      const shop = getShopItems(state);
      const affordable = shop.findIndex((item) => item.affordable);
      stepGame(state, emptyInput({ shopBuyIndex: affordable >= 0 ? affordable : null }), 1 / 60);
      stepGame(state, emptyInput({ activateDoubleXp: true, activateInfLives: true }), 1 / 60);
      stepGame(state, emptyInput({ confirm: true }), 1 / 60);
      continue;
    }

    if (state.mode === "victory") {
      break;
    }
  }

  return JSON.stringify(getSnapshot(state));
}

test("deterministic parity with scripted shop transactions", () => {
  const snapshotA = runScript(7777);
  const snapshotB = runScript(7777);
  expect(snapshotA).toBe(snapshotB);
});
