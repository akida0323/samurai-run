let player;
let obstacles = [];
let coins = [];
let bgImg; 
let playerImg; // 信長の画像用
let score = 0;
let gameOver = false;
let gameClear = false;
let distance = 0; 
let goalDistance = 1000; 

// スマホ用ボタンの変数
let jumpButton;
let slashButton;

function preload() {
  // 背景画像を読み込みます
  bgImg = loadImage('bg.jpg');
  
  // ★重要★ 信長の画像（nobunaga.png）を読み込みます。
  // まだGitHubに画像を上げていなくてもエラーで画面が消えないように対策を入れました！
  playerImg = loadImage('nobunaga.png', 
    () => { console.log("信長画像の読み込み成功！"); }, 
    () => { console.log("信長画像はまだありません（予備の四角を表示します）"); }
  );
}

function setup() {
  createCanvas(800, 400);
  player = new Player();

  // --- 📱 スマホ・PC共通の「跳」「斬」ボタンの作成 ---
  // 跳（ジャンプ）ボタン
  jumpButton = createButton('跳');
  jumpButton.position(40, height - 90);
  styleButton(jumpButton, '#888888');
  jumpButton.mousePressed(() => { handleJump(); });

  // 斬（攻撃）ボタン
  slashButton = createButton('斬');
  slashButton.position(width - 120, height - 90);
  styleButton(slashButton, '#de3121');
  slashButton.mousePressed(() => { handleSlash(); });
}

// ボタンの見た目をかっこよくする関数
function styleButton(btn, bgColor) {
  btn.size(80, 80);
  btn.style('background-color', bgColor);
  btn.style('color', '#ffffff');
  btn.style('font-size', '24px');
  btn.style('font-weight', 'bold');
  btn.style('border-radius', '50%');
  btn.style('border', '2px solid #ffffff');
}

function draw() {
  // 背景の表示
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(220); 
  }

  // 地面（道）
  fill(50, 30, 20, 150);
  rect(0, height - 40, width, 40);

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
      
      // プレイヤーと敵がぶつかった時の判定
      if (player.hits(obstacles[i])) {
        // もし信長が「斬（攻撃）」状態なら敵を倒せる、そうでなければゲームオーバー
        if (player.isSlashing) {
          obstacles.splice(i, 1);
          score += 20; // 敵を倒したらボーナス
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

  // UI表示（タイトル、スコア、リトライ判定など）
  drawUI();
}

function drawUI() {
  textSize(32);
  textAlign(LEFT);
  fill(0);
  stroke(255);
  strokeWeight(4);
  textFont('Georgia');
  text("本能寺脱出！安土への道", 20, 50);

  // スコアと残り距離の枠
  textSize(20);
  noStroke();
  fill(255, 255, 255, 200);
  rect(width - 180, 20, 160, 60, 5);
  fill(0);
  text("金: " + score, width - 160, 45);
  let remaining = max(0, goalDistance - distance);
  text("安土まで: " + remaining + "m", width - 160, 70);

  // ゲームオーバー画面
  if (gameOver) {
    showEndScreen("無念！敵襲に倒る", "画面またはボタンクリックで再挑戦", color(255, 0, 0));
  }

  // ゲームクリア画面
  if (gameClear) {
    showEndScreen("祝！安土城へ帰還成る！", "織田信長の歴史が守られた！", color(0, 200, 0));
  }
}

function showEndScreen(title, sub, txtColor) {
  textAlign(CENTER);
  textSize(48);
  fill(txtColor);
  stroke(255);
  strokeWeight(4);
  text(title, width / 2, height / 2);
  textSize(20);
  noStroke();
  fill(0);
  text(sub, width / 2, height / 2 + 50);
}

// 操作処理の共通化
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

// PCのキーボード操作用（スペースでジャンプ、Xキーで斬る）
function keyPressed() {
  if (key === ' ') {
    handleJump();
  } else if (key === 'x' || key === 'X' || key === 'Enter') {
    handleSlash();
  }
}

function mousePressed() {
  // ボタン以外の画面をクリックしたときのリトライ用
  if (gameOver || gameClear) {
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
    this.r = 50; // 少し大きくしました
    this.x = 80;
    this.y = height - this.r - 40;
    this.vy = 0;
    this.gravity = 0.6;
    this.isSlashing = false; // 斬撃中かどうかのフラグ
    this.slashTimer = 0;
  }
  
  jump() {
    if (this.y === height - this.r - 40) {
      this.vy = -13;
    }
  }

  slash() {
    if (!this.isSlashing) {
      this.isSlashing = true;
      this.slashTimer = 15; // 15フレームの間、攻撃判定が出る
    }
  }

  update() {
    this.vy += this.gravity;
    this.y += this.vy;
    this.y = constrain(this.y, 0, height - this.r - 40);

    // 斬撃タイマーのカウントダウン
    if (this.isSlashing) {
      this.slashTimer--;
      if (this.slashTimer <= 0) {
        this.isSlashing = false;
      }
    }
  }

  show() {
    // 斬撃中はエフェクトを出す
    if (this.isSlashing) {
      fill(255, 255, 255, 150);
      arc(this.x + this.r, this.y + this.r/2, 80, 80, -PI/2, PI/2);
    }

    // 信長（プレイヤー）の画像表示
    if (playerImg && playerImg.width > 0) {
      image(playerImg, this.x, this.y, this.r, this.r);
    } else {
      // 画像がないときは青い四角（昨日の消えちゃった対策！）
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
    fill(255, 100, 0); // 敵（明智軍の足軽や火の粉のイメージ）
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

// 判定用関数
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
