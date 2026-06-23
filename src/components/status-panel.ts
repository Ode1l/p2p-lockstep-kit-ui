import type { StatusPanelState } from "../types";
import { setText } from "../utils/dom";

const defaultState: StatusPanelState = {
  peerId: "",
  remotePeerId: "",
  connected: false,
  connectionState: "idle",
  currentTurn: 1,
  turnOwner: null,
  localState: "idle",
  remoteState: "idle",
  readySelf: false,
  readyPeer: false,
  pendingAction: null,
  sessionId: "default-session",
};

const turnLabel = (owner: StatusPanelState["turnOwner"]) => {
  if (owner === "me") {
    return "Your turn";
  }
  if (owner === "peer") {
    return "Peer turn";
  }
  return "Waiting";
};

export class P2PLockstepStatusPanelElement extends HTMLElement {
  #state: StatusPanelState = defaultState;
  #ready = false;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.render();
  }

  set state(value: StatusPanelState) {
    this.#state = value;
    if (this.#ready) {
      this.render();
    }
  }

  get state() {
    return this.#state;
  }

  render() {
    const { connected, pendingAction } = this.#state;

    this.className = "block";
    this.innerHTML = `
      <section class="lock-panel grid gap-3 rounded-[2rem] p-4 text-sm text-[var(--lock-muted)]">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <article class="rounded-[1.4rem] border border-[var(--lock-border)] bg-[rgba(245,234,210,0.045)] p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--lock-dim)]">Connection</p>
            <p class="mt-2 text-base font-semibold text-[var(--lock-paper)]">${connected ? "Live" : "Standby"}</p>
            <p data-connection-state class="mt-1 text-sm text-[var(--lock-muted)]"></p>
          </article>

          <article class="rounded-[1.4rem] border border-[var(--lock-border)] bg-[rgba(245,234,210,0.045)] p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--lock-dim)]">Turn</p>
            <p data-current-turn class="mt-2 text-base font-semibold text-[var(--lock-paper)]"></p>
            <p data-turn-owner class="mt-1 text-sm text-[var(--lock-muted)]"></p>
          </article>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <article class="rounded-[1.4rem] border border-[var(--lock-border)] bg-[rgba(245,234,210,0.045)] p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--lock-dim)]">Identity</p>
            <p class="mt-2 text-sm font-medium text-[var(--lock-muted)]">Session: <span data-session-id class="lock-mono text-[var(--lock-paper)]"></span></p>
            <p data-peer-id class="lock-mono mt-2 break-all text-sm text-[var(--lock-paper)]"></p>
            <p data-remote-peer-id class="lock-mono mt-2 break-all text-xs text-[var(--lock-dim)]"></p>
          </article>

          <article class="rounded-[1.4rem] border border-[var(--lock-border)] bg-[rgba(245,234,210,0.045)] p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--lock-dim)]">Lobby State</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span data-ready-self class="rounded-full border border-[var(--lock-border)] px-3 py-1 text-xs text-[var(--lock-muted)]"></span>
              <span data-ready-peer class="rounded-full border border-[var(--lock-border)] px-3 py-1 text-xs text-[var(--lock-muted)]"></span>
              <span data-local-state class="rounded-full border border-[var(--lock-border)] px-3 py-1 text-xs text-[var(--lock-muted)]"></span>
              <span data-remote-state class="rounded-full border border-[var(--lock-border)] px-3 py-1 text-xs text-[var(--lock-muted)]"></span>
              ${
                pendingAction
                  ? `<span class="rounded-full border border-[var(--lock-border-strong)] bg-[rgba(201,149,67,0.14)] px-3 py-1 text-xs text-[var(--lock-bronze-bright)]">Pending ${pendingAction}</span>`
                  : ""
              }
            </div>
          </article>
        </div>
      </section>
    `;

    setText(this, "[data-connection-state]", this.#state.connectionState);
    setText(this, "[data-current-turn]", `#${this.#state.currentTurn}`);
    setText(this, "[data-turn-owner]", turnLabel(this.#state.turnOwner));
    setText(this, "[data-session-id]", this.#state.sessionId);
    setText(this, "[data-peer-id]", this.#state.peerId || "Local peer ID will appear after register.");
    setText(this, "[data-remote-peer-id]", this.#state.remotePeerId || "Remote peer not connected yet.");
    setText(this, "[data-ready-self]", `Me ${this.#state.readySelf ? "ready" : "idle"}`);
    setText(this, "[data-ready-peer]", `Peer ${this.#state.readyPeer ? "ready" : "idle"}`);
    setText(this, "[data-local-state]", `Local ${this.#state.localState}`);
    setText(this, "[data-remote-state]", `Remote ${this.#state.remoteState}`);
  }
}
