import type { ActionBarState, GamePageState, StatusPanelState } from "../types";
import type { P2PLockstepActionBarElement } from "../components/action-bar";
import type { P2PLockstepStatusPanelElement } from "../components/status-panel";
import type { P2PLockstepBoardHostElement } from "../game/board-host";

const defaultState: GamePageState = {
  gameTitle: "P2P Lockstep",
  peerId: "",
  remotePeerId: "",
  connected: false,
  connectionState: "idle",
  readySelf: false,
  readyPeer: false,
  canReady: false,
  canStart: false,
  canUndo: false,
  canRestart: false,
  currentTurn: 1,
  turnOwner: null,
  localState: "idle",
  remoteState: "idle",
  pendingAction: null,
  sessionId: "default-session",
};

export class P2PLockstepGamePageElement extends HTMLElement {
  #state: GamePageState = defaultState;
  #ready = false;
  #title: HTMLElement | null = null;
  #subtitle: HTMLElement | null = null;
  #statusPanel: (HTMLElement & { state: StatusPanelState }) | null = null;
  #actionBar: (HTMLElement & { state: ActionBarState }) | null = null;
  #boardHost: P2PLockstepBoardHostElement | null = null;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.render();
    this.#syncChildren();
  }

  set state(value: GamePageState) {
    this.#state = value;
    if (this.#ready) {
      this.#syncChildren();
    }
  }

  get state() {
    return this.#state;
  }

  render() {
    this.className = "block h-full";
    this.innerHTML = `
      <section class="grid h-full gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside class="flex flex-col gap-4">
          <div class="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p class="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-teal-200/70">
              Match
            </p>
            <h2 data-title class="mt-3 text-3xl font-semibold tracking-tight text-white"></h2>
            <p data-subtitle class="mt-3 text-sm leading-6 text-slate-300"></p>
          </div>

          <p2p-lockstep-status-panel></p2p-lockstep-status-panel>
        </aside>

        <div class="grid min-h-[32rem] gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
          <p2p-lockstep-board-host></p2p-lockstep-board-host>
          <div class="lg:sticky lg:bottom-6">
            <p2p-lockstep-action-bar></p2p-lockstep-action-bar>
          </div>
        </div>
      </section>
    `;

    this.#title = this.querySelector("[data-title]");
    this.#subtitle = this.querySelector("[data-subtitle]");
    this.#statusPanel = this.querySelector("p2p-lockstep-status-panel");
    this.#actionBar = this.querySelector("p2p-lockstep-action-bar");
    this.#boardHost = this.querySelector("p2p-lockstep-board-host");
  }

  getBoardHost() {
    return this.#boardHost?.getMount() ?? null;
  }

  #syncChildren() {
    if (!this.#title || !this.#subtitle || !this.#statusPanel || !this.#actionBar) {
      return;
    }

    this.#title.textContent = this.#state.gameTitle;
    this.#subtitle.textContent = this.#state.connected
      ? "Connection established. The board host is ready for the actual game implementation."
      : "The game surface stays active so reconnect and recovery can happen without losing context.";

    this.#statusPanel.state = {
      peerId: this.#state.peerId,
      remotePeerId: this.#state.remotePeerId,
      connected: this.#state.connected,
      connectionState: this.#state.connectionState,
      currentTurn: this.#state.currentTurn,
      turnOwner: this.#state.turnOwner,
      localState: this.#state.localState,
      remoteState: this.#state.remoteState,
      readySelf: this.#state.readySelf,
      readyPeer: this.#state.readyPeer,
      pendingAction: this.#state.pendingAction,
      sessionId: this.#state.sessionId,
    };

    this.#actionBar.state = {
      connected: this.#state.connected,
      readySelf: this.#state.readySelf,
      canReady: this.#state.canReady,
      canStart: this.#state.canStart,
      canUndo: this.#state.canUndo,
      canRestart: this.#state.canRestart,
      connectionState: this.#state.connectionState,
    };
  }
}
