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
      <section class="lock-panel rounded-[2rem] p-4">
        <div class="flex flex-col gap-3">
          <button
            type="button"
            data-action="ready"
            class="lock-disabled inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
              readySelf
                ? "lock-secondary"
                : "bg-[var(--lock-teal)] text-[#08120f] shadow-[0_12px_32px_rgba(110,231,200,0.22)] hover:brightness-105"
            }"
            ${canReady ? "" : "disabled"}
          >
            ${readySelf ? "Ready Sent" : "Ready"}
          </button>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              data-action="start"
              class="lock-primary lock-disabled inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition"
              ${canStart ? "" : "disabled"}
            >
              Start
            </button>
            <button
              type="button"
              data-action="undo"
              class="lock-secondary lock-disabled inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition"
              ${canUndo ? "" : "disabled"}
            >
              Undo
            </button>
            <button
              type="button"
              data-action="restart"
              class="lock-secondary lock-disabled inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition"
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
