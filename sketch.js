let player;
let obstacles = [];
let coins = [];
let bgImg; 
let playerImg; 
let score = 0;
let gameOver = false;
let gameClear = false;
let distance = 0; 
let goalDistance = 1000; 

// ボタンの変数
let jumpButton;
let slashButton;

function preload() {
  bgImg = loadImage('bg.jpg');
  playerImg = loadImage('nobunaga.png', 
    () => { console.log("信長画像の読み込み成功！"); }, 
    () => { console.log("信長画像はまだありません（予備の四角を表示します）"); }
  );
}

function setup() {
  // パソコンでもスマホでも画面に収まるように自動調整する設定
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = canvasWidth * 0.5; // 横長の比率を維持
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('game-container'); // 画面の真ん中に配置するための設定

  player = new Player();

  // --- 📱 スマホ・PC共通ボタンの位置を画面サイズに合わせて調整 ---
  // 跳（ジャンプ）ボタン：左下、信長と重ならない位置
  jumpButton = createButton('跳');
  jumpButton.position(20, height - 110);
  styleButton(jumpButton, '#888888');
  // 反応を速くするため、クリックだけでなくタッチが始まった瞬間に動くように強化！
  jumpButton.mousePressed(handleJump);
  jumpButton.touchStarted(handleJump);

  // 斬（攻撃）ボタン：右下
  slashButton = createButton('斬');
  slashButton.position(width - 100, height - 110);
  styleButton(slashButton, '#de3121');
  slashButton.mousePressed(handleSlash);
  slashButton.touchStarted(handleSlash);
}

// 画面のサイズが途中で変わっても崩れないようにする魔法の命令
function windowResized() {
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = canvasWidth * 0.5;
  resizeCanvas(canvasWidth, canvasHeight);
  
  // ボタンの位置も画面に合わせて自動で引っ越し
  jumpButton.position(20, height - 110);
  slashButton.position(width - 100, height - 110);
}

function styleButton(btn, bgColor) {
  btn.size(80, 80);
  btn.style('background-color', bgColor);
  btn.style('color', '#ffffff');
  btn.style('font-size', '24px');
  btn.style('font-weight', 'bold');
  btn.style('border-radius', '50%');
  btn.style('border', '2px solid #ffffff');
  btn.style('user-select', 'none'); // 連打したときに文字が選択されないようにする設定
}

function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(220); 
  }

  // 地面（道）
  fill(50, 30, 20, 150);
  rect(0, height - 30, width, 30);

  if (!gameOver && !gameClear) {
    distance += 1; 
    
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
        if (player.isSlashing) {
          obstacles.splice(i, 1);
          score += 20; 
        } else {
          gameOver = true;
        }
      } else if (obstacles[i].offscreen()) {
        obstacles.splice(i, 1);
      }
    }

    // コイン（金）の管理
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

  drawUI();
}

function drawUI() {
  // タイトルの文字サイズも画面幅に合わせて少し小さく調整
  textSize(width * 0.045);
  textAlign(LEFT);
  fill(0);
  stroke(255);
  strokeWeight(3);
  text("本能寺脱出！安土への道", 20, 40);

  // スコアと残り距離の枠
  textSize(16);
  noStroke();
  fill(255, 255, 255, 200);
  rect(width - 150, 15, 130, 55, 5);
  fill(0);
  text("金: " + score, width - 135, 35);
  let remaining = max(0, goalDistance - distance);
  text("安土まで: " + remaining + "m", width - 135, 60);

  if (gameOver) {
    showEndScreen("無念！敵襲に倒る", "画面またはボタンクリックで再挑戦", color(255, 0, 0));
  }

  if (gameClear) {
    showEndScreen("祝！安土城へ帰還成る！", "織田信長の歴史が守られた！", color(0, 200, 0));
  }
}

function showEndScreen(title, sub, txtColor) {
  textAlign(CENTER);
  textSize(width * 0.06);
  fill(txtColor);
  stroke(255);
  strokeWeight(4);
  text(title, width / 2, height / 2);
  textSize(16);
  noStroke();
  fill(0);
  text(sub, width / 2, height / 2 + 40);
}

function handleJump() {
  if (gameOver || gameClear) {
    resetGame();
  } else {
    player.jump();
  }
}

function handleSlash() {
  if (gameOver || gameClear) {
    resetGame();
  } else {
    player.slash();
  }
}

function keyPressed() {
  if (key === ' ') {
    handleJump();
  } else if (key === 'x' || key === 'X' || key === 'Enter') {
    handleSlash();
  }
}

function mousePressed() {
  if ((gameOver || gameClear) && mouseY < height - 120) {
    resetGame();
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

// --- キャラクターの仕組み ---
class Player {
  constructor() {
    this.r = height * 0.12; // 画面の高さに合わせたサイズに変更
    this.x = width * 0.25;  // ★初期位置を右にずらしてボタンと重ならないようにしました！
    this.y = height - this.r - 30;
    this.vy = 0;
    this.gravity = 0.6;
    this.isSlashing = false; 
    this.slashTimer = 0;
  }
  
  jump() {
    if (this.y === height - this.r - 30) {
      this.vy = -12;
    }
  }

  slash() {
    if (!this.isSlashing) {
      this.isSlashing = true;
      this.slashTimer = 12; 
    }
  }

  update() {
    this.vy += this.gravity;
    this.y += this.vy;
    this.y = constrain(this.y, 0, height - this.r - 30);

    if (this.isSlashing) {
      this.slashTimer--;
      if (this.slashTimer <= 0) {
        this.isSlashing = false;
      }
    }
  }

  show() {
    if (this.isSlashing) {
      fill(255, 255, 255, 180);
      arc(this.x + this.r, this.y + this.r/2, this.r * 1.5, this.r * 1.5, -PI/2, PI/2);
    }

    if (playerImg && playerImg.width > 0) {
      image(playerImg, this.x, this.y, this.r, this.r);
    } else {
      fill(0, 102, 153);
      rect(this.x, this.y, this.r, this.r);
    }
  }

  hits(obstacle) {
    return collideRectRect(this.x, this.y, this.r, this.r, obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  }

  pickUp(coin) {
    return collideRectCircle(this.x, this.y, this.r, this.r, coin.x, coin.y, coin.r * 2);
  }
}

class Obstacle {
  constructor() {
    this.w = width * 0.04;
    this.h = height * 0.12;
    this.x = width;
    this.y = height - this.h - 30;
    this.speed = width * 0.008; // 画面サイズに合わせた速度
  }
  update() {
    this.x -= this.speed;
  }
  show() {
    fill(255, 100, 0); 
    rect(this.x, this.y, this.w, this.h);
  }
  offscreen() {
    return this.x < -this.w;
  }
}

class Coin {
  constructor() {
    this.r = width * 0.015;
    this.x = width;
    this.y = random(height * 0.3, height - 80);
    this.speed = width * 0.005;
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
