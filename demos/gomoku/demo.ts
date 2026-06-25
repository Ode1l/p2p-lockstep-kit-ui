import type { LockstepRuntime, SessionSnapshot } from "../../src/types";
import { GomokuBoardView } from "./board-view";
import {
  buildGomokuSnapshot,
  createGomokuSessionPlugin,
  createMove,
  type Cell,
} from "./game";

const defaultSnapshot: SessionSnapshot = {
  localState: "idle",
  remoteState: "idle",
  turn: 1,
  history: [],
  lastStart: null,
  pendingAction: null,
  connected: false,
};

export const mountGomokuDemo = (options: {
  mount: HTMLElement;
  runtime: LockstepRuntime;
}) => {
  const boardView = new GomokuBoardView();
  let snapshot = options.runtime.observer.getSnapshot() ?? defaultSnapshot;
  let hover: Cell | null = null;

  options.mount.replaceChildren(boardView.element);
  options.runtime.setGamePlugin(createGomokuSessionPlugin());

  const render = () => {
    const gomoku = buildGomokuSnapshot(snapshot.history);
    const canMove =
      snapshot.connected &&
      snapshot.localState === "turn" &&
      !snapshot.pendingAction &&
      !gomoku.winner;
    const ghost =
      canMove && hover && gomoku.board[hover.y][hover.x] === 0
        ? gomoku.nextStone
        : null;

    boardView.render({
      board: gomoku.board,
      hover,
      ghost,
      lastMove: gomoku.lastMove,
      disabled: !canMove,
      status: getStatusText(snapshot, gomoku.winningPlayer, gomoku.nextStone),
    });
  };

  boardView.onHover((cell) => {
    hover = cell;
    render();
  });

  boardView.onMove((cell) => {
    const gomoku = buildGomokuSnapshot(snapshot.history);
    const canMove =
      snapshot.connected &&
      snapshot.localState === "turn" &&
      !snapshot.pendingAction &&
      !gomoku.winner &&
      gomoku.board[cell.y][cell.x] === 0;

    if (!canMove) {
      return;
    }

    options.runtime.actions.move(createMove(cell));
  });

  const unsubscribe = options.runtime.observer.subscribe({
    onStateChange(next) {
      snapshot = next;
      render();
    },
    onConnectionChange() {},
    onGameEvent() {},
  });

  render();

  return () => {
    unsubscribe();
    boardView.element.remove();
  };
};

const stoneLabel = (stone: 1 | 2) => (stone === 1 ? "Black" : "White");

const getStatusText = (
  snapshot: SessionSnapshot,
  winner: "local" | "remote" | null,
  nextStone: 1 | 2,
) => {
  if (winner) {
    return winner === "local" ? "You win" : "Peer wins";
  }
  if (snapshot.pendingAction) {
    return "Approval pending";
  }
  if (snapshot.localState === "syncing" || snapshot.remoteState === "syncing") {
    return "Syncing board";
  }
  if (!snapshot.connected) {
    return "Waiting for peer";
  }
  if (snapshot.localState === "turn") {
    return `Your turn - ${stoneLabel(nextStone)}`;
  }
  if (snapshot.localState === "remote_turn") {
    return `Peer turn - ${stoneLabel(nextStone)}`;
  }
  return "Ready when both players start";
};
