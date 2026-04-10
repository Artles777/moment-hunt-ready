# AGENTS.md

## Purpose

This repository is a demo-first MVP for a sports/esports moment-prediction game.

The core loop must stay intact:

`watch stream/feed -> user guesses -> actual event arrives -> delta is measured -> score is awarded -> leaderboard updates`

Optimize for a working end-to-end demo, not for production completeness.

This file is the operating contract for contributors and coding agents working in this repo. Use it to avoid breaking the demo, introducing fake integrations, or drifting away from the product's actual constraints.

## Product snapshot

Moment Hunt is currently a single-screen realtime prototype with:

- a Next.js frontend in `app/*`
- a server-side realtime runtime with an in-app SSE endpoint and an optional local WebSocket adapter
- real sports metadata and events sourced from ESPN soccer endpoints
- simulated esports demo feeds emitted by the shared realtime runtime
- a local-only leaderboard persisted in browser storage
- separate `sports` and `esports` tabs sharing one normalized gameplay contract

Important honesty rule:

- `sports` uses real upstream sports data
- `esports` currently uses clearly simulated demo feeds in this repo
- video/stream availability is partial and depends on upstream data

Do not present the current MVP as a production-grade realtime streaming platform.

## Non-negotiable rules

- Do not invent APIs, credentials, environment variables, database schemas, websocket channels, or external integrations.
- Do not claim code was tested, deployed, or verified unless it actually was.
- Do not replace realtime behavior with client-side mocks unless explicitly requested.
- If a source is simulated, label it clearly as simulated.
- Keep sports and esports events on one normalized event schema whenever possible.
- Keep scoring deterministic and implemented in a single source of truth.
- Do not move business logic into presentation components unless there is a strong reason.
- Do not silently convert missing realtime data into fake live data.
- Do not overwrite existing user changes in the worktree unless explicitly asked.
- Do not do broad refactors when a narrow fix is enough.

## Priorities

When making tradeoffs, follow this order:

1. working end-to-end flow
2. correct event timing and scoring
3. validation and reproducibility
4. maintainable structure
5. UI polish

If a change improves polish but weakens the playable demo loop, the change is wrong.

## Actual source of truth in this repo

The example paths below must be adapted to the real repository layout. This repo does not currently use `src/*`.

Current source-of-truth map:

- Event/feed interfaces in practice: `lib/moment-hunt/types.ts`
- Scoring rules in practice: `lib/moment-hunt/scoring.ts`
- Realtime transport/protocol: `server/realtime-runtime.mjs`, `app/api/realtime/route.ts`, and `server/realtime-server.mjs` for the optional local WebSocket adapter
- Realtime client behavior: `hooks/use-moment-hunt-realtime.ts`
- Page-level gameplay orchestration: `app/page.tsx`
- Product-specific UI composition: `components/moment-hunt/*`
- Stream parsing and format helpers: `lib/moment-hunt/stream-source.ts`, `lib/moment-hunt/format.ts`
- Visual tokens and app-level theming: `app/globals.css`
- Dev entrypoint for running both services: `scripts/dev-all.mjs`
- Product notes and current scope: `README.md`

Implication:

- if you change the event contract, update `server/realtime-runtime.mjs`, `app/api/realtime/route.ts`, `server/realtime-server.mjs`, `lib/moment-hunt/types.ts`, realtime ingestion, and UI consumers in the same task
- if you change scoring, update both the scoring implementation and every UI that renders scoring results in the same task
- if you change normalized helpers or realtime client behavior, update all consumers in the same task

## Repository structure

- `app/layout.tsx`
  Root layout, metadata, global CSS import, Vercel analytics in production.

- `app/page.tsx`
  Main product screen and orchestration layer.
  It currently owns:
  - page layout orchestration
  - feed selection
  - video state handling
  - gameplay state machine
  - leaderboard persistence wiring
  - composition of product-specific UI modules

- `components/moment-hunt/*`
  Product-specific UI modules for the single-screen MVP.
  Current responsibility split:
  - `page-header.tsx` for mode switch and global status
  - `broadcast-list.tsx` for the left broadcast column
  - `video-hero.tsx` for stream/video presentation
  - `game-panel.tsx` for round controls and result rendering
  - `right-rail.tsx` for score, controls, selected feed, activity, and notes
  - `glass-card.tsx` for the shared Moment Hunt card shell

- `lib/moment-hunt/types.ts`
  Shared normalized types for feed state, live events, leaderboard entries, and game state.

- `lib/moment-hunt/scoring.ts`
  Shared scoring constants and deterministic score calculation.

- `lib/moment-hunt/stream-source.ts`
  Stream URL parsing and embed/direct source normalization.

- `lib/moment-hunt/format.ts`
  Formatting helpers for clock values, labels, and UI-safe event text.

- `hooks/use-moment-hunt-realtime.ts`
  WebSocket/SSE client transport, feed-state ingestion, and live-event normalization into UI-friendly state.

- `app/api/realtime/route.ts`
  Same-origin SSE endpoint used by `next start` and Vercel deployments.

- `server/realtime-runtime.mjs`
  Shared realtime runtime.
  It fetches sports data, emits simulated esports demo feeds, normalizes feeds, emits `feed_state`, emits `live_event`, and simulates replay progression for completed matches.

- `app/globals.css`
  Global theme tokens and layout visual language.
  The current visual direction is intentional: dark glassmorphism with custom tokens such as `--glass`, `--surface`, `--live`, `--success`.

- `server/realtime-server.mjs`
  Optional local WebSocket adapter for the shared realtime runtime.

- `scripts/dev-all.mjs`
  Runs Next.js and the local WebSocket adapter together.

- `components/ui/*`
  Shared UI primitives. Treat them as generic building blocks, not as a place for product-specific game logic.

- `lib/utils.ts`
  Shared utility helpers.

- `hooks/*`
  Generic hooks. Not central to the current gameplay contract.

## Current functional contract

The following behavior is part of the MVP contract and must be preserved unless the task explicitly changes product behavior.

### Main playable loop

The MVP must preserve:

`view -> guess -> compare -> score -> leaderboard`

The user experience may improve, but this sequence must remain coherent end-to-end.

### Source of truth rules

- The frontend must not invent future events locally.
- The frontend should react to normalized realtime messages, not raw provider payloads.
- The stream catalog must come from realtime feed state, not from hardcoded UI arrays.
- The currently selected broadcast must always correspond to the current feed list.

### Gameplay state machine

The main gameplay state machine in `app/page.tsx` is currently:

- `idle`
- `armed`
- `guess-locked`
- `resolved`

Expected behavior:

- Starting a round clears previous target and result state.
- Catching locks the current guess timestamp.
- Resolution only happens after an actual event arrives.
- Switching the selected match resets round state.
- Scoring is computed from timestamp delta, not from subjective UI state.

Do not bypass this flow casually.

### Leaderboard contract

- The leaderboard is local-only today.
- Persistence key: `moment-hunt-leaderboard-v2`
- "You" is the local mutable player row.
- Ranks are recalculated after score updates.

Do not add heavy persistence infrastructure unless the task explicitly asks for it.

### Realtime feed contract

The frontend currently expects two normalized realtime message types:

#### `feed_state`

Expected fields:

- `source`
- `matchId`
- `title`
- `competition`
- `venue`
- `clockMs`
- `startedAt`
- `streamStatus`
- `streamUrl`
- `streamSyncSupported`
- `posterUrl`
- `statusDetail`
- `broadcastName`
- `homeTeam`
- `awayTeam`
- `homeScore`
- `awayScore`
- `isPlayable`
- `eventCount`

#### `live_event`

Expected fields:

- `id`
- `source`
- `matchId`
- `title`
- `competition`
- `eventType`
- `eventTimestamp`
- `label`
- `team`
- `streamStatus`

Rules:

- Keep payloads backward-compatible when possible.
- Do not rename or remove existing fields casually.
- If required fields change, update all producers and consumers in the same task.

## Event model rules

Every incoming event must be normalized before reaching the UI.

Do not maintain separate incompatible event formats for sports and esports in frontend state.

Every normalized event should include at least:

- `source`
- `matchId`
- `title`
- `eventType`
- `eventTimestamp`
- `label`

Additional fields such as `competition`, `team`, and `streamStatus` should remain consistent across sources whenever possible.

## Realtime rules

- Prefer WebSocket/realtime delivery over hardcoded UI timers.
- Keep transport concerns separate from UI presentation state.
- UI should consume normalized events, not provider-specific raw payloads.
- Sports adapters and esports simulators, if added, must emit the same normalized event shape.
- Client-side timers may be used only as an explicit fallback, not as the default realtime mechanism.
- Do not precompute future events on the client.
- Do not silently replace missing upstream data with fake live signals.

## Video and stream rules

- `streamUrl` may legitimately be empty.
- Missing video is an honest upstream limitation, not necessarily a bug.
- The UI must remain usable even when no playable stream URL is available.
- `streamSyncSupported` must be respected:
  - `true` means the player may be synchronized to feed time
  - `false` means the player should behave like a regular clip or embed and should not be force-seeked against match time

Current supported parsing behavior in `lib/moment-hunt/stream-source.ts`:

- direct video URLs
- YouTube
- Twitch
- direct `.m3u8`

Current upstream limitation in this repo:

- scheduled/live ESPN matches often do not expose a browser-playable live stream URL
- replay matches may expose MP4/HLS highlight clips via `summary.videos`

Do not fake a production-grade live video ingestion pipeline unless explicitly requested.

Do not imply that upstream broadcast metadata equals an embeddable live stream URL. Those are different things.

## UI layout contract

The desktop layout is intentionally organized as:

- left sticky broadcast column
- main content column with video and gameplay
- right utility column with score, controls, selected feed, activity, and notes

Preserve these constraints unless the task explicitly changes UX:

- broadcasts stay on the left on desktop
- the broadcast list should not require a separate inner scroll to be usable
- the main video/feed panel remains the focal point
- score and controls remain visible in the right rail

Do not move the broadcast list back into the right sidebar or bury it in a nested scrolling container without explicit direction.

## Implementation rules

- Prefer the smallest working implementation over speculative abstractions.
- Avoid introducing new dependencies unless they materially simplify delivery.
- Avoid broad refactors unless the task requires them.
- Keep the single-screen MVP behavior intact unless the task explicitly changes UX.
- Do not add infrastructure that is not needed for the current demo scope.
- Keep business logic out of generic UI primitives under `components/ui/*`.
- Prefer behavior-preserving extraction over rewrite-heavy refactors.
- If touching core files like `app/page.tsx`, `hooks/use-moment-hunt-realtime.ts`, or `server/realtime-server.mjs`, read the full file first.

## Product-specific constraints

- Do not fake a production-grade live video ingestion pipeline.
- Do not add CV/ML event detection unless explicitly requested.
- Do not build auth, matchmaking, anti-cheat, or multiplayer infrastructure unless explicitly requested.
- Leaderboard may remain local or lightweight unless the task explicitly requires persistence.
- The MVP must always preserve the main playable loop:
  `view -> guess -> compare -> score -> leaderboard`

## Failure handling

- If a realtime source is unavailable, fail honestly and expose a clear fallback state.
- Do not silently substitute fake live data unless the task explicitly allows a simulated mode.
- If required information is missing, state what is missing and implement the smallest honest fallback.
- Missing video should degrade to metadata and status, not to a broken player or blank layout.
- If a source is simulated, mark it as simulated in code comments, UI copy, or docs as appropriate.

## Demo honesty

This repository may use:

- real sports event sources
- simulated esports event sources
- placeholder stream/video layers

That is acceptable.

What is not acceptable:

- presenting simulated infrastructure as a real production integration
- claiming live upstream video exists when the app is only showing metadata or replay clips
- claiming validation happened when it did not

## Common regression traps

- replacing realtime state with local constants or mock arrays
- resetting the selected feed incorrectly when feed ordering changes
- breaking the round reset when the match changes
- reimplementing scoring in multiple places
- treating replay clips as sync-safe live streams
- assuming every feed has `streamUrl`
- assuming `.m3u8` works in every browser without explicit player support
- moving the broadcast list into a nested scroll area on desktop
- changing realtime message fields without updating both server and frontend
- rewriting `app/page.tsx`, `components/moment-hunt/*`, or `hooks/use-moment-hunt-realtime.ts` wholesale and accidentally dropping part of the game loop
- mixing provider payloads directly into UI state without normalization

## Validation rules

Before considering a task complete:

- run the minimal relevant checks for the files changed
- typecheck touched code if available
- run targeted tests if available
- run the modified service or app when behavior changed
- if a check cannot be run, say exactly why

Prefer targeted checks over full-suite runs unless shared infrastructure changed.

For this repo, the default validation baseline for meaningful code changes is:

1. run `npm run build`
2. run the changed service or app when behavior changed
3. verify the relevant UI flow manually when the change affects gameplay, layout, or realtime behavior

Docs-only changes do not require a build unless they accompany code changes.

## Delivery standard

A task is only considered complete when:

- the modified flow is coherent end-to-end
- assumptions are explicitly stated
- validation is reported honestly
- simulated parts are clearly labeled
- no unsupported claims are made

## Response format for coding tasks

When making non-trivial changes:

1. briefly state the plan
2. list files to be modified
3. preserve stable contracts unless explicitly changing them
4. after changes, report what was validated and what was not validated

When no validation was run, say that directly.

## Safe change checklist

Before editing:

- inspect the relevant file fully if it is a core module
- check for existing uncommitted changes
- avoid overwriting user work
- prefer small diffs over rewrites

When changing frontend behavior:

- keep realtime-driven flow intact
- do not hardcode future events
- preserve honest empty-video fallback behavior
- preserve the desktop left-column broadcast layout
- preserve mobile readability

When changing backend behavior:

- keep `feed_state` and `live_event` stable unless the task explicitly changes the protocol
- keep replay event emission deterministic
- be cautious with refresh intervals and replay speed
- add provider-specific parsing only with defensive fallbacks

## Recommended refactor direction

If the project grows further, continue splitting orchestration and state concerns into focused hooks/modules without changing behavior first.

Suggested extraction order:

1. leaderboard persistence hook
2. feed selection hook
3. video control hook
4. activity/event-log widget extraction if the right rail grows
5. protocol contract tests for `feed_state` and `live_event`

Do behavior-preserving extraction first, then feature work.

If more pieces are extracted, update this file so the source-of-truth section keeps pointing at the real canonical paths.

## Maintenance rule

If a proposed change conflicts with this document, do one of the following in the same task:

- update the implementation to match the contract, or
- update this file with a clear reason for the contract change

Do not let `AGENTS.md` drift away from the real product.
