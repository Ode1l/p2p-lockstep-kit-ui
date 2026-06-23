# p2p-lockstep-kit-ui

Web Components UI shell for `p2p-lockstep-kit-network` and `p2p-lockstep-kit-session`.

The UI package owns the generic app surface:

- lobby page
- signaling registration
- peer connection
- share link and QR code
- game page shell
- ready / start / undo / restart controls
- request dialogs and toast messages
- board host container

Game projects mount their actual board into the board host and talk to the session through the runtime exposed by the UI element.

## Install

```bash
npm install p2p-lockstep-kit-ui
```

The UI package depends on:

```text
p2p-lockstep-kit-network
p2p-lockstep-kit-session
```

Game projects do not need to instantiate those packages directly for the common lobby/game flow.

## Basic Usage

```ts
import "p2p-lockstep-kit-ui";
import "p2p-lockstep-kit-ui/style.css";
```

```html
<p2p-lockstep-app
  game-title="Gomoku"
  session-id="gomoku"
></p2p-lockstep-app>
```

The default signaling server is `wss://signal.jiahengli.xyz`. Override it only when you
run your own signaling endpoint:

```html
<p2p-lockstep-app
  game-title="Gomoku"
  session-id="gomoku"
  signal-url="wss://signal.example.com"
></p2p-lockstep-app>
```

## Mounting A Game Board

```ts
import "p2p-lockstep-kit-ui";
import "p2p-lockstep-kit-ui/style.css";
import type { LockstepRuntime, P2PLockstepAppElement } from "p2p-lockstep-kit-ui";

const app = document.querySelector("p2p-lockstep-app") as P2PLockstepAppElement | null;

if (!app) {
  throw new Error("Missing p2p-lockstep-app");
}

await customElements.whenDefined("p2p-lockstep-app");

const runtime = app.getRuntime() as LockstepRuntime | null;
const boardHost = app.getBoardHost();

if (!runtime || !boardHost) {
  throw new Error("Lockstep UI is not ready");
}

const board = document.createElement("div");
board.className = "h-full";
boardHost.append(board);

runtime.observer.subscribe({
  onStateChange(snapshot) {
    // Render board state from snapshot.history, snapshot.turn, and local/remote states.
  },
});

board.addEventListener("click", () => {
  runtime.actions.move({
    // Game-specific move payload.
  });
});
```

## Runtime Boundary

The UI exposes the runtime from the app element:

```ts
const runtime = app.getRuntime();
```

Runtime actions:

```ts
runtime.actions.ready();
runtime.actions.start();
runtime.actions.move(move);
runtime.actions.undo();
runtime.actions.restart();
runtime.actions.approve();
runtime.actions.reject();
```

Runtime state:

```ts
runtime.observer.subscribe({
  onStateChange(snapshot) {},
  onConnectionChange(connected) {},
  onGameEvent(event) {},
  onError(error) {},
});
```

Network details are intentionally kept behind the UI runtime for the standard flow. Use `runtime.network` only when a game needs custom connection behavior.

## Package Design

```text
game project
  -> imports p2p-lockstep-kit-ui
  -> mounts board into p2p-lockstep-app.getBoardHost()
  -> sends moves through p2p-lockstep-app.getRuntime().actions

p2p-lockstep-kit-ui
  -> owns lobby/game pages and common controls
  -> creates NetworkClient
  -> creates session
  -> maps session snapshots into UI state

p2p-lockstep-kit-network / p2p-lockstep-kit-session
  -> provide transport and lockstep state
```

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

The local Vite config aliases `p2p-lockstep-kit-network` and `p2p-lockstep-kit-session` to sibling source folders for development. Published consumers resolve the package dependencies normally.

## Cloudflare Pages Demo

`pnpm build` builds the npm library package and does not emit an `index.html`.
Use the Pages build when deploying the demo site:

```bash
pnpm build:pages
```

Cloudflare Pages settings:

```text
Build command: pnpm build:pages
Build output directory: dist-pages
```
