import type { LobbyPageState, SharePanelState } from "../types";
import { emit } from "../utils/events";
import { buildShareUrl, parseShareInput } from "../utils/share";

const defaultState: LobbyPageState = {
  gameTitle: "P2P Lockstep",
  signalUrl: "",
  targetId: "",
  peerId: "",
  remotePeerId: "",
  connectionState: "idle",
  registering: false,
  connecting: false,
};

export class P2PLockstepLobbyPageElement extends HTMLElement {
  #state: LobbyPageState = defaultState;
  #ready = false;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.addEventListener("click", this.#handleClick);
    this.addEventListener("input", this.#handleInput);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
    this.removeEventListener("input", this.#handleInput);
  }

  set state(value: LobbyPageState) {
    this.#state = value;
    if (this.#ready) {
      this.render();
    }
  }

  get state() {
    return this.#state;
  }

  render() {
    this.className = "block";
    this.innerHTML = `
      <section class="grid min-h-full gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.85fr)]">
        <div class="flex flex-col justify-between gap-6 rounded-[2.4rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
          <div class="space-y-5">
            <div class="space-y-3">
              <p class="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-teal-200/70">
                Lobby
              </p>
              <h1 class="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                ${this.#state.gameTitle}
              </h1>
              <p class="max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                Register your peer, share the link, then move into the game surface. The lobby is
                intentionally simple so it stays usable on phone and desktop.
              </p>
            </div>

            <div class="grid gap-4">
              <section class="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Register</p>
                    <h2 class="mt-2 text-lg font-semibold text-white">Signaling server</h2>
                  </div>
                  <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    ${this.#state.connectionState}
                  </span>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm text-slate-300">WebSocket URL</span>
                  <input
                    data-field="signal-url"
                    value="${this.#state.signalUrl}"
                    placeholder="ws://host:port"
                    class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-300/50"
                  />
                </label>

                <button
                  type="button"
                  data-action="register"
                  class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  ${this.#state.registering || !this.#state.signalUrl ? "disabled" : ""}
                >
                  ${this.#state.registering ? "Registering..." : "Register peer"}
                </button>

                <div class="mt-4 rounded-[1.4rem] border border-white/8 bg-slate-950/55 p-4">
                  <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Local Peer ID</p>
                  <p class="mt-2 break-all font-mono text-sm text-slate-200">
                    ${this.#state.peerId || "Register first to get your peer ID."}
                  </p>
                </div>
              </section>

              <section class="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <div class="mb-4">
                  <p class="text-[0.68rem] uppercase tracking-[0.26em] text-slate-500">Join</p>
                  <h2 class="mt-2 text-lg font-semibold text-white">Connect to a peer</h2>
                </div>

                <label class="block">
                  <span class="mb-2 block text-sm text-slate-300">Target peer or share URL</span>
                  <input
                    data-field="target-id"
                    value="${this.#state.targetId}"
                    placeholder="peer id or share link"
                    class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-300/50"
                  />
                </label>

                <button
                  type="button"
                  data-action="connect"
                  class="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  ${this.#state.connecting || !this.#state.targetId ? "disabled" : ""}
                >
                  ${this.#state.connecting ? "Connecting..." : "Connect"}
                </button>
              </section>
            </div>
          </div>
        </div>

        <p2p-lockstep-share-panel></p2p-lockstep-share-panel>
      </section>
    `;

    const sharePanel = this.querySelector("p2p-lockstep-share-panel") as
      | (HTMLElement & { state: SharePanelState })
      | null;
    if (sharePanel) {
      sharePanel.state = {
        peerId: this.#state.peerId,
        signalUrl: this.#state.signalUrl,
        shareUrl: buildShareUrl(this.#state.peerId, this.#state.signalUrl),
      };
    }
  }

  #handleClick = (event: Event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "button[data-action]",
    );
    if (!target || target.disabled) {
      return;
    }

    if (target.dataset.action === "register") {
      emit(this, "lockstep-register", { signalUrl: this.#state.signalUrl.trim() });
    }

    if (target.dataset.action === "connect") {
      emit(this, "lockstep-connect", { targetId: this.#state.targetId.trim() });
    }
  };

  #handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    if (!input?.dataset.field) {
      return;
    }

    if (input.dataset.field === "signal-url") {
      emit(this, "lockstep-signal-change", { signalUrl: input.value });
      return;
    }

    if (input.dataset.field === "target-id") {
      const parsed = parseShareInput(input.value);
      if (parsed) {
        emit(this, "lockstep-share-detected", parsed);
        return;
      }
      emit(this, "lockstep-target-change", { targetId: input.value });
    }
  };
}
