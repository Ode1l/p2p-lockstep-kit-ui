import { NetworkClient } from "p2p-lockstep-kit-network";
import { createSession } from "p2p-lockstep-kit-session";
import type {
  AppState,
  DialogState,
  LockstepRuntime,
  RuntimeObserver,
  SessionSnapshot,
  SessionStateView,
  ToastState,
} from "./types";
import { readShareLocation } from "./utils/share";
import type { P2PLockstepLobbyPageElement } from "./pages/lobby-page";
import type { P2PLockstepGamePageElement } from "./pages/game-page";
import type { P2PLockstepConfirmDialogElement } from "./components/confirm-dialog";
import type { P2PLockstepToastMessageElement } from "./components/toast-message";

const defaultState = (attrs?: {
  gameTitle?: string;
  sessionId?: string;
  signalUrl?: string;
}): AppState => ({
  screen: "lobby",
  gameTitle: attrs?.gameTitle || "P2P Lockstep",
  sessionId: attrs?.sessionId || "default-session",
  signalUrl: attrs?.signalUrl || "",
  targetId: "",
  peerId: "",
  remotePeerId: "",
  connectionState: "idle",
  connected: false,
  registering: false,
  connecting: false,
  readySelf: false,
  readyPeer: false,
  canReady: false,
  canStart: false,
  canUndo: false,
  canRestart: false,
  started: false,
  currentTurn: 1,
  turnOwner: null,
  localState: "idle",
  remoteState: "idle",
  pendingAction: null,
  historyLength: 0,
  lastStart: null,
  lastError: "",
});

const defaultDialog: DialogState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Approve",
  cancelLabel: "Reject",
};

const defaultToast: ToastState = {
  open: false,
  message: "",
};

const readyStates: SessionStateView[] = ["ready", "could_start"];
const activeStates: SessionStateView[] = [
  "turn",
  "remote_turn",
  "approving",
  "waiting_approval",
  "syncing",
];

type SessionInstance = ReturnType<typeof createSession>;
type InternalObserver = RuntimeObserver & {
  onGameEvent: NonNullable<RuntimeObserver["onGameEvent"]>;
};

export class P2PLockstepAppElement extends HTMLElement {
  static get observedAttributes() {
    return ["game-title", "session-id", "signal-url"];
  }

  #ready = false;
  #state: AppState = defaultState();
  #dialogState: DialogState = defaultDialog;
  #toastState: ToastState = defaultToast;
  #lobbyPage: P2PLockstepLobbyPageElement | null = null;
  #gamePage: P2PLockstepGamePageElement | null = null;
  #dialog: (HTMLElement & { state: DialogState }) | null = null;
  #toast: (HTMLElement & { state: ToastState }) | null = null;
  #network = new NetworkClient();
  #session: SessionInstance | null = null;
  #runtime: LockstepRuntime | null = null;
  #toastTimer: number | null = null;
  #observer: InternalObserver | null = null;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.#state = defaultState({
      gameTitle: this.getAttribute("game-title") ?? undefined,
      sessionId: this.getAttribute("session-id") ?? undefined,
      signalUrl: this.getAttribute("signal-url") ?? undefined,
    });
    this.render();
    this.addEventListener("lockstep-register", this.#handleRegisterEvent as EventListener);
    this.addEventListener("lockstep-connect", this.#handleConnectEvent as EventListener);
    this.addEventListener(
      "lockstep-signal-change",
      this.#handleSignalChangeEvent as EventListener,
    );
    this.addEventListener(
      "lockstep-target-change",
      this.#handleTargetChangeEvent as EventListener,
    );
    this.addEventListener(
      "lockstep-share-detected",
      this.#handleShareDetectedEvent as EventListener,
    );
    this.addEventListener("lockstep-copy-share", this.#handleCopyShareEvent as EventListener);
    this.addEventListener("lockstep-ready", this.#handleReadyEvent as EventListener);
    this.addEventListener("lockstep-start", this.#handleStartEvent as EventListener);
    this.addEventListener("lockstep-undo", this.#handleUndoEvent as EventListener);
    this.addEventListener("lockstep-restart", this.#handleRestartEvent as EventListener);
    this.addEventListener(
      "lockstep-dialog-confirm",
      this.#handleDialogConfirmEvent as EventListener,
    );
    this.addEventListener(
      "lockstep-dialog-cancel",
      this.#handleDialogCancelEvent as EventListener,
    );
    this.#initializeSession();
    void this.#bootstrapFromLocation();
  }

  disconnectedCallback() {
    this.removeEventListener("lockstep-register", this.#handleRegisterEvent as EventListener);
    this.removeEventListener("lockstep-connect", this.#handleConnectEvent as EventListener);
    this.removeEventListener(
      "lockstep-signal-change",
      this.#handleSignalChangeEvent as EventListener,
    );
    this.removeEventListener(
      "lockstep-target-change",
      this.#handleTargetChangeEvent as EventListener,
    );
    this.removeEventListener(
      "lockstep-share-detected",
      this.#handleShareDetectedEvent as EventListener,
    );
    this.removeEventListener("lockstep-copy-share", this.#handleCopyShareEvent as EventListener);
    this.removeEventListener("lockstep-ready", this.#handleReadyEvent as EventListener);
    this.removeEventListener("lockstep-start", this.#handleStartEvent as EventListener);
    this.removeEventListener("lockstep-undo", this.#handleUndoEvent as EventListener);
    this.removeEventListener("lockstep-restart", this.#handleRestartEvent as EventListener);
    this.removeEventListener(
      "lockstep-dialog-confirm",
      this.#handleDialogConfirmEvent as EventListener,
    );
    this.removeEventListener(
      "lockstep-dialog-cancel",
      this.#handleDialogCancelEvent as EventListener,
    );
    if (this.#toastTimer) {
      window.clearTimeout(this.#toastTimer);
      this.#toastTimer = null;
    }
    this.#network.disconnect();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    if (!this.#ready) {
      return;
    }
    if (name === "game-title" && newValue) {
      this.#patchState({ gameTitle: newValue });
    }
    if (name === "session-id" && newValue) {
      this.#patchState({ sessionId: newValue });
    }
    if (name === "signal-url" && newValue) {
      this.#patchState({ signalUrl: newValue });
    }
  }

  getRuntime() {
    return this.#runtime;
  }

  getBoardHost() {
    return this.#gamePage?.getBoardHost() ?? null;
  }

  render() {
    this.className = "block min-h-screen bg-slate-950 text-slate-100";
    this.innerHTML = `
      <div class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.14),_transparent_36%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(15,23,42,1))]">
        <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2.8rem_2.8rem] opacity-20"></div>

        <main class="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <header class="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
            <div class="flex items-center gap-3">
              <div class="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.8)]"></div>
              <div>
                <p class="text-[0.68rem] uppercase tracking-[0.28em] text-slate-500">P2P Lockstep UI</p>
                <p class="text-sm font-medium text-slate-200">Web Components shell for lobby and game flow</p>
              </div>
            </div>
            <div class="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
              ${this.#state.connectionState}
            </div>
          </header>

          <div class="flex-1">
            <p2p-lockstep-lobby-page ${this.#state.screen === "lobby" ? "" : "hidden"}></p2p-lockstep-lobby-page>
            <p2p-lockstep-game-page ${this.#state.screen === "game" ? "" : "hidden"}></p2p-lockstep-game-page>
          </div>
        </main>

        <p2p-lockstep-confirm-dialog></p2p-lockstep-confirm-dialog>
        <p2p-lockstep-toast-message></p2p-lockstep-toast-message>
      </div>
    `;

    this.#lobbyPage = this.querySelector("p2p-lockstep-lobby-page");
    this.#gamePage = this.querySelector("p2p-lockstep-game-page");
    this.#dialog = this.querySelector("p2p-lockstep-confirm-dialog");
    this.#toast = this.querySelector("p2p-lockstep-toast-message");

    this.#syncUi();
  }

  #initializeSession() {
    this.#session = createSession(this.#network, this.#state.sessionId);

    this.#runtime = {
      actions: {
        ready: () => this.#session?.actions.ready(),
        start: () => this.#session?.actions.start(),
        move: (data: unknown) => this.#session?.actions.move(data),
        undo: () => this.#session?.actions.undo(),
        restart: () => this.#session?.actions.restart(),
        approve: () => this.#session?.actions.approve(),
        reject: () => this.#session?.actions.reject(),
      },
      observer: {
        subscribe: (observer: RuntimeObserver) =>
          this.#session?.observer.subscribe({
            onStateChange: observer.onStateChange,
            onConnectionChange: observer.onConnectionChange,
            onError: observer.onError,
            onGameEvent: observer.onGameEvent ?? (() => {}),
          }) ?? (() => {}),
        getSnapshot: () => (this.#session?.observer.getSnapshot() as SessionSnapshot | null) ?? null,
      },
      network: {
        register: (url: string) => this.#network.register(url),
        connect: (targetId: string) => this.#network.connect(targetId),
        disconnect: () => this.#network.disconnect(),
        getLocalPeerId: () => this.#network.getLocalPeerId(),
        getRemotePeerId: () => this.#network.getRemotePeerId(),
        peerState: () => this.#network.peerState(),
      },
    };

    this.#observer = {
      onStateChange: (snapshot) => this.#applySnapshot(snapshot),
      onConnectionChange: (connected) => this.#applyConnectionState(connected),
      onGameEvent: () => {},
      onError: (error) => {
        this.#patchState({ lastError: error.message, connectionState: "error" });
        this.#showToast(error.message);
      },
    };

    this.#session.observer.subscribe(this.#observer);
    this.#patchState({
      localState: "idle",
      remoteState: "idle",
      currentTurn: 1,
    });
  }

  async #bootstrapFromLocation() {
    const shared = readShareLocation();
    if (shared.signalUrl) {
      this.#patchState({ signalUrl: shared.signalUrl });
    }
    if (shared.peerId) {
      this.#patchState({ targetId: shared.peerId });
    }

    if (!this.#state.signalUrl) {
      return;
    }

    await this.#register(this.#state.signalUrl, true);
    if (shared.peerId) {
      await this.#connect(shared.peerId, true);
    }
  }

  async #register(signalUrl: string, quiet = false) {
    const trimmed = signalUrl.trim();
    if (!trimmed) {
      return;
    }

    this.#patchState({
      signalUrl: trimmed,
      registering: true,
      connectionState: "registering",
      lastError: "",
    });

    try {
      const { peerId } = await this.#network.register(trimmed);
      this.#session?.net.setPeerIds({ local: peerId, remote: this.#state.remotePeerId || null });
      this.#patchState({
        peerId,
        registering: false,
        connectionState: "registered",
      });
      if (!quiet) {
        this.#showToast("Peer registered. You can share the link now.");
      }
    } catch (error) {
      this.#patchState({
        registering: false,
        connectionState: "error",
        lastError: error instanceof Error ? error.message : "Failed to register signaling session.",
      });
      this.#showToast(this.#state.lastError || "Failed to register signaling session.");
    }
  }

  async #connect(targetId: string, quiet = false) {
    const trimmed = targetId.trim();
    if (!trimmed) {
      return;
    }

    if (!this.#state.peerId && this.#state.signalUrl) {
      await this.#register(this.#state.signalUrl, true);
    }

    this.#patchState({
      targetId: trimmed,
      remotePeerId: trimmed,
      connecting: true,
      connectionState: "connecting",
      screen: "game",
    });
    this.#session?.net.setPeerIds({ local: this.#state.peerId || null, remote: trimmed });

    try {
      await this.#network.connect(trimmed);
      if (!quiet) {
        this.#showToast("Connection request sent.");
      }
    } catch (error) {
      this.#patchState({
        connecting: false,
        connectionState: "error",
        lastError: error instanceof Error ? error.message : "Failed to start peer connection.",
      });
      this.#showToast(this.#state.lastError || "Failed to start peer connection.");
    }
  }

  #applySnapshot(snapshot: SessionSnapshot) {
    const readySelf = readyStates.includes(snapshot.localState);
    const readyPeer = readyStates.includes(snapshot.remoteState);
    const canReady =
      this.#state.connected && (snapshot.localState === "idle" || snapshot.localState === "ready");
    const canStart = this.#state.connected && snapshot.localState === "could_start";
    const canUndo =
      this.#state.connected &&
      (snapshot.localState === "turn" || snapshot.localState === "remote_turn") &&
      !snapshot.pendingAction &&
      snapshot.history.length > 0;
    const canRestart =
      this.#state.connected &&
      (snapshot.localState === "turn" || snapshot.localState === "remote_turn") &&
      !snapshot.pendingAction;
    const started =
      activeStates.includes(snapshot.localState) ||
      (snapshot.localState === "offline" && snapshot.lastStart !== null);
    const turnOwner =
      snapshot.localState === "turn"
        ? "me"
        : snapshot.localState === "remote_turn"
          ? "peer"
          : null;

    this.#patchState({
      readySelf,
      readyPeer,
      canReady,
      canStart,
      canUndo,
      canRestart,
      started,
      currentTurn: snapshot.turn,
      turnOwner,
      localState: snapshot.localState,
      remoteState: snapshot.remoteState,
      pendingAction: snapshot.pendingAction,
      historyLength: snapshot.history.length,
      lastStart: snapshot.lastStart,
    });

    if (snapshot.localState === "approving" && snapshot.pendingAction) {
      this.#dialogState = {
        open: true,
        title:
          snapshot.pendingAction === "undo"
            ? "Undo request pending"
            : "Restart request pending",
        description:
          snapshot.pendingAction === "undo"
            ? "Your peer wants to roll the match back. Approve the undo or reject it and keep the current board."
            : "Your peer wants to restart the match. Approve to reset the board shell or reject to continue.",
        confirmLabel: "Approve",
        cancelLabel: "Reject",
      };
    } else if (this.#dialogState.open) {
      this.#dialogState = defaultDialog;
    }

    this.#syncUi();
  }

  #applyConnectionState(connected: boolean) {
    const peerState = this.#network.peerState();
    const remotePeerId = this.#network.getRemotePeerId() ?? this.#state.remotePeerId;
    const peerId = this.#network.getLocalPeerId() ?? this.#state.peerId;

    const connectionState =
      peerState === "connected"
        ? "connected"
        : peerState === "requesting"
          ? "connecting"
          : this.#state.screen === "game"
            ? "offline"
            : peerId
              ? "registered"
              : "idle";

    this.#patchState({
      peerId,
      remotePeerId,
      connected,
      connecting: peerState === "requesting",
      connectionState,
      screen: connected || this.#state.screen === "game" ? "game" : "lobby",
    });

    if (connected) {
      this.#showToast("Peer connected. Game page is live.");
    } else if (this.#state.screen === "game" && peerId) {
      this.#showToast("Peer disconnected. Waiting for reconnect.");
    }
  }

  #patchState(next: Partial<AppState>) {
    this.#state = {
      ...this.#state,
      ...next,
    };
    if (this.#ready) {
      this.#syncUi();
    }
  }

  #syncUi() {
    const lobby = this.#lobbyPage;
    const game = this.#gamePage;
    const dialog = this.#dialog;
    const toast = this.#toast;
    if (!lobby || !game || !dialog || !toast) {
      return;
    }

    lobby.toggleAttribute("hidden", this.#state.screen !== "lobby");
    game.toggleAttribute("hidden", this.#state.screen !== "game");

    lobby.state = {
      gameTitle: this.#state.gameTitle,
      signalUrl: this.#state.signalUrl,
      targetId: this.#state.targetId,
      peerId: this.#state.peerId,
      remotePeerId: this.#state.remotePeerId,
      connectionState: this.#state.connectionState,
      registering: this.#state.registering,
      connecting: this.#state.connecting,
    };

    game.state = {
      gameTitle: this.#state.gameTitle,
      peerId: this.#state.peerId,
      remotePeerId: this.#state.remotePeerId,
      connected: this.#state.connected,
      connectionState: this.#state.connectionState,
      readySelf: this.#state.readySelf,
      readyPeer: this.#state.readyPeer,
      canReady: this.#state.canReady,
      canStart: this.#state.canStart,
      canUndo: this.#state.canUndo,
      canRestart: this.#state.canRestart,
      currentTurn: this.#state.currentTurn,
      turnOwner: this.#state.turnOwner,
      localState: this.#state.localState,
      remoteState: this.#state.remoteState,
      pendingAction: this.#state.pendingAction,
      sessionId: this.#state.sessionId,
    };

    dialog.state = this.#dialogState;
    toast.state = this.#toastState;
  }

  #showToast(message: string) {
    if (!message) {
      return;
    }
    if (this.#toastTimer) {
      window.clearTimeout(this.#toastTimer);
    }
    this.#toastState = {
      open: true,
      message,
    };
    this.#syncUi();
    this.#toastTimer = window.setTimeout(() => {
      this.#toastState = defaultToast;
      this.#syncUi();
      this.#toastTimer = null;
    }, 2200);
  }

  async #copyText(value: string) {
    if (!value) {
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        this.#showToast("Share link copied.");
        return;
      }
    } catch {
      // fall through to prompt
    }
    window.prompt("Copy share link", value);
  }

  #handleRegisterEvent = (event: CustomEvent<{ signalUrl: string }>) => {
    void this.#register(event.detail.signalUrl);
  };

  #handleConnectEvent = (event: CustomEvent<{ targetId: string }>) => {
    void this.#connect(event.detail.targetId);
  };

  #handleSignalChangeEvent = (event: CustomEvent<{ signalUrl: string }>) => {
    this.#patchState({ signalUrl: event.detail.signalUrl });
  };

  #handleTargetChangeEvent = (event: CustomEvent<{ targetId: string }>) => {
    this.#patchState({ targetId: event.detail.targetId });
  };

  #handleShareDetectedEvent = (event: CustomEvent<{ peerId: string; signalUrl: string }>) => {
    this.#patchState({
      targetId: event.detail.peerId,
      signalUrl: event.detail.signalUrl || this.#state.signalUrl,
    });
  };

  #handleCopyShareEvent = (event: CustomEvent<{ value: string }>) => {
    void this.#copyText(event.detail.value);
  };

  #handleReadyEvent = () => {
    this.#session?.actions.ready();
    this.#showToast("Ready state sent.");
  };

  #handleStartEvent = () => {
    this.#session?.actions.start();
    this.#showToast("Start request sent.");
  };

  #handleUndoEvent = () => {
    this.#session?.actions.undo();
    this.#showToast("Undo request sent.");
  };

  #handleRestartEvent = () => {
    this.#session?.actions.restart();
    this.#showToast("Restart request sent.");
  };

  #handleDialogConfirmEvent = () => {
    this.#session?.actions.approve();
    this.#dialogState = defaultDialog;
    this.#syncUi();
    this.#showToast("Request approved.");
  };

  #handleDialogCancelEvent = () => {
    this.#session?.actions.reject();
    this.#dialogState = defaultDialog;
    this.#syncUi();
    this.#showToast("Request rejected.");
  };
}
