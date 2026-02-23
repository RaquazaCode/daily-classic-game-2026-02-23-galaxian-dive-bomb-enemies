export type GameMode = "menu" | "playing" | "paused" | "intermission" | "gameover" | "victory";

export type ShopItemId =
  | "extra_life_cap"
  | "rapid_fire"
  | "spread_shot"
  | "piercing_rounds"
  | "engine_boost"
  | "hull_plating"
  | "drone_unlock"
  | "inf_lives_charge"
  | "double_xp_charge";

export type InputState = {
  left: boolean;
  right: boolean;
  shoot: boolean;
  start: boolean;
  pause: boolean;
  restart: boolean;
  confirm: boolean;
  shopBuyIndex: number | null;
  activateInfLives: boolean;
  activateDoubleXp: boolean;
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
  pierce: number;
  source: "player" | "drone";
};

export type EnemyBullet = {
  x: number;
  y: number;
  vy: number;
};

export type DifficultyProfile = {
  blockIndex: number;
  rows: number;
  cols: number;
  formationSpeed: number;
  stepDown: number;
  diveBaseCooldown: number;
  diveVariance: number;
  diveSpeed: number;
  simultaneousDivers: number;
  enemyFireInterval: number;
  enemyBulletSpeed: number;
  canvasWidth: number;
  canvasHeight: number;
};

export type ShopItem = {
  id: ShopItemId;
  name: string;
  cost: number;
  level: number;
  maxLevel: number | null;
  description: string;
  affordable: boolean;
};

export type Upgrades = {
  extraLifeCap: number;
  rapidFire: number;
  spreadShot: number;
  piercingRounds: number;
  engineBoost: number;
  hullPlating: number;
  droneUnlock: number;
};

export type GameState = {
  mode: GameMode;
  width: number;
  height: number;
  seed: number;
  rngState: number;
  score: number;
  wave: number;
  maxWave: number;
  wavesPerBlock: number;
  waveBlock: number;
  lives: number;
  maxLives: number;
  credits: number;
  xp: number;
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
  enemyBullets: EnemyBullet[];
  enemies: Enemy[];
  formation: {
    dir: number;
    speed: number;
    stepDown: number;
  };
  diveTimer: number;
  diveCooldown: number;
  lastDiveEnemyId: number | null;
  enemyFireTimer: number;
  hitsTaken: number;
  ticks: number;
  upgrades: Upgrades;
  inventory: {
    infLivesCharges: number;
    doubleXpCharges: number;
  };
  timers: {
    infLives: number;
    doubleXp: number;
  };
  drone: {
    active: boolean;
    x: number;
    y: number;
    cooldown: number;
  };
  difficultyProfile: DifficultyProfile;
  intermission: {
    reason: string;
    nextBlock: number;
  };
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
  credits: number;
  xp: number;
  waveBlock: number;
  maxWave: number;
  shop: {
    available: boolean;
    items: ShopItem[];
  };
  upgrades: Upgrades;
  inventory: {
    infLivesCharges: number;
    doubleXpCharges: number;
  };
  timers: {
    infLives: number;
    doubleXp: number;
  };
  drone: {
    active: boolean;
    x: number;
    y: number;
  };
  enemyBullets: EnemyBullet[];
  difficultyProfile: DifficultyProfile;
  victoryReached: boolean;
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
  maxWave: 60,
  wavesPerBlock: 5,
  playerSpeed: 220,
  playerBaseCooldown: 0.35,
  bulletSpeed: 380,
  droneBulletSpeed: 340,
  enemyCollisionX: 20,
  enemyCollisionY: 18,
  bulletHitX: 16,
  bulletHitY: 14,
  infLivesDuration: 10,
  doubleXpDuration: 16,
  droneFollowLerp: 0.2,
  droneOffsetX: 44,
  droneOffsetY: -28,
  droneCooldown: 0.72,
  waveClearScoreBonus: 350,
  waveClearCreditsBonus: 110,
  waveClearXpBonus: 80,
  defaultFireInterval: 1.25
};

const SHOP_ORDER: ShopItemId[] = [
  "extra_life_cap",
  "rapid_fire",
  "spread_shot",
  "piercing_rounds",
  "engine_boost",
  "hull_plating",
  "drone_unlock",
  "inf_lives_charge",
  "double_xp_charge"
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rngNext(state: GameState) {
  let t = (state.rngState += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  state.rngState = state.rngState >>> 0;
  return result;
}

function getDifficultyProfile(blockIndex: number): DifficultyProfile {
  return {
    blockIndex,
    rows: Math.min(10, 5 + Math.floor(blockIndex / 2)),
    cols: Math.min(13, 8 + Math.floor(blockIndex / 3)),
    formationSpeed: 28 + blockIndex * 7,
    stepDown: 18 + Math.floor(blockIndex / 2),
    diveBaseCooldown: Math.max(0.85, 2.8 - blockIndex * 0.18),
    diveVariance: Math.max(0.2, 1.5 - blockIndex * 0.04),
    diveSpeed: 190 + blockIndex * 14,
    simultaneousDivers: Math.min(3, 1 + Math.floor(blockIndex / 3)),
    enemyFireInterval: Math.max(0.35, 1.4 - blockIndex * 0.08),
    enemyBulletSpeed: 170 + blockIndex * 10,
    canvasWidth: Math.min(640, 480 + blockIndex * 14),
    canvasHeight: Math.min(860, 720 + blockIndex * 10)
  };
}

function resolveWaveBlock(wave: number) {
  return Math.floor((wave - 1) / BASE_CONFIG.wavesPerBlock);
}

function spawnEnemiesForProfile(state: GameState, profile: DifficultyProfile) {
  const enemies: Enemy[] = [];
  const spacingX = profile.canvasWidth / (profile.cols + 1);
  const spacingY = clamp(34 - profile.blockIndex, 20, 34);
  const originY = 96;
  let id = 0;

  for (let row = 0; row < profile.rows; row += 1) {
    for (let col = 0; col < profile.cols; col += 1) {
      const x = spacingX * (col + 1);
      const y = originY + row * spacingY;
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
        diveScore: 150 + profile.blockIndex * 20
      });
    }
  }

  state.enemies = enemies;
}

function getRapidFireCooldown(state: GameState) {
  const reduction = 1 - state.upgrades.rapidFire * 0.1;
  return BASE_CONFIG.playerBaseCooldown * clamp(reduction, 0.38, 1);
}

function getPlayerSpeed(state: GameState) {
  return BASE_CONFIG.playerSpeed * (1 + state.upgrades.engineBoost * 0.08);
}

function getInvulnWindow(state: GameState) {
  return 1.2 + state.upgrades.hullPlating * 0.2;
}

function getPierceCount(state: GameState) {
  return state.upgrades.piercingRounds;
}

function getWaveRewards(state: GameState) {
  const blockFactor = state.waveBlock + 1;
  return {
    score: BASE_CONFIG.waveClearScoreBonus + blockFactor * 90,
    credits: BASE_CONFIG.waveClearCreditsBonus + blockFactor * 45,
    xp: BASE_CONFIG.waveClearXpBonus + blockFactor * 34
  };
}

function awardProgress(state: GameState, baseCredits: number, baseXp: number, baseScore: number) {
  const xpMultiplier = state.timers.doubleXp > 0 ? 2 : 1;
  state.credits += Math.round(baseCredits);
  state.xp += Math.round(baseXp * xpMultiplier);
  state.score += Math.round(baseScore);
}

function getShopLevel(state: GameState, id: ShopItemId) {
  switch (id) {
    case "extra_life_cap":
      return state.upgrades.extraLifeCap;
    case "rapid_fire":
      return state.upgrades.rapidFire;
    case "spread_shot":
      return state.upgrades.spreadShot;
    case "piercing_rounds":
      return state.upgrades.piercingRounds;
    case "engine_boost":
      return state.upgrades.engineBoost;
    case "hull_plating":
      return state.upgrades.hullPlating;
    case "drone_unlock":
      return state.upgrades.droneUnlock;
    case "inf_lives_charge":
      return state.inventory.infLivesCharges;
    case "double_xp_charge":
      return state.inventory.doubleXpCharges;
  }
}

function getShopMaxLevel(id: ShopItemId) {
  switch (id) {
    case "extra_life_cap":
      return 3;
    case "rapid_fire":
      return 5;
    case "spread_shot":
      return 2;
    case "piercing_rounds":
      return 3;
    case "engine_boost":
      return 4;
    case "hull_plating":
      return 3;
    case "drone_unlock":
      return 1;
    case "inf_lives_charge":
    case "double_xp_charge":
      return null;
  }
}

function getShopCost(state: GameState, id: ShopItemId) {
  switch (id) {
    case "extra_life_cap":
      return 250 + state.upgrades.extraLifeCap * 150;
    case "rapid_fire":
      return 220 + state.upgrades.rapidFire * 140;
    case "spread_shot":
      return 420 + state.upgrades.spreadShot * 280;
    case "piercing_rounds":
      return 360 + state.upgrades.piercingRounds * 220;
    case "engine_boost":
      return 200 + state.upgrades.engineBoost * 120;
    case "hull_plating":
      return 260 + state.upgrades.hullPlating * 170;
    case "drone_unlock":
      return 900;
    case "inf_lives_charge":
      return 500;
    case "double_xp_charge":
      return 380;
  }
}

function getShopDescription(id: ShopItemId) {
  switch (id) {
    case "extra_life_cap":
      return "Increase max lives and heal 1 immediately.";
    case "rapid_fire":
      return "Reduce firing cooldown by 10% per level.";
    case "spread_shot":
      return "Add side bullets to each shot.";
    case "piercing_rounds":
      return "Bullets pass through additional enemies.";
    case "engine_boost":
      return "Increase ship movement speed.";
    case "hull_plating":
      return "Longer invulnerability after a hit.";
    case "drone_unlock":
      return "Unlock one autonomous support drone.";
    case "inf_lives_charge":
      return "Gain one Infinity Lives charge (E).";
    case "double_xp_charge":
      return "Gain one Double XP charge (Q).";
  }
}

export function getShopItems(state: GameState): ShopItem[] {
  return SHOP_ORDER.map((id) => {
    const cost = getShopCost(state, id);
    const level = getShopLevel(state, id);
    const maxLevel = getShopMaxLevel(id);
    return {
      id,
      name: id.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      cost,
      level,
      maxLevel,
      description: getShopDescription(id),
      affordable: state.credits >= cost && (maxLevel == null || level < maxLevel)
    };
  });
}

function applyShopPurchase(state: GameState, id: ShopItemId) {
  const cost = getShopCost(state, id);
  const maxLevel = getShopMaxLevel(id);
  const level = getShopLevel(state, id);
  if (maxLevel != null && level >= maxLevel) return false;
  if (state.credits < cost) return false;

  state.credits -= cost;

  switch (id) {
    case "extra_life_cap":
      state.upgrades.extraLifeCap += 1;
      state.maxLives = 3 + state.upgrades.extraLifeCap;
      state.lives = Math.min(state.maxLives, state.lives + 1);
      break;
    case "rapid_fire":
      state.upgrades.rapidFire += 1;
      break;
    case "spread_shot":
      state.upgrades.spreadShot += 1;
      break;
    case "piercing_rounds":
      state.upgrades.piercingRounds += 1;
      break;
    case "engine_boost":
      state.upgrades.engineBoost += 1;
      break;
    case "hull_plating":
      state.upgrades.hullPlating += 1;
      break;
    case "drone_unlock":
      state.upgrades.droneUnlock = 1;
      state.drone.active = true;
      break;
    case "inf_lives_charge":
      state.inventory.infLivesCharges += 1;
      break;
    case "double_xp_charge":
      state.inventory.doubleXpCharges += 1;
      break;
  }

  return true;
}

function getEnemyCandidates(state: GameState) {
  return state.enemies.filter((enemy) => enemy.alive && !enemy.diving);
}

function pickDiveTarget(state: GameState) {
  const candidates = getEnemyCandidates(state);
  if (candidates.length === 0) return null;
  const idx = Math.floor(rngNext(state) * candidates.length);
  return candidates[Math.min(idx, candidates.length - 1)];
}

function pickShooterEnemy(state: GameState) {
  const alive = state.enemies.filter((enemy) => enemy.alive);
  if (alive.length === 0) return null;
  const idx = Math.floor(rngNext(state) * alive.length);
  return alive[Math.min(idx, alive.length - 1)];
}

function resetEnemy(enemy: Enemy) {
  enemy.x = enemy.homeX;
  enemy.y = enemy.homeY;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.diving = false;
}

function setWaveProfile(state: GameState, wave: number) {
  state.waveBlock = resolveWaveBlock(wave);
  const profile = getDifficultyProfile(state.waveBlock);
  state.difficultyProfile = profile;
  state.width = profile.canvasWidth;
  state.height = profile.canvasHeight;
  state.formation.speed = profile.formationSpeed;
  state.formation.stepDown = profile.stepDown;
  state.player.y = state.height - 70;
}

function startWave(state: GameState) {
  setWaveProfile(state, state.wave);
  spawnEnemiesForProfile(state, state.difficultyProfile);
  state.bullets = [];
  state.enemyBullets = [];
  state.diveCooldown = state.difficultyProfile.diveBaseCooldown;
  state.diveTimer = state.diveCooldown;
  state.enemyFireTimer = BASE_CONFIG.defaultFireInterval;
  state.lastDiveEnemyId = null;
}

function activatePower(state: GameState, kind: "infLives" | "doubleXp") {
  if (kind === "infLives") {
    if (state.inventory.infLivesCharges <= 0) return;
    if (state.timers.infLives > 0) return;
    state.inventory.infLivesCharges -= 1;
    state.timers.infLives = BASE_CONFIG.infLivesDuration;
    return;
  }

  if (state.inventory.doubleXpCharges <= 0) return;
  if (state.timers.doubleXp > 0) return;
  state.inventory.doubleXpCharges -= 1;
  state.timers.doubleXp = BASE_CONFIG.doubleXpDuration;
}

function makeBullet(state: GameState, x: number, y: number, source: "player" | "drone") {
  return {
    x,
    y,
    vy: source === "player" ? -BASE_CONFIG.bulletSpeed : -BASE_CONFIG.droneBulletSpeed,
    pierce: getPierceCount(state),
    source
  } satisfies Bullet;
}

function shootPlayer(state: GameState) {
  const center = state.player.x;
  const baseY = state.player.y - 16;
  state.bullets.push(makeBullet(state, center, baseY, "player"));

  if (state.upgrades.spreadShot >= 1) {
    state.bullets.push(makeBullet(state, center - 13, baseY + 2, "player"));
    state.bullets.push(makeBullet(state, center + 13, baseY + 2, "player"));
  }

  if (state.upgrades.spreadShot >= 2) {
    state.bullets.push(makeBullet(state, center - 24, baseY + 4, "player"));
    state.bullets.push(makeBullet(state, center + 24, baseY + 4, "player"));
  }
}

function updateDrone(state: GameState, dt: number) {
  if (!state.drone.active) return;

  const targetX = state.player.x + BASE_CONFIG.droneOffsetX;
  const targetY = state.player.y + BASE_CONFIG.droneOffsetY;
  state.drone.x += (targetX - state.drone.x) * BASE_CONFIG.droneFollowLerp;
  state.drone.y += (targetY - state.drone.y) * BASE_CONFIG.droneFollowLerp;

  if (state.drone.cooldown > 0) {
    state.drone.cooldown = Math.max(0, state.drone.cooldown - dt);
  }

  if (state.drone.cooldown <= 0) {
    const target = pickShooterEnemy(state);
    if (target) {
      const drift = (target.x - state.drone.x) * 0.06;
      state.bullets.push({
        ...makeBullet(state, state.drone.x + drift, state.drone.y - 6, "drone")
      });
      state.drone.cooldown = BASE_CONFIG.droneCooldown;
    }
  }
}

function handleWaveClear(state: GameState) {
  const rewards = getWaveRewards(state);
  awardProgress(state, rewards.credits, rewards.xp, rewards.score);

  const clearedWave = state.wave;
  if (clearedWave >= state.maxWave) {
    state.mode = "victory";
    state.intermission.reason = "All 60 waves cleared.";
    state.intermission.nextBlock = state.waveBlock;
    return;
  }

  state.wave = clearedWave + 1;
  if (clearedWave % state.wavesPerBlock === 0) {
    state.mode = "intermission";
    state.intermission.reason = `Wave ${clearedWave} complete. Upgrade before block ${resolveWaveBlock(state.wave) + 1}.`;
    state.intermission.nextBlock = resolveWaveBlock(state.wave);
    state.bullets = [];
    state.enemyBullets = [];
    return;
  }

  startWave(state);
}

function processPlayerHits(state: GameState) {
  const player = state.player;
  const infiniteLivesActive = state.timers.infLives > 0;

  if (player.invuln > 0 || infiniteLivesActive) return;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const dx = Math.abs(enemy.x - player.x);
    const dy = Math.abs(enemy.y - player.y);
    if (dx < BASE_CONFIG.enemyCollisionX && dy < BASE_CONFIG.enemyCollisionY) {
      state.lives -= 1;
      state.hitsTaken += 1;
      player.invuln = getInvulnWindow(state);
      resetEnemy(enemy);
      if (state.lives <= 0) {
        state.mode = "gameover";
      }
      return;
    }
  }

  for (const bullet of state.enemyBullets) {
    const dx = Math.abs(bullet.x - player.x);
    const dy = Math.abs(bullet.y - player.y);
    if (dx < 12 && dy < 14) {
      state.lives -= 1;
      state.hitsTaken += 1;
      player.invuln = getInvulnWindow(state);
      bullet.y = state.height + 999;
      if (state.lives <= 0) {
        state.mode = "gameover";
      }
      return;
    }
  }
}

function processBulletHits(state: GameState) {
  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      if (Math.abs(dx) < BASE_CONFIG.bulletHitX && Math.abs(dy) < BASE_CONFIG.bulletHitY) {
        enemy.alive = false;
        const value = enemy.diving ? enemy.diveScore : 100 + state.waveBlock * 10;
        const credits = enemy.diving ? 24 + state.waveBlock * 6 : 16 + state.waveBlock * 4;
        const xp = enemy.diving ? 18 + state.waveBlock * 6 : 12 + state.waveBlock * 3;
        awardProgress(state, credits, xp, value);
        bullet.pierce -= 1;
        if (bullet.pierce < 0) {
          bullet.y = -999;
        }
        break;
      }
    }
  }

  state.bullets = state.bullets.filter((bullet) => bullet.y > -30);
}

function updateEnemies(state: GameState, dt: number) {
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
      if (enemy.y > state.height + 40 || enemy.x < -30 || enemy.x > state.width + 30) {
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
    handleWaveClear(state);
    return;
  }

  if (minX < Infinity) {
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
  }

  if (maxY > state.height - 150) {
    state.mode = "gameover";
  }
}

function updateDiveAttacks(state: GameState) {
  state.diveTimer -= 1 / 60;
  if (state.diveTimer > 0) return;

  for (let i = 0; i < state.difficultyProfile.simultaneousDivers; i += 1) {
    const target = pickDiveTarget(state);
    if (!target) break;
    target.diving = true;
    const dx = state.player.x - target.x;
    target.vx = dx * 0.62;
    target.vy = state.difficultyProfile.diveSpeed + rngNext(state) * 70;
    state.lastDiveEnemyId = target.id;
  }

  state.diveCooldown = state.difficultyProfile.diveBaseCooldown + rngNext(state) * state.difficultyProfile.diveVariance;
  state.diveTimer = state.diveCooldown;
}

function updateEnemyFire(state: GameState, dt: number) {
  state.enemyFireTimer -= dt;
  if (state.enemyFireTimer > 0) return;

  const shooter = pickShooterEnemy(state);
  if (shooter) {
    state.enemyBullets.push({
      x: shooter.x,
      y: shooter.y + 12,
      vy: state.difficultyProfile.enemyBulletSpeed
    });
  }

  state.enemyFireTimer = state.difficultyProfile.enemyFireInterval;
}

export function createGame(seed: number): GameState {
  const wave = 1;
  const waveBlock = resolveWaveBlock(wave);
  const profile = getDifficultyProfile(waveBlock);

  const state: GameState = {
    mode: "menu",
    width: profile.canvasWidth,
    height: profile.canvasHeight,
    seed,
    rngState: seed >>> 0,
    score: 0,
    wave,
    maxWave: BASE_CONFIG.maxWave,
    wavesPerBlock: BASE_CONFIG.wavesPerBlock,
    waveBlock,
    lives: 3,
    maxLives: 3,
    credits: 0,
    xp: 0,
    player: {
      x: profile.canvasWidth / 2,
      y: profile.canvasHeight - 70,
      w: 34,
      h: 18,
      speed: BASE_CONFIG.playerSpeed,
      cooldown: 0,
      invuln: 0
    },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    formation: {
      dir: 1,
      speed: profile.formationSpeed,
      stepDown: profile.stepDown
    },
    diveTimer: profile.diveBaseCooldown,
    diveCooldown: profile.diveBaseCooldown,
    lastDiveEnemyId: null,
    enemyFireTimer: BASE_CONFIG.defaultFireInterval,
    hitsTaken: 0,
    ticks: 0,
    upgrades: {
      extraLifeCap: 0,
      rapidFire: 0,
      spreadShot: 0,
      piercingRounds: 0,
      engineBoost: 0,
      hullPlating: 0,
      droneUnlock: 0
    },
    inventory: {
      infLivesCharges: 0,
      doubleXpCharges: 0
    },
    timers: {
      infLives: 0,
      doubleXp: 0
    },
    drone: {
      active: false,
      x: profile.canvasWidth / 2 + BASE_CONFIG.droneOffsetX,
      y: profile.canvasHeight - 95,
      cooldown: 0
    },
    difficultyProfile: profile,
    intermission: {
      reason: "",
      nextBlock: 0
    }
  };

  spawnEnemiesForProfile(state, profile);
  return state;
}

export function stepGame(state: GameState, input: InputState, dt: number) {
  if (state.mode === "menu") {
    if (input.start) {
      state.mode = "playing";
      startWave(state);
    }
    return;
  }

  if (input.restart) {
    const seed = state.seed;
    const next = createGame(seed);
    Object.assign(state, next);
    state.mode = "playing";
    startWave(state);
    return;
  }

  if (input.pause && (state.mode === "playing" || state.mode === "paused")) {
    state.mode = state.mode === "paused" ? "playing" : "paused";
  }

  if (state.mode === "intermission") {
    const items = getShopItems(state);
    if (input.shopBuyIndex != null) {
      const selected = items[input.shopBuyIndex];
      if (selected) {
        applyShopPurchase(state, selected.id);
      }
    }

    if (input.confirm) {
      state.mode = "playing";
      startWave(state);
    }
    return;
  }

  if (state.mode === "victory" || state.mode === "gameover" || state.mode === "paused") {
    return;
  }

  state.ticks += 1;

  if (input.activateInfLives) {
    activatePower(state, "infLives");
  }
  if (input.activateDoubleXp) {
    activatePower(state, "doubleXp");
  }

  state.timers.infLives = Math.max(0, state.timers.infLives - dt);
  state.timers.doubleXp = Math.max(0, state.timers.doubleXp - dt);

  const player = state.player;
  player.speed = getPlayerSpeed(state);

  if (player.invuln > 0) {
    player.invuln = Math.max(0, player.invuln - dt);
  }

  if (input.left) {
    player.x -= player.speed * dt;
  } else if (input.right) {
    player.x += player.speed * dt;
  }
  player.x = clamp(player.x, 24, state.width - 24);

  if (player.cooldown > 0) {
    player.cooldown = Math.max(0, player.cooldown - dt);
  }

  if (input.shoot && player.cooldown <= 0) {
    shootPlayer(state);
    player.cooldown = getRapidFireCooldown(state);
  }

  updateDrone(state, dt);

  for (const bullet of state.bullets) {
    bullet.y += bullet.vy * dt;
  }
  state.bullets = state.bullets.filter((bullet) => bullet.y > -28);

  for (const bullet of state.enemyBullets) {
    bullet.y += bullet.vy * dt;
  }
  state.enemyBullets = state.enemyBullets.filter((bullet) => bullet.y < state.height + 24);

  updateEnemies(state, dt);
  if (state.mode !== "playing") return;

  updateDiveAttacks(state);
  updateEnemyFire(state, dt);
  processBulletHits(state);
  processPlayerHits(state);
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
      vy: b.vy,
      pierce: b.pierce,
      source: b.source
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
    credits: state.credits,
    xp: state.xp,
    waveBlock: state.waveBlock,
    maxWave: state.maxWave,
    shop: {
      available: state.mode === "intermission",
      items: getShopItems(state)
    },
    upgrades: { ...state.upgrades },
    inventory: {
      infLivesCharges: state.inventory.infLivesCharges,
      doubleXpCharges: state.inventory.doubleXpCharges
    },
    timers: {
      infLives: Number(state.timers.infLives.toFixed(2)),
      doubleXp: Number(state.timers.doubleXp.toFixed(2))
    },
    drone: {
      active: state.drone.active,
      x: Math.round(state.drone.x),
      y: Math.round(state.drone.y)
    },
    enemyBullets: state.enemyBullets.map((b) => ({
      x: Math.round(b.x),
      y: Math.round(b.y),
      vy: b.vy
    })),
    difficultyProfile: { ...state.difficultyProfile },
    victoryReached: state.mode === "victory",
    coordinateSystem: {
      origin: "top-left",
      x: "right",
      y: "down",
      units: "pixels"
    }
  };
}
