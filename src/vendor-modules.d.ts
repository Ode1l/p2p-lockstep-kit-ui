declare module "p2p-lockstep-kit-network" {
  export type PeerState = "passive" | "requesting" | "connected";
  export type MediaState = "idle" | "starting" | "active";

  export class NetworkClient {
    constructor();
    register(url: string): Promise<{ peerId: string }>;
    connect(targetId: string): Promise<void>;
    send(data: unknown): void;
    disconnect(): void;
    onMessage(handler: (data: unknown) => void): void;
    onRemoteStream(handler: (stream: MediaStream | null) => void): void;
    onStateChange(handler: (state: PeerState) => void): void;
    onMediaChange(handler: (state: MediaState) => void): void;
    getLocalPeerId(): string | null;
    getRemotePeerId(): string | null;
    peerState(): PeerState;
    mediaState(): MediaState;
  }
}

declare module "p2p-lockstep-kit-session" {
  import type { NetworkClient } from "p2p-lockstep-kit-network";

  export type SessionState =
    | "idle"
    | "ready"
    | "could_start"
    | "turn"
    | "remote_turn"
    | "approving"
    | "waiting_approval"
    | "syncing"
    | "offline";

  export type SessionEvent =
    | "REMOTE_READY"
    | "READY"
    | "START"
    | "REMOTE_START"
    | "MOVE"
    | "REMOTE_MOVE"
    | "UNDO"
    | "REMOTE_UNDO"
    | "RESTART"
    | "REMOTE_RESTART"
    | "APPROVE"
    | "REJECT"
    | "GAME_OVER"
    | "SYNC"
    | "SYNC_COMPLETE"
    | "OFFLINE"
    | "ONLINE";

  export type PendingAction = "undo" | "restart" | null;
  export type PlayerLabel = "local" | "remote";

  export type TurnEntry = {
    turn: number;
    player: PlayerLabel;
    move?: unknown;
  };

  export type GameStateSnapshot = {
    localState: SessionState;
    remoteState: SessionState;
    turn: number;
    history: TurnEntry[];
    lastStart: PlayerLabel | null;
    pendingAction: PendingAction;
    connected: boolean;
  };

  export type GameEvent = {
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
    from?: PlayerLabel;
    timestamp?: number;
  };

  export interface IGameObserver {
    onStateChange(snapshot: GameStateSnapshot): void;
    onGameEvent(event: GameEvent): void;
    onConnectionChange?(connected: boolean): void;
    onError?(error: { message: string; context?: unknown }): void;
  }

  export interface GameState {
    history: TurnEntry[];
    localState: string;
    remoteState: string;
    turn: number;
    lastStart: PlayerLabel | null;
  }

  export interface ValidationResult {
    valid: boolean;
    reason?: string;
  }

  export interface IGamePlugin {
    validateMove(move: unknown, gameState: GameState): ValidationResult;
    checkWin(
      gameState: GameState,
      history: TurnEntry[],
    ): PlayerLabel | null;
    initialize?(): void;
    cleanup?(): void;
  }

  export type SessionHandle = {
    observer: {
      subscribe(observer: IGameObserver): () => void;
      getSnapshot(): GameStateSnapshot | null;
    };
    net: {
      setPeerIds(ids: { local?: string | null; remote?: string | null }): void;
    };
    state: {
      setGamePlugin(plugin: IGamePlugin): void;
    };
    actions: {
      ready(): void;
      start(): void;
      move(data: unknown): void;
      undo(): void;
      restart(): void;
      approve(): void;
      reject(): void;
    };
    send(data: unknown): void;
  };

  export function createSession(networkClient: NetworkClient, sid?: string): SessionHandle;
}
