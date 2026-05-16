let player;
let arrows = [];
let coins = []; 
let petals = []; 
let enemyNinjas = []; // 弓兵（忍）のリスト
let stage = 1;
let score = 0;
let goalX = 10000; 
let isGameOver = false;
let isClear = false;

// 音用の変数
let slashSound;
let coinSound;

function setup() {
  createCanvas(800, 450);
  
  // 刀の「シュッ」
  slashSound = new p5.Noise('white');
  slashSound.amp(0);
  slashSound.start();
  
  // 小判の「チャリン」（高いサイン波）
  coinSound = new p5.Oscillator('triangle');
  coinSound.amp(0);
  coinSound.start();
  
  resetGame();
}

function draw() {
  if (stage % 2 === 1) {
    background(10, 15, 40);
  } else {
    drawSunset();
  }
  
  if (isGameOver) {
    showScreen("無念...", "再挑戦するには画面をタッチ");
    return;
  }
  
  if (isClear) {
    if (petals.length < 100) {
      for(let i=0; i<5; i++) petals.push(new Petal());
    }
    drawPetals();
    showScreen("天晴！", "お宝を手に入れた！ 次の幕へ");
    return;
  }

  drawScenery();
  
  let treasure = drawTreasure(); 
  if (treasure && dist(player.x, player.y, treasure.x, treasure.y) < 40) {
    isClear = true;
  }

  player.update();
  player.display();

  // 弓兵（忍）の描画
  for (let i = enemyNinjas.length - 1; i >= 0; i--) {
    enemyNinjas[i].display();
    enemyNinjas[i].timer--;
    if (enemyNinjas[i].timer < 0) enemyNinjas.splice(i, 1);
  }

  // 小判の生成
  if (frameCount % 60 === 0 && !isClear) {
    coins.push(new Coin());
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].update();
    coins[i].display();
    if (dist(player.x, player.y, coins[i].x, coins[i].y) < 30) {
      coins.splice(i, 1);
      score += 50; 
      playCoinSound(); // チャリン！
    } else if (coins[i].x < 0) {
      coins.splice(i, 1);
    }
  }

  // 弓矢と弓兵の同時生成
  if (frameCount % max(15, 60 - stage * 3) === 0 && !isClear) {
    let arrowY = random(200, 330);
    arrows.push(new Arrow(stage, arrowY));
    enemyNinjas.push(new EnemyNinja(arrowY)); // 矢と同じ高さに忍が登場
  }

  for (let i = arrows.length - 1; i >= 0; i--) {
    arrows[i].update();
    arrows[i].display();
    if (player.isAttacking && dist(player.x + 30, player.y, arrows[i].x, arrows[i].y) < 60) {
      arrows.splice(i, 1);
      score += 10;
      continue;
    }
    if (dist(player.x, player.y, arrows[i].x, arrows[i].y) < 25) {
      isGameOver = true;
    }
    if (arrows[i] && arrows[i].x < 0) arrows.splice(i, 1);
  }

  drawUI();
  drawButtons();
}

// 小判の音（高い音を短く鳴らす）
function playCoinSound() {
  coinSound.freq(1200);
  coinSound.amp(0.3, 0.05);
  setTimeout(() => {
    coinSound.freq(1500); // 少し音程を上げてキラキラ感を出す
    setTimeout(() => coinSound.amp(0, 0.1), 50);
  }, 50);
}

function playSlashSound() {
  slashSound.amp(0.3, 0.01);
  setTimeout(() => slashSound.amp(0, 0.1), 100);
}

// 敵の弓兵クラス
class EnemyNinja {
  constructor(y) {
    this.x = width - 40;
    this.y = y;
    this.timer = 30; // 少しの間だけ表示
  }
  display() {
    push();
    translate(this.x, this.y);
    fill(20, 20, 20); // 黒装束
    rect(-10, -15, 20, 30, 5);
    fill(50); // 頭巾
    ellipse(0, -20, 18, 18);
    stroke(150); // 弓
    noFill();
    arc(-15, 0, 30, 40, -PI/2, PI/2);
    pop();
  }
}

// --- キーボード操作の追加 ---
function keyPressed() {
  if (key === ' ' || keyCode === UP_ARROW) {
    player.jump();
  }
  if (key === 'f' || key === 'F' || key === 'Enter') {
    player.attack();
  }
}

function mousePressed() {
  if (isGameOver) { stage = 1; score = 0; resetGame(); }
  else if (isClear) { stage++; resetGame(); }
  else {
    if (mouseX < width / 2) player.jump();
    else player.attack();
  }
}

// (背景・他クラスは調整済みで継続)
function drawSunset() {
  for (let y = 0; y < 400; y++) {
    let inter = map(y, 0, 400, 0, 1);
    let c = lerpColor(color(255, 100, 0), color(255, 200, 100), inter);
    stroke(c); line(0, y, width, y);
  }
}

function drawScenery() {
  if(stage % 2 === 1) { fill(255, 255, 200, 200); ellipse(650, 80, 60, 60); }
  fill(20, 25, 50, 150);
  triangle(0, 350, 200, 150, 400, 350); triangle(300, 350, 550, 100, 800, 350);
  fill(50, 40, 30); rect(0, 350, width, 100);
}

function drawTreasure() {
  let tX = width - (player.worldX - (goalX - 100));
  if (tX < width + 100) {
    let tY = 320;
    push(); translate(tX, tY); fill(150, 100, 50); rect(-25, -20, 50, 40);
    fill(255, 215, 0); rect(-5, -15, 10, 10); stroke(0); line(-25, -5, 25, -5); pop();
    return { x: tX, y: tY };
  }
  return null;
}

function drawButtons() {
  textAlign(CENTER, CENTER); textSize(24);
  fill(100, 100, 100, 150); ellipse(80, height - 70, 80, 80); fill(255); text("跳", 80, height - 70);
  fill(200, 50, 50, 150); ellipse(width - 80, height - 70, 80, 80); fill(255); text("斬", width - 80, height - 70);
}

class Coin {
  constructor() { this.x = width; this.y = random(150, 280); }
  update() { if(!isClear) this.x -= 5; }
  display() { fill(255, 215, 0); stroke(200, 150, 0); ellipse(this.x, this.y, 15, 22); }
}

class Samurai {
  constructor() {
    this.x = 100; this.y = 330; this.vy = 0; this.gravity = 0.8; this.jumpPower = -16;
    this.worldX = 0; this.isAttacking = false; this.attackTimer = 0; this.animCount = 0;
  }
  update() {
    if(isClear) return;
    this.vy += this.gravity; this.y += this.vy;
    if (this.y > 330) { this.y = 330; this.vy = 0; }
    this.worldX += 5; this.animCount += 0.15;
    if (this.isAttacking) { this.attackTimer--; if (this.attackTimer <= 0) this.isAttacking = false; }
  }
  display() {
    push();
    let bodyBob = (this.y === 330 && !isClear) ? sin(this.animCount * 2) * 2 : 0;
    translate(this.x, this.y + bodyBob);
    fill(20, 20, 40);
    let legMove = (this.y === 330 && !isClear) ? sin(this.animCount * 2) * 15 : 0;
    rect(-10 + legMove/2, 10, 12, 15); rect(-5 - legMove/2, 10, 12, 15);
    fill(40, 80, 180); rotate(0.05); rect(-15, -20, 30, 35, 5);
    push(); translate(0, -30 + bodyBob/2);
    fill(255, 224, 189); ellipse(0, 0, 30, 32); fill(0); ellipse(8, -2, 3, 5);
    fill(200, 0, 0); rect(-15, -10, 30, 5);
    let ribbonSway = cos(this.animCount) * 10; triangle(-15, -8, -35, -15 + ribbonSway, -30, -5 + ribbonSway);
    fill(0); beginShape(); vertex(-2, -15); vertex(5, -25); vertex(15, -20); vertex(8, -12); endShape(CLOSE);
    pop();
    if (this.isAttacking) { stroke(230, 230, 250); strokeWeight(4); noFill(); arc(25, 0, 90, 90, -PI/3, PI/4); }
    else { fill(80); rect(5, 5, 35, 6); fill(150, 100, 50); rect(-5, 8, 12, 6); }
    pop();
  }
  jump() { if (this.y === 330) this.vy = this.jumpPower; }
  attack() { if(!this.isAttacking) { this.isAttacking = true; this.attackTimer = 12; playSlashSound(); } }
}

class Arrow {
  constructor(s, y) { this.x = width - 40; this.y = y; this.speed = 7 + (s * 1.5); }
  update() { if(!isClear) this.x -= this.speed; }
  display() { stroke(139, 69, 19); strokeWeight(2); line(this.x, this.y, this.x + 30, this.y); fill(200); noStroke(); triangle(this.x, this.y, this.x+8, this.y-4, this.x+8, this.y+4); }
}

class Petal {
  constructor() { this.x = random(width); this.y = random(-100, 0); this.size = random(5, 12); this.speed = random(2, 5); this.angle = random(TWO_PI); }
  update() { this.y += this.speed; this.x += sin(this.angle) * 3; this.angle += 0.1; if (this.y > height) this.y = -10; }
  display() { fill(255, 215, 0); noStroke(); ellipse(this.x, this.y, this.size, this.size); }
}

function drawPetals() { for (let p of petals) { p.update(); p.display(); } }
function resetGame() { player = new Samurai(); arrows = []; coins = []; petals = []; enemyNinjas = []; isGameOver = false; isClear = false; }
function drawUI() {
  fill(0, 0, 0, 150); rect(10, 10, 250, 80, 10);
  fill(255); textAlign(LEFT); textSize(18); text(`幕: 第 ${stage} 幕`, 25, 35); text(`宝まで: ${floor(max(0, goalX - player.worldX))}m`, 25, 60);
  fill(255, 215, 0); text(`小判: ${score}`, 25, 85);
}
function showScreen(title, sub) { background(0, 0, 0, 150); fill(255, 50, 50); textAlign(CENTER); textSize(60); text(title, width / 2, height / 2); fill(255); textSize(20); text(sub, width / 2, height / 2 + 50); }