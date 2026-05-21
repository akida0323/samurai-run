let player;
let obstacles = [];
let coins = [];
let bgImg, playerImg, enemyImg; 

// 🔊 音声用の変数
let sndJump, sndSlash, sndCoin;

let score = 0;
let gameOver = false;
let gameClear = false;
let distance = 0; 
let goalDistance = 1200; 

let jumpButton, slashButton;

function preload() {
  // 画像の読み込み
  bgImg = loadImage('bg.jpg');
  playerImg = loadImage('nobunaga.png');
  enemyImg = loadImage('enemy.png');
  
  // ★大改造：音の読み込みに失敗しても、ゲーム全体を絶対にストップさせない魔法の処理！
  soundFormats('mp3', 'wav');
  
  sndJump = loadSound('jump.mp3', 
    () => console.log("ジャンプ音 成功"), 
    (err) => console.log("ジャンプ音なしで続行します")
  );
  sndSlash = loadSound('slash.mp3', 
    () => console.log("斬撃音 成功"), 
    (err) => console.log("斬撃音なしで続行します")
  );
  sndCoin = loadSound('coin.mp3', 
    () => console.log("コイン音 成功"), 
    (err) => console.log("コイン音なしで続行します")
  );
}

function setup() {
  let canvasWidth = min(windowWidth - 20, 800);
  let canvasHeight = canvasWidth * 0.5; 
  createCanvas(canvasWidth, canvasHeight);
  
  player = new Player();

  // ボタン作成
  jumpButton = createButton('跳 (JUMP)');
  styleButton(jumpButton, '#555555');
  jumpButton.mousePressed(handleJump);

  slashButton = createButton('斬 (SLASH)');
  styleButton(slashButton, '#de3121');
  slashButton.mousePressed(handleSlash);

  let buttonContainer = createDiv('');
  buttonContainer.style('display', 'flex');
  buttonContainer.style('justify-content', 'space-between');
  buttonContainer.style('max-width', '800px');
  buttonContainer.style('margin', '15px auto 0');
  buttonContainer.style('padding', '0 10px');
  
  jumpButton.parent(buttonContainer);
  slashButton.parent(buttonContainer);
}

function styleButton(btn, bgColor) {
  btn.style('width', '45%');
  btn.style('height', '65px');
  btn.style('background-color', bgColor);
  btn.style('color', '#ffffff');
  btn.style('font-size', '22px');
  btn.style('font-weight', 'bold');
  btn.style('border-radius', '15px');
  btn.style('border', 'none');
  btn.style('box-shadow', '0 5px #333');
  btn.style('user-select', 'none');
}

function draw() {
  if (bgImg) {
    image(bgImg, 0, 0, width, height);
  } else {
    background(220); 
  }

  // 地面
  fill(40, 25, 15, 180);
  rect(0, height - 30, width, 30);

  if (!gameOver && !gameClear) {
    let currentSpeed = 1.5 + (distance * 0.001);
    distance += currentSpeed; 
    
    if (distance >= goalDistance) {
      gameClear = true;
    }

    player.update();
    player.show();

    // 敵の出現パターン（通常・高速・空中）
    if (frameCount % 75 === 0) {
      let rand = random(1);
      if (rand < 0.5) {
        obstacles.push(new Obstacle('normal'));
      } else if (rand < 0.8) {
        obstacles.push(new Obstacle('fast')); 
      } else {
        obstacles.push(new Obstacle('fly'));
      }
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].update();
      obstacles[i].show();
      
      if (player.hits(obstacles[i])) {
        if (player.isSlashing && obstacles[i].type !== 'fly') {
          obstacles.splice(i, 1);
          score += 20; 
          // 音が正常にロードされている時だけ安全に鳴らす
          try { if (sndSlash && sndSlash.isLoaded()) sndSlash.play(); } catch(e){}
        } else {
          gameOver = true;
        }
      } else if (obstacles[i].offscreen()) {
        obstacles.splice(i, 1);
      }
    }

    // コインの管理
    if (frameCount % 90 === 0) {
      coins.push(new Coin());
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].update();
      coins[i].show();
      if (player.pickUp(coins[i])) {
        score += 10;
        coins.splice(i, 1);
        try { if (sndCoin && sndCoin.isLoaded()) sndCoin.play(); } catch(e){}
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
  fill(255);
  stroke(0);
  strokeWeight(4);
  text("本能寺脱出！安土への道", 15, 35);

  noStroke();
  fill(0, 0, 0, 150);
  rect(width - 145, 10, 130, 55, 8);
  fill(255);
  textSize(14);
  text("金: " + score, width - 130, 30);
  let remaining = max(0, goalDistance - floor(distance));
  text("安土まで: " + remaining + "m", width - 130, 50);

  if (gameOver) {
    fill(255, 0, 0, 50);
    rect(0, 0, width, height);
    
    textAlign(CENTER);
    textSize(max(width * 0.06, 24));
    fill(255, 50, 50);
    stroke(0);
    strokeWeight(5);
    text("【無念】 本能寺に散る...", width / 2, height / 2 - 20);
    
    textSize(16);
    noStroke();
    fill(255);
    text("無念の炎が信長を包む。ボタンを押して再起せよ！", width / 2, height / 2 + 20);
  }

  if (gameClear) {
    fill(255, 215, 0, 40);
    rect(0, 0, width, height);

    textAlign(CENTER);
    textSize(max(width * 0.07, 28));
    fill(50, 255, 50);
    stroke(0);
    strokeWeight(6);
    text("🏆 祝・安土城へ帰還成る！ 🏆", width / 2, height / 2 - 20);
    
    textSize(18);
    noStroke();
    fill(255);
    text("天下布武の歴史は、ここから再び始まる！", width / 2, height / 2 + 25);
  }
}

function handleJump() {
  if (gameOver || gameClear) {
    resetGame();
  } else {
    if (player.jump()) {
      try { if (sndJump && sndJump.isLoaded()) sndJump.play(); } catch(e){}
    }
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
  if (key === ' ' || key === 'ArrowUp') handleJump();
  else if (key === 'x' || key === 'X' || key === 'Enter') handleSlash();
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
    this.r = height * 0.16; 
    this.x = width * 0.12;  
    this.y = height - this.r - 30;
    this.vy = 0;
    this.gravity = 0.75; 
    this.isSlashing = false; 
    this.slashTimer = 0;
  }
  
  jump() {
    if (this.y === height - this.r - 30) {
      this.vy = -14;
      return true;
    }
    return false;
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
      stroke(200, 240, 255, 230);
      strokeWeight(6);
      noFill();
      let angleStart = -PI / 3;
      let angleEnd = PI / 3;
      arc(this.x + this.r * 0.5, this.y + this.r * 0.5, this.r * 2.2, this.r * 2.2, angleStart, angleEnd);
      noStroke();
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
  constructor(type) {
    this.type = type;
    this.r = height * 0.14;
    this.x = width;
    
    if (this.type === 'normal') {
      this.w = this.r * 0.9;
      this.h = this.r;
      this.y = height - this.h - 30;
      this.speed = width * 0.01; 
    } else if (this.type === 'fast') {
      this.w = this.r * 1.3; 
      this.h = this.r * 1.1;
      this.y = height - this.h - 30;
      this.speed = width * 0.016; 
    } else if (this.type === 'fly') {
      this.w = width * 0.03;
      this.h = width * 0.03;
      this.y = random(height * 0.2, height * 0.5); 
      this.speed = width * 0.012;
    }
  }
  
  update() {
    this.x -= this.speed;
  }
  
  show() {
    if (this.type === 'normal') {
      if (enemyImg && enemyImg.width > 0) {
        image(enemyImg, this.x, this.y, this.w, this.h);
      } else {
        fill(255, 100, 0); rect(this.x, this.y, this.w, this.h);
      }
    } else if (this.type === 'fast') {
      if (enemyImg && enemyImg.width > 0) {
        image(enemyImg, this.x, this.y, this.w, this.h);
      } else {
        fill(150, 0, 100); rect(this.x, this.y, this.w, this.h);
      }
    } else if (this.type === 'fly') {
      fill(255, 50, 0);
      ellipse(this.x + this.w/2, this.y + this.h/2, this.w * 1.5);
    }
  }
  
  offscreen() {
    return this.x < -this.w;
  }
}

class Coin {
  constructor() {
    this.r = width * 0.018;
    this.x = width;
    this.y = random(height * 0.45, height - 100);
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
