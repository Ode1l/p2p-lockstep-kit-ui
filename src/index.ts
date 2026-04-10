import "./tailwind.css";
import { P2PLockstepActionBarElement } from "./components/action-bar";
import { P2PLockstepConfirmDialogElement } from "./components/confirm-dialog";
import { P2PLockstepSharePanelElement } from "./components/share-panel";
import { P2PLockstepStatusPanelElement } from "./components/status-panel";
import { P2PLockstepToastMessageElement } from "./components/toast-message";
import { P2PLockstepBoardHostElement } from "./game/board-host";
import { P2PLockstepLobbyPageElement } from "./pages/lobby-page";
import { P2PLockstepGamePageElement } from "./pages/game-page";
import { P2PLockstepAppElement } from "./app-shell";

const define = (tag: string, ctor: CustomElementConstructor) => {
  if (!customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
};

export const defineP2PLockstepUi = () => {
  define("p2p-lockstep-share-panel", P2PLockstepSharePanelElement);
  define("p2p-lockstep-status-panel", P2PLockstepStatusPanelElement);
  define("p2p-lockstep-action-bar", P2PLockstepActionBarElement);
  define("p2p-lockstep-confirm-dialog", P2PLockstepConfirmDialogElement);
  define("p2p-lockstep-toast-message", P2PLockstepToastMessageElement);
  define("p2p-lockstep-board-host", P2PLockstepBoardHostElement);
  define("p2p-lockstep-lobby-page", P2PLockstepLobbyPageElement);
  define("p2p-lockstep-game-page", P2PLockstepGamePageElement);
  define("p2p-lockstep-app", P2PLockstepAppElement);
};

defineP2PLockstepUi();

export * from "./types";
export { P2PLockstepActionBarElement } from "./components/action-bar";
export { P2PLockstepConfirmDialogElement } from "./components/confirm-dialog";
export { P2PLockstepSharePanelElement } from "./components/share-panel";
export { P2PLockstepStatusPanelElement } from "./components/status-panel";
export { P2PLockstepToastMessageElement } from "./components/toast-message";
export { P2PLockstepBoardHostElement } from "./game/board-host";
export { P2PLockstepLobbyPageElement } from "./pages/lobby-page";
export { P2PLockstepGamePageElement } from "./pages/game-page";
export { P2PLockstepAppElement } from "./app-shell";
