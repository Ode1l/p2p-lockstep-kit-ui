import "../../src/index";
import { mountGomokuDemo } from "./demo";
import type { P2PLockstepAppElement } from "../../src/app-shell";

window.addEventListener("DOMContentLoaded", () => {
  const app = document.querySelector(
    "p2p-lockstep-app",
  ) as P2PLockstepAppElement | null;
  const mount = app?.getBoardHost();
  const runtime = app?.getRuntime();

  if (!mount || !runtime) {
    return;
  }

  mountGomokuDemo({ mount, runtime });
});
