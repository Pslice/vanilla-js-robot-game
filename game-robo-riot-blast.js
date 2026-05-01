const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Explicit declarations
const gameTitleElement = document.getElementById("gameTitle");
gameTitleElement.innerHTML = "ROBO Riot Blast";

// Load sprites
const playerSprite = new Image();
playerSprite.src = "sprites/robot.png";
const blockSprite = new Image();
blockSprite.src = "sprites/block.png";
const strongBlockSprite = new Image();
strongBlockSprite.src = "sprites/strongblock.png";
const laserBallSprite = new Image();
laserBallSprite.src = "sprites/laser-ball.png";
const badRobotSprite = new Image();
badRobotSprite.src = "sprites/bad-robot.png";
const badLaserBallSprite = new Image();
badLaserBallSprite.src = "sprites/bad-laser-ball.png";

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;
const BLOCK_SIZE = 32;

// Animation frames (same layout for player and enemies)
const animations = {
  down: { start: 0 },
  up: { start: 2 },
  right: { start: 4 },
  left: { start: 6 },
};

const BLAST_SPEED = 5;
const BLAST_INTERVAL = 6;

// Game state
let gameState = "playing"; // "playing", "dead", "won"
let currentLevel = 0;
let score = 0;
const MAX_HEALTH = 3;
let health = MAX_HEALTH;
let invincibleTimer = 0; // brief invincibility after a hit

// Arrays that get rebuilt each level
let strongWalls = [];
let weakBlocks = [];
let enemies = [];
let playerBlasts = [];
let enemyBlasts = [];

// Collision detection
function Overlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Only checks strong walls
function collidesWithStrongWall(rect) {
  for (const wall of strongWalls) {
    if (Overlap(rect, wall)) return true;
  }
  return false;
}

// Checks both strong and weak walls
function collidesWithAnyWall(rect) {
  for (const wall of strongWalls) {
    if (Overlap(rect, wall)) return true;
  }
  for (const block of weakBlocks) {
    if (Overlap(rect, block)) return true;
  }
  return false;
}

// Each level function returns strong walls, weak blocks, enemy spawns, and start/goal positions

const levels = [
  // Level 1: Simple corridors
  function level1() {
    const strong = [];
    const weak = [];

    // Border (gap at top-left for entrance, bottom-right for exit)
    for (let col = 0; col <= 27; col++) {
      if (col !== 1) strong.push({ col, row: 0 });
      if (col !== 26) strong.push({ col, row: 17 });
    }
    for (let row = 1; row <= 16; row++) {
      strong.push({ col: 0, row });
      strong.push({ col: 27, row });
    }

    // Vertical corridor walls
    for (let row = 0; row <= 10; row++) strong.push({ col: 5, row: row + 2 });
    for (let row = 5; row <= 16; row++) strong.push({ col: 10, row });
    for (let row = 0; row <= 11; row++) strong.push({ col: 15, row: row + 2 });
    for (let row = 5; row <= 16; row++) strong.push({ col: 20, row });
    for (let row = 0; row <= 11; row++) strong.push({ col: 25, row: row + 2 });

    // Breakable blocks
    weak.push({ col: 2, row: 5 }, { col: 3, row: 5 });
    weak.push({ col: 2, row: 10 }, { col: 3, row: 10 }, { col: 4, row: 10 });
    weak.push({ col: 7, row: 3 }, { col: 8, row: 3 });
    weak.push({ col: 7, row: 8 }, { col: 8, row: 8 }, { col: 9, row: 8 });
    weak.push({ col: 12, row: 6 }, { col: 13, row: 6 });
    weak.push({ col: 12, row: 12 }, { col: 13, row: 12 }, { col: 14, row: 12 });
    weak.push({ col: 17, row: 3 }, { col: 18, row: 3 });
    weak.push({ col: 17, row: 9 }, { col: 18, row: 9 }, { col: 19, row: 9 });
    weak.push({ col: 22, row: 6 }, { col: 23, row: 6 });
    weak.push({ col: 22, row: 13 }, { col: 23, row: 13 });

    return {
      strongWallGrid: strong,
      weakBlockGrid: weak,
      enemySpawns: [
        { col: 3, row: 14, patrolDir: "up" },
        { col: 8, row: 14, patrolDir: "up" },
        { col: 13, row: 3, patrolDir: "down" },
      ],
      playerStart: { col: 1, row: 1 },
      goalPos: { col: 26, row: 16 },
    };
  },

  // Level 2: Rooms with doorways
  function level2() {
    const strong = [];
    const weak = [];

    // Border
    for (let col = 0; col <= 27; col++) {
      if (col !== 1) strong.push({ col, row: 0 });
      if (col !== 26) strong.push({ col, row: 17 });
    }
    for (let row = 1; row <= 16; row++) {
      strong.push({ col: 0, row });
      strong.push({ col: 27, row });
    }

    // Room 1 (top-left)
    for (let col = 1; col <= 8; col++) {
      if (col !== 4) strong.push({ col, row: 8 });
    }
    for (let row = 1; row <= 7; row++) {
      if (row !== 4) strong.push({ col: 9, row });
    }

    // Room 2 (top-right)
    for (let col = 18; col <= 26; col++) {
      if (col !== 22) strong.push({ col, row: 8 });
    }
    for (let row = 1; row <= 7; row++) {
      if (row !== 4) strong.push({ col: 17, row });
    }

    // Room 3 (bottom-center)
    for (let col = 8; col <= 19; col++) {
      if (col !== 13) strong.push({ col, row: 10 });
    }
    for (let row = 10; row <= 16; row++) {
      if (row !== 13) strong.push({ col: 8, row });
      if (row !== 13) strong.push({ col: 19, row });
    }

    // Corridor
    for (let col = 10; col <= 16; col++) {
      strong.push({ col, row: 8 });
    }

    // Breakable blocks
    // Room 1
    weak.push(
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 2, row: 3 },
      { col: 6, row: 5 },
      { col: 7, row: 5 },
      { col: 3, row: 6 },
      { col: 4, row: 6 },
      { col: 5, row: 6 },
    );
    // Room 2
    weak.push(
      { col: 20, row: 2 },
      { col: 21, row: 2 },
      { col: 22, row: 2 },
      { col: 24, row: 4 },
      { col: 25, row: 4 },
      { col: 19, row: 6 },
      { col: 20, row: 6 },
      { col: 21, row: 6 },
    );
    // Room 3
    weak.push(
      { col: 10, row: 12 },
      { col: 11, row: 12 },
      { col: 12, row: 12 },
      { col: 14, row: 12 },
      { col: 15, row: 12 },
      { col: 11, row: 14 },
      { col: 12, row: 14 },
      { col: 13, row: 14 },
      { col: 15, row: 14 },
      { col: 16, row: 14 },
    );
    // Corridors
    weak.push(
      { col: 12, row: 9 },
      { col: 14, row: 9 },
      { col: 3, row: 12 },
      { col: 4, row: 12 },
      { col: 23, row: 12 },
      { col: 24, row: 12 },
    );

    return {
      strongWallGrid: strong,
      weakBlockGrid: weak,
      enemySpawns: [
        { col: 5, row: 5, patrolDir: "right" },
        { col: 22, row: 5, patrolDir: "left" },
        { col: 14, row: 13, patrolDir: "left" },
        { col: 3, row: 15, patrolDir: "right" },
      ],
      playerStart: { col: 1, row: 1 },
      goalPos: { col: 26, row: 16 },
    };
  },

  // Level 3: Gauntlet
  function level3() {
    const strong = [];
    const weak = [];

    // Border
    for (let col = 0; col <= 27; col++) {
      if (col !== 1) strong.push({ col, row: 0 });
      if (col !== 26) strong.push({ col, row: 17 });
    }
    for (let row = 1; row <= 16; row++) {
      strong.push({ col: 0, row });
      strong.push({ col: 27, row });
    }

    // Zigzag walls — snake your way down
    // Row 4, gap on the right
    for (let col = 1; col <= 26; col++) {
      if (col < 22 || col > 23) strong.push({ col, row: 4 });
    }
    // Row 8, gap on the left
    for (let col = 1; col <= 26; col++) {
      if (col < 4 || col > 5) strong.push({ col, row: 8 });
    }
    // Row 12, gap on the right
    for (let col = 1; col <= 26; col++) {
      if (col < 22 || col > 23) strong.push({ col, row: 12 });
    }

    // Pillars for cover
    strong.push({ col: 8, row: 2 }, { col: 16, row: 2 });
    strong.push({ col: 12, row: 6 }, { col: 20, row: 6 });
    strong.push({ col: 8, row: 10 }, { col: 16, row: 10 });
    strong.push({ col: 12, row: 14 }, { col: 20, row: 14 });

    // Breakable blocks in each corridor (skip pillar positions)
    for (let col = 3; col <= 20; col += 3) {
      if (col !== 12) weak.push({ col, row: 2 });
      if (col + 1 !== 8 && col + 1 !== 16) weak.push({ col: col + 1, row: 2 });
    }
    weak.push({ col: 24, row: 2 }, { col: 25, row: 2 });
    weak.push(
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 10, row: 3 },
      { col: 11, row: 3 },
    );

    for (let col = 6; col <= 24; col += 3) {
      if (col !== 12) weak.push({ col, row: 6 });
      if (col + 1 !== 16) weak.push({ col: col + 1, row: 6 });
    }
    weak.push({ col: 2, row: 5 }, { col: 3, row: 5 });
    weak.push(
      { col: 15, row: 7 },
      { col: 16, row: 7 },
      { col: 24, row: 7 },
      { col: 25, row: 7 },
    );

    for (let col = 3; col <= 20; col += 3) {
      if (col !== 8) weak.push({ col, row: 10 });
      if (col + 1 !== 16) weak.push({ col: col + 1, row: 10 });
    }
    weak.push({ col: 24, row: 10 }, { col: 25, row: 10 });
    weak.push(
      { col: 2, row: 9 },
      { col: 3, row: 9 },
      { col: 10, row: 11 },
      { col: 11, row: 11 },
    );

    for (let col = 6; col <= 24; col += 3) {
      if (col !== 12) weak.push({ col, row: 14 });
      if (col + 1 !== 20) weak.push({ col: col + 1, row: 14 });
    }
    weak.push({ col: 2, row: 15 }, { col: 3, row: 15 });
    weak.push(
      { col: 15, row: 15 },
      { col: 16, row: 15 },
      { col: 24, row: 15 },
      { col: 25, row: 15 },
    );
    weak.push({ col: 10, row: 16 }, { col: 11, row: 16 });

    return {
      strongWallGrid: strong,
      weakBlockGrid: weak,
      enemySpawns: [
        { col: 14, row: 2, patrolDir: "right" },
        { col: 20, row: 6, patrolDir: "left" },
        { col: 2, row: 6, patrolDir: "right" },
        { col: 22, row: 10, patrolDir: "left" },
        { col: 2, row: 14, patrolDir: "right" },
        { col: 23, row: 14, patrolDir: "left" },
      ],
      playerStart: { col: 1, row: 1 },
      goalPos: { col: 26, row: 16 },
    };
  },
];

// Goal zone
let goal = { x: 0, y: 0, width: BLOCK_SIZE, height: BLOCK_SIZE };

// Player
const player = {
  x: 0,
  y: 0,
  width: 28, // make the player slightly smaller
  height: 28,
  frame: 0,
  frameTimer: 0,
  frameInterval: 12,
  direction: "down",
  speed: 3,
  moving: false,
};

// Build a level from its definition
function loadLevel(levelIndex) {
  const levelData = levels[levelIndex]();

  // Strong walls
  strongWalls = levelData.strongWallGrid.map(({ col, row }) => ({
    x: col * BLOCK_SIZE,
    y: row * BLOCK_SIZE,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }));

  // Weak blocks
  weakBlocks = levelData.weakBlockGrid.map(({ col, row }) => ({
    x: col * BLOCK_SIZE,
    y: row * BLOCK_SIZE,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
  }));

  // Enemies
  enemies = levelData.enemySpawns.map((spawn) => ({
    x: spawn.col * BLOCK_SIZE,
    y: spawn.row * BLOCK_SIZE,
    width: 32,
    height: 32,
    frame: 0,
    frameTimer: 0,
    frameInterval: 12,
    direction: spawn.patrolDir,
    speed: 1.5,
    moving: true,
    shootCooldown: 0,
  }));

  playerBlasts = [];
  enemyBlasts = [];

  goal.x = levelData.goalPos.col * BLOCK_SIZE;
  goal.y = levelData.goalPos.row * BLOCK_SIZE;

  player.x = levelData.playerStart.col * BLOCK_SIZE;
  player.y = levelData.playerStart.row * BLOCK_SIZE;
  player.direction = "down";
  player.frame = 0;
  player.frameTimer = 0;
}

// Shooting
function firePlayerBlast() {
  if (gameState !== "playing") return;

  const dirVel = {
    up: { vx: 0, vy: -BLAST_SPEED },
    down: { vx: 0, vy: BLAST_SPEED },
    left: { vx: -BLAST_SPEED, vy: 0 },
    right: { vx: BLAST_SPEED, vy: 0 },
  };
  const { vx, vy } = dirVel[player.direction];

  playerBlasts.push({
    x: player.x + player.width / 2 - FRAME_WIDTH / 2,
    y: player.y + player.height / 2 - FRAME_HEIGHT / 2,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    vx,
    vy,
    frame: 0,
    frameTimer: 0,
  });
}

// Enemy version of the same thing
function fireEnemyBlast(enemy) {
  const dirVel = {
    up: { vx: 0, vy: -BLAST_SPEED },
    down: { vx: 0, vy: BLAST_SPEED },
    left: { vx: -BLAST_SPEED, vy: 0 },
    right: { vx: BLAST_SPEED, vy: 0 },
  };
  const { vx, vy } = dirVel[enemy.direction];

  enemyBlasts.push({
    x: enemy.x + enemy.width / 2 - FRAME_WIDTH / 2,
    y: enemy.y + enemy.height / 2 - FRAME_HEIGHT / 2,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    vx,
    vy,
    frame: 0,
    frameTimer: 0,
  });
}

// Line-of-sight check — returns the direction to shoot if there's a clear path, null otherwise
function hasLineOfSight(enemy) {
  const eCenterX = enemy.x + enemy.width / 2;
  const eCenterY = enemy.y + enemy.height / 2;
  const pCenterX = player.x + player.width / 2;
  const pCenterY = player.y + player.height / 2;

  const alignedH = Math.abs(eCenterY - pCenterY) < BLOCK_SIZE / 2;
  const alignedV = Math.abs(eCenterX - pCenterX) < BLOCK_SIZE / 2;

  if (!alignedH && !alignedV) return null;

  // Which way is the player?
  let dir = null;
  if (alignedH) {
    dir = pCenterX < eCenterX ? "left" : "right";
  } else {
    dir = pCenterY < eCenterY ? "up" : "down";
  }

  // Step toward player checking for walls in the way
  const stepX = dir === "left" ? -BLOCK_SIZE : dir === "right" ? BLOCK_SIZE : 0;
  const stepY = dir === "up" ? -BLOCK_SIZE : dir === "down" ? BLOCK_SIZE : 0;

  let checkX = eCenterX + stepX;
  let checkY = eCenterY + stepY;

  const dist = Math.abs(alignedH ? pCenterX - eCenterX : pCenterY - eCenterY);
  const steps = Math.floor(dist / BLOCK_SIZE);

  for (let i = 0; i < steps; i++) {
    const probe = {
      x: checkX - 4,
      y: checkY - 4,
      width: 8,
      height: 8,
    };
    if (collidesWithStrongWall(probe)) return null;
    checkX += stepX;
    checkY += stepY;
  }

  return dir;
}

// Controller
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") {
    e.preventDefault();
    firePlayerBlast();
  }
  if (e.key === "Enter" && (gameState === "dead" || gameState === "won")) {
    restartGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function restartGame() {
  score = 0;
  currentLevel = 0;
  health = MAX_HEALTH;
  invincibleTimer = 0;
  loadLevel(currentLevel);
  gameState = "playing";
}

// Lose a hit — die if out of health, otherwise go briefly invincible
function takeDamage() {
  if (invincibleTimer > 0) return;
  health--;
  if (health <= 0) {
    gameState = "dead";
  } else {
    invincibleTimer = 90; // ~1.5 seconds of invincibility
  }
}

// Update
function update() {
  if (gameState !== "playing") return;

  // Tick down invincibility
  if (invincibleTimer > 0) invincibleTimer--;

  // Player movement
  player.moving = false;

  if (keys["ArrowUp"]) {
    player.y -= player.speed;
    player.direction = "up";
    player.moving = true;
  }
  if (keys["ArrowDown"]) {
    player.y += player.speed;
    player.direction = "down";
    player.moving = true;
  }
  // Wall collision (vertical)
  for (const wall of strongWalls) {
    if (Overlap(player, wall)) {
      player.y =
        player.y < wall.y ? wall.y - player.height : wall.y + wall.height;
    }
  }
  for (const block of weakBlocks) {
    if (Overlap(player, block)) {
      player.y =
        player.y < block.y ? block.y - player.height : block.y + block.height;
    }
  }

  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.direction = "left";
    player.moving = true;
  }
  if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.direction = "right";
    player.moving = true;
  }
  // Wall collision (horizontal)
  for (const wall of strongWalls) {
    if (Overlap(player, wall)) {
      player.x =
        player.x < wall.x ? wall.x - player.width : wall.x + wall.width;
    }
  }
  for (const block of weakBlocks) {
    if (Overlap(player, block)) {
      player.x =
        player.x < block.x ? block.x - player.width : block.x + block.width;
    }
  }

  // Keep in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  // Player animation
  if (player.moving) {
    player.frameTimer++;
    if (player.frameTimer >= player.frameInterval) {
      player.frameTimer = 0;
      player.frame = (player.frame + 1) % 2;
    }
  } else {
    player.frame = 1;
    player.frameTimer = 0;
  }

  // Enemy AI
  for (const enemy of enemies) {
    // Patrol movement
    const prevX = enemy.x;
    const prevY = enemy.y;

    if (enemy.direction === "left") enemy.x -= enemy.speed;
    if (enemy.direction === "right") enemy.x += enemy.speed;
    if (enemy.direction === "up") enemy.y -= enemy.speed;
    if (enemy.direction === "down") enemy.y += enemy.speed;

    // Hit a wall? Turn around
    let hitWall = false;
    for (const wall of strongWalls) {
      if (Overlap(enemy, wall)) {
        hitWall = true;
        break;
      }
    }
    if (!hitWall) {
      for (const block of weakBlocks) {
        if (Overlap(enemy, block)) {
          hitWall = true;
          break;
        }
      }
    }

    // Edge of canvas counts too
    if (
      enemy.x < 0 ||
      enemy.x + enemy.width > canvas.width ||
      enemy.y < 0 ||
      enemy.y + enemy.height > canvas.height
    ) {
      hitWall = true;
    }

    if (hitWall) {
      enemy.x = prevX;
      enemy.y = prevY;
      const reverse = {
        left: "right",
        right: "left",
        up: "down",
        down: "up",
      };
      enemy.direction = reverse[enemy.direction];
    }

    // Animate
    enemy.frameTimer++;
    if (enemy.frameTimer >= enemy.frameInterval) {
      enemy.frameTimer = 0;
      enemy.frame = (enemy.frame + 1) % 2;
    }

    // Shoot if they can see the player
    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    } else {
      const losDir = hasLineOfSight(enemy);
      if (losDir) {
        enemy.direction = losDir;
        fireEnemyBlast(enemy);
        enemy.shootCooldown = 90;
      }
    }
  }

  // Player blasts
  for (let i = playerBlasts.length - 1; i >= 0; i--) {
    const blast = playerBlasts[i];
    blast.x += blast.vx;
    blast.y += blast.vy;

    blast.frameTimer++;
    if (blast.frameTimer >= BLAST_INTERVAL) {
      blast.frameTimer = 0;
      blast.frame = (blast.frame + 1) % 2;
    }

    if (
      blast.x + blast.width < 0 ||
      blast.x > canvas.width ||
      blast.y + blast.height < 0 ||
      blast.y > canvas.height
    ) {
      playerBlasts.splice(i, 1);
      continue;
    }

    // Strong wall absorbs the blast
    let removed = false;
    for (const wall of strongWalls) {
      if (Overlap(blast, wall)) {
        playerBlasts.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    // Weak block = +1
    for (let j = weakBlocks.length - 1; j >= 0; j--) {
      if (Overlap(blast, weakBlocks[j])) {
        weakBlocks.splice(j, 1);
        playerBlasts.splice(i, 1);
        score += 1;
        removed = true;
        break;
      }
    }
    if (removed) continue;

    // Enemy = +5
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (Overlap(blast, enemies[j])) {
        enemies.splice(j, 1);
        playerBlasts.splice(i, 1);
        score += 5;
        break;
      }
    }
  }

  // Enemy blasts
  for (let i = enemyBlasts.length - 1; i >= 0; i--) {
    const blast = enemyBlasts[i];
    blast.x += blast.vx;
    blast.y += blast.vy;

    blast.frameTimer++;
    if (blast.frameTimer >= BLAST_INTERVAL) {
      blast.frameTimer = 0;
      blast.frame = (blast.frame + 1) % 2;
    }

    if (
      blast.x + blast.width < 0 ||
      blast.x > canvas.width ||
      blast.y + blast.height < 0 ||
      blast.y > canvas.height
    ) {
      enemyBlasts.splice(i, 1);
      continue;
    }

    // Absorbed by walls
    let removed = false;
    for (const wall of strongWalls) {
      if (Overlap(blast, wall)) {
        enemyBlasts.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    for (const block of weakBlocks) {
      if (Overlap(blast, block)) {
        enemyBlasts.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) continue;

    if (Overlap(blast, player)) {
      enemyBlasts.splice(i, 1);
      takeDamage();
      break;
    }
  }

  // Touching an enemy hurts too
  for (const enemy of enemies) {
    if (Overlap(player, enemy)) {
      takeDamage();
      if (gameState === "dead") return;
      break;
    }
  }

  // Reached the exit?
  if (Overlap(player, goal)) {
    if (currentLevel < levels.length - 1) {
      currentLevel++;
      loadLevel(currentLevel);
    } else {
      gameState = "won";
    }
  }
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "d8dee8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal
  ctx.fillStyle = "#00ff66";
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("EXIT", goal.x + BLOCK_SIZE / 2, goal.y - 2);

  // Walls + blocks
  for (const wall of strongWalls) {
    ctx.drawImage(strongBlockSprite, wall.x, wall.y, wall.width, wall.height);
  }

  for (const block of weakBlocks) {
    ctx.drawImage(blockSprite, block.x, block.y, block.width, block.height);
  }

  // Blasts
  for (const blast of enemyBlasts) {
    ctx.drawImage(
      badLaserBallSprite,
      0,
      blast.frame * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      blast.x,
      blast.y,
      blast.width,
      blast.height,
    );
  }

  for (const blast of playerBlasts) {
    ctx.drawImage(
      laserBallSprite,
      0,
      blast.frame * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      blast.x,
      blast.y,
      blast.width,
      blast.height,
    );
  }

  // Enemies
  for (const enemy of enemies) {
    const anime = animations[enemy.direction];
    const frameIndex = anime.start + enemy.frame;
    const srcX = frameIndex * FRAME_WIDTH;
    ctx.drawImage(
      badRobotSprite,
      srcX,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      enemy.x,
      enemy.y,
      enemy.width,
      enemy.height,
    );
  }

  // Player (blink when invincible)
  const drawPlayer =
    invincibleTimer === 0 || Math.floor(invincibleTimer / 4) % 2 === 0;
  if (drawPlayer) {
    const anime = animations[player.direction];
    const frameIndex = anime.start + player.frame;
    const srcX = frameIndex * FRAME_WIDTH;
    ctx.drawImage(
      playerSprite,
      srcX,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      player.x,
      player.y,
      player.width,
      player.height,
    );
  }

  // HUD bar
  const HUD_HEIGHT = 32;
  ctx.fillStyle = "rgba(220, 220, 220, 0.9)";
  ctx.fillRect(0, 0, canvas.width, HUD_HEIGHT);

  ctx.fillStyle = "#222222";
  ctx.font = "bold 18px monospace";
  ctx.textBaseline = "middle";
  const hudY = HUD_HEIGHT / 2;

  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 10, hudY);

  // Health icons (first frame of laser-ball.png)
  const iconSize = 20;
  const iconGap = 4;
  const healthStartX = 140;
  const iconY = (HUD_HEIGHT - iconSize) / 2;
  for (let i = 0; i < health; i++) {
    ctx.drawImage(
      laserBallSprite,
      0,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      healthStartX + i * (iconSize + iconGap),
      iconY,
      iconSize,
      iconSize,
    );
  }

  ctx.textAlign = "center";
  ctx.fillText(
    "Level: " + (currentLevel + 1) + " / " + levels.length,
    canvas.width / 2,
    hudY,
  );

  ctx.textAlign = "right";
  ctx.font = "14px monospace";
  ctx.fillStyle = "#555555";
  ctx.fillText("Arrows = move | Space = shoot", canvas.width - 10, hudY);

  // Death screen
  if (gameState === "dead") {
    ctx.fillStyle = "rgba(100, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 64px monospace";
    ctx.fillText("DESTROYED", canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "28px monospace";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#ffcc00";
    ctx.font = "22px monospace";
    ctx.fillText(
      "Press Enter to restart",
      canvas.width / 2,
      canvas.height / 2 + 60,
    );
  }

  // Win screen
  if (gameState === "won") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 64px monospace";
    ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "32px monospace";
    ctx.fillText(
      "Final Score: " + score,
      canvas.width / 2,
      canvas.height / 2 - 10,
    );

    ctx.fillStyle = "#ffcc00";
    ctx.font = "22px monospace";
    ctx.fillText(
      "Press Enter to restart",
      canvas.width / 2,
      canvas.height / 2 + 50,
    );
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Go
playerSprite.onload = () => {
  loadLevel(currentLevel);
  gameLoop();
};
