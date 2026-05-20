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

let jumpButton;
let slashButton;

function preload() {
  bgImg = loadImage('bg.jpg');
  playerImg = loadImage('nobunaga.png', 
    () => { console.log("信長画像の読み込み成功！"); }, 
    () => { console.log("信長画像はまだありません"); }
  );
}

function setup() {
  // パソコンでもスマホでも綺麗に収まるサイズ
  let canvasWidth = min(windowWidth - 20, 800);
  let canvasHeight = canvasWidth * 0.5; 
  let canvas = createCanvas(canvasWidth, canvasHeight);
  
  // ゲームを画面の真ん中に寄せるためのちょっとした設定
  canvas.style('display', 'block');
  canvas.style('margin', '0 auto');

  player = new Player();

  // --- 📱 ボタンをゲーム画面の「真下」に完全に独立させて配置！ ---
  // こうすることで、ゲーム画面の中の信長と絶対にかぶりません。
  
  // 跳（ジャンプ）ボタン
  jumpButton = createButton('跳 (JUMP)');
  styleButton(jumpButton, '#888888');
  // 最速で反応させるため、あらゆるタッチ・クリックイベントを網羅！
  jumpButton.elt.addEventListener('touchstart', (e) => { e.preventDefault(); handleJump(); }, {passive: false});
  jumpButton.mousePressed(handleJump);

  // 斬（攻撃）ボタン
  slashButton = createButton('斬 (SLASH)');
  styleButton(slashButton, '#de3121');
  slashButton.elt.addEventListener('touchstart', (e) => { e.preventDefault(); handleSlash(); }, {passive: false});
  slashButton.mousePressed(handleSlash);

  // ボタンを横並びにするための入れ物（コンテナ）を自動で作る
  let buttonContainer = createDiv('');
  buttonContainer.style('display', 'flex');
  buttonContainer.style('justify-content', 'space-between');
  buttonContainer.style('max-width', '800px');
  buttonContainer.style('margin', '15px auto 0');
  buttonContainer.style('padding', '0 10px');
  
  // ボタンを入れ物の中に引っ越しさせる
  jumpButton.parent(buttonContainer);
  slashButton.parent(buttonContainer);
}

function styleButton(btn, bgColor) {
  // スマホで押しやすいように、横に少し広いクッションみたいな形にします
  btn.style('width', '45%');
  btn.style('height', '60px');
  btn.style('background-color', bgColor);
  btn.style('color', '#ffffff');
  btn.style('font-size', '22px');
  btn.style('font-weight', 'bold');
  btn.style('border-radius', '12px');
  btn.style('border', 'none');
  btn.style('box-shadow', '0 4px #666');
  btn.style('user-select', 'none');
  btn.style('-webkit-user-select', 'none');
  btn.style('-webkit-touch-callout', 'none');
}

function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(220); 
  }

  // 地面
  fill(50, 30, 20, 150);
  rect(0, height - 30, width, 30);

  if (!gameOver && !gameClear) {
    distance += 1.5; // 少しだけ爽快感を出すためにスピードアップ！
    
    if (distance >= goalDistance) {
      gameClear = true;
    }

    player.update();
    player.show();

    if (frameCount % 80 === 0) {
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

    if (frameCount % 100 === 0) {
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
  textSize(max(width * 0.045, 16));
  textAlign(LEFT);
  fill(0);
  stroke(255);
  strokeWeight(3);
  text("本能寺脱出！安土への道", 15, 35);

  // スコア表示
  textSize(14);
  noStroke();
  fill(255, 255, 255, 200);
  rect(width - 135, 10, 120, 50, 5);
  fill(0);
  text("金: " + score, width - 120, 28);
  let remaining = max(0, goalDistance - floor(distance));
  text("安土まで: " + remaining + "m", width - 120, 48);

  if (gameOver) {
    showEndScreen("無念！敵襲に倒る", "ボタンを押して再挑戦", color(255, 0, 0));
  }

  if (gameClear) {
    showEndScreen("祝！安土城へ帰還成る！", "織田信長の歴史が守られた！", color(0, 200, 0));
  }
}

function showEndScreen(title, sub, txtColor) {
  textAlign(CENTER);
  textSize(max(width * 0.06, 20));
  fill(txtColor);
  stroke(255);
  strokeWeight(4);
  text(title, width / 2, height / 2);
  textSize(14);
  noStroke();
  fill(0);
  text(sub, width / 2, height / 2 + 35);
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

// PCのキーボードでも遊べます
function keyPressed() {
  if (key === ' ' || key === 'ArrowUp') {
    handleJump();
  } else if (key === 'x' || key === 'X' || key === 'Enter') {
    handleSlash();
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

class Player {
  constructor() {
    this.r = height * 0.15; 
    this.x = width * 0.15;  // 完全に独立したので、信長を少し左に戻して走るスペースを広く確保
    this.y = height - this.r - 30;
    this.vy = 0;
    this.gravity = 0.7; // ズバッと着地するように少し重力を強化
    this.isSlashing = false; 
    this.slashTimer = 0;
  }
  
  jump() {
    if (this.y === height - this.r - 30) {
      this.vy = -14;
    }
  }

  slash() {
    if (!this.isSlashing) {
      this.isSlashing = true;
      this.slashTimer = 10; 
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
      fill(255, 255, 255, 200);
      // 斬撃エフェクト
      arc(this.x + this.r, this.y + this.r/2, this.r * 1.6, this.r * 1.6, -PI/3, PI/3);
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
    this.h = height * 0.14;
    this.x = width;
    this.y = height - this.h - 30;
    this.speed = width * 0.01; 
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
    this.r = width * 0.018;
    this.x = width;
    this.y = random(height * 0.3, height - 80);
    this.speed = width * 0.007;
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
