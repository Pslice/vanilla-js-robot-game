const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Explicit declarations
const playerObjectElement = document.getElementById("playerObject");

// Set game Title
const gameTitleElement = document.getElementById("gameTitle");
gameTitleElement.innerHTML = "ROBO Basics";

const sprite = new Image();
sprite.src = "sprites/robot.png";

const block = new Image();
block.src = "sprites/block.png";

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 16;

const BLOCK_SIZE = 32;

const wallGrid = [
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
  { col: 4, row: 1 },
  { col: 5, row: 1 },
  // uncommit to add a row 3 blocks below
  // { col: 1, row: 4 },
  // { col: 2, row: 4 },
  // { col: 3, row: 4 },
  // { col: 4, row: 4 },
  // { col: 5, row: 4 },
];

const walls = wallGrid.map(({ col, row }) => ({
  x: col * BLOCK_SIZE,
  y: row * BLOCK_SIZE,
  width: BLOCK_SIZE,
  height: BLOCK_SIZE,
}));

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

const player = {
  // Starting position
  x: 200,
  y: 140,

  // Player graphics
  width: 32, // actual pixel art is 16 pixels so this will make the robot appear twice as big
  height: 32,
  frame: 0,
  frameTimer: 0,
  frameInterval: 12,
  direction: "down",

  // Player stats
  speed: 3,
  moving: false,
};

//controller
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function update() {
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

  playerObjectElement.innerHTML = JSON.stringify(player);
}

function draw() {
  const anime = animations[player.direction];
  const frameIndex = anime.start + player.frame;
  const srcX = frameIndex * FRAME_WIDTH;
  const srcY = 0;

  // Background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2); // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect

  // Place the walls
  for (const wall of walls) {
    ctx.drawImage(block, wall.x, wall.y, wall.width, wall.height);
  }

  // Place the player
  ctx.drawImage(
    //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
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
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

sprite.onload = function () {
  gameLoop();
};
