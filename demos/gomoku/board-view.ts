import {
  GOMOKU_SIZE,
  type Board,
  type Cell,
  type PlayerStone,
} from "./game";

type BoardViewEvents = {
  dismissWinner(): void;
  hover(cell: Cell | null): void;
  move(cell: Cell): void;
};

export class GomokuBoardView {
  readonly element = document.createElement("div");

  #canvas = document.createElement("canvas");
  #status = document.createElement("div");
  #winnerNotice = document.createElement("div");
  #ctx: CanvasRenderingContext2D;
  #size = 720;
  #cellSize = this.#size / (GOMOKU_SIZE + 1);
  #events: Partial<BoardViewEvents> = {};

  constructor() {
    const ctx = this.#canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }
    this.#ctx = ctx;
    this.#canvas.width = this.#size;
    this.#canvas.height = this.#size;
    this.#canvas.className =
      "block aspect-square w-full max-w-[min(100%,calc(100svh-13rem),45rem)] rounded-[1.35rem] border border-[rgba(48,43,35,0.18)] bg-[#d8b16d] shadow-[0_18px_54px_rgba(60,47,27,0.2)] touch-none sm:max-w-[min(100%,72svh,45rem)] sm:rounded-[1.65rem]";
    this.#canvas.setAttribute("aria-label", "Gomoku board");

    this.element.className =
      "relative flex h-full min-h-0 flex-col items-center justify-start gap-2 p-0 sm:gap-3 sm:p-4 lg:justify-center";
    this.#status.className =
      "rounded-full border border-[var(--lock-border)] bg-[rgba(255,255,252,0.82)] px-3 py-1.5 text-xs font-semibold text-[var(--lock-muted)] shadow-sm backdrop-blur";
    this.#winnerNotice.className =
      "pointer-events-none absolute inset-0 z-20 hidden items-center justify-center p-4";
    this.element.append(this.#canvas, this.#status, this.#winnerNotice);

    this.#bindEvents();
  }

  onDismissWinner(handler: BoardViewEvents["dismissWinner"]) {
    this.#events.dismissWinner = handler;
  }

  onHover(handler: BoardViewEvents["hover"]) {
    this.#events.hover = handler;
  }

  onMove(handler: BoardViewEvents["move"]) {
    this.#events.move = handler;
  }

  render(input: {
    board: Board;
    hover: Cell | null;
    ghost: PlayerStone | null;
    lastMove: Cell | null;
    disabled: boolean;
    status: string;
    winnerNotice: { title: string; description: string } | null;
  }) {
    this.#status.textContent = input.status;
    this.#ctx.clearRect(0, 0, this.#size, this.#size);
    this.#drawBoardSurface();
    this.#drawGrid();
    this.#drawStarPoints();
    this.#drawStones(input.board);
    if (input.lastMove) {
      this.#drawLastMove(input.lastMove);
    }
    if (!input.disabled && input.hover && input.ghost) {
      this.#drawStone(input.hover.x, input.hover.y, input.ghost, true);
    }
    this.#renderWinnerNotice(input.winnerNotice);
  }

  #bindEvents() {
    this.#canvas.addEventListener("pointermove", (event) => {
      this.#events.hover?.(this.#getCell(event));
    });
    this.#canvas.addEventListener("pointerleave", () => {
      this.#events.hover?.(null);
    });
    this.#canvas.addEventListener("pointerdown", (event) => {
      const cell = this.#getCell(event);
      if (cell) {
        this.#events.move?.(cell);
      }
    });
    this.#winnerNotice.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "button[data-dismiss-winner]",
      );
      if (target) {
        this.#events.dismissWinner?.();
      }
    });
  }

  #getCell(event: PointerEvent): Cell | null {
    const rect = this.#canvas.getBoundingClientRect();
    const scaleX = this.#canvas.width / rect.width;
    const scaleY = this.#canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const gridX = Math.round(x / this.#cellSize) - 1;
    const gridY = Math.round(y / this.#cellSize) - 1;

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX >= GOMOKU_SIZE ||
      gridY >= GOMOKU_SIZE
    ) {
      return null;
    }

    return { x: gridX, y: gridY };
  }

  #drawBoardSurface() {
    const gradient = this.#ctx.createLinearGradient(0, 0, this.#size, this.#size);
    gradient.addColorStop(0, "#f1d59a");
    gradient.addColorStop(0.52, "#d8b16d");
    gradient.addColorStop(1, "#b98543");
    this.#ctx.fillStyle = gradient;
    this.#ctx.fillRect(0, 0, this.#size, this.#size);
  }

  #drawGrid() {
    const offset = this.#cellSize;
    const end = this.#size - this.#cellSize;

    this.#ctx.strokeStyle = "rgba(53, 38, 21, 0.72)";
    this.#ctx.lineWidth = 1.4;

    for (let i = 0; i < GOMOKU_SIZE; i += 1) {
      const pos = offset + i * this.#cellSize;
      this.#ctx.beginPath();
      this.#ctx.moveTo(offset, pos);
      this.#ctx.lineTo(end, pos);
      this.#ctx.stroke();
      this.#ctx.beginPath();
      this.#ctx.moveTo(pos, offset);
      this.#ctx.lineTo(pos, end);
      this.#ctx.stroke();
    }
  }

  #drawStarPoints() {
    const points = [
      [3, 3],
      [11, 3],
      [7, 7],
      [3, 11],
      [11, 11],
    ];

    this.#ctx.fillStyle = "rgba(45, 31, 18, 0.78)";
    for (const [x, y] of points) {
      this.#ctx.beginPath();
      this.#ctx.arc(
        this.#cellSize + x * this.#cellSize,
        this.#cellSize + y * this.#cellSize,
        this.#cellSize * 0.1,
        0,
        Math.PI * 2,
      );
      this.#ctx.fill();
    }
  }

  #drawStones(board: Board) {
    for (let y = 0; y < GOMOKU_SIZE; y += 1) {
      for (let x = 0; x < GOMOKU_SIZE; x += 1) {
        const stone = board[y][x];
        if (stone !== 0) {
          this.#drawStone(x, y, stone, false);
        }
      }
    }
  }

  #drawStone(x: number, y: number, stone: PlayerStone, ghost: boolean) {
    const cx = this.#cellSize + x * this.#cellSize;
    const cy = this.#cellSize + y * this.#cellSize;
    const radius = this.#cellSize * 0.42;
    const gradient = this.#ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.35,
      radius * 0.12,
      cx,
      cy,
      radius,
    );

    if (stone === 1) {
      gradient.addColorStop(0, ghost ? "rgba(82,82,74,0.58)" : "#4a4840");
      gradient.addColorStop(1, ghost ? "rgba(12,12,10,0.42)" : "#0f0f0d");
    } else {
      gradient.addColorStop(0, ghost ? "rgba(255,255,255,0.72)" : "#ffffff");
      gradient.addColorStop(1, ghost ? "rgba(223,218,204,0.48)" : "#d8d2bf");
    }

    this.#ctx.beginPath();
    this.#ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.#ctx.fillStyle = gradient;
    this.#ctx.fill();
    this.#ctx.strokeStyle =
      stone === 1 ? "rgba(0,0,0,0.62)" : "rgba(77,67,51,0.42)";
    this.#ctx.lineWidth = ghost ? 1 : 1.5;
    this.#ctx.stroke();
  }

  #drawLastMove(cell: Cell) {
    const cx = this.#cellSize + cell.x * this.#cellSize;
    const cy = this.#cellSize + cell.y * this.#cellSize;
    this.#ctx.beginPath();
    this.#ctx.arc(cx, cy, this.#cellSize * 0.5, 0, Math.PI * 2);
    this.#ctx.strokeStyle = "rgba(31,31,29,0.72)";
    this.#ctx.lineWidth = 3;
    this.#ctx.stroke();
  }

  #renderWinnerNotice(
    notice: { title: string; description: string } | null,
  ) {
    if (!notice) {
      this.#winnerNotice.classList.add("hidden");
      this.#winnerNotice.classList.remove("flex", "pointer-events-auto");
      this.#winnerNotice.classList.add("pointer-events-none");
      this.#winnerNotice.replaceChildren();
      return;
    }

    this.#winnerNotice.classList.remove("hidden");
    this.#winnerNotice.classList.remove("pointer-events-none");
    this.#winnerNotice.classList.add("flex", "pointer-events-auto");
    this.#winnerNotice.innerHTML = `
      <div class="w-full max-w-[18rem] rounded-[1.4rem] border border-[rgba(20,20,18,0.14)] bg-[rgba(255,255,252,0.94)] p-4 text-center shadow-[0_22px_70px_rgba(20,20,18,0.2)] backdrop-blur-xl">
        <p class="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--lock-dim)]">Game over</p>
        <p class="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--lock-paper)]">${notice.title}</p>
        <p class="mt-1 text-sm leading-5 text-[var(--lock-muted)]">${notice.description}</p>
        <button
          type="button"
          data-dismiss-winner
          class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--lock-paper)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          View board
        </button>
      </div>
    `;
  }
}
