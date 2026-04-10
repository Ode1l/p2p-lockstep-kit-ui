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

  export type PendingAction = "undo" | "restart" | null;

  export type GameStateSnapshot = {
    localState: SessionState;
    remoteState: SessionState;
    turn: number;
    history: Array<{ turn: number; player: "local" | "remote"; move?: unknown }>;
    lastStart: "local" | "remote" | null;
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
    from?: "local" | "remote";
    timestamp?: number;
  };

  export interface IGameObserver {
    onStateChange(snapshot: GameStateSnapshot): void;
    onGameEvent(event: GameEvent): void;
    onConnectionChange?(connected: boolean): void;
    onError?(error: { message: string; context?: unknown }): void;
  }

  export type SessionHandle = {
    observer: {
      subscribe(observer: IGameObserver): () => void;
      getSnapshot(): GameStateSnapshot | null;
    };
    net: {
      setPeerIds(ids: { local?: string | null; remote?: string | null }): void;
    };
    actions: {
      ready(): void;
      start(): void;
      move(data: unknown): void;
      undo(): void;
      restart(): void;
      approve(): void;
      reject(): void;
      rejoin(sid: string): void;
    };
    send(data: unknown): void;
  };

  export function createSession(networkClient: NetworkClient, sid?: string): SessionHandle;
}
