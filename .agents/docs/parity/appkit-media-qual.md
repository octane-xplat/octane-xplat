# AppKit media/graphics and overlay runtime qualification

Runtime evidence for [issue #78](../../../../../github.com/octane-xplat/octane-xplat/issues/78)
section 1 rows: **Media and charts** (Chart hover/drag/click, Image, Video,
AnimatedImage, Pager, Lightbox zoom/swipe/video) and **Overlays** (Popover +
typeahead window layer, Tooltip).

**Host unless noted:** local Apple Silicon Mac, macOS 27.2 (Darwin 27.2.0),
AppKit/JavaScriptCore host via `bun run probe run … --target macos` and the
`@xplat/macos` verify fixtures. `skymac.local` (arm64 iMac, macOS 26.6.2, ~9 GB
free) was verified reachable but not yet used. `press`/`setText` are
action-dispatch; NSEvent posting goes through the real event queue; neither is
physical OS input. No screenshots/visual analysis performed.

## What ran (2026-10-30)

Unit/build lanes on `2a5ec81ad` + this branch's fixes:

- `turbo run test` — charts, image, video, gif, lightbox, sheet, picker: all
  green. media: 32/33 → fixed (below), now 33/33.
- `test:packed` — image, charts, video, lightbox, media, picker, sheet: green.
  gif and macos-renderer fail; see Findings.
- `ui test:macos` — green after the packed-consumer fix (macos-value-exports,
  query-storage, table-universal, thumbhash, macos-barrel, packed consumer
  Bundler + NodeNext).
- `macos-renderer` authored suite: **647 pass / 17 fail** — identical to the
  documented main state (vm-slice realm + unrelated feature tests). Owned by
  the renderer test-debt task; not regressed by this work.
- `media tests/macos-runtime.mjs`: **APPKIT_MEDIA_RUNTIME_OK, 48 assertions**
  in the real JSC host — actual PNG/JPEG decode, JPEG encode and Foundation
  file IO (injected panel/sheet; no OS permission/camera).

Maintained probes (all on the real host):

| Probe | Result |
| --- | --- |
| `examples/probes/counter.tsrx` | pass (2 assertions) |
| `examples/probes/charts.macos.tsrx` | **pass** after a probe fix (below): SVG→NSImage 320×200, center press → tooltip `Visits: 5` with real frame geometry |
| `image-loading.macos.tsrx` | pass: sibling removal/re-add, both images decode |
| `image-fit.macos.tsrx` | pass: cover/contain + position state, view 120×120 vs logical 160×80 |
| `image-memory-cache`, `cached-image`, `video`, `animated-image`, `pager`, `lightbox-gestures`, `popover`, `typeahead-*` (4), `native-sheet`, `appkit-sheet-portal` | pass, but these are manual fixtures whose `run()` only records "mounted" — mounting proves the component trees build without render errors, nothing more |
| `test:color:macos` (color-picker fixture), `test:overlay-keyboard:macos` | pass |

Research probes (gitignored `research/probes-cases/`):

- `svg-decode.macos.tsrx`: `NSImage.initWithData` decodes SVG 40×40 and PNG
  1×1; a mounted `<image src="data:image/svg+xml;base64,…">` shows `.image`
  within ≤3 s. **AppKit on macOS 27 rasterizes SVG** — the earlier "SVG
  decoded" failure was a probe race, not a decode gap.
- `media-runtime.macos.tsrx` (Video+AnimatedImage+Pager, local files):
  - **Video is qualified**: `ready:16000` event, `playing:true` after
    `play()`, `currentTime()` advanced 1594 ms during ~1.5 s playback,
    `pause()` → `playing:false`, `seekTo(1000)` → `currentTime()` = 1000 ms.
    Real AVPlayerLayer load/play/pause/seek — the strongest media-row
    evidence so far.
  - **Pager**: `NSScrollView` present, `documentView` 960×120 = 3 pages ×
    320 pt — native paging geometry correct.
  - **AnimatedImage**: mounts a `PlaceholderHostView` whose subview is the
    `XplatAnimatedImageView`; my probe read `.image` on the host (nil) —
    the subview's animation state remains unverified, not disproven.

## Findings

1. **Video (AVPlayerLayer) — qualified** on Apple Silicon macOS 27.2 for
   load/ready/play/pause/seek/currentTime via the public `Video` API +
   events. Remaining: controls chrome input, loop/end, fit modes, AX,
   sandbox/packaged behavior, remote sources.

2. **Chart — qualified at dispatch level**: SVG→NSImage 320×200, tap
   dispatch → tooltip with real geometry. Hover/drag coordinate
   qualification (`6f30ff7f5` tracking areas) still needs real pointer
   events; the press path exercises the fallback center point only.

3. **Image — partial**: data-URI decode, contentFit/contentPosition state,
   sibling-removal reuse all verified. Cache APIs (prefetch/isCached/
   evict/clear) and HTTP loads remain unqualified (manual fixture).

4. **AnimatedImage — mounted only**: bridge view is a subview of the
   placeholder host; animation/frames not yet verified.

5. **Lightbox — partial**: the `test:overlays` fixture previously checked
   full-window presentation, `allowsMagnification`/`maxMagnification` = 4,
   Left/Right navigation, imperative open/close and focus restore. On
   current main that fixture cannot complete — see the GC crash below.
   Double-click zoom/pinch/swipe and video playback are documented as
   unqualified in `docs/app/primitives.md`.

6. **Deterministic GC-finalization crash blocks overlay-surface
   qualification.** `apps/macos/test/verify-overlays.mjs` (repaired launch
   path, below) and a research overlay probe both die with `EXC_BREAKPOINT`
   (reported as SIGKILL) 4/4 identical stacks: during a JSC sweep,
   `IsoHeapCellType::finishSweep` → JS finalizer →
   `_NSEventObserverBlockContainer dealloc` → `_Block_release` →
   `deleteBlockReferenceOnOwningLoop` → `napi_delete_reference` →
   `JSObjectGetPropertyForKey` → `Structure::materializePropertyTable` →
   `LocalAllocator::allocateSlowCase` — allocation during GC, which JSC
   forbids. This is an **upstream NativeScript-macOS bridge defect** (napi
   ref deletion allocating inside finalization), triggered when an
   NSEvent-observer's JS wrapper is collected — popover/typeahead/sheet
   surfaces install and remove local event monitors, so overlay workloads
   hit it reliably. Until the bridge fix lands, Popover/typeahead
   positioning, outside/Escape dismissal, provider retention and focus
   return cannot get runtime evidence; the row stays open. Source-level
   owners (`popover-owner.macos.ts`, `typeahead-layer.macos.ts`) and their
   unit tests already cover the intended contract.

7. **Probe harness bugs found and fixed (this branch)**:
   - `scripts/probe/runner.ts`: passed the whole `{arm64,x86_64}` metadata
     map as one arg → `metadata.nsmd not found`; now selects host arch.
   - `examples/probes/charts.macos.tsrx`: asserted `image` before the
     deferred local decode ran (race); now waits for it.
   - `apps/macos/test/verify-overlays.mjs`: shim-only bootstrap predated
     the native-leaf loader (`libxplatmason.dylib is not loaded`) and the
     generated entry missed `import 'virtual:bamboo.css'`; now builds the
     native artifact and writes the real bootstrap.
   - `packages/media/tests/photo-capture.macos.test.mjs` +
     `macos-runtime.mjs`: the `file-pick-filter.macos` split left fixture
     require-shims throwing; real leaf modules now load.
   - `packages/ui/tests/packed-consumer.mjs`: read `exports['.'].macos.types`
     — stale after `8c9e2f567` collapsed export maps; uses `exports['.'].types`.

8. **`gif` packed consumer fails on main** (pre-existing, not fixed):
   `consumer.tsx` — `AnimatedImage(props)` typed `unknown` because the
   `types` condition resolves the universal `index.d.ts` while the `web`
   leaf returns `JSX.Element`. Same latent pattern repo-wide (single
   canonical types entry); gif's consumer is the only one asserting a
   per-target return type. Belongs to the tsrx-typegen/leaf-plumbing lane.

9. **`macos-renderer` packed consumer fails on main**: the consumer's
   `src/types.ts` imports `@octane-xplat/macos-renderer/{intrinsics,
   jsx-runtime,jsx-dev-runtime}` — subpaths removed in `308c14c58`. Needs
   the same retarget the ui consumer got (`4eceb4f18` → `@octane-xplat/jsx`).
   Owned by the renderer test-debt task.

10. **Still unqualified** (need real input/visual or further harness work):
    Chart hover/drag coordinates via OS pointer events; Image HTTP +
    cache APIs; AnimatedImage frames/animation; Pager live
    scroll/momentum/settlement; Lightbox zoom gestures + video;
    Popover/typeahead surface behavior (blocked by #6); Tooltip display
    (only `NSView.toolTip` property set/clear is checkable nonvisually);
    all VoiceOver paths; `skymac.local` second-host replication.

## Commands

```sh
bun run probe run examples/probes/charts.macos.tsrx --target macos --deps @octane-xplat/charts
bun run probe run examples/probes/media-runtime… --deps @octane-xplat/video,@octane-xplat/gif,@octane-xplat/pager
bun run --filter @xplat/macos test:overlays   # currently blocked by the GC crash
bun run --filter @octane-xplat/ui test:color:macos test:overlay-keyboard:macos
```
