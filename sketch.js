let player;
let obstacles = [];
let coins = [];
let bgImg; // 背景画像をいれる変数
let score = 0;
let gameOver = false;
let gameClear = false;
let distance = 0; // 走った距離
let goalDistance = 1000; // ゴール（安土城）までの距離（1000m）

function preload() {
  // bg.jpg という名前の背景画像を読み込みます
  bgImg = loadImage('bg.jpg');
}

function setup() {
  createCanvas(800, 400);
  player = new Player();
}

function draw() {
  // 背景に画像を画面サイズ（横800、縦400）に合わせて表示
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(220); // 画像がない場合の予備背景
  }

  // 地面や火の粉をイメージした簡易的な演出
  fill(50, 30, 20, 150);
  rect(0, height - 40, width, 40);

  if (!gameOver && !gameClear) {
    distance += 1; // 距離を進める
    
    // ゴール判定
    if (distance >= goalDistance) {
      gameClear = true;
    }

    player.update();
    player.show();

    // 障害物の管理
    if (frameCount % 90 === 0) {
      obstacles.push(new Obstacle());
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].update();
      obstacles[i].show();
      if (player.hits(obstacles[i])) {
        gameOver = true;
      }
      if (obstacles[i].offscreen()) {
        obstacles.splice(i, 1);
      }
    }

    // コインの管理
    if (frameCount % 120 === 0) {
      coins.push(new Coin());
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].update();
      coins[i].show();
      if (player.pickUp(coins[i])) {
        score += 10;
        coins.splice(i, 1);
      } else if (coins[i].offscreen()) {
        coins.splice(i, 1);
      }
    }
  }

  // UI表示（タイトルやスコア）
  drawUI();
}

function drawUI() {
  // タイトル表示
  textSize(32);
  textAlign(LEFT);
  fill(0);
  stroke(255);
  strokeWeight(4);
  textFont('Georgia');
  text("本能寺脱出！安土への道", 20, 50);

  // スコアと残り距離
  textSize(20);
  noStroke();
  fill(255);
  rect(width - 180, 20, 160, 60, 5);
  fill(0);
  text("金: " + score, width - 160, 45);
  let remaining = max(0, goalDistance - distance);
  text("安土まで: " + remaining + "m", width - 160, 70);

  // ゲームオーバー画面
  if (gameOver) {
    textAlign(CENTER);
    textSize(48);
    fill(255, 0, 0);
    text("無念！敵襲に倒る", width / 2, height / 2);
    textSize(20);
    fill(0);
    text("画面クリックで再挑戦", width / 2, height / 2 + 50);
  }

  // ゲームクリア画面
  if (gameClear) {
    textAlign(CENTER);
    textSize(48);
    fill(0, 200, 0);
    text("祝！安土城へ帰還成る！", width / 2, height / 2);
    textSize(20);
    fill(0);
    text("織田信長の歴史が守られた！", width / 2, height / 2 + 50);
  }
}

function mousePressed() {
  if (gameOver || gameClear) {
    resetGame();
  } else {
    player.jump();
  }
}

function keyPressed() {
  if (key === ' ') {
    if (gameOver || gameClear) {
      resetGame();
    } else {
      player.jump();
    }
  }
}

function resetGame() {
  gameOver = false;
  gameClear = false;
  distance = 0;
  score = 0;
  obstacles = [];
  coins = [];
  player = new Player();
}

// 以下、プレイヤー・障害物・コインの基本クラス（裏側の仕組み）
class Player {
  constructor() {
    this.r = 40;
    this.x = 50;
    this.y = height - this.r - 40;
    this.vy = 0;
    this.gravity = 0.6;
  }
  jump() {
    if (this.y === height - this.r - 40) {
      this.vy = -13;
    }
  }
  hits(obstacle) {
    return collideRectRect(this.x, this.y, this.r, this.r, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  }
  pickUp(coin) {
    return collideRectCircle(this.x, this.y, this.r, this.r, coin.x, coin.y, coin.r * 2);
  }
  update() {
    this.vy += this.gravity;
    this.y += this.vy;
    this.y = constrain(this.y, 0, height - this.r - 40);
  }
  show() {
    fill(0, 102, 153); // 今はまだ青い四角（のちに信長に変えます！）
    rect(this.x, this.y, this.r, this.r);
  }
}

class Obstacle {
  constructor() {
    this.w = 30;
    this.h = 50;
    this.x = width;
    this.y = height - this.h - 40;
    this.speed = 6;
  }
  update() {
    this.x -= this.speed;
  }
  show() {
    fill(255, 100, 0); // 障害物（火の粉や敵兵のイメージ）
    rect(this.x, this.y, this.w, this.h);
  }
  offscreen() {
    return this.x < -this.w;
  }
}

class Coin {
  constructor() {
    this.r = 10;
    this.x = width;
    this.y = random(150, height - 100);
    this.speed = 4;
  }
  update() {
    this.x -= this.speed;
  }
  show() {
    fill(255, 215, 0);
    ellipse(this.x, this.y, this.r * 2);
  }
  offscreen() {
    return this.x < -this.r * 2;
  }
}

// 簡易当たり判定用関数
function collideRectRect(x, y, w, h, x2, y2, w2, h2) {
  return x + w >= x2 && x <= x2 + w2 && y + h >= y2 && y <= y2 + h2;
}
function collideRectCircle(rx, ry, rw, rh, cx, cy, diameter) {
  let testX = cx; let testY = cy;
  if (cx < rx) testX = rx; else if (cx > rx + rw) testX = rx + rw;
  if (cy < ry) testY = ry; else if (cy > ry + rh) testY = ry + rh;
  let d = dist(cx, cy, testX, testY);
  return d <= diameter / 2;
}
