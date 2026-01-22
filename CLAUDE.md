# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Run API server (3001) + frontend (3000) together
npm run server         # API server only
npm run dev            # Vite dev server only
npm run build          # Production build
npm test               # Run tests once
npm run test:watch     # Watch mode
npx vitest -t "pattern" # Run single test by name
```

## Architecture

React dashboard displaying live convoy data from Gas Town (`gt` CLI).

### Data Flow

```
gt CLI (~/gt) → server.ts (WebSocket) → App.tsx → UI components
```

1. **server.ts** - Node.js server wrapping `gt` CLI
   - Runs `gt convoy list --all --json` and `gt convoy status {id} --json`
   - WebSocket broadcasts convoy updates every 10s
   - HTTP endpoints: `/api/convoys`, `/api/convoy-list`, `/api/convoy/:id`
   - Config: `GT_WORKSPACE` (default `~/gt`), `API_PORT` (default `3001`)

2. **types.ts** - Transformation layer (pure functions, fully tested)
   - `GtConvoyStatus` → `Convoy` via `transformGtConvoy()`
   - `GtConvoyStatus[]` → `SystemStats` via `calculateStats()`
   - Assignee formats: `{rig}/polecats/{name}` (ephemeral workers), `{rig}/crew/{name}` (persistent workers)

3. **App.tsx** - React app with WebSocket connection
   - Auto-reconnects on disconnect
   - Sends `{ type: 'refresh' }` for manual refresh

### Status Mapping

| gt CLI | App Status |
|--------|------------|
| `closed` | `COMPLETE` |
| `open` + incomplete items | `RUNNING` |
| `open` + no tracked items | `STALE` |

### Styling

Tailwind CSS via CDN with custom colors (`industrial-*`, `brass-*`, `copper-*`). Theme config in `index.html`.

## Key Principles

- **TDD** - Tests first; implementation done when tests pass
- **Don't Swallow Errors** - No silent catches. Throw exceptions to surface root causes
- **No Dead Code** - Remove unused code, don't comment it out
- **KISS/YAGNI** - Minimal complexity, no speculative features
- **Separation of Concerns** - Pure transformation logic in `types.ts`, UI in components, I/O in `server.ts`
