import QRCode from "qrcode";
import type { SharePanelState } from "../types";
import { emit } from "../utils/events";

const defaultState: SharePanelState = {
  peerId: "",
  signalUrl: "",
  shareUrl: "",
};

export class P2PLockstepSharePanelElement extends HTMLElement {
  #state: SharePanelState = defaultState;
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

  set state(value: SharePanelState) {
    this.#state = value;
    if (this.#ready) {
      this.render();
    }
  }

  get state() {
    return this.#state;
  }

  async render() {
    const { peerId, shareUrl } = this.#state;
    this.className = "block";
    this.innerHTML = `
      <section class="flex h-full flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div class="space-y-2">
          <p class="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-teal-200/70">
            Share
          </p>
          <h3 class="text-lg font-semibold text-white">Invite your peer</h3>
          <p class="max-w-md text-sm leading-6 text-slate-300">
            Copy the direct share link or let the other side scan the QR code. The lobby stays
            mobile-friendly, so this panel works for phone and desktop.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div class="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-3">
            <canvas class="h-44 w-44 rounded-2xl bg-white"></canvas>
          </div>

          <div class="flex min-w-0 flex-col justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
            <div class="space-y-3">
              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Peer ID</p>
                <p class="mt-1 break-all font-mono text-sm text-slate-100">${peerId || "Not registered yet"}</p>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.24em] text-slate-500">Share URL</p>
                <p class="mt-1 break-all font-mono text-sm text-slate-300">
                  ${shareUrl || "Register first to generate a share link."}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-action="copy-share"
              class="inline-flex w-full items-center justify-center rounded-full bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              ${shareUrl ? "" : "disabled"}
            >
              Copy share link
            </button>
          </div>
        </div>
      </section>
    `;

    const canvas = this.querySelector("canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!shareUrl) {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    try {
      await QRCode.toCanvas(canvas, shareUrl, {
        width: 176,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
    } catch {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  #handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest("[data-action='copy-share']")) {
      return;
    }
    emit(this, "lockstep-copy-share", { value: this.#state.shareUrl });
  };
}
