const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Explicit declarations
const gameTitleElement = document.getElementById("gameTitle");

// Set game Title
gameTitleElement.innerHTML = "ROBO Raid";

const playerSprite = new Image();
playerSprite.src = "sprites/robot.png";
const blockSprite = new Image();
blockSprite.src = "sprites/block.png";
const laserBallSprite = new Image();
laserBallSprite.src = "sprites/laser-ball.png";

const animations = {
  down: { start: 0 },
  up: { start: 2 },
  right: { start: 4 },
  left: { start: 6 },
};

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;
const BLOCK_SIZE = 32;

const laserBlast = {
  BLAST_SPEED: 5,
  BLAST_INTERVAL: 6,
};
const blasts = [];

// Game state + stats
let gameState = "playing"; // "playing" or "won"
let blocksDestroyed = 0;
let totalBlocks = 0;
let startTime = 0;
let endTime = 0;

// Block formations — each function returns a different { col, row } layout
// A random one gets picked each round
const formations = [
  // Formation 0: Grid fortress
  function gridFortress() {
    const grid = [];
    for (let row = 1; row <= 5; row++) {
      for (let col = 2; col <= 12; col++) {
        if (col % 3 !== 0) {
          // leave every 3rd column open
          grid.push({ col, row });
        }
      }
    }
    for (let row = 8; row <= 12; row++) {
      for (let col = 15; col <= 25; col++) {
        if (col % 3 !== 1) {
          grid.push({ col, row });
        }
      }
    }
    return grid;
  },

  // Formation 1: Diamonds
  function diamonds() {
    const grid = [];
    const diamondPoints = [
      [0, -3],
      [0, -2],
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [-1, -2],
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [-1, 2],
      [1, -2],
      [1, -1],
      [1, 0],
      [1, 1],
      [1, 2],
      [-2, -1],
      [-2, 0],
      [-2, 1],
      [2, -1],
      [2, 0],
      [2, 1],
      [-3, 0],
      [3, 0],
    ];
    // Two diamonds
    for (const [dr, dc] of diamondPoints) {
      grid.push({ col: 7 + dc, row: 5 + dr });
      grid.push({ col: 21 + dc, row: 12 + dr });
    }
    // Drop anything that landed off-screen
    return grid.filter(
      (b) => b.col >= 0 && b.col <= 27 && b.row >= 0 && b.row <= 17,
    );
  },

  // Formation 2: Clusters
  function clusters() {
    const grid = [];
    // 3x3 block clusters spread around the map
    const clusterOrigins = [
      { col: 2, row: 1 },
      { col: 8, row: 2 },
      { col: 14, row: 1 },
      { col: 20, row: 3 },
      { col: 5, row: 7 },
      { col: 11, row: 8 },
      { col: 18, row: 7 },
      { col: 24, row: 9 },
      { col: 3, row: 13 },
      { col: 9, row: 12 },
      { col: 16, row: 14 },
      { col: 22, row: 13 },
    ];
    for (const origin of clusterOrigins) {
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          grid.push({ col: origin.col + dc, row: origin.row + dr });
        }
      }
    }
    return grid;
  },

  // Formation 3: Walls
  function verticalWalls() {
    const grid = [];
    const columns = [3, 7, 11, 15, 19, 23];
    for (const col of columns) {
      for (let row = 1; row <= 16; row++) {
        // Leave gaps at rows 5 and 11 so the player can move through
        if (row !== 5 && row !== 11) {
          grid.push({ col, row });
        }
      }
    }
    return grid;
  },

  // Formation 4: Spiral
  function spiral() {
    const grid = [];
    // Top row
    for (let col = 2; col <= 25; col++) grid.push({ col, row: 1 });
    // Right side down
    for (let row = 2; row <= 15; row++) grid.push({ col: 25, row });
    // Bottom going left
    for (let col = 5; col <= 24; col++) grid.push({ col, row: 15 });
    // Left side going up
    for (let row = 4; row <= 14; row++) grid.push({ col: 5, row });
    // Inner top
    for (let col = 6; col <= 22; col++) grid.push({ col, row: 4 });
    // Inner right
    for (let row = 5; row <= 12; row++) grid.push({ col: 22, row });
    // Inner bottom
    for (let col = 8; col <= 21; col++) grid.push({ col, row: 12 });
    // Inner left
    for (let row = 7; row <= 11; row++) grid.push({ col: 8, row });
    // Center piece
    for (let col = 9; col <= 18; col++) grid.push({ col, row: 7 });
    return grid;
  },
];

// Pick a random formation and fill the walls array
let walls = [];

function generateWalls() {
  const randomIndex = Math.floor(Math.random() * formations.length);
  const wallGrid = formations[randomIndex]();
  walls.length = 0; // clear the array
  for (const { col, row } of wallGrid) {
    walls.push({
      x: col * BLOCK_SIZE,
      y: row * BLOCK_SIZE,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
    });
  }
  totalBlocks = walls.length;
  blocksDestroyed = 0;
}

const START_X = 14 * BLOCK_SIZE;
const START_Y = 9 * BLOCK_SIZE;

const player = {
  x: START_X,
  y: START_Y,
  width: 32,
  height: 32,
  frame: 0,
  frameTimer: 0,
  frameInterval: 12,
  direction: "down",
  speed: 3,
  moving: false,
};

function rectsOverLap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function fireBlast() {
  if (gameState !== "playing") return;

  const directionVelocity = {
    up: { vx: 0, vy: -laserBlast.BLAST_SPEED },
    down: { vx: 0, vy: laserBlast.BLAST_SPEED },
    left: { vx: -laserBlast.BLAST_SPEED, vy: 0 },
    right: { vx: laserBlast.BLAST_SPEED, vy: 0 },
  };
  const { vx, vy } = directionVelocity[player.direction];

  blasts.push({
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

// Controller
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") fireBlast();
  if (e.key === "Enter" && gameState === "won") restartGame();
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Reset and roll a new formation
function restartGame() {
  player.x = START_X;
  player.y = START_Y;
  player.direction = "down";
  player.frame = 0;
  player.frameTimer = 0;
  blasts.length = 0;
  generateWalls();
  startTime = Date.now();
  gameState = "playing";
}

// Turn ms into a readable time like "12.3s" or "1:05.2"
function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);
  if (minutes > 0) {
    return minutes + ":" + String(seconds).padStart(2, "0") + "." + tenths;
  }
  return seconds + "." + tenths + "s";
}

function update() {
  if (gameState !== "playing") return;

  player.moving = false;

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
  for (const wall of walls) {
    if (rectsOverLap(player, wall)) {
      player.x =
        player.x < wall.x ? wall.x - player.width : wall.x + wall.width;
    }
  }

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
  for (const wall of walls) {
    if (rectsOverLap(player, wall)) {
      player.y =
        player.y < wall.y ? wall.y - player.height : wall.y + wall.height;
    }
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

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

  // Update blasts and check for wall hits
  for (let i = blasts.length - 1; i >= 0; i--) {
    const blast = blasts[i];
    blast.x += blast.vx;
    blast.y += blast.vy;

    blast.frameTimer++;
    if (blast.frameTimer >= laserBlast.BLAST_INTERVAL) {
      blast.frameTimer = 0;
      blast.frame = (blast.frame + 1) % 2;
    }

    const offScreen =
      blast.x + blast.width < 0 ||
      blast.x > canvas.width ||
      blast.y + blast.height < 0 ||
      blast.y > canvas.height;

    if (offScreen) {
      blasts.splice(i, 1);
      continue;
    }

    let hitWall = false;
    for (let j = walls.length - 1; j >= 0; j--) {
      if (rectsOverLap(blast, walls[j])) {
        walls.splice(j, 1);
        blocksDestroyed++;
        hitWall = true;
      }
    }
    if (hitWall) blasts.splice(i, 1);
  }

  // All blocks gone = win
  if (walls.length === 0) {
    endTime = Date.now();
    gameState = "won";
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw walls
  for (const wall of walls) {
    ctx.drawImage(blockSprite, wall.x, wall.y, wall.width, wall.height);
  }

  // Draw blasts
  for (const blast of blasts) {
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

  // Draw player
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

  // HUD
  ctx.fillStyle = "#dd0000";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText("Blocks: " + blocksDestroyed + " / " + totalBlocks, 10, 10);

  if (gameState === "playing") {
    const elapsed = Date.now() - startTime;
    ctx.fillText("Time: " + formatTime(elapsed), 10, 34);
  }

  ctx.fillStyle = "#888888";
  ctx.font = "14px monospace";
  ctx.textAlign = "right";
  ctx.fillText("Arrow keys = move | Space = shoot", canvas.width - 10, 10);

  // Win screen
  if (gameState === "won") {
    const finalTime = endTime - startTime;

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 64px monospace";
    ctx.fillText("RAID COMPLETE", canvas.width / 2, canvas.height / 2 - 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "28px monospace";
    ctx.fillText(
      "Blocks destroyed: " + blocksDestroyed,
      canvas.width / 2,
      canvas.height / 2 - 10,
    );
    ctx.fillText(
      "Time: " + formatTime(finalTime),
      canvas.width / 2,
      canvas.height / 2 + 30,
    );

    ctx.fillStyle = "#ffcc00";
    ctx.font = "22px monospace";
    ctx.fillText(
      'Press "ENTER" for a new formation',
      canvas.width / 2,
      canvas.height / 2 + 90,
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
  generateWalls();
  startTime = Date.now();
  gameLoop();
};
