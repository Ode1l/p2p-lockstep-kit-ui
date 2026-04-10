import type { ActionBarState } from "../types";
import { emit } from "../utils/events";

const defaultState: ActionBarState = {
  connected: false,
  readySelf: false,
  canReady: false,
  canStart: false,
  canUndo: false,
  canRestart: false,
  connectionState: "idle",
};

export class P2PLockstepActionBarElement extends HTMLElement {
  #state: ActionBarState = defaultState;
  #ready = false;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.addEventListener("click", this.#handleClick);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#handleClick);
  }

  set state(value: ActionBarState) {
    this.#state = value;
    if (this.#ready) {
      this.render();
    }
  }

  get state() {
    return this.#state;
  }

  render() {
    const { canReady, canStart, canUndo, canRestart, readySelf } = this.#state;

    this.className = "block";
    this.innerHTML = `
      <section class="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div class="flex flex-col gap-3">
          <button
            type="button"
            data-action="ready"
            class="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
              readySelf
                ? "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                : "bg-teal-400 text-slate-950 hover:bg-teal-300"
            } disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
            ${canReady ? "" : "disabled"}
          >
            ${readySelf ? "Ready Sent" : "Ready"}
          </button>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              data-action="start"
              class="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-900 disabled:text-slate-500"
              ${canStart ? "" : "disabled"}
            >
              Start
            </button>
            <button
              type="button"
              data-action="undo"
              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
              ${canUndo ? "" : "disabled"}
            >
              Undo
            </button>
            <button
              type="button"
              data-action="restart"
              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500"
              ${canRestart ? "" : "disabled"}
            >
              Restart
            </button>
          </div>
        </div>
      </section>
    `;
  }

  #handleClick = (event: Event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "button[data-action]",
    );
    if (!target || target.disabled) {
      return;
    }
    emit(this, `lockstep-${target.dataset.action}`);
  };
}
