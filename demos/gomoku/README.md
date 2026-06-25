# Gomoku Demo

This root is intentionally outside `src/` so the demo can evolve independently
from the npm package entry. The package build still emits only `src/index.ts`.

The demo mounts into `<p2p-lockstep-app>` through `getRuntime()` and
`getBoardHost()`.
