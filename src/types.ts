export type SessionStateView =
  | "idle"
  | "ready"
  | "could_start"
  | "turn"
  | "remote_turn"
  | "approving"
  | "waiting_approval"
  | "syncing"
  | "offline";

export type PendingAction = "undo" | "restart" | null;
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

export type TurnEntry = {
  turn: number;
  player: "local" | "remote";
  move?: unknown;
};

export type SessionSnapshot = {
  localState: SessionStateView;
  remoteState: SessionStateView;
  turn: number;
  history: TurnEntry[];
  lastStart: "local" | "remote" | null;
  pendingAction: PendingAction;
  connected: boolean;
};

export type RuntimeEvent = {
  type:
    | "READY"
    | "START"
    | "MOVE"
    | "GAME_OVER"
    | "UNDO"
    | "RESTART"
    | "OFFLINE"
    | "ONLINE"
    | "SYNC"
    | "ERROR";
  payload?: unknown;
  from?: "local" | "remote";
  timestamp?: number;
};

export type RuntimeObserver = {
  onStateChange(snapshot: SessionSnapshot): void;
  onConnectionChange?(connected: boolean): void;
  onGameEvent?(event: RuntimeEvent): void;
  onError?(error: { message: string; context?: unknown }): void;
};

export type LockstepRuntime = {
  actions: {
    ready(): void;
    start(): void;
    move(data: unknown): void;
    undo(): void;
    restart(): void;
    approve(): void;
    reject(): void;
  };
  observer: {
    subscribe(observer: RuntimeObserver): () => void;
    getSnapshot(): SessionSnapshot | null;
  };
  network: {
    register(url: string): Promise<{ peerId: string }>;
    connect(targetId: string): Promise<void>;
    disconnect(): void;
    getLocalPeerId(): string | null;
    getRemotePeerId(): string | null;
    peerState(): "passive" | "requesting" | "connected";
  };
};

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
  lastStart: "local" | "remote" | null;
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
