import "./style.css";
import { Game } from "./game.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <h1>Snake</h1>
  <div class="game-wrapper">
    <div class="score">Score: <span id="score-value">0</span></div>
    <canvas id="game-canvas"></canvas>
    <div class="game-over" id="game-over" hidden>
      <h2>Game Over</h2>
      <p>Score: <span id="final-score">0</span></p>
      <button id="restart-btn">Play Again</button>
    </div>
  </div>
  <p class="instructions">Arrow keys or WASD to move</p>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const scoreEl = document.querySelector<HTMLElement>("#score-value")!;
const gameOverEl = document.querySelector<HTMLElement>("#game-over")!;

const game = new Game(canvas, scoreEl, gameOverEl);

document.addEventListener("keydown", (e) => game.handleKeyDown(e));
document
  .querySelector<HTMLButtonElement>("#restart-btn")!
  .addEventListener("click", () => game.restart());
