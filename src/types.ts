import type {
  GameEvent,
  GameStateSnapshot,
  IGamePlugin,
  PendingAction,
  PlayerLabel,
  SessionState,
  TurnEntry,
} from "p2p-lockstep-kit-session";

export type {
  GameEvent,
  GameState,
  GameStateSnapshot,
  IGameObserver,
  IGamePlugin,
  PendingAction,
  PlayerLabel,
  SessionEvent,
  SessionState,
  TurnEntry,
  ValidationResult,
} from "p2p-lockstep-kit-session";

export type SessionStateView = SessionState;

export type TurnOwner = "me" | "peer" | null;
export type AppScreen = "lobby" | "game";
export type ConnectionState =
  | "idle"
  | "registering"
  | "registered"
  | "connecting"
  | "connected"
  | "offline"
  | "error";

export type SessionSnapshot = GameStateSnapshot;
export type RuntimeEvent = GameEvent;

export type RuntimeObserver = {
  onStateChange(snapshot: SessionSnapshot): void;
  onConnectionChange?(connected: boolean): void;
  onGameEvent?(event: RuntimeEvent): void;
  onError?(error: { message: string; context?: unknown }): void;
};

export type GameRuntime = {
  setGamePlugin(plugin: IGamePlugin): void;
  actions: {
    move(data: unknown): void;
  };
  observer: {
    subscribe(observer: RuntimeObserver): () => void;
    getSnapshot(): SessionSnapshot | null;
  };
};

export type LockstepRuntime = GameRuntime;

export type AppState = {
  screen: AppScreen;
  gameTitle: string;
  sessionId: string;
  signalUrl: string;
  targetId: string;
  peerId: string;
  remotePeerId: string;
  connectionState: ConnectionState;
  connected: boolean;
  registering: boolean;
  connecting: boolean;
  readySelf: boolean;
  readyPeer: boolean;
  canReady: boolean;
  canStart: boolean;
  canUndo: boolean;
  canRestart: boolean;
  started: boolean;
  currentTurn: number;
  turnOwner: TurnOwner;
  localState: SessionStateView;
  remoteState: SessionStateView;
  pendingAction: PendingAction;
  historyLength: number;
  lastStart: PlayerLabel | null;
  lastError: string;
};

export type SharePanelState = {
  peerId: string;
  signalUrl: string;
  shareUrl: string;
};

export type LobbyPageState = Pick<
  AppState,
  | "gameTitle"
  | "signalUrl"
  | "targetId"
  | "peerId"
  | "remotePeerId"
  | "connectionState"
  | "registering"
  | "connecting"
>;

export type StatusPanelState = Pick<
  AppState,
  | "gameTitle"
  | "peerId"
  | "remotePeerId"
  | "connected"
  | "connectionState"
  | "currentTurn"
  | "turnOwner"
  | "localState"
  | "remoteState"
  | "readySelf"
  | "readyPeer"
  | "pendingAction"
  | "sessionId"
>;

export type ActionBarState = Pick<
  AppState,
  | "connected"
  | "readySelf"
  | "canReady"
  | "canStart"
  | "canUndo"
  | "canRestart"
  | "started"
  | "connectionState"
>;

export type GamePageState = Pick<
  AppState,
  | "gameTitle"
  | "peerId"
  | "remotePeerId"
  | "connected"
  | "connectionState"
  | "readySelf"
  | "readyPeer"
  | "canReady"
  | "canStart"
  | "canUndo"
  | "canRestart"
  | "started"
  | "currentTurn"
  | "turnOwner"
  | "localState"
  | "remoteState"
  | "pendingAction"
  | "sessionId"
>;

export type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
};

export type ToastState = {
  open: boolean;
  message: string;
};
