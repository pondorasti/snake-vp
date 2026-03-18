type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const TICK_RATE = 150;

const OPPOSITES: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  W: "UP",
  s: "DOWN",
  S: "DOWN",
  a: "LEFT",
  A: "LEFT",
  d: "RIGHT",
  D: "RIGHT",
};

export class Game {
  private ctx: CanvasRenderingContext2D;
  private scoreEl: HTMLElement;
  private gameOverEl: HTMLElement;
  private snake: Point[] = [];
  private direction: Direction = "RIGHT";
  private nextDirection: Direction = "RIGHT";
  private food: Point = { x: 0, y: 0 };
  private score = 0;
  private isGameOver = false;
  private lastTick = 0;
  private animationId = 0;
  private colors = { bg: "", snake: "", food: "", grid: "" };

  constructor(canvas: HTMLCanvasElement, scoreEl: HTMLElement, gameOverEl: HTMLElement) {
    this.scoreEl = scoreEl;
    this.gameOverEl = gameOverEl;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    this.ctx = canvas.getContext("2d")!;
    this.ctx.scale(dpr, dpr);

    this.readColors();
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => this.readColors());

    this.reset();
    this.start();
  }

  private readColors(): void {
    const s = getComputedStyle(document.documentElement);
    this.colors = {
      bg: s.getPropertyValue("--canvas-bg").trim(),
      snake: s.getPropertyValue("--accent").trim(),
      food: s.getPropertyValue("--food-color").trim(),
      grid: s.getPropertyValue("--border").trim(),
    };
  }

  private reset(): void {
    const mid = Math.floor(GRID_SIZE / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    this.direction = "RIGHT";
    this.nextDirection = "RIGHT";
    this.score = 0;
    this.isGameOver = false;
    this.spawnFood();
    this.scoreEl.textContent = "0";
    this.gameOverEl.hidden = true;
  }

  private start(): void {
    this.lastTick = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  private loop = (timestamp: number): void => {
    this.animationId = requestAnimationFrame(this.loop);

    if (this.isGameOver) return;

    if (timestamp - this.lastTick >= TICK_RATE) {
      this.lastTick = timestamp;
      this.update();
    }

    this.render();
  };

  private update(): void {
    this.direction = this.nextDirection;

    const head = this.snake[0];
    const next: Point = { x: head.x, y: head.y };

    if (this.direction === "UP") next.y--;
    else if (this.direction === "DOWN") next.y++;
    else if (this.direction === "LEFT") next.x--;
    else next.x++;

    // Wall collision
    if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
      this.endGame();
      return;
    }

    // Self collision
    if (this.snake.some((s) => s.x === next.x && s.y === next.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(next);

    if (next.x === this.food.x && next.y === this.food.y) {
      this.score++;
      this.scoreEl.textContent = String(this.score);
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  private endGame(): void {
    this.isGameOver = true;
    this.render();
    const finalScoreEl = this.gameOverEl.querySelector("#final-score");
    if (finalScoreEl) finalScoreEl.textContent = String(this.score);
    this.gameOverEl.hidden = false;
  }

  private spawnFood(): void {
    let p: Point;
    do {
      p = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (this.snake.some((s) => s.x === p.x && s.y === p.y));
    this.food = p;
  }

  private render(): void {
    const { ctx, colors } = this;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Food
    ctx.fillStyle = colors.food;
    ctx.beginPath();
    ctx.arc(
      this.food.x * CELL_SIZE + CELL_SIZE / 2,
      this.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Snake
    ctx.fillStyle = colors.snake;
    const gap = 1;
    const r = 4;
    for (const seg of this.snake) {
      const x = seg.x * CELL_SIZE + gap;
      const y = seg.y * CELL_SIZE + gap;
      const size = CELL_SIZE - gap * 2;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
    }

    // Eyes on head
    const head = this.snake[0];
    const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = colors.bg;
    const eyeR = 2.5;
    const eyeOff = 4;

    let e1x = cx,
      e1y = cy,
      e2x = cx,
      e2y = cy;
    if (this.direction === "RIGHT" || this.direction === "LEFT") {
      const dx = this.direction === "RIGHT" ? eyeOff : -eyeOff;
      e1x = cx + dx;
      e1y = cy - eyeOff;
      e2x = cx + dx;
      e2y = cy + eyeOff;
    } else {
      const dy = this.direction === "DOWN" ? eyeOff : -eyeOff;
      e1x = cx - eyeOff;
      e1y = cy + dy;
      e2x = cx + eyeOff;
      e2y = cy + dy;
    }
    ctx.beginPath();
    ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
    ctx.fill();
  }

  handleKeyDown(e: KeyboardEvent): void {
    const dir = KEY_MAP[e.key];
    if (!dir) return;

    if (OPPOSITES[dir] !== this.direction) {
      this.nextDirection = dir;
    }

    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
    }
  }

  restart(): void {
    cancelAnimationFrame(this.animationId);
    this.reset();
    this.start();
  }
}
