const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Explicit declarations
const gameTitleElement = document.getElementById("gameTitle");

// Set game Title
gameTitleElement.innerHTML = "ROBO Maze";

const sprite = new Image();
sprite.src = "sprites/robot.png";

const block = new Image();
block.src = "sprites/block.png";

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;

const BLOCK_SIZE = 32;

// Game state
let gameState = "playing"; // "playing" or "won"

// Maze layout — same wallGrid pattern from game.js, just way more blocks
// Opening at top-left (start) and bottom-right (exit)
const wallGrid = [
  // Top border (leave col 1 open for the start)
  { col: 3, row: 0 },
  { col: 4, row: 0 },
  { col: 5, row: 0 },
  { col: 6, row: 0 },
  { col: 7, row: 0 },
  { col: 8, row: 0 },
  { col: 9, row: 0 },
  { col: 10, row: 0 },
  { col: 11, row: 0 },
  { col: 12, row: 0 },
  { col: 13, row: 0 },
  { col: 14, row: 0 },
  { col: 15, row: 0 },
  { col: 16, row: 0 },
  { col: 17, row: 0 },
  { col: 18, row: 0 },
  { col: 19, row: 0 },
  { col: 20, row: 0 },
  { col: 21, row: 0 },
  { col: 22, row: 0 },
  { col: 23, row: 0 },
  { col: 24, row: 0 },
  { col: 25, row: 0 },
  { col: 26, row: 0 },
  { col: 27, row: 0 },

  // Bottom border (leave col 26 open for the exit)
  { col: 0, row: 17 },
  { col: 1, row: 17 },
  { col: 2, row: 17 },
  { col: 3, row: 17 },
  { col: 4, row: 17 },
  { col: 5, row: 17 },
  { col: 6, row: 17 },
  { col: 7, row: 17 },
  { col: 8, row: 17 },
  { col: 9, row: 17 },
  { col: 10, row: 17 },
  { col: 11, row: 17 },
  { col: 12, row: 17 },
  { col: 13, row: 17 },
  { col: 14, row: 17 },
  { col: 15, row: 17 },
  { col: 16, row: 17 },
  { col: 17, row: 17 },
  { col: 18, row: 17 },
  { col: 19, row: 17 },
  { col: 20, row: 17 },
  { col: 21, row: 17 },
  { col: 22, row: 17 },
  { col: 23, row: 17 },
  { col: 24, row: 17 },
  { col: 25, row: 17 },
  { col: 27, row: 17 },

  // Left border
  { col: 0, row: 1 },
  { col: 0, row: 2 },
  { col: 0, row: 3 },
  { col: 0, row: 4 },
  { col: 0, row: 5 },
  { col: 0, row: 6 },
  { col: 0, row: 7 },
  { col: 0, row: 8 },
  { col: 0, row: 9 },
  { col: 0, row: 10 },
  { col: 0, row: 11 },
  { col: 0, row: 12 },
  { col: 0, row: 13 },
  { col: 0, row: 14 },
  { col: 0, row: 15 },
  { col: 0, row: 16 },

  // Right border
  { col: 27, row: 0 },
  { col: 27, row: 1 },
  { col: 27, row: 2 },
  { col: 27, row: 3 },
  { col: 27, row: 4 },
  { col: 27, row: 5 },
  { col: 27, row: 6 },
  { col: 27, row: 7 },
  { col: 27, row: 8 },
  { col: 27, row: 9 },
  { col: 27, row: 10 },
  { col: 27, row: 11 },
  { col: 27, row: 12 },
  { col: 27, row: 13 },
  { col: 27, row: 14 },
  { col: 27, row: 15 },
  { col: 27, row: 16 },

  // Interior maze walls — horizontal segments
  // Row 2: wall with gap
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 4, row: 2 },
  { col: 5, row: 2 },
  { col: 6, row: 2 },
  { col: 8, row: 2 },
  { col: 9, row: 2 },
  { col: 10, row: 2 },
  { col: 11, row: 2 },
  { col: 12, row: 2 },
  { col: 13, row: 2 },

  // Row 4: wall with gaps
  { col: 1, row: 4 },
  { col: 2, row: 4 },
  { col: 3, row: 4 },
  { col: 5, row: 4 },
  { col: 6, row: 4 },
  { col: 7, row: 4 },
  { col: 8, row: 4 },
  { col: 10, row: 4 },
  { col: 11, row: 4 },
  { col: 12, row: 4 },
  { col: 13, row: 4 },
  { col: 14, row: 4 },

  // Row 6: wall segments
  { col: 3, row: 6 },
  { col: 4, row: 6 },
  { col: 5, row: 6 },
  { col: 7, row: 6 },
  { col: 8, row: 6 },
  { col: 9, row: 6 },
  { col: 10, row: 6 },
  { col: 11, row: 6 },
  { col: 13, row: 6 },
  { col: 14, row: 6 },

  // Vertical wall dropping from row 2
  { col: 15, row: 2 },
  { col: 15, row: 3 },
  { col: 15, row: 4 },
  { col: 15, row: 5 },
  { col: 15, row: 6 },

  // Right side upper section
  { col: 17, row: 1 },
  { col: 17, row: 2 },
  { col: 17, row: 3 },
  { col: 19, row: 2 },
  { col: 20, row: 2 },
  { col: 21, row: 2 },
  { col: 22, row: 2 },
  { col: 23, row: 2 },
  { col: 25, row: 2 },
  { col: 25, row: 3 },
  { col: 25, row: 4 },

  // Right side row 4
  { col: 17, row: 4 },
  { col: 18, row: 4 },
  { col: 19, row: 4 },
  { col: 21, row: 4 },
  { col: 22, row: 4 },
  { col: 23, row: 4 },

  // Middle section rows 7-8
  { col: 1, row: 8 },
  { col: 2, row: 8 },
  { col: 3, row: 8 },
  { col: 4, row: 8 },
  { col: 5, row: 8 },
  { col: 7, row: 8 },
  { col: 8, row: 8 },
  { col: 9, row: 8 },

  // Vertical wall col 11
  { col: 11, row: 8 },
  { col: 11, row: 9 },
  { col: 11, row: 10 },
  { col: 11, row: 11 },

  // Right side middle
  { col: 15, row: 8 },
  { col: 16, row: 8 },
  { col: 17, row: 8 },
  { col: 18, row: 8 },
  { col: 19, row: 8 },
  { col: 17, row: 6 },
  { col: 18, row: 6 },
  { col: 19, row: 6 },
  { col: 20, row: 6 },
  { col: 21, row: 6 },
  { col: 23, row: 6 },
  { col: 24, row: 6 },
  { col: 25, row: 6 },
  { col: 25, row: 7 },
  { col: 25, row: 8 },

  { col: 21, row: 8 },
  { col: 22, row: 8 },
  { col: 23, row: 8 },

  // Row 10
  { col: 1, row: 10 },
  { col: 2, row: 10 },
  { col: 3, row: 10 },
  { col: 5, row: 10 },
  { col: 6, row: 10 },
  { col: 7, row: 10 },
  { col: 8, row: 10 },
  { col: 9, row: 10 },

  { col: 13, row: 10 },
  { col: 14, row: 10 },
  { col: 15, row: 10 },
  { col: 16, row: 10 },
  { col: 17, row: 10 },
  { col: 19, row: 10 },
  { col: 20, row: 10 },
  { col: 21, row: 10 },
  { col: 23, row: 10 },
  { col: 24, row: 10 },
  { col: 25, row: 10 },

  // Row 12
  { col: 2, row: 12 },
  { col: 3, row: 12 },
  { col: 4, row: 12 },
  { col: 5, row: 12 },
  { col: 6, row: 12 },
  { col: 8, row: 12 },
  { col: 9, row: 12 },
  { col: 10, row: 12 },
  { col: 11, row: 12 },

  // Vertical wall col 13
  { col: 13, row: 12 },
  { col: 13, row: 13 },
  { col: 13, row: 14 },

  { col: 15, row: 12 },
  { col: 16, row: 12 },
  { col: 17, row: 12 },
  { col: 18, row: 12 },
  { col: 19, row: 12 },
  { col: 21, row: 12 },
  { col: 22, row: 12 },
  { col: 23, row: 12 },
  { col: 24, row: 12 },
  { col: 25, row: 12 },

  // Row 14
  { col: 1, row: 14 },
  { col: 2, row: 14 },
  { col: 3, row: 14 },
  { col: 5, row: 14 },
  { col: 6, row: 14 },
  { col: 7, row: 14 },
  { col: 8, row: 14 },
  { col: 9, row: 14 },
  { col: 10, row: 14 },
  { col: 11, row: 14 },

  { col: 15, row: 14 },
  { col: 16, row: 14 },
  { col: 18, row: 14 },
  { col: 19, row: 14 },
  { col: 20, row: 14 },
  { col: 21, row: 14 },
  { col: 23, row: 14 },
  { col: 24, row: 14 },
  { col: 25, row: 14 },

  // Row 16: bottom corridor walls
  { col: 2, row: 16 },
  { col: 3, row: 16 },
  { col: 4, row: 16 },
  { col: 5, row: 16 },
  { col: 6, row: 16 },
  { col: 7, row: 16 },
  { col: 9, row: 16 },
  { col: 10, row: 16 },
  { col: 11, row: 16 },
  { col: 12, row: 16 },
  { col: 13, row: 16 },
  { col: 15, row: 16 },
  { col: 16, row: 16 },
  { col: 17, row: 16 },
  { col: 18, row: 16 },
  { col: 20, row: 16 },
  { col: 21, row: 16 },
  { col: 22, row: 16 },
  { col: 23, row: 16 },
  { col: 24, row: 16 },
];

const walls = wallGrid.map(({ col, row }) => ({
  x: col * BLOCK_SIZE,
  y: row * BLOCK_SIZE,
  width: BLOCK_SIZE,
  height: BLOCK_SIZE,
}));

// Goal zone — green square at the exit
const goal = {
  x: 26 * BLOCK_SIZE,
  y: 17 * BLOCK_SIZE,
  width: BLOCK_SIZE,
  height: BLOCK_SIZE,
};

// Collision detection
function Overlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

const animations = {
  down: { start: 0 },
  up: { start: 2 },
  right: { start: 4 },
  left: { start: 6 },
};

// Player starts top-left, just inside the entrance
const START_X = 1 * BLOCK_SIZE;
const START_Y = 1 * BLOCK_SIZE;

const player = {
  x: START_X,
  y: START_Y,

  // Player graphics
  width: 28, // made the player sprite smaller to fit between the blocks easier
  height: 28,
  frame: 0,
  frameTimer: 0,
  frameInterval: 12,
  direction: "down",

  // Player stats
  speed: 3,
  moving: false,
};

// Controller
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  // Space to restart after winning
  if (e.key === " " && gameState === "won") {
    restartGame();
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Reset everything back to the start
function restartGame() {
  player.x = START_X;
  player.y = START_Y;
  player.direction = "down";
  player.frame = 0;
  player.frameTimer = 0;
  gameState = "playing";
}

function update() {
  // Don't move if the game is over
  if (gameState !== "playing") return;

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

  for (const wall of walls) {
    if (Overlap(player, wall)) {
      player.y =
        player.y < wall.y ? wall.y - player.height : wall.y + wall.height;
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

  for (const wall of walls) {
    if (Overlap(player, wall)) {
      player.x =
        player.x < wall.x ? wall.x - player.width : wall.x + wall.width;
    }
  }

  // Keep player within the canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  // Animation
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

  // Did the player reach the exit?
  if (Overlap(player, goal)) {
    gameState = "won";
  }
}

function draw() {
  const anime = animations[player.direction];
  const frameIndex = anime.start + player.frame;
  const srcX = frameIndex * FRAME_WIDTH;
  const srcY = 0;

  // Background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal zone
  ctx.fillStyle = "#00ff66";
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

  // Labels
  ctx.fillStyle = "#ffcc00";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("START", START_X + BLOCK_SIZE / 2, START_Y - 8);
  ctx.fillStyle = "#00ff66";
  ctx.fillText("EXIT", goal.x + BLOCK_SIZE / 2, goal.y - 8);

  // Walls
  for (const wall of walls) {
    ctx.drawImage(block, wall.x, wall.y, wall.width, wall.height);
  }

  // Player
  ctx.drawImage(
    sprite,
    srcX,
    srcY,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    player.x,
    player.y,
    player.width,
    player.height,
  );

  // Win screen
  if (gameState === "won") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 64px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px monospace";
    ctx.fillText(
      "Press SPACE to restart",
      canvas.width / 2,
      canvas.height / 2 + 30,
    );
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

sprite.onload = function () {
  gameLoop();
};
