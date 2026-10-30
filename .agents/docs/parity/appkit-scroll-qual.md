# AppKit scrolling, layout and styling — runtime qualification

Issue #78 section 1 qualification run, executed on the `feat/appkit-scroll-qual`
worktree off `origin/main` (`2a5ec81ad`). All results are **action-dispatch /
native-API evidence** from a real Mac — the probe host is AppKit/JavaScriptCore
on arm64 macOS 27.2 (local machine), unless marked otherwise. No OS pointer,
keyboard, VoiceOver or pixel evidence is claimed. No remote-host run was
produced this round (see "Remaining" at the end).

## Bugs found and fixed

1. **`scripts/probe/runner.ts` passed the whole `{arm64,x86_64}` metadata map to
   the JSC host** (universal-metadata regression). Every `--target macos` probe
   exited `metadata.nsmd not found`. Now selects `artifact.metadata[macOSHostArch()]`
   like `dev.ts`/`webview-dev.ts`. (`5b485bd25`)
2. **`scrollable-area.macos.tsrx` fixture**: trailing `style={{display:'flex'}}`
   overrode the content size passed through `getContentProps`, so the document
   stayed at clip size and the fixture timed out after 9 assertions. Merging the
   styles restored the intended geometry — 20/20 assertions now pass. (`6139be070`)
3. **JS class methods were never registered as ObjC methods.** The pinned
   NativeScript runtime only exports *enumerable* prototype members as new
   methods; ES class methods are non-enumerable. Proven live:
   - `AppDelegate` (`apps/macos/src/appkit.ts`) used bare `NativeClass(this)`:
     `instancesRespondToSelector('windowDidResize:')` returned false and bridge
     `onWindowResize` listeners received **0 calls** on a real resize while the
     raw `NSWindowDidResizeNotification` observer saw 2. Every delegate
     callback was dead: resize, `windowShouldClose`/`windowWillClose` (close
     lifecycle + `controller.closed`), `applicationOpenURLs` (deep links),
     `applicationDidBecomeActive/ResignActive` (appState), `applicationWillTerminate`,
     `applicationDidFinishLaunching` (event pump start).
   - `HoverTrackingTarget` (`macos-renderer`): `respondsToSelector` false for
     `mouseEntered:`/`mouseExited:`/`mouseMoved:` → `:hover`, `observeHover`
     (Tooltip/Hoverable) and `observePointerMotion` (Chart) dispatch dead.
   - `ObjCExposedMethods` alone does **not** register a method; its keys need
     colons (`mouseEntered:`) matching the `ButtonActionTarget` convention.
   - `NSObject.extend({...})` literals also produce unregistered classes
     (checked `instancesRespondToSelector` — false). `ListDelegate`
     (`list-view.ts:220`) uses `.extend` for NSTableView dataSource/delegate
     methods → the `listview` leaf's delegate path is almost certainly dead
     too; not fixed here (needs its own conversion + fixture).
   - Overrides of *existing* ObjC methods DO work without enumeration
     (`layout()` override fired via ObjC dispatch) — the bridge forwards
     superclass-method dispatch through the JS prototype. That is why
     `MasonLayoutView.layout`, `intrinsicContentSize` getters, KVO
     `observeValueForKeyPath` etc. kept working and the gap stayed hidden.
   - Fixes: `AppDelegate` enumerates its prototype before `NativeClass`
     (`e00ea2907`); `HoverTrackingTarget` uses `registerGestureClass` plus
     colon keys in `ObjCExposedMethods` (`11a5b36c6`). After the fix,
     `windowDidResize` fires on real resizes and all three tracking
     selectors respond.
4. **Newly-live `applicationDidFinishLaunching` killed the external runloop.**
   Its `app.stop(this)` + manual pump assumes the stock `app.run()` loop owns
   dispatch; under `OCTANE_MACOS_EXTERNAL_RUNLOOP` the host owns the loop and
   `-stop:` terminated it (host exited 0 before the case ran). Now gated on
   the env flag. (`e00ea2907`)
5. **Windows could not be resized at all.** `createAppKitWindow` pinned the
   content view at 640×420 at *required* priority (deliberate anti-grow fix,
   but it hardcoded the size): `setContentSize` snapped back, `fitWindowToContent`
   was a no-op, and user resizing was impossible. The pins now track the last
   applied window size via `windowDidResize` — anti-grow protection kept,
   explicit/user resizes take. (`e00ea2907`)

## Runtime evidence by #78 row

Host: arm64 macOS 27.2, AppKit/JavaScriptCore, `interaction: appkit-action-dispatch`.

- **Scroll geometry / viewport metadata** — `test:scroll:macos`
  (`scrollable-area.macos.tsrx`): **20/20 pass**. Clip 320×240 vs document
  640×480; `scrollToPoint`+`reflectScrolledClipView` moves the clip origin
  (unflipped Y handled); axis switching toggles scroller presence with stable
  refs; `useScrollableArea` state (isScrollable/atStart/atEnd) and `onScroll`
  event fields (`verticalOffset,viewportHeight,contentHeight`) verified;
  content and viewport resize update state; refs clear on unmount.
  `scroll-metadata.macos.tsrx` mounts (a11y metadata still unqualified).
- **Overflow clipping** — `overflow-clip.macos.tsrx` mounts. Native
  `clipsToBounds` behavior not yet exercised beyond mount.
- **Data Table horizontal viewport** — combined diag: data Table with 520pt of
  pixel columns inside a 360pt clip produces `documentView` 520×111 vs clip
  360; `scrollToPoint` moves the clip to x=120. Horizontal scroll range is
  real. **Sticky columns**: horizontal scroll works; the pinned column could
  not be isolated in the Mason subtree from this probe — placement still
  unproven natively. **Resize handles**: fixture mounts; no native gesture or
  AX evidence. `table-scroll.macos.tsrx` mounts.
- **Label overflow / alignment** — `white-space: nowrap` + `text-overflow:
  ellipsis` yields `PaddedLabelCell` with `lineBreakMode = 4`
  (`NSLineBreakByTruncatingTail`), `wraps = false`. `text-overflow-css.macos.tsrx`
  mounts.
- **Multiline layout** — `<textview>` mounts and lays out (4-line doc 54pt);
  autoGrow/row-cap geometry not exercised. `text-entry-ownership.macos.tsrx` mounts.
- **Outline snapshots + scroll spy** — `outline-snapshot.macos.tsrx` mounts
  only; discovery/navigation unproven.
- **Large-list scrolling/virtualization** — `@xplat/macos smoke`: **30/30
  assertions in 2m33s** on the fixed tree, including the VirtualList windowing
  assertions introduced by `8211f9a90` (500-row list windows to 3 mounted rows;
  drop-first mutation; full sweep completes). Action-dispatch evidence.
- **CSS state selectors** — `container-reveal`, `focus-modality`,
  `focus-within` mount/pass. The tracking-area dispatch path was *proven dead*
  (bug 3) and is now *proven registered* (`respondsToSelector` true for all
  three selectors). Live `:hover`/`:active` delivery still needs real pointer
  input; `:focus*` needs OS focus events. Not closed.
- **@media re-evaluation on window resize** — **verified**: `useMediaQuery`
  `(min-width: 800px)` flipped compact→wide→compact across
  `setContentSize(1000/700)`; `useWindowSize` tracked 640→1000→700; stylesheet
  `@media (min-width:800px)` resized a styled box 150→300→150. Single-window
  case only — the per-window media limit (all windows share the largest
  window's size) is unchanged and remains an open gap in issue §2.
- **Keyframe playback + reduced motion** — a `rotate` keyframe applied to a
  view produced a changing `affineTransform` across two samples 700 ms apart
  (−17° → ~85°). Playback runs on the shared timer. Reduced-motion preference
  and notification delivery unqualified. `progress-bar.macos.tsrx` mounts.
- **Patterned / decorative borders** — `double` and `groove` at 6pt produce a
  backing sublayer holding 8 nested band layers (4 sides × 2 bands) vs 0 for
  `solid` — the per-side band path executes natively. Shading joins at
  corners, antialiasing and pixels unqualified. `border-styles.macos.tsrx`
  mounts.
- **Pull-refresh geometry diagnostic** — `pull-refresh-geometry.macos.tsrx`
  mounts (phase/docking experiment remains unrun).

## Regression coverage

`XPLAT_MACOS_SMOKE_TIMEOUT_MS=600000 turbo run smoke --filter=@xplat/macos`
after the fixes: 30 assertions, 0 failures — the newly-live delegate methods
(resize delivery, `applicationShouldTerminateAfterLastWindowClosed`,
`windowWillClose` close lifecycle) did not disturb the sweep. Note the sweep
needs each rich-text package's `build:assets` (`turbo run build:assets
--filter=@octane-xplat/lexical|richtext|tiptap`) or it fails on unresolved
`dist/macos/browser.js`.

## Remaining / not claimed

- skymac.local remote run: host reachable (arm64, macOS 26.6.2) but Data volume
  is 98% full (5.7 GB free) with no node/pnpm — usable only for copied
  self-contained artifacts. A packaged-app or copied probe-project run on a
  second host is still outstanding; andromeda (Intel) was superseded by skymac
  per user correction, so Intel evidence for this slice is also outstanding.
- Live OS input for `:hover`/`:active`, real keyboard/Tab for `:focus*`,
  VoiceOver, and pixels are untouched — several rows stay open by design.
- `ListDelegate`/`.extend` conversion, `EmbeddedNavigationDelegate`,
  `video.ts StatusObserver`, and any delegate methods on bare-`NativeClass`
  subclasses that are *new* selectors (e.g. `InteractionTextView.textDidEndEditing`
  if NSTextView lacks that selector) — same enumeration contract; flagged for
  the input/focus/controls and media owners.
- Sticky-column physical offset, resize-handle gestures/AX splitter, Outline
  scroll-spy behavior, Tokenizer clipping count, box-shadow/outlines,
  reduced-motion live preference, per-window `@media`.
- `macos-renderer` authored suites have 17 pre-existing vm-realm failures
  owned elsewhere; `check:docs`/`doc-examples`/`recipes` not re-run here.
