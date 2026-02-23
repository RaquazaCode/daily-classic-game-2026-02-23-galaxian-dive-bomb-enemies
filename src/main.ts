import "./style.css";
import { createGame, getShopItems, getSnapshot, stepGame, type GameState, type InputState } from "./game";

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
let confirmPressed = false;
let shopBuyIndex: number | null = null;
let activateInfLivesPressed = false;
let activateDoubleXpPressed = false;

function handleKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "a", "d", " ", "space", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
    event.preventDefault();
  }

  held.add(key);

  if (key === "enter") {
    startPressed = true;
    confirmPressed = true;
  }
  if (key === "p") pausePressed = true;
  if (key === "r") restartPressed = true;
  if (key === "f") toggleFullscreen();
  if (key === "q") activateDoubleXpPressed = true;
  if (key === "e") activateInfLivesPressed = true;

  const numeric = Number(key);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 9) {
    shopBuyIndex = numeric - 1;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  held.delete(event.key.toLowerCase());
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

safeCanvas.addEventListener("mousedown", (event) => {
  if (state.mode === "menu") {
    startPressed = true;
    return;
  }

  if (state.mode !== "intermission") return;

  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * state.width;
  const y = ((event.clientY - rect.top) / rect.height) * state.height;

  const panelX = 34;
  const panelY = 142;
  const rowH = 42;
  const rowGap = 8;

  for (let i = 0; i < 9; i += 1) {
    const y0 = panelY + i * (rowH + rowGap);
    if (x >= panelX && x <= state.width - 34 && y >= y0 && y <= y0 + rowH) {
      shopBuyIndex = i;
      return;
    }
  }

  const continueBtn = {
    x: state.width / 2 - 124,
    y: state.height - 84,
    w: 248,
    h: 42
  };
  if (x >= continueBtn.x && x <= continueBtn.x + continueBtn.w && y >= continueBtn.y && y <= continueBtn.y + continueBtn.h) {
    confirmPressed = true;
  }
});

function readInput(): InputState {
  const input: InputState = {
    left: held.has("arrowleft") || held.has("a"),
    right: held.has("arrowright") || held.has("d"),
    shoot: held.has(" ") || held.has("space"),
    start: startPressed,
    pause: pausePressed,
    restart: restartPressed,
    confirm: confirmPressed,
    shopBuyIndex,
    activateInfLives: activateInfLivesPressed,
    activateDoubleXp: activateDoubleXpPressed
  };

  startPressed = false;
  pausePressed = false;
  restartPressed = false;
  confirmPressed = false;
  shopBuyIndex = null;
  activateInfLivesPressed = false;
  activateDoubleXpPressed = false;
  return input;
}

function ensureCanvasSize() {
  const ratio = window.devicePixelRatio || 1;
  const expectedW = Math.floor(state.width * ratio);
  const expectedH = Math.floor(state.height * ratio);
  if (safeCanvas.width !== expectedW || safeCanvas.height !== expectedH) {
    safeCanvas.width = expectedW;
    safeCanvas.height = expectedH;
    safeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

window.addEventListener("resize", ensureCanvasSize);
ensureCanvasSize();

function drawBackground(context: CanvasRenderingContext2D, game: GameState) {
  context.fillStyle = "#040814";
  context.fillRect(0, 0, game.width, game.height);

  const gradient = context.createLinearGradient(0, 0, 0, game.height);
  gradient.addColorStop(0, "rgba(26, 54, 116, 0.55)");
  gradient.addColorStop(1, "rgba(4, 10, 28, 0.9)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, game.width, game.height);

  context.fillStyle = "rgba(180, 215, 255, 0.2)";
  for (let i = 0; i < 82; i += 1) {
    const x = (i * 91 + game.ticks * 3) % game.width;
    const y = (i * 131 + game.ticks * 2) % game.height;
    context.fillRect(x, y, 2, 2);
  }
}

function drawPlayer(context: CanvasRenderingContext2D, game: GameState) {
  const { x, y, w, h, invuln } = game.player;
  context.save();
  context.translate(x, y);
  context.fillStyle = invuln > 0 || game.timers.infLives > 0 ? "rgba(142, 248, 255, 0.92)" : "#7afcff";
  context.beginPath();
  context.moveTo(-w / 2, h / 2);
  context.lineTo(0, -h / 2);
  context.lineTo(w / 2, h / 2);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.28)";
  context.fillRect(-w / 2, h / 2, w, 6);
  context.restore();
}

function drawDrone(context: CanvasRenderingContext2D, game: GameState) {
  if (!game.drone.active) return;
  context.save();
  context.translate(game.drone.x, game.drone.y);
  context.fillStyle = "#9effa6";
  context.beginPath();
  context.moveTo(-10, 7);
  context.lineTo(0, -7);
  context.lineTo(10, 7);
  context.closePath();
  context.fill();
  context.restore();
}

function drawEnemies(context: CanvasRenderingContext2D, game: GameState) {
  for (const enemy of game.enemies) {
    if (!enemy.alive) continue;
    context.save();
    context.translate(enemy.x, enemy.y);
    context.fillStyle = enemy.diving ? "#ff6b6b" : "#ffd166";
    context.beginPath();
    context.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(0,0,0,0.35)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-8, 8);
    context.lineTo(8, 8);
    context.stroke();
    context.restore();
  }
}

function drawBullets(context: CanvasRenderingContext2D, game: GameState) {
  for (const bullet of game.bullets) {
    context.fillStyle = bullet.source === "drone" ? "#b1ff80" : "#8dfcff";
    context.fillRect(bullet.x - 2, bullet.y - 10, 4, 12);
  }

  context.fillStyle = "#ffac4f";
  for (const bullet of game.enemyBullets) {
    context.fillRect(bullet.x - 2, bullet.y - 2, 4, 10);
  }
}

function drawHud(context: CanvasRenderingContext2D, game: GameState) {
  context.fillStyle = "rgba(12, 18, 40, 0.8)";
  context.fillRect(0, 0, game.width, 64);

  context.fillStyle = "#eaf2ff";
  context.font = "16px 'Trebuchet MS', sans-serif";
  context.fillText(`Score ${game.score}`, 14, 24);
  context.fillText(`Wave ${game.wave}/${game.maxWave}`, 160, 24);
  context.fillText(`Lives ${game.lives}/${game.maxLives}`, 332, 24);

  context.font = "14px 'Trebuchet MS', sans-serif";
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.fillText(`Credits ${game.credits}`, 14, 48);
  context.fillText(`XP ${game.xp}`, 140, 48);
  context.fillText(`Block ${game.waveBlock + 1}`, 214, 48);
  context.fillText(`Drone ${game.drone.active ? "ON" : "OFF"}`, 294, 48);

  const infStatus = game.timers.infLives > 0 ? `${game.timers.infLives.toFixed(1)}s` : `${game.inventory.infLivesCharges}c`;
  const xpStatus = game.timers.doubleXp > 0 ? `${game.timers.doubleXp.toFixed(1)}s` : `${game.inventory.doubleXpCharges}c`;
  context.fillText(`E ${infStatus}`, 370, 48);
  context.fillText(`Q ${xpStatus}`, 430, 48);

  context.fillStyle = "rgba(255,255,255,0.15)";
  context.fillRect(0, 64, game.width, 2);
}

function drawTitleOverlay(context: CanvasRenderingContext2D, game: GameState) {
  context.fillStyle = "rgba(5, 8, 20, 0.72)";
  context.fillRect(0, 0, game.width, game.height);

  context.fillStyle = "#eaf2ff";
  context.textAlign = "center";
  context.font = "30px 'Trebuchet MS', sans-serif";
  context.fillText("Galaxian: Shop Escalation", game.width / 2, game.height / 2 - 94);

  context.font = "15px 'Trebuchet MS', sans-serif";
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.fillText("Survive 60 waves with shop breaks every 5 rounds.", game.width / 2, game.height / 2 - 58);
  context.fillText("Upgrade smartly: speed, spread, pierce, drone, and timed powers.", game.width / 2, game.height / 2 - 36);
  context.fillText("Press Enter or click to launch.", game.width / 2, game.height / 2 - 8);
  context.fillText("Move: ← → / A D   Shoot: Space   Pause: P   Restart: R   Fullscreen: F", game.width / 2, game.height / 2 + 32);
  context.fillText("Timed powers: Q = Double XP, E = Infinity Lives", game.width / 2, game.height / 2 + 54);
  context.textAlign = "start";
}

function drawIntermissionOverlay(context: CanvasRenderingContext2D, game: GameState) {
  context.fillStyle = "rgba(5, 8, 20, 0.85)";
  context.fillRect(0, 0, game.width, game.height);

  context.fillStyle = "#eaf2ff";
  context.textAlign = "center";
  context.font = "30px 'Trebuchet MS', sans-serif";
  context.fillText(`Intermission: Block ${game.intermission.nextBlock + 1}`, game.width / 2, 72);

  context.font = "15px 'Trebuchet MS', sans-serif";
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillText(game.intermission.reason, game.width / 2, 102);
  context.fillText(`Credits ${game.credits}   XP ${game.xp}`, game.width / 2, 124);

  const items = getShopItems(game);
  const panelX = 34;
  const panelW = game.width - 68;
  const rowH = 42;
  const rowGap = 8;

  context.textAlign = "start";
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const y = 142 + i * (rowH + rowGap);

    context.fillStyle = item.affordable ? "rgba(24, 58, 112, 0.9)" : "rgba(52, 40, 40, 0.8)";
    context.fillRect(panelX, y, panelW, rowH);

    context.strokeStyle = "rgba(255,255,255,0.15)";
    context.strokeRect(panelX, y, panelW, rowH);

    context.fillStyle = "#dff1ff";
    context.font = "14px 'Trebuchet MS', sans-serif";
    const lvl = item.maxLevel == null ? `x${item.level}` : `${item.level}/${item.maxLevel}`;
    context.fillText(`${i + 1}. ${item.name}`, panelX + 10, y + 17);
    context.fillStyle = "rgba(255,255,255,0.72)";
    context.fillText(item.description, panelX + 10, y + 34);

    context.textAlign = "right";
    context.fillStyle = item.affordable ? "#9effa6" : "#ff9c9c";
    context.fillText(`${item.cost} cr`, panelX + panelW - 10, y + 17);
    context.fillStyle = "rgba(255,255,255,0.82)";
    context.fillText(`Lvl ${lvl}`, panelX + panelW - 10, y + 34);
    context.textAlign = "start";
  }

  const buttonX = game.width / 2 - 124;
  const buttonY = game.height - 84;
  context.fillStyle = "rgba(34, 96, 158, 0.96)";
  context.fillRect(buttonX, buttonY, 248, 42);
  context.strokeStyle = "rgba(255,255,255,0.3)";
  context.strokeRect(buttonX, buttonY, 248, 42);

  context.textAlign = "center";
  context.fillStyle = "#f4fbff";
  context.font = "16px 'Trebuchet MS', sans-serif";
  context.fillText("Enter: Start Next Block", game.width / 2, buttonY + 27);
  context.font = "13px 'Trebuchet MS', sans-serif";
  context.fillText("Buy with keys 1..9 or click rows", game.width / 2, buttonY - 12);
  context.textAlign = "start";
}

function drawSimpleOverlay(context: CanvasRenderingContext2D, game: GameState, title: string, subtitle: string) {
  context.fillStyle = "rgba(5, 8, 20, 0.72)";
  context.fillRect(0, 0, game.width, game.height);

  context.textAlign = "center";
  context.fillStyle = "#eaf2ff";
  context.font = "30px 'Trebuchet MS', sans-serif";
  context.fillText(title, game.width / 2, game.height / 2 - 44);
  context.font = "16px 'Trebuchet MS', sans-serif";
  context.fillText(subtitle, game.width / 2, game.height / 2 - 10);
  context.fillText("Press R to restart", game.width / 2, game.height / 2 + 22);
  context.textAlign = "start";
}

function drawOverlay(context: CanvasRenderingContext2D, game: GameState) {
  if (game.mode === "playing") return;
  if (game.mode === "menu") {
    drawTitleOverlay(context, game);
    return;
  }
  if (game.mode === "intermission") {
    drawIntermissionOverlay(context, game);
    return;
  }
  if (game.mode === "paused") {
    drawSimpleOverlay(context, game, "Paused", "Press P to resume");
    return;
  }
  if (game.mode === "victory") {
    drawSimpleOverlay(context, game, "Victory", "All 60 waves cleared");
    return;
  }
  if (game.mode === "gameover") {
    drawSimpleOverlay(context, game, "Game Over", "You were overwhelmed");
  }
}

function render() {
  ensureCanvasSize();
  drawBackground(safeCtx, state);
  drawHud(safeCtx, state);
  drawEnemies(safeCtx, state);
  drawBullets(safeCtx, state);
  drawDrone(safeCtx, state);
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
    const input =
      i === 0
        ? readInput()
        : {
            left: false,
            right: false,
            shoot: false,
            start: false,
            pause: false,
            restart: false,
            confirm: false,
            shopBuyIndex: null,
            activateInfLives: false,
            activateDoubleXp: false
          };
    stepGame(state, input, 1 / 60);
  }
  render();
};

window.render_game_to_text = () => JSON.stringify(getSnapshot(state));
