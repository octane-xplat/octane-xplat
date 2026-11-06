# Upstream limitations

Keep limitations in Octane, NativeScript, `@nativescript-community/octane`,
and other upstream dependencies visible to maintainers. A local workaround
may be appropriate, but do not let it hide the upstream behavior or imply that
upstream supports the behavior.

## Where to record a limitation

Record the finding in the relevant topic page under `.agents/docs/`, such as a
framework note, platform investigation, parity record, or feature note. If no
page owns the topic, create one and link it from
[the internal docs index](README.md). Keep the evidence with the conclusion
rather than making a second, detached inventory that can go stale.

Include enough detail to distinguish a verified upstream constraint from an
assumption:

- The owning upstream package and the version or commit examined.
- The affected API, platform, and conditions, plus the observable limitation.
- Evidence type and a link to the relevant upstream source, documentation,
  issue, or local probe. Distinguish source/build evidence from runtime
  behavior.
- Whether Xplat leaves the behavior unsupported, works around it, or carries a
  local patch; explain the workaround's scope and constraints.
- The current status and what upstream change or dependency update would allow
  the workaround to be removed, when applicable.

Check the record when upgrading the upstream dependency. Update its status
when the limitation changes, and keep historical evidence distinguishable
from current behavior.



## octane universal compiler: __methodDep allowlist gap (0.16.3)

The universal compiler emits `import { __methodDep } from 'octane'` when
a member call (`x.m()`) appears inside a compiled hook callback
(useMemo/useCallback/useEffect bodies) — e.g. `items.map`, `set.has`,
`data.filter` inside ui table hooks and OverflowList's useCallback.
`UNIVERSAL_RUNTIME_IMPORTS` in dist/compiler/compile-universal.js lacks
`'__methodDep'`, so universal compilation throws even though
universal-core exports the helper. Patched locally:
packages/cli/patches/octane@0.16.3.patch adds the name to the allowlist
(manifest.json records why/dropWhen).

## octane universal compiler: plain .ts helpers fall to the dom default

`slotHooks` (the .ts/.js hook-slotting pass) resolves the file renderer
via `resolveRendererForFile`; files matching no `renderers.rules`
include glob land on `default: 'dom'`. Under dom the production pass
lowers useMemo/useCallback to the native-only `memoSlot`/`memoTake`/
`memoPublish` helpers imported from 'octane/internal/client' — those
read CURRENT_SCOPE (render.js), which is null on universal targets, so
the first useMemo inside a shared .ts hook throws at render
('r is null'). Fix at our layer: xplatLinuxGtk sets
`renderers.default: 'gtk'` so every unmatched file gets universal
slotting (`useMemo(fn, deps, sym)`). Long-term, upstream could treat
non-component helper files as renderer-agnostic or honor the app-level
universal runtime instead of the dom default.

## macos-node-api bridge: member enumeration and selector gaps (camera TS port)

Verified during the AppKit camera TS migration (worktree sleek-heather,
host bundle shipped by packages/cli/src/macos/jsc-host/prebuilt/macos):

- `NSObject.extend`/class registration only sees *enumerable* methods — the
  host's ObjC member enumeration ignores non-enumerable class keys, so a
  TypeScript `class X extends NSObject` must re-mark `ObjCExposedMethods`
  members enumerable before `NativeClass(this)` or AppKit target/action and
  delegate dispatch never reach JS (photo-sheet.macos.ts does this in a
  static block).
- `captureOutput:didStartRecordingToOutputFileAtURL:fromConnections:` kills
  the host when delivered to a JS delegate — it fires re-entrantly while
  `startRecording` is still returning. The camera host omits it from
  `exposedMethods` and synthesizes `recordingStarted` from `isRecording`
  polling instead.
- The long `NSBitmapImageRep` designated initializer
  (`initWithBitmapDataPlanes:...`) is absent from the bridge metadata; the
  sheet resizes through `NSImage` + `TIFFRepresentation` and re-encodes via
  `representationUsingTypeProperties`.
- `NSObject` fields are not initialized by `alloc().init()` — ObjC
  construction bypasses JS field initializers, so class state must be lazy
  (getters/`??=`), never bare field reads on the hot path.
- `[NSApp activate]`/`activateIgnoringOtherApps:`/`activateWithOptions:`
  dispatch through the bridge but cannot make a fixture app frontmost in a
  plain exec/`open` launch context (observed on macOS 27): no `keyWindow` is
  reachable for bundled-sheet qualification; `open`-launched copies of the
  linker-signed host do carry the TCC camera grant (same cdhash).

## @nativescript/core windows: ApplicationData map and file text IO gaps (pkg.pr.new runtime abae298+cbec98bb)

Verified on a packaged x64 MSIX (org.octanexplat.windows61 1.0.0.197, literal
main 733f683737) via the service-adapter fixture — runtime evidence, not source
reading:

- `ApplicationDataContainer.Values` is an opaque handle: the projection
  exposes none of the `IMap` surface (`HasKey`, `Lookup`, `Insert`, `Remove`,
  `First`, `Size`); own property names are just `handle`, and indexer writes
  land on the JS wrapper rather than the OS map. Upstream
  `ApplicationSettings.getString` throws `TypeError: ... Values.HasKey is not
  a function` and direct member calls are silent no-ops (probe evidence from
  the service fixture on 1.0.0.199). `storage.windows.ts` therefore persists
  preferences to a JSON document in the container's local state through the
  working async `File` APIs, keeping the synchronous string contract
  in-memory with best-effort asynchronous durability.
- `FileSystemAccess` "sync" text/buffer APIs are fake-sync:
  `readTextSync`/`writeTextSync`/`readBufferSync`/`writeBufferSync` call the
  WinRT `PathIO.*Async` op with `.done()` and return before completion, so a
  sync read always yields `''`/`undefined`. The real async path works
  (`File.readText`/`writeText` resolve through `NSWinRT.toPromise`) — the
  service fixture records `syncText` as limitation evidence and qualifies
  content IO through the async APIs.

- `FileSystemAccess.deleteFile`/`deleteFolder` (and the entity calls built on
  them — `File.remove`/`removeSync`, `Folder.remove`/`removeSync`) never
  delete: `Windows.Storage.StorageFile.GetFileFromPathAsync(path)` returns a
  pending `IAsyncOperation`, and the next line calls `DeleteAsync` on the
  *operation* rather than the resolved entity. The unprojected member access
  throws `Error: Unspecified error (HRESULT 0x80004005)` into `onError`, so
  `await File.remove()` rejects and `removeSync()` silently swallows it; when
  it does not throw, the op is never awaited either way. Verified on 1.0.0.204
  (files-identity `foreign.remove()` rejection) and 1.0.0.205 (`removeError`
  field, both launches). Qualification fixtures delete through
  `toPromise(GetFileFromPathAsync(path))` + `toPromise(file.DeleteAsync())` —
  the path `files.windows.ts` already relies on.
- The rest of the entity-member surface shares the defect classes, verified
  on 1.0.0.209 (`corefs-depth` probe, launch `mw1aw1lh`): `File.rename` throws
  the same `HRESULT 0x80004005` (RenameAsync invoked on the pending
  `IAsyncOperation`); `File.size` silently returns `0` (GetFileFromPathAsync +
  BasicProperties read off the operation); `Folder.getEntities`/`eachEntity`
  throw `GetFolderFromPathAsync(...).done is not a function` — the
  enumeration path uses the `.done()` fake-sync pattern on a projection that
  only exposes `then`. Only `File.lastModified` returns a real value (Date
  lands inside a try/catch that hides `Date.now()` on failure, so even that
  cannot distinguish epoch from the fallback). Net: on the pinned runtime,
  upstream `File`/`Folder` covers only path joins, `exists`, and async
  `readText`/`writeText`/`readBuffer`/`writeBuffer`/`appendText` — every
  delete, rename, size, and enumeration member is broken or silent-wrong.
- Clipboard text marshalling is lossy past BMP ASCII, verified on 1.0.0.210
  and 1.0.0.211 (`clipboard-depth`, launches `mw1bskqo`/`mw1iafcb`):
  `DataPackage.SetText` accepts any JS string, but
  `GetTextAsync`/`SetText` through the projection mangles non-BMP code points
  to `?` per UTF-16 unit (`'😀'` reads back `'??'`, `'🇯🇵'` reads back
  `'????'`), maps `U+0301` combining acute to `'`, and truncates the payload
  at the first `U+0000` (`'before after'` reads back `'before'`). The exact
  mojibake varies across launches (e.g. `?` U+003F vs `�` U+FFFD render
  alike; a lone `U+1F600` read back as `??` on some launches and as the real
  emoji on others), so only the invariants are stable: the unicode+NUL
  payload never round-trips exactly, ASCII prefix survives, NUL tail
  truncates. BMP ASCII text round-trips exactly. `readText` also maps an empty/undelivered payload
  to `null` — that mapping is our leaf's contract, not upstream loss.
  Storage through the JSON-document path round-trips the same characters
  exactly, so the loss is specific to WinRT string marshalling, not file IO.
  Clipboard commits are also racy across the same launches: `SetContent` +
  `Flush` does not settle before an immediate `GetTextAsync` — one launch
  read the just-written payload, the next read `null` then the payload on
  the *following* call, and an empty write was rejected while a flush was
  in flight. Callers must tolerate a commit window after `writeText`.
- `AbortController`/`AbortSignal` are not projected in the packaged runtime —
  `new AbortController()` throws `ReferenceError` inside the app process
  (observed on 1.0.0.201, files-chunk spec). Cancellation contracts that take
  an `AbortSignal` still work against a duck-typed object (`aborted`,
  `addEventListener`/`removeEventListener`, `throwIfAborted`) because the
  `files.readBytes` leaf only uses those members; the fixture records
  `abortControllerPresent` as limitation evidence.
- OS key auto-repeat is not routed to the WinUI `keyDown`/`keyUp` delegates:
  a physically held key produces one projected `keyDown` and one `keyUp`
  (observed on 1.0.0.201, `windows-key-event-bridge`), while the character
  repeat itself still enters the focused control. Held/repeat payload
  fidelity stays an uncovered dimension.

Packaged picker surface, verified through 1.0.0.224 (`picker-probe`/
`picker-invoke`, launches `mw2ekg6j`/`mw2sfynm`/`mw2tzq2d`):
`Windows.Storage.Pickers.FileOpenPicker`/`FileSavePicker`/`FolderPicker`
all project and construct, `PickSingleFileAsync`/`PickMultipleFilesAsync`
resolve, `FileTypeFilter` accepts `Append('*')` (`'*.*'` throws
`E_INVALIDARG 0x80070057`), and `SuggestedStartLocation` sets cleanly.
Two bridge limitations were verified and worked around:
`dotnet.invoke` cannot marshal projected WinRT objects — every carrier
(picker, `handle`, `interop.handleOf` wrappers, `dotnet.wrap`,
`interop.pointer`) arrives as `System.String` or fails primitive
conversion, so `WinRtRef` RCW materialization never runs — and the bridge
awaits `Task`-returning methods on the caller thread, which deadlocks
against a dialog's message pump. The shipping path avoids both: the
app-compiled `OctaneXplat.Interop.ServiceInterop` helper
(`App_Resources/Windows/Interop`, merged via `app.csproj`) constructs
the picker in-process, initializes the owner HWND acquired through
`NSWinRT.win32.call` (`GetActiveWindow`/`GetForegroundWindow`), enqueues
on the captured `DispatcherQueue`, and returns `token|path` entries via
`FutureAccessList`; JS polls `PickState`. Verified on 1.0.0.224: the
managed pick reported `pending` for 8 s (a live dialog) while the JS-side
invoke rejected `WinRT async operation failed` — and `files.pick`/`pickMultiple`/
`export` ship on this path — qualified on 1.0.0.227: a typed-path
selection returned `ok:core20-pick-target.txt` with `FutureAccessList`
token read-through (`files.readText` -> `core20-pick-content`), a
typed-destination save committed `files.export` -> `saved` (verified
driver-side on disk), and a concurrent pick returned the `fail:busy`
guard. `FileIO.WriteBytesAsync` rejects on token-granted files
(`HRESULT 0x80004005`, same as upstream's other broken `StorageFile`
members); export writes through `OpenAsync(ReadWrite)` +
`GetOutputStreamAt` + `WriteAsync` + `Flush` instead. WASDK 1.8 `Microsoft.Windows.Storage.Pickers` is absent on
pinned WASDK 1.6 — confirmed dead end.

Upstream status: reported — [NativeScript/NativeScript#11613](https://github.com/NativeScript/NativeScript/issues/11613)
(file-system-access member matrix) and
[NativeScript/NativeScript#11614](https://github.com/NativeScript/NativeScript/issues/11614)
(HSTRING marshalling loss + `Values` IMap unprojected) and
[NativeScript/NativeScript#11616](https://github.com/NativeScript/NativeScript/issues/11616)
(`dotnet.invoke` cannot marshal projected WinRT objects; bridge awaits
`Task`-returning methods on the caller thread). Revisit all when the
Windows core runtime rev changes.

## @nativescript-community/octane driver: text-run parenting gaps (0.2.5)

Verified by source read + Astryx-Markdown seam probes (web/macOS lab runs,
2026-11-02): `addViewChild` accepts `FormattedString→Span` and
`TextBase→FormattedString`, but `TextBase→Span` falls through to
`cannot host a <Span> child` — so nested `<Text>` inside `<Text>` throws on
iOS/Android, and bare `#text` children under a `Span` are not folded (the
`RichTextSpan` leaf writes `text` explicitly to dodge this). FormattedString
runs are also flat — a `Span` cannot host `Span` children, so nested styled
runs must be flattened by the text-owner layer. Decision #25 recorded this as
provisional; a full repair candidate exists unpinned at
`tools/platform-qualification/patches/windows-rich-text/driver-source.patch`
(~40 lines, TextBase-owned FormattedString projection). Until it lands in the
canonical package patch or upstream, inline rich text on iOS/Android must use
explicit `<formattedstring>` + flat `<span>` runs.

## octane universal `useMediaQuery`: prefers-reduced-motion unsupported on native leaves

`evaluateNativeMediaQuery` (packages/ui/src/internal/platform) implements a
restricted grammar — `prefers-reduced-motion` evaluates `false` on
iOS/Android and on the macOS hook path (`media-query-source.macos`), even
though the AppKit renderer's own CSS env honors it via
`NSWorkspace.accessibilityDisplayShouldReduceMotion` (+ live notification)
and `readReducedMotion()` exists for JS facades. iOS
`UIAccessibilityIsReduceMotionEnabled` and Android
`Settings.Global.ANIMATOR_DURATION_SCALE` are the OS sources — plumbing is a
local gap, not an upstream miss; record consumers must not assume the hook
reflects the OS preference today. Pinned in `media-query-native.test.ts`.

## NativeScript iOS: persisted LiveSync bundle overrides the packaged entry (9.1.0)

Verified against `NativeScript/ios` tag v9.1.0 (shipped via `@nativescript/ios`
9.1.0 → ios-spm 9.1.0, TKLiveSync.xcframework) — source evidence plus runtime
confirmation on simulator `91D40099-…` (#145):

- A **DEBUG** iOS binary runs `TNSInitializeLiveSync()` at `main()` before
  configuring the runtime
  ([main.m](https://github.com/NativeScript/ios/blob/v9.1.0/project-template-ios/internal/main.m);
  same shape in `internal/NativeScriptStart.m`). `DEBUG=1` is defined only in
  the template's Debug `GCC_PREPROCESSOR_DEFINITIONS`, so the whole path —
  including `TKLiveSync` — is compiled out of `--release` builds.
- `trySetLiveSyncApplicationPath()`
  ([TKLiveSync.m](https://github.com/NativeScript/ios/blob/v9.1.0/TKLiveSync/TKLiveSync.m))
  sets `TNSBaseDir` to `~/Library/Application Support/LiveSync` whenever a
  `LiveSync/app` directory exists in the data container; `main.m` then makes
  it the runtime `BaseDir`, so `RuntimeConfig.ApplicationPath` becomes
  `LiveSync/app` and the entry resolves from the leftover dev copy instead of
  `<App>.app/app`. There is no runtime flag to opt out.
- Writer side (CLI, `nativescript` package): physical devices receive
  `sync.zip` under `Library/Application Support/LiveSync`
  (`lib/common/constants.js`), extracted by the runtime at next boot;
  emulators get file-by-file writes into the installed bundle's `app/`
  (`lib/device-path-provider.js` → `simctl get_app_container`), which a
  reinstall replaces — so the stale-copy trap is a device/debug-install
  boundary, not a simulator LiveSync behavior.
- Observed: a debug standalone install over a prior LiveSync session (data
  preserved) runs the residue — `__dirname` resolves to
  `…/LiveSync/app`, HTTP-import dev bundles die on the dead dev server
  (`HTTP import failed … network error`), `Fatal: the main module failed to
  run`, abort. Verified on simulator with a synthesized `LiveSync/app`
  residue; the reporter verified the same sequence and the recovery on a
  physical iPhone (#145).
- Xplat stance: documented boundary, no code workaround. Recovery = remove
  only the `LiveSync` directory (app data preserved); release builds are
  immune by construction. See
  [the native release guide](../../docs/start/native-release.md#ios-a-standalone-install-keeps-leftover-development-code).
  A CLI step that clears the residue on standalone install is a candidate
  proposal, not implemented.
- Status: current in 9.1.0. Recheck on runtime upgrade — removal would be a
  change to `TNSInitializeLiveSync`/`trySetLiveSyncApplicationPath` or the
  DEBUG gating in the project template.

## iOS Simulator: BGTaskScheduler submission unavailable (iOS 27.0 simruntime)

Runtime-verified on simulator `91D40099-…` (iOS 27.0, probe app
`org.octanexplat.probe.p4a1a90aeafd3fde3.p507ae21373cf1149`, 2026-11-05):

- `registerForTaskWithIdentifier:usingQueue:launchHandler:` works — the
  launch handler registers inside Apple's launch window.
- `submitTaskRequest:error:` always returns `NO` with
  `BGTaskSchedulerErrorCodeUnavailable`
  ("BGTaskScheduler is not available on this platform") regardless of
  `earliestBeginDate`; `cancelTaskRequestWithIdentifier:` returns normally.
- Apple's `_simulateLaunchForTaskWithIdentifier:` LLDB escape hatch dispatches
  nothing with no pending request, and Apple documents the debug functions as
  device-only — so a simulated dispatch cannot be exercised on the simulator.
- Submitting without a registered launch handler raises an uncatchable
  `NSInternalInconsistencyException`
  ("No launch handler registered for task with identifier …") that kills the
  process — our leaf gates `register()` on a successful handler registration
  instead of relying on a catchable return value.

Upstream scope: matches Apple's documented position that the scheduler is a
device feature and community reports that submission always fails on the
simulator. Xplat stance: no workaround — `register()` surfaces the OS's real
rejection, and dispatch/resubmission qualification requires a physical device.
Recheck on a simulator runtime upgrade.

## Pulsar iOS 1.4.0: sound simulation and shared audio-session ownership

Pulsar `AudioSimulator` enables synthesized sound under `DEBUG` and on the
simulator; `SystemPresetsImpl` plays it alongside UIKit feedback. Its
`enableSound(false)` queues shared `AVAudioSession` deactivation even when the
simulator never configured an engine. Calling it during another service's
capture/playback can therefore interfere with that service.

Xplat's [preparation helper](../../packages/haptics/scripts/prepare-ios.mjs)
fetches revision `f65113a6f1fed7c9737ce85f5ae7ddc5caa5723d`, verifies the exact
AudioSimulator input, disables the initial sound flag for every build/device,
and guards deactivation behind `isEngineConfigured`. A patched-only factory
makes an unpatched remote dependency fail at compile time. The bridge disables sound
before constructing presets or composers. Consumers must use the prepared
local SPM package and rebuild; changing bridge JavaScript alone is insufficient.
See [consumer setup](../../docs/packages/package-haptics.md#set-up-ios).

Evidence: [upstream audio simulator](https://github.com/software-mansion-labs/pulsar-ios/blob/1.4.0/Sources/Pulsar/Audio/AudioSimulator.swift),
[system presets](https://github.com/software-mansion-labs/pulsar-ios/blob/1.4.0/Sources/Pulsar/Presets/SystemPresetsImpl.swift),
and [issue 154](https://github.com/octane-xplat/octane-xplat/issues/154).
Source behavior and compilation are distinct from physical output. The
maintained `@octane-xplat/haptics` `test:ios-build` task compiles the patched
package and bridge for Debug/Release iOS simulator targets without creating or
booting a device. Physical tactile output and recording interaction require
separate iPhone qualification. Reassess/remove this source preparation when
upstream provides silent initialization that leaves other audio owners alone.

Apple defaults to suppressing haptics while microphone input is active; the
camera's independent microphone session starts for audio-enabled preview.
This is OS policy, not a Pulsar defect. Camera's explicit iOS opt-in leases
`allowHapticsAndSystemSoundsDuringRecording` before microphone activation and
restores it after native microphone release. Only the package's own camera
leases are coordinated; external owners must coordinate writes to this
app-wide Boolean. See [Apple's policy](https://developer.apple.com/documentation/avfaudio/avaudiosession/allowhapticsandsystemsoundsduringrecording)
and the [camera guide](../../docs/app/movie-capture.md#allow-ios-feedback-while-the-microphone-is-active).

## UIKit + SVGKit: no display pass after reveal from a hidden ancestor

`SVGKFastImageView` (SVGKit 3.1.1, Akylas `3.x` fork `24cad5f`) rasterizes its
SVG only inside `drawRect:` → `SVGKImage renderInContext:`; the layer's
backing contents appear solely when UIKit runs a display pass. UIKit drops
the pending display of a view inside a hidden (`UIView.hidden`) ancestor at
the moment it would draw, and unhiding the ancestor does not re-run
`drawRect:` — the view keeps positive bounds and a parsed image but
`layer.contents` stays nil. NativeScript maps `visibility: collapse` to
`hidden = true` plus removal from layout, so an `svgview` mounted under a
parent that was collapsed through its first layout reveals as a blank glyph
(issue #149, reported on a physical iPhone 13 Pro Max).

- Runtime evidence (simulator 91D40099-A056-497D-A572-ADDDFD6A8F23, case
  `examples/probes/svg-collapse-reveal.ios.tsrx`): bounds 0x0 + contents nil
  while collapsed; after reveal bounds 24x24, `hidden` false, parsed 24x24
  image — `layer.contents` nil before the workaround, non-nil after.
- Xplat stance: vendored-fork workaround. `SVGView` on the `xplat-vendored`
  branch of `octane-xplat/ui-svg` requests display (`setNeedsDisplay`) when
  it gains positive bounds (`onLayout`) or its own visibility is restored
  (`[visibilityProperty.setNative]`), gated on `layer.contents == nil` so
  already-drawn views are not re-rasterized. The view cannot observe an
  ancestor's hidden→visible transition; the bounds signal relies on
  NativeScript re-laying out the subtree when a collapsed ancestor returns.
- Status: current in SVGKit 3.1.1 / Akylas `3.x` fork. Recheck if upstream
  makes `SVGKFastImageView` re-request display on `layoutSubviews` or
  `didMoveToWindow`.

## SVGKit: `<use>` element attributes never reach generated layers

SVGKit 3.1.1 (Akylas `3.x` fork `24cad5f`, pod source
`Source/DOM classes/SVG-DOM/SVGUseElement.m` + `Parsers/Parser Extensions/
SVGKParserDefsAndUse.m`) resolves a `<use>` reference at parse time into an
`SVGElementInstance` tree, and `SVGUseElement.layoutLayer:` only forwards to
the *linked element's* `layoutLayer:` — the use element's own
fill/stroke/style/transform/x/y are parsed but never applied to the
generated `CAShapeLayer`. Use-based icons therefore parse, size, and produce
shape geometry yet paint nothing, and a bare `href` (no `xlink:` prefix)
trips an `NSAssert` in the parser (issue #148, reported on a physical
iPhone 13 Pro Max: 2 CAShapeLayers with 2 paths but 0 filled / 0 stroked).

- Runtime evidence (simulator 91D40099-A056-497D-A572-ADDDFD6A8F23, case
  `examples/probes/svg-use-icons.ios.tsrx`): pre-expansion a
  `<g fill="none"><use fill="#FFF" xlink:href="#p"/></g>` produced 1 shape
  layer with a path and 0 filled; the equivalent inlined path produced a
  filled layer. Post-expansion every `<use>` variant (minimal, filtered,
  flip-like, bare `href`) paints like its inlined control.
- Xplat stance: vendored-fork expansion. `resolveSvgUse` in the
  `xplat-vendored` branch of `octane-xplat/ui-svg` rewrites `<use>` markup
  before `SVGKSourceString` sees it — each use becomes a `<g>` carrying its
  non-reserved attributes plus an x/y translate wrapping a clone of the
  referenced element (SVG 1.1 §5.6 generated-content model); `<svg>`/
  `<symbol>` references generate a sized `<svg>` element. File sources keep
  SVGKit's file URL (relative references) unless the document contains a
  `<use>`. Unresolvable or cyclic references pass through unexpanded.
- Status: current in SVGKit 3.1.1 / Akylas `3.x` fork. Recheck if upstream
  makes `SVGUseElement` apply its own attributes to the instance tree;
  removing the expansion then restores upstream parsing.
