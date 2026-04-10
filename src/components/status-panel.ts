import type { StatusPanelState } from "../types";

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
    const { peerId, remotePeerId, connected, connectionState, readySelf, readyPeer, localState, remoteState, currentTurn, pendingAction, sessionId } =
      this.#state;

    this.className = "block";
    this.innerHTML = `
      <section class="grid gap-3 rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-200">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <article class="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Connection</p>
            <p class="mt-2 text-base font-semibold text-white">${connected ? "Live" : "Standby"}</p>
            <p class="mt-1 text-sm text-slate-400">${connectionState}</p>
          </article>

          <article class="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Turn</p>
            <p class="mt-2 text-base font-semibold text-white">#${currentTurn}</p>
            <p class="mt-1 text-sm text-slate-400">${turnLabel(this.#state.turnOwner)}</p>
          </article>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <article class="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Identity</p>
            <p class="mt-2 text-sm font-medium text-slate-200">Session: <span class="font-mono text-slate-100">${sessionId}</span></p>
            <p class="mt-2 break-all font-mono text-sm text-slate-300">${peerId || "Local peer ID will appear after register."}</p>
            <p class="mt-2 break-all font-mono text-xs text-slate-500">${remotePeerId || "Remote peer not connected yet."}</p>
          </article>

          <article class="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
            <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Lobby State</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Me ${readySelf ? "ready" : "idle"}</span>
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Peer ${readyPeer ? "ready" : "idle"}</span>
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Local ${localState}</span>
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Remote ${remoteState}</span>
              ${
                pendingAction
                  ? `<span class="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">Pending ${pendingAction}</span>`
                  : ""
              }
            </div>
          </article>
        </div>
      </section>
    `;
  }
}
