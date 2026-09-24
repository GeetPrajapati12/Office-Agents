# Office AI Agents — Update Batch 3: UI Polish (visual parity pass toward the munder-difflin reference)

This zip is scoped to visual/UI changes only, on top of the previous "Command Center" batch.
It does NOT replace that zip — apply Batch 2 first (or already have it applied), then this one.

## New/changed files
- `src/renderer/src/pixi/AvatarEntity.ts` — **real** floating status-label bubble above each avatar's
  head (e.g. "Idle", "Working"), driven by the actual `setState()` calls already in your codebase.
  Not fabricated text — it reflects the real AgentState value.
- `src/renderer/src/pixi/OfficeEngine.ts` — added `drawDecor()`: potted plants at fixed floor spots,
  and a proper meeting table with chair blocks instead of a plain colored square. Purely cosmetic —
  station/obstacle logic is unchanged.
- `src/renderer/src/components/office/OfficeCanvas.tsx` — bottom-left info chip showing your **real**
  configured provider/model (fetched from `window.api.settings.get()`), similar placement to the
  reference's "memory · minilm" chip but showing actual data instead of a made-up label.
- `src/renderer/src/components/layout/TitleBar.tsx` — theme toggle (🌙/☀) now actually works: it
  writes to `AppSettings.theme` via `settings:update` and sets `data-theme` on `<html>`, which
  `global.css` now has real light-mode variable overrides for. Fullscreen toggle (⤢/⤡) uses the
  real Fullscreen API. Also shows the real configured model name next to the app title.
- `src/renderer/src/styles/global.css` — added `:root[data-theme='light']` variable overrides so the
  theme toggle has somewhere real to go (previously `AppSettings.theme` was persisted but never
  consumed anywhere in the UI).
- `src/renderer/src/components/command-center/CommandCenter.tsx` — terminal tab now shows a header
  line with your real provider/model (`■ live · ollama · llama3`, etc.) and a footer with a real
  line count plus a "bypass permissions" toggle. Queue row now has "+ files" / "🎙 voice" buttons
  matching the reference layout — **both are disabled with a "Coming soon" tooltip**, not silently
  broken buttons that look functional but do nothing.
- `src/renderer/src/components/agent/AgentCard.tsx` — added a GOD badge (yellow pill) for Michael,
  and a "🎙 talk" button under Michael's card specifically, which switches the right panel to the
  Command Center (same action as clicking the card, just matches the reference's separate button).
- `src/renderer/src/components/layout/MainLayout.tsx` — passes the new `onTalk` handler through to
  `AgentCard`.

## Explicitly NOT faked, and why
- **No numeric progress bars on agent cards.** The reference shows a bottom progress bar per card,
  but your `PipelineStage` type has no percent-complete field — I won't draw a bar that implies real
  completion tracking when none exists. If you want this, it needs a real progress field added to
  `PipelineStage`/`TaskDefinition` and populated by whatever executes each stage.
- **"bypass permissions" toggle is cosmetic only.** It's a local `useState` in `CommandCenter`, not
  wired to any actual approval/permission gate. Clicking it changes the label, nothing else. Your
  real approval flow is still `GodOrchestrator`'s `requestApproval()` → `GOD_APPROVAL_PENDING` event,
  which still has no UI to respond to (flagged in the last two batches too).
- **"ctx N% used" style context-window readout was NOT added.** The reference shows this because
  it's tracking a real LLM context window fill percentage. Your `LLMClient` doesn't currently track
  token usage at all (none of the three provider calls read `usage` from the response), so I didn't
  fabricate a percentage — that would be actively misleading. Happy to wire this for real if you
  want: Anthropic and OpenAI both return token usage in their response bodies already.

## Still needs actual art assets for full visual parity
No amount of `PIXI.Graphics` primitives will produce the exact pixel-art look in your reference
screenshot — that requires a real tileset (windows, floor textures, desk/chair sprites, character
sheets). Your own `README.md` names LimeZu's "Modern Interiors" pack for this. If you get/purchase
that asset pack (or any similar one), the natural next step is a `SpriteSheetLoader` that swaps
`AvatarEntity`'s and `OfficeEngine`'s `PIXI.Graphics` primitives for `PIXI.Texture`-based sprites —
that's a well-defined follow-up task once assets exist, not something I can shortcut without them.
