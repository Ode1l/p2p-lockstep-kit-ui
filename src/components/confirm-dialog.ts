import type { DialogState } from "../types";
import { emit } from "../utils/events";

const defaultState: DialogState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
};

export class P2PLockstepConfirmDialogElement extends HTMLElement {
  #state: DialogState = defaultState;
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

  set state(value: DialogState) {
    this.#state = value;
    if (this.#ready) {
      this.render();
    }
  }

  get state() {
    return this.#state;
  }

  render() {
    const { open, title, description, confirmLabel, cancelLabel } = this.#state;
    this.className = open ? "fixed inset-0 z-50 block" : "hidden";
    this.innerHTML = `
      <div data-overlay class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
      <div class="relative flex min-h-full items-end justify-center p-4 sm:items-center">
        <section class="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/40">
          <div class="space-y-3">
            <p class="text-[0.72rem] uppercase tracking-[0.28em] text-teal-200/70">Action Required</p>
            <h3 class="text-xl font-semibold text-white">${title}</h3>
            <p class="text-sm leading-6 text-slate-300">${description}</p>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              data-action="confirm"
              class="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              ${confirmLabel}
            </button>
            <button
              type="button"
              data-action="cancel"
              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              ${cancelLabel}
            </button>
          </div>
        </section>
      </div>
    `;
  }

  #handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (target.matches("[data-overlay]") || target.closest("[data-action='cancel']")) {
      emit(this, "lockstep-dialog-cancel");
      return;
    }
    if (target.closest("[data-action='confirm']")) {
      emit(this, "lockstep-dialog-confirm");
    }
  };
}
