export type GameMode = "menu" | "playing" | "paused" | "gameover";

export type InputState = {
  left: boolean;
  right: boolean;
  shoot: boolean;
  start: boolean;
  pause: boolean;
  restart: boolean;
};

export type Enemy = {
  id: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  row: number;
  col: number;
  alive: boolean;
  diving: boolean;
  vx: number;
  vy: number;
  diveScore: number;
};

export type Bullet = {
  x: number;
  y: number;
  vy: number;
};

export type GameState = {
  mode: GameMode;
  width: number;
  height: number;
  seed: number;
  rngState: number;
  score: number;
  wave: number;
  lives: number;
  player: {
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    cooldown: number;
    invuln: number;
  };
  bullets: Bullet[];
  enemies: Enemy[];
  formation: {
    dir: number;
    speed: number;
    stepDown: number;
  };
  diveTimer: number;
  diveCooldown: number;
  lastDiveEnemyId: number | null;
  hitsTaken: number;
  ticks: number;
};

export type GameSnapshot = {
  mode: GameMode;
  score: number;
  wave: number;
  lives: number;
  player: { x: number; y: number; w: number; h: number };
  bullets: Bullet[];
  enemies: Array<Pick<Enemy, "id" | "x" | "y" | "alive" | "diving" | "row" | "col">>;
  formationDir: number;
  diveTimer: number;
  lastDiveEnemyId: number | null;
  hitsTaken: number;
  seed: number;
  coordinateSystem: {
    origin: string;
    x: string;
    y: string;
    units: string;
  };
};

const BASE_CONFIG = {
  width: 480,
  height: 720,
  rows: 5,
  cols: 8,
  enemySpacingX: 42,
  enemySpacingY: 36,
  enemyOffsetX: 80,
  enemyOffsetY: 90,
  playerSpeed: 220,
  bulletSpeed: 380,
  formationSpeed: 28,
  stepDown: 18,
  diveBaseCooldown: 2.8,
  diveVariance: 1.5,
  diveSpeed: 190,
  waveSpeedBoost: 6
};

export function createGame(seed: number, overrides?: Partial<typeof BASE_CONFIG>): GameState {
  const config = { ...BASE_CONFIG, ...overrides };
  const enemies: Enemy[] = [];
  let id = 0;
  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const x = config.enemyOffsetX + col * config.enemySpacingX;
      const y = config.enemyOffsetY + row * config.enemySpacingY;
      enemies.push({
        id: id++,
        x,
        y,
        homeX: x,
        homeY: y,
        row,
        col,
        alive: true,
        diving: false,
        vx: 0,
        vy: 0,
        diveScore: 150
      });
    }
  }

  return {
    mode: "menu",
    width: config.width,
    height: config.height,
    seed,
    rngState: seed >>> 0,
    score: 0,
    wave: 1,
    lives: 3,
    player: {
      x: config.width / 2,
      y: config.height - 70,
      w: 34,
      h: 18,
      speed: config.playerSpeed,
      cooldown: 0,
      invuln: 0
    },
    bullets: [],
    enemies,
    formation: {
      dir: 1,
      speed: config.formationSpeed,
      stepDown: config.stepDown
    },
    diveTimer: config.diveBaseCooldown,
    diveCooldown: config.diveBaseCooldown,
    lastDiveEnemyId: null,
    hitsTaken: 0,
    ticks: 0
  };
}

function rngNext(state: GameState) {
  let t = (state.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  state.rngState = state.rngState >>> 0;
  return result;
}

function pickDiveTarget(state: GameState) {
  const candidates = state.enemies.filter((enemy) => enemy.alive && !enemy.diving);
  if (candidates.length === 0) return null;
  const idx = Math.floor(rngNext(state) * candidates.length);
  return candidates[Math.min(idx, candidates.length - 1)];
}

function resetEnemy(enemy: Enemy) {
  enemy.x = enemy.homeX;
  enemy.y = enemy.homeY;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.diving = false;
}

export function stepGame(state: GameState, input: InputState, dt: number) {
  if (state.mode === "menu") {
    if (input.start) {
      state.mode = "playing";
    }
    return;
  }

  if (input.restart) {
    const seed = state.seed;
    const next = createGame(seed);
    Object.assign(state, next);
    state.mode = "playing";
    return;
  }

  if (input.pause && state.mode !== "gameover") {
    state.mode = state.mode === "paused" ? "playing" : "paused";
  }

  if (state.mode !== "playing") return;

  state.ticks += 1;

  const player = state.player;
  if (player.invuln > 0) {
    player.invuln = Math.max(0, player.invuln - dt);
  }

  if (input.left) {
    player.x -= player.speed * dt;
  } else if (input.right) {
    player.x += player.speed * dt;
  }
  player.x = Math.max(24, Math.min(state.width - 24, player.x));

  if (player.cooldown > 0) {
    player.cooldown = Math.max(0, player.cooldown - dt);
  }

  if (input.shoot && player.cooldown <= 0) {
    state.bullets.push({ x: player.x, y: player.y - 16, vy: -BASE_CONFIG.bulletSpeed });
    player.cooldown = 0.35;
  }

  for (const bullet of state.bullets) {
    bullet.y += bullet.vy * dt;
  }
  state.bullets = state.bullets.filter((bullet) => bullet.y > -20);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let aliveCount = 0;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    aliveCount += 1;
    if (enemy.diving) {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.y > state.height + 50) {
        resetEnemy(enemy);
      }
    } else {
      enemy.x += state.formation.dir * state.formation.speed * dt;
      minX = Math.min(minX, enemy.x);
      maxX = Math.max(maxX, enemy.x);
      maxY = Math.max(maxY, enemy.y);
    }
  }

  if (aliveCount === 0) {
    state.wave += 1;
    state.formation.speed += BASE_CONFIG.waveSpeedBoost;
    for (const enemy of state.enemies) {
      enemy.alive = true;
      resetEnemy(enemy);
      enemy.homeY += 6;
    }
  }

  const formationLeft = minX - 18;
  const formationRight = maxX + 18;
  if (formationLeft < 20 || formationRight > state.width - 20) {
    state.formation.dir *= -1;
    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.diving) continue;
      enemy.y += state.formation.stepDown;
      enemy.homeY = enemy.y;
    }
  }

  if (maxY > state.height - 140) {
    state.mode = "gameover";
  }

  state.diveTimer -= dt;
  if (state.diveTimer <= 0) {
    const target = pickDiveTarget(state);
    if (target) {
      target.diving = true;
      const dx = player.x - target.x;
      target.vx = dx * 0.6;
      target.vy = BASE_CONFIG.diveSpeed + rngNext(state) * 80;
      state.lastDiveEnemyId = target.id;
    }
    state.diveCooldown = BASE_CONFIG.diveBaseCooldown + rngNext(state) * BASE_CONFIG.diveVariance;
    state.diveTimer = state.diveCooldown;
  }

  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      if (Math.abs(dx) < 16 && Math.abs(dy) < 14) {
        enemy.alive = false;
        state.score += enemy.diving ? enemy.diveScore : 100;
        bullet.y = -999;
        break;
      }
    }
  }
  state.bullets = state.bullets.filter((bullet) => bullet.y > -20);

  if (player.invuln <= 0) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dx = Math.abs(enemy.x - player.x);
      const dy = Math.abs(enemy.y - player.y);
      if (dx < 20 && dy < 18) {
        state.lives -= 1;
        state.hitsTaken += 1;
        player.invuln = 1.2;
        resetEnemy(enemy);
        if (state.lives <= 0) {
          state.mode = "gameover";
        }
        break;
      }
    }
  }
}

export function getSnapshot(state: GameState): GameSnapshot {
  return {
    mode: state.mode,
    score: state.score,
    wave: state.wave,
    lives: state.lives,
    player: {
      x: Math.round(state.player.x),
      y: Math.round(state.player.y),
      w: state.player.w,
      h: state.player.h
    },
    bullets: state.bullets.map((b) => ({
      x: Math.round(b.x),
      y: Math.round(b.y),
      vy: b.vy
    })),
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
      alive: enemy.alive,
      diving: enemy.diving,
      row: enemy.row,
      col: enemy.col
    })),
    formationDir: state.formation.dir,
    diveTimer: Number(state.diveTimer.toFixed(2)),
    lastDiveEnemyId: state.lastDiveEnemyId,
    hitsTaken: state.hitsTaken,
    seed: state.seed,
    coordinateSystem: {
      origin: "top-left",
      x: "right",
      y: "down",
      units: "pixels"
    }
  };
}
