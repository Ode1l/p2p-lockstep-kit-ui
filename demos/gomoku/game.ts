import type { GameState, IGamePlugin, TurnEntry } from "p2p-lockstep-kit-session";

export const GOMOKU_SIZE = 15;
export const GOMOKU_MOVE_TYPE = "gomoku.move";

export type Stone = 0 | 1 | 2;
export type Board = Stone[][];
export type PlayerStone = 1 | 2;
export type Cell = { x: number; y: number };
export type GomokuMove = Cell & {
  type: typeof GOMOKU_MOVE_TYPE;
};

export type GomokuSnapshot = {
  board: Board;
  winner: PlayerStone | null;
  winningPlayer: "local" | "remote" | null;
  lastMove: (Cell & { stone: PlayerStone; owner: "local" | "remote" }) | null;
  nextStone: PlayerStone;
};

const directions: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export const createEmptyBoard = (): Board =>
  Array.from({ length: GOMOKU_SIZE }, () =>
    Array.from({ length: GOMOKU_SIZE }, () => 0 as Stone),
  );

export const createMove = (cell: Cell): GomokuMove => ({
  type: GOMOKU_MOVE_TYPE,
  x: cell.x,
  y: cell.y,
});

export const isGomokuMove = (value: unknown): value is GomokuMove => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const move = value as Partial<GomokuMove>;
  return (
    move.type === GOMOKU_MOVE_TYPE &&
    Number.isInteger(move.x) &&
    Number.isInteger(move.y) &&
    typeof move.x === "number" &&
    typeof move.y === "number" &&
    move.x >= 0 &&
    move.y >= 0 &&
    move.x < GOMOKU_SIZE &&
    move.y < GOMOKU_SIZE
  );
};

export const stoneForTurn = (turn: number): PlayerStone =>
  turn % 2 === 1 ? 1 : 2;

export const isWin = (board: Board, move: Cell & { stone: PlayerStone }) => {
  for (const [dx, dy] of directions) {
    let count = 1;
    count += countDirection(board, move, dx, dy);
    count += countDirection(board, move, -dx, -dy);
    if (count >= 5) {
      return true;
    }
  }
  return false;
};

const countDirection = (
  board: Board,
  move: Cell & { stone: PlayerStone },
  dx: number,
  dy: number,
) => {
  let count = 0;
  let x = move.x + dx;
  let y = move.y + dy;

  while (
    x >= 0 &&
    y >= 0 &&
    x < GOMOKU_SIZE &&
    y < GOMOKU_SIZE &&
    board[y][x] === move.stone
  ) {
    count += 1;
    x += dx;
    y += dy;
  }

  return count;
};

export const buildGomokuSnapshot = (history: TurnEntry[]): GomokuSnapshot => {
  const board = createEmptyBoard();
  let winner: PlayerStone | null = null;
  let winningPlayer: "local" | "remote" | null = null;
  let lastMove: GomokuSnapshot["lastMove"] = null;

  for (const entry of history) {
    if (!isGomokuMove(entry.move)) {
      continue;
    }

    const stone = stoneForTurn(entry.turn);
    if (board[entry.move.y][entry.move.x] !== 0) {
      continue;
    }

    board[entry.move.y][entry.move.x] = stone;
    lastMove = {
      x: entry.move.x,
      y: entry.move.y,
      stone,
      owner: entry.player,
    };

    if (!winner && isWin(board, { ...entry.move, stone })) {
      winner = stone;
      winningPlayer = entry.player;
    }
  }

  return {
    board,
    winner,
    winningPlayer,
    lastMove,
    nextStone: stoneForTurn(history.length + 1),
  };
};

const canPlaceFromHistory = (history: TurnEntry[], move: GomokuMove) => {
  const snapshot = buildGomokuSnapshot(history);
  if (snapshot.winner) {
    return { valid: false, reason: "Game already finished." };
  }
  if (snapshot.board[move.y][move.x] !== 0) {
    return { valid: false, reason: "Cell already occupied." };
  }
  return { valid: true };
};

export const createGomokuSessionPlugin = (): IGamePlugin => ({
  validateMove(move: unknown, gameState: GameState) {
    if (!isGomokuMove(move)) {
      return { valid: false, reason: "Invalid gomoku move." };
    }
    return canPlaceFromHistory(gameState.history, move);
  },
  checkWin() {
    // Keep the session in turn mode after a winner so Restart remains available.
    // The demo board derives and displays the winner from history.
    return null;
  },
});
