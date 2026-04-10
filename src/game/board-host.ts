export class P2PLockstepBoardHostElement extends HTMLElement {
  #ready = false;
  #observer: MutationObserver | null = null;

  connectedCallback() {
    if (this.#ready) {
      return;
    }
    this.#ready = true;
    this.render();

    const mount = this.getMount();
    const placeholder = this.querySelector<HTMLElement>("[data-placeholder]");
    if (!mount || !placeholder) {
      return;
    }

    const syncPlaceholder = () => {
      placeholder.style.display = mount.childElementCount > 0 ? "none" : "flex";
    };

    syncPlaceholder();
    this.#observer = new MutationObserver(syncPlaceholder);
    this.#observer.observe(mount, { childList: true });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  render() {
    this.className = "block h-full";
    this.innerHTML = `
      <section class="relative h-full min-h-[22rem] overflow-hidden rounded-[2.2rem] border border-white/10 bg-slate-950/70">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.10),_transparent_48%),radial-gradient(circle_at_bottom,_rgba(248,250,252,0.06),_transparent_38%)]"></div>
        <div data-board-mount class="relative z-10 h-full"></div>
        <div
          data-placeholder
          class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-center text-sm leading-6 text-slate-400"
        >
          Board host is ready. Mount the actual game board here in the next step.
        </div>
      </section>
    `;
  }

  getMount() {
    return this.querySelector<HTMLDivElement>("[data-board-mount]");
  }
}
