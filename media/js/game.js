const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 20;
const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 300;

const PLAYER_MAX_SPEED = 5;
const LASER_MAX_SPEED = 5;
const LASER_COOLDOWN = 20;

const GAME_STATE = {
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  playerX: 0,
  playerY: 0,
  laserCooldown: 0,
  enemies: [],
  lasers: [],
  enemyLasers: [],
  gameOver: false
};

function rectsIntersect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function clamp(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function rand(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}

function setPosition(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function createEnemy(container, x, y) {
  const element = document.createElement("img");
  element.src = "media/img/enemy-blue-1.png";
  element.className = "enemy";
  container.appendChild(element);
  const enemy = {
    x,
    y,
    dx: 0,
    dy: 0,
    element,
    cooldown: rand(ENEMY_COOLDOWN / 2, ENEMY_COOLDOWN * 2)
  };
  GAME_STATE.enemies.push(enemy);
}

function createPlayer(container, x, y) {
  const player = document.createElement("img");
  player.src = "media/img/player-blue-1.png";
  player.className = "player";
  container.appendChild(player);
}

function createLaser(container, x, y) {
  const element = document.createElement("img");
  element.src = "media/img/laser-blue-1.png";
  element.className = "laser";
  container.appendChild(element);
  const laser = { x, y, element };
  GAME_STATE.lasers.push(laser);
  const audio = new Audio("media/sound/sfx-laser1.ogg");
  audio.play();
}

function createEnemyLaser(container, x, y) {
  const element = document.createElement("img");
  element.src = "media/img/laser-red-5.png";
  element.className = "enemy-laser";
  container.appendChild(element);
  const laser = { x, y, element };
  GAME_STATE.enemyLasers.push(laser);
}

function init() {
  const container = document.querySelector(".game");
  const enemySpacing =
    (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);

  for (let j = 0; j < 3; j++) {
    const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
    for (let i = 0; i < ENEMIES_PER_ROW; i++) {
      const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
      createEnemy(container, x, y);
    }
  }

  GAME_STATE.playerX = GAME_WIDTH / 2;
  GAME_STATE.playerY = GAME_HEIGHT - 50;
  createPlayer(container, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updatePlayer() {
  const player = document.querySelector(".player");
  setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function destroyLaser(container, laser) {
  container.removeChild(laser.element);
  laser.isDead = true;
}

function destroyEnemy(container, enemy) {
  container.removeChild(enemy.element);
  enemy.isDead = true;
}

function destroyPlayer(container, player) {
  container.removeChild(player);
  GAME_STATE.gameOver = true;
  const audio = new Audio("media/sound/sfx-lose.ogg");
  audio.play();
}

function updateLasers(container) {
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y -= LASER_MAX_SPEED;
    if (laser.y < 0) {
      destroyLaser(container, laser);
    }
    setPosition(laser.element, laser.x, laser.y);
    const r1 = laser.element.getBoundingClientRect();
    const enemies = GAME_STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.element.getBoundingClientRect();
      if (rectsIntersect(r1, r2)) {
        // Enemy was hit
        destroyEnemy(container, enemy);
        destroyLaser(container, laser);
        break;
      }
    }
  }
  GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}

function updateEnemyLasers(container) {
  const lasers = GAME_STATE.enemyLasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y += LASER_MAX_SPEED;
    if (laser.y > GAME_HEIGHT) {
      destroyLaser(container, laser);
    }
    setPosition(laser.element, laser.x, laser.y);
    const r1 = laser.element.getBoundingClientRect();
    const player = document.querySelector(".player");
    const r2 = player.getBoundingClientRect();
    if (rectsIntersect(r1, r2)) {
      // Player was hit
      destroyPlayer(container, player);
      break;
    }
  }
  GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

function updateEnemies(container) {
  const dx = Math.sin(Date.now() / 1000.0) * 50;
  const dy = Math.cos(Date.now() / 1000.0) * 10;

  const enemies = GAME_STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    enemy.dx = dx;
    enemy.dy = dy;
    const x = enemy.x + enemy.dx;
    const y = enemy.y + enemy.dy;
    setPosition(enemy.element, x, y);
    enemy.cooldown -= 1;
    if (enemy.cooldown <= 0) {
      enemy.cooldown = ENEMY_COOLDOWN;
      createEnemyLaser(container, x, y);
    }
  }
  GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function playerHasWon() {
  const enemies = document.querySelectorAll(".enemy");
  return enemies.length === 0;
}

function update() {
  const container = document.querySelector(".game");

  if (GAME_STATE.gameOver) {
    document.querySelector(".game-over").style.display = "block";
    return;
  }

  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += PLAYER_MAX_SPEED;
  }

  GAME_STATE.playerX = clamp(
    GAME_STATE.playerX,
    PLAYER_WIDTH,
    GAME_WIDTH - PLAYER_WIDTH
  );

  if (GAME_STATE.spacePressed && GAME_STATE.laserCooldown === 0) {
    createLaser(container, GAME_STATE.playerX, GAME_STATE.playerY);
    GAME_STATE.laserCooldown += LASER_COOLDOWN;
  }
  if (GAME_STATE.laserCooldown > 0) {
    GAME_STATE.laserCooldown -= 1;
  }
  updatePlayer();
  updateLasers(container);
  updateEnemies(container);
  updateEnemyLasers(container);
  if (playerHasWon()) {
    document.querySelector(".congratulations").style.display = "block";
  }

  window.requestAnimationFrame(update);
}

function onKeyDown(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = true;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = true;
  }
}

function onKeyUp(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = false;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = false;
  }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

window.requestAnimationFrame(update);
