import "./style.css";
import { createGame, getSnapshot, stepGame, type GameState, type InputState } from "./game";

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
  }
}

const params = new URLSearchParams(window.location.search);
const scripted = params.get("scripted_demo") === "1";
const autostart = params.get("autostart") === "1" || scripted;

const seedParam = params.get("seed");
const seed = seedParam ? Number(seedParam) : Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) {
  throw new Error("Canvas missing");
}
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context missing");
}
const safeCanvas = canvas as HTMLCanvasElement;
const safeCtx = ctx as CanvasRenderingContext2D;

let state = createGame(Number.isFinite(seed) ? seed : 20260223);
if (autostart) {
  state.mode = "playing";
}

const held = new Set<string>();
let startPressed = false;
let pausePressed = false;
let restartPressed = false;

function handleKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "a", "d", " ", "space"].includes(key)) {
    event.preventDefault();
  }
  held.add(key);
  if (key === "enter") startPressed = true;
  if (key === "p") pausePressed = true;
  if (key === "r") restartPressed = true;
  if (key === "f") toggleFullscreen();
}

function handleKeyUp(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  held.delete(key);
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

safeCanvas.addEventListener("mousedown", () => {
  if (state.mode === "menu") {
    startPressed = true;
  }
});

function readInput(): InputState {
  const input: InputState = {
    left: held.has("arrowleft") || held.has("a"),
    right: held.has("arrowright") || held.has("d"),
    shoot: held.has(" ") || held.has("space"),
    start: startPressed,
    pause: pausePressed,
    restart: restartPressed
  };
  startPressed = false;
  pausePressed = false;
  restartPressed = false;
  return input;
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  safeCanvas.width = state.width * ratio;
  safeCanvas.height = state.height * ratio;
  safeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawBackground(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(120, 160, 255, 0.25)";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 83 + state.ticks * 2) % state.width;
    const y = (i * 131 + state.ticks * 3) % state.height;
    ctx.fillRect(x, y, 2, 2);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, "rgba(12, 32, 76, 0.5)");
  gradient.addColorStop(1, "rgba(2, 8, 20, 0.85)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const { x, y, w, h, invuln } = state.player;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = invuln > 0 ? "rgba(120, 220, 255, 0.8)" : "#7afcff";
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(0, -h / 2);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(-w / 2, h / 2, w, 6);
  ctx.restore();
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const color = enemy.diving ? "#ff6b6b" : "#ffd166";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(8, 8);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "#8dfcff";
  for (const bullet of state.bullets) {
    ctx.fillRect(bullet.x - 2, bullet.y - 10, 4, 12);
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "rgba(12, 18, 40, 0.8)";
  ctx.fillRect(0, 0, state.width, 46);

  ctx.fillStyle = "#eaf2ff";
  ctx.font = "16px 'Trebuchet MS', sans-serif";
  ctx.fillText(`Score ${state.score}`, 18, 28);
  ctx.fillText(`Wave ${state.wave}`, 180, 28);
  ctx.fillText(`Lives ${state.lives}`, 300, 28);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(0, 46, state.width, 2);
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.mode === "playing") return;

  ctx.fillStyle = "rgba(5, 8, 20, 0.7)";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "#eaf2ff";
  ctx.font = "28px 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Galaxian: Dive Bomb", state.width / 2, state.height / 2 - 60);

  ctx.font = "16px 'Trebuchet MS', sans-serif";
  if (state.mode === "menu") {
    ctx.fillText("Press Enter or Click to Start", state.width / 2, state.height / 2 - 16);
  } else if (state.mode === "paused") {
    ctx.fillText("Paused - Press P to Resume", state.width / 2, state.height / 2 - 16);
  } else if (state.mode === "gameover") {
    ctx.fillText("Game Over - Press R to Restart", state.width / 2, state.height / 2 - 16);
  }

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "14px 'Trebuchet MS', sans-serif";
  ctx.fillText("Move: ← →   Shoot: Space   Pause: P   Restart: R", state.width / 2, state.height / 2 + 24);
  ctx.fillText("Toggle Fullscreen: F", state.width / 2, state.height / 2 + 46);
  ctx.textAlign = "start";
}

function render() {
  drawBackground(safeCtx, state);
  drawHud(safeCtx, state);
  drawEnemies(safeCtx, state);
  drawBullets(safeCtx, state);
  drawPlayer(safeCtx, state);
  drawOverlay(safeCtx, state);
}

let lastTime = performance.now();
function loop(time: number) {
  const dt = Math.min(0.033, (time - lastTime) / 1000);
  lastTime = time;
  const input = readInput();
  stepGame(state, input, dt);
  render();
  requestAnimationFrame(loop);
}

if (!scripted) {
  requestAnimationFrame(loop);
} else {
  render();
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  } else {
    safeCanvas.requestFullscreen().catch(() => undefined);
  }
}

window.advanceTime = (ms: number) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) {
    const input = i === 0 ? readInput() : { left: false, right: false, shoot: false, start: false, pause: false, restart: false };
    stepGame(state, input, 1 / 60);
  }
  render();
};

window.render_game_to_text = () => {
  return JSON.stringify(getSnapshot(state));
};
