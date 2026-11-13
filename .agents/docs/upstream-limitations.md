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



## octane universal compiler: __methodDep allowlist gap (0.17.0)

The universal compiler emits `import { __methodDep } from 'octane'` when
a member call (`x.m()`) appears inside a compiled hook callback
(useMemo/useCallback/useEffect bodies) — e.g. `items.map`, `set.has`,
`data.filter` inside ui table hooks and OverflowList's useCallback.
`UNIVERSAL_RUNTIME_IMPORTS` in dist/compiler/compile-universal.js lacks
`'__methodDep'`, so universal compilation throws even though
universal-core exports the helper. Patched locally:
packages/cli/patches/octane@0.17.0.patch adds the name to the allowlist
(manifest.json records why/dropWhen).

## octane universal compiler: plain .ts helpers fall to the dom default

`slotHooks` (the .ts/.js hook-slotting pass) resolves the file renderer
via `resolveRendererForFile`; files matching no `renderers.rules`
include glob land on `default: 'dom'`. Under dom the production pass
lowers useMemo/useCallback to the native-only `memoSlot`/`memoTake`/
`memoPublish` helpers imported from 'octane/internal/client' — those
read CURRENT_SCOPE (render.js), which is null on universal targets, so
the first useMemo inside a shared .ts hook throws at render
('r is null'). Fix at our layer: linuxGtk sets
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

## Upstream NativeScript Octane driver: text-run parenting gaps (0.2.5)

Upstream `@nativescript-community/octane` 0.2.5 accepts
`FormattedString→Span` and `TextBase→FormattedString`, but rejects
`TextBase→Span` and does not fold bare `#text` children under a `Span`.
The source-owned [NativeScript driver](../../packages/nativescript-octane/src/driver.ts)
includes the former local patch: it projects mixed text and spans into an
ordered FormattedString and folds text under Span. Maintain that behavior in
source, rather than restoring a dependency patch. Nested styled Span trees
still require flattening by the text-owner layer; source ownership does not
establish additional device qualification.

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

## @nativescript-community/sentry: filtering and lifecycle gaps (4.6.49)

Verified from plugin source at 4.6.49 (`wrapper.ios.js`, `wrapper.android.js`,
`sdk.js`) — source evidence, not runtime behavior:

- `beforeSend` cannot drop or redact a **native crash report**. iOS
  (`wrapper.ios.js` `initNativeSdk`) invokes the JS callback inside the cocoa
  `SentryOptions.beforeSend` then returns the event unconditionally; Android
  (`wrapper.android.js` `BeforeSendCallback.execute`) likewise ignores the
  result. JavaScript-level events still run through the JS client's
  `beforeSend`, where `null` drops and modifications send — only the
  native-crash path is observe-only. `beforeBreadcrumb` does honor `null` on
  both native bridges.
- The exported `close()` (`sdk.js`) closes only the JS client and never calls
  `NATIVE.closeNativeSdk()`, so native crash capture would continue after JS
  collection stops. Xplat stance: `sentry.close()` calls the JS client's
  `client.close(timeout)` for a delivery-status result, then
  `NATIVE.closeNativeSdk()` (best-effort) so a consent withdrawal stops
  native capture too.
- `flush()` is documented in `sdk.d.ts` as "Not yet working on Android" — it
  awaits only the JS client's queue. The Android native-side queue is not
  covered; the returned status reflects the JS queue on both platforms.
- `enabled` is forwarded into the native options on both platforms (iOS
  options dictionary → `SentryOptions.enabled`; Android `setEnabled`), so
  `enabled: false` at init also disables native crash capture.
- Status: current in @nativescript-community/sentry 4.6.49. Recheck if
  upstream honors `beforeSend` results on native events, wires `close()` to
  the native SDK, or implements Android flush.

## @nativescript/vite: release source maps and the rolldown runtime chunk (8.0.20)

Verified from `configuration/base.js` at 8.0.20 and a production `native`
fixture build (packages/sentry `test:artifacts:native`) — build evidence, not
runtime behavior:

- `build.sourcemap` defaults to `debug`, so a release bundling emits no maps.
  Xplat stance: the starter opts in through `native(mode, { extra: {
  build: { sourcemap: 'hidden' } } })`; the last `extra` merge wins over the
  upstream default.
- The emitted `rolldown-runtime-*.mjs` helper chunk receives a Debug ID from
  `sentry-cli sourcemaps inject` but ships no `.map`, so frames inside it
  cannot symbolicate. It is upstream bundler boilerplate; the guides tell
  readers to upload it so Sentry reports the gap accurately rather than
  silently dropping it.
- `output.sourcemapBaseUrl` writes absolute `file://` source-map URLs for
  devtools. It is inert under `sourcemap: 'hidden'` (no `//# sourceMappingURL`
  comment is emitted) but would leak host paths if an app switched to inline
  or linked maps.

## Mason iOS owns layer masks (core 1.0.0-beta.5)

Mason’s `applyBox` treats an arbitrary `UIView.layer.mask` as overflow work:
visible overflow clears it, and hidden overflow may replace it. Assigning a
component CAShapeLayer directly therefore conflicts with normal Mason layout,
independently of NativeScript background cleanup. SmoothCorners supplies its
exact generated SVG path through Mason’s `style.clipPath` instead. Mason parses
`path("…")` and installs a MasonMaskLayer that its overflow logic preserves and
composes with bounds clipping. The decorative surface always has this CSS clip;
the content host receives it only for hidden overflow. Disabling the content
clip clears only the CSS value the component installed; border strokes and the
outer shadow remain separate.

Source: [applyBox](https://github.com/octane-xplat/nativescript-mason/blob/core-v1.0.0-beta.5/packages/nativescript-masonkit/src-native/mason-ios/Mason/Mason/MasonElement.swift#L1318-L1390),
[mask ownership](https://github.com/octane-xplat/nativescript-mason/blob/core-v1.0.0-beta.5/packages/nativescript-mason-core/src-native/ios/Mask.swift#L529-L623).
This uses the existing Mason API, without an upstream patch or a private redraw
wrapper. NativeScript core’s basic clip-path API and Mason’s path-capable API
are different boundaries; do not infer Mason’s support from core’s shape list.
Recheck this ownership contract when upgrading Mason. Host regressions cover
CSS path forwarding, resizing, removal, and preserving unrelated clips. The
actual iOS probe is `packages/smooth-corners/tests/clipping.ios.tsrx`; its
execution results belong in Silo. Tracking: [#153](https://github.com/octane-xplat/octane-xplat/issues/153).

## octane universal HMR: shifted hook slots corrupt live owners (0.16.3)

`hmrUniversalComponent.update` swaps the component render function and
reschedules every live owner, but the universal compiler assigns hook slots by
global ordinal (`module.useRef#N` across all hooks in the file). Inserting or
removing an earlier hook shifts every later slot onto a different hook's
record, so a `useRef` slot can inherit a host ref object as unrelated user
storage; ref cleanup then crashes (`null.set`/`null.delete`) in
`runCommitTasks`. Host reproduction:
`packages/ui/tests/universal-hmr.test.mts` compiles two revisions of the same
module and drives `wrapper[UNIVERSAL_HMR].update` under `flushUniversalSync`.
Until upstream emits a hook signature HMR can compare, there is no dispatch-time
signal to detect the mismatch — the slot symbols are identical by design.

Local patch scope: `packages/cli/patches/octane@0.17.0.patch` wraps the revised
component in a revision-keyed `universalBlock` + `universalKey`, so every
accepted update claims a fresh scope owner — old ref/effect cleanups run
against the old hooks and the new revision mounts independently. This trades
away hook-state preservation on native HMR edits (root and nested owners both
remount); normal rendering, reconciliation, and persisted app data are
unaffected. Remove the hunk when upstream ships signature-aware universal HMR
or an equivalent remount-on-incompatible-signature behavior. Tracking:
[#152](https://github.com/octane-xplat/octane-xplat/issues/152).

## @nativescript/vite: node_modules changes never reach the transform caches (8.0.20)

Vite's watcher excludes `node_modules`, so a patch install (`pnpm
patch-commit` + `pnpm install`, or Bun's patchedDependencies) that rewrites a
source-served dependency produces no file event: `handleHotUpdate` never runs
and both `server.transformRequest`'s module cache and the shared `/ns/m`
transform-result cache keep serving the pre-install output indefinitely —
timestamp/`?v` suffixes canonicalize to the same key. Verified on Opals with
`@octane-xplat/smooth-corners` (octane-xplat#161).

Local patch scope: `packages/cli/patches/@nativescript__vite@8.0.20.patch`
fingerprints each resolved `node_modules` file at `/ns/m` serve time
(`mtimeMs:size`, recorded at first serve) and runs the upstream
`purgeTransformCachesForHotUpdate` routine — Vite module graph plus the shared
transform cache — before re-transforming when the fingerprint drifts. Bounds:
detection needs a changed mtime or size (a rewrite preserving both stays
stale until restart); the purge clears the shared cache like every hot
update; the device still re-fetches the module through its normal HMR/app
reload path. `@nativescript/vite@8.0.21` (Windows preview) is not covered —
its npm and pkg.pr.new tarballs diverge in these files, so a single shared
patch cannot target both safely. Regression coverage:
`packages/cli/test/vite-ns-m-dep-freshness.test.mts`. Tracking:
[#161](https://github.com/octane-xplat/octane-xplat/issues/161).
## NativeScript 9.1.3: iOS variable-font computed weights

Upstream `ui/styling/font.ios.ts` creates a UIFont from family/weight traits,
but only applies variation coordinates when `fontVariationSettings` is
explicit. With SN Pro (default `wght=200`), ordinary CSS weights and editable
controls can remain at 200. The former Text-only inline bridge could not see
computed class weights or cover editors; issue
[#156](https://github.com/octane-xplat/octane-xplat/issues/156) records the gap.

The canonical `@nativescript/core@9.1.3` patch resolves supported axes from
CoreText after the CSS cascade. It derives `wght` from computed weight
(normal=400) only when no explicit weight axis exists, preserves other axes
and font traits, clamps to the selected font range, and keeps derived axes
out of inherited authored CSS. Its cache includes the computed CSS weight.
Static fonts retain their existing native selection. No new UI dependency is
required. Remove this patch hunk when an adopted upstream release provides
these same semantics; keep the Text component bridge removed.

Owning upstream source:
[font.ios.ts at 9.1.3](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/styling/font.ios.ts).
The CLI's `test:fonts` lane executes the installed patched module against a
CoreText boundary model. Actual platform behavior is owned by
`apps/mobile/src/tests/variable-font-styles.ios.spec.tsrx` and the existing
Geist spec; run `test:ios:fonts` on the selected, prebooted simulator. Host
checks alone do not qualify UIKit behavior or root font-family inheritance.

## Pager demo: isolated browser callback failure (cause unverified)

The maintained `packages/demos/src/PagerDemo.tsrx` passes a top-level TSRX
`renderPage` arrow to `renderItem`. With Octane 0.16.3, rendering that demo in a
browser Workshop story fails with `Cannot read properties of undefined (reading
'parentNode')` in the compiled callback. The compiler/callback ownership cause
is still unverified; this is evidence about that concrete path, not a general
claim that callbacks are unsupported. Native behavior is unverified.

The public component workshop uses an inline JSX callback inside its owning
`PagerExample` in `apps/component-workshop/src/leaves.web.tsrx`. That case passes
compiled Chromium mounting. Keep the original case visible in
[issue #176](https://github.com/octane-xplat/octane-xplat/issues/176); remove this
qualification only after the maintained demo itself passes. The isolated
browser fixtures intentionally do not import the failing demo as a workaround.

## NativeScript Windows: UserConsentVerifier await panics the isolate

Awaiting `Windows.Security.Credentials.UI.UserConsentVerifier.CheckAvailabilityAsync`
(or `RequestVerificationAsync`) through `NSWinRT.toPromise` from a JS
service/command context panics the process in the Windows preview runtime:

`v8::scope::PinnedRef<'_, v8::scope::HandleScope<'_, ()>> and Context do not
belong to the same Isolate` (nativescript-crash.log, packaged MSIX
1.0.0.233, source `c28d5b489`). The panic is process-fatal — no JS
try/catch intercepts it — while other WinRT asyncs (StorageFile,
PasswordVault) complete through `toPromise` in the same context. The
`OctaneXplat.Interop.ServiceInterop` managed helper ran the calls on the
captured dispatcher and returned polled string state. Tracked upstream in
[#11627](https://github.com/NativeScript/NativeScript/issues/11627).

Fixed upstream in `@nativescript/windows@1.0.0-beta.24` (the original
report ran `0.1.0-alpha.146`): the opt-in `hello-toPromise` service spec
awaited both calls through `NSWinRT.toPromise` in the same
command-dispatch context on packaged MSIX 1.0.0.247 and resolved —
`CheckAvailabilityAsync` → `1` (DeviceNotPresent) and
`RequestVerificationAsync` → `1` on a host with no Hello enrollment —
with the process surviving. With beta.24 as the minimum runtime the
managed bridge was removed (hard cutover): `biometrics.windows` awaits
the projected calls directly and the `HelloStart`/`HelloState` members
are gone from `ServiceInterop`.

### NativeScript file API `*Sync` variants are stubs on Windows

`File.readTextSync` returns the string `"undefined"` (not the file contents)
and `File.writeTextSync` reports success without performing IO. Confirmed on
packaged MSIX 1.0.0.243 via write instrumentation (writeCount incremented,
writeError null, file unchanged) and revalidated on
`@nativescript/windows@1.0.0-beta.24` (MSIX 1.0.0.251, `corefs-sync` spec):
`readTextSync` returns `undefined` on a file with real contents, a
fresh-file `writeTextSync` produces an empty file after which async
`writeText` throws `Windows.Foundation.HResult`, and `File.exists` returns
`undefined` (not `false`) for a missing path. Any app relying on synchronous file reads or
writes — e.g. preferences persistence through `File.writeTextSync` — silently
loses data (tracked upstream as NativeScript/NativeScript#11630). Workaround in `storage.windows.ts`: async `readText`/`writeText`
with snapshot writes enqueued at call time. Real-world impact: a packaged
qualification app's storage-persist spec read `null` for values written the
previous launch.

## Mason iOS input suspension needs core 1.0.0-beta.8 or later

For Xplat #221, Mason source revision `915996706008351bf949b6d8ac040864d9619dc8`
adds the per-viewport `MasonUIView.userScrollEnabled` setter. It is published in
`@octane-xplat/nativescript-mason-core@1.0.0-beta.8` (tag `next`; `latest`
remains 0.0.1 bootstrap); registry beta.7 and earlier do not contain it. Check
native capability rather than trusting the package version, and rebuild the
native app after upgrading the dependency.

The native setter cancels user pans and momentum without assigning offsets;
programmatic seeks remain available. Overflow hidden is not a substitute:
Mason clamps hidden-axis offsets to zero. `suspendScrollInput` on Xplat's iOS
entry point owns a snapshot of mounted descendant viewports with overlapping
leases; native subtree replacement requires release and reacquisition. Other
platforms have no equivalent contract in this API. Host tests establish
ownership, not real-touch qualification. See the
[public usage and limits](../../docs/app/primitives.md#pause-ios-user-scrolling-during-an-ancestor-drag).

## Mobile Video callbacks (@nstudio/nativescript-exoplayer 6.2.0)

Two dependency boundaries affect Android Video qualification. In the
[plugin source at its published gitHead](https://github.com/nstudio/nativescript-plugins/blob/f29a83d78dccb5c2c9aff00f1749bc2b6788b56d/packages/nativescript-exoplayer/index.android.ts),
`onPlayWhenReadyChanged` sets `eventPlaybackStart` without emitting
`Video.playbackStartEvent`; the installed 6.2.0 `index.android.js` agrees.
Adding an emit at that location would still confuse a playback request with
actual playback. The mobile Video leaf removes its poster on `onPlaybackStart`.

Separately, the probe host loads case code dynamically, so its Java listener
proxies use NativeScript Android's runtime binding generator. In
[Android 9.1.1 `Dump.getSupportedMethods`](https://github.com/NativeScript/android/blob/60d03e98f215d63f3043cce926197f8044950ad1/test-app/runtime-binding-generator/src/main/java/com/tns/bindings/Dump.java#L281),
interface methods are collected only when abstract; explicitly supplied
implementations of default interface methods are omitted. This affects
ExoPlayer 2.17.1's `Player.Listener` callbacks. An independent listener and an
explicit `java.lang.Object.extend` implementation received no native callbacks;
reflection on the generated class showed no callback overrides. This conclusion
is scoped to runtime-generated proxies, not a qualification of static bindings
or every Android app build.

On the selected Android AVD, native state reached READY with `isPlaying=true`,
media time advanced, and decoder rendered-buffer counts increased with controls
both enabled and disabled. Plugin readiness/start flags remained false, event
counts stayed zero, and the poster remained. Thus absence of `onReady` in this
probe does not establish a media preparation failure. Decoder counters establish
native rendering progress, not visible pixels, flicker, or display timing.

The plugin half is repaired locally: the canonical patch
`@nstudio__nativescript-exoplayer@6.2.0.patch` emits `playbackStart` once per
source from `onIsPlayingChanged` — ExoPlayer's actual-playing transition — and
returns `onPlayWhenReadyChanged` to a stub so a play request cannot surface as
a start. `release()` and non-looping-ended flag resets are preserved, so
replays and source replacements report again; looping does not re-emit. The
maintained listener regression is
`packages/video/tests/exoplayer-playback-start.mobile.test.ts`. On iOS the
plugin's `playbackStart()` emitter was dead code with no observer call site:
`PlayerObserverClass` only watches the item's `status` for `playbackReady`.
The same canonical patch now observes the player's KVO-compliant
`timeControlStatus` and emits once per source from its `Playing` state —
AVFoundation's actual-playing transition; a buffering player reports
`WaitingToPlayAtSpecifiedRate`, so a play request or a stall cannot surface as
a start. `eventPlaybackStart` resets on non-looping finish, item replacement,
and `_setNativePlayerSource`, so replays and replacements report again while
looping does not; the player-state observer attaches in `_init()`, re-attaches
on AVPlayer replacement, and detaches in `destroy()`. The same patch also
pauses the shared AVPlayer on source replacement when autoplay is off:
AVPlayer.rate survives `replaceCurrentItemWithPlayerItem`, so a player told to
play (e.g. autoplay on a failed item) would otherwise resume on the next item
even when the new source requests `autoplay=false`. Android recreates its
ExoPlayer per source, resetting `playWhenReady`, and the web leaf resets on a
new `src` — the pause restores that contract on iOS. The maintained iOS
regression is `packages/video/tests/exoplayer-playback-start.ios.test.ts`. Both
tests drive the installed plugin source through stubbed listener/KVO contracts
— they do not qualify NativeScript's runtime bridging or device delivery.

The runtime proxy gap is repaired locally and remains upstream work: a
`Dump.getSupportedMethods` change on the 9.1.1 base `60d03e98` (local
nativescript-android worktree `stony-crocus/v911-repair`, repair commit
`d896651e`) generates proxy overrides for explicitly requested non-abstract
interface methods — including interfaces passed to `Object.extend` — while
leaving unnamed defaults on their native implementations. Debuggable consumers
must take the `-PoptimizedWithInspector` variant: `RuntimeHelper` starts
`AndroidJsV8Inspector` whenever `android:debuggable` is set, and the plain
`-Poptimized` AAR omits that JNI, so a debuggable app dies pre-JS into
`ErrorReportActivity` with `UnsatisfiedLinkError`. The qualified artifact is
`runtime-optimized-with-inspector-release.aar` (SHA-256
`f5874cf7da11894af3220270c93fef68bf27701c60479bf0678acbfe6c5ee56e`,
arm64-v8a, V8 14.9.207.39, built on NDK 29.0.14206865); an earlier main-based
draft (SHA-256 `f59623f1…`, built on `6d16eb2c`) is incompatible and must not
be used.

With that runtime in the prepared probe's `runtime-libs`, the full Android
matrix passed on `elegant-fir-probe` (Android 35, run
`e3c44d20-148e-4ac6-8f26-8cce317e5c02`, 22/22 assertions):
`playbackStart`/`playbackReady` each delivered once per source through the
dynamic proxy in both controls modes, poster present before start and removed
after, pause/resume/seek/loop kept a single start, source replacement re-armed
and reported again with autoplay rendered frames, a missing source stayed
buffering with the poster retained, cancellation returned to idle with the
poster, and unmount unloaded the view with the player idle. At that time
media-failure callback delivery (`onPlayerError`) had not been exercised.

The upstream repair is now landed on the NativeScript/android main line at
`e5432d92e6174b02e0905db2121d3a1065e90422` (three layers: supplied default
interface overrides in `Dump.getSupportedMethods`, content-keyed class
identity for anonymous interface proxies, and unsupplied D8-desugared
defaults bridged to the native `$-CC` companion). Upstream verification:
binding-generator tests 14/14 and 26/26 on-device specs on
`elegant-fir-probe`, including a real second-listener `onPlayerError`
PlaybackException (`errors 1`, `errorStates 2`); no upstream release exists,
so consumers still need a locally built artifact.

For consumer verification the complete repair was backported onto the same
9.1.1 base `60d03e98` (worktree `trudy-v911-full`) and rebuilt as
`runtime-optimized-with-inspector-release.aar` (SHA-256
`8e50916b0d95e824754477ecbb79718497eaeef4dea7fa755262dad52f23a0bd`,
arm64-v8a). With that artifact in `runtime-libs` the same probe matrix passed
again on `elegant-fir-probe` (run `1d2a0608-c72b-4158-9b49-a9895d27c05e`,
22/22 assertions), and an added runtime-layer case passed all four
assertions: a second anonymous `Player.Listener` proxy received the real
missing-file `ExoPlaybackException` (`errors 1`, states `2,1`), and an
unsupplied `Comparator.reversed` default resolved to the native
`Collections$ReverseComparator2` implementation. The same layer case also
passed on the previous Dump-only artifact `f5874cf7` (run
`cc99288d-d9c8-4017-a2aa-93f3d5f4e802`): this consumer cannot discriminate
the newer layers because the plugin supplies the full `Player.Listener`
surface, so Dump-only stubs still forward to each instance's own
implementation. Discriminating fail-before/pass-after coverage for the
newer layers therefore stays with the upstream test-app specs; the consumer
runs confirm the complete runtime is not a regression for the matrix.
Static app bindings and release-APK delivery remain unqualified. Detailed
run evidence belongs in Silo and reports.

On the selected iOS simulator (`91D40099-A056-497D-A572-ADDDFD6A8F23`, iPhone
18 Pro), the equivalent matrix passed (acceptance run
`c5f25a82-1ee6-4004-970a-cdfc4e1addce`, 24/24 assertions):
`playbackStart`/`playbackReady` each delivered once per source through the
real NativeScript KVO `timeControlStatus` bridging in both controls modes,
poster present before start and removed after, pause/resume/seek/loop kept a
single start, source replacement re-armed and reported again under autoplay,
a missing source surfaced `AVPlayerItem.status=Failed`
(`AVFoundationErrorDomain -11800`) with the poster retained, cancellation
stayed paused with the poster (the residual-rate repair above), and unmount
left the view unloaded with the player paused. The unpatched run also showed
the residual-rate failure: a failed autoplay item's requested rate replayed
the next non-autoplay source. On fast local media an autoplay replacement
reaches `Playing` inside ~40 ms, so the poster mounts only for that window —
the poster contract is qualified by the paused/failed paths, not a
single-instant sample. AVFoundation errors were observed via item status, not
a plugin error event; static bindings and release-app delivery remain
unqualified.

## GTK 4: WM_DELETE on a second window crashes X11 apps under headless Xvfb

Verified 2026-11-09 on Debian trixie (`libgtk-4-1 4.18.6+ds-2`, `gjs 1.82.3-1`, openbox, Xvfb, dbus-run-session): closing a second `Gtk.Window`/`Gtk.ApplicationWindow` via `xdotool windowclose` (WM_DELETE) kills the process with `BadDrawable` / `GdkSurface unexpectedly destroyed` + `_gdk_surface_destroy_hierarchy: assertion failed: (priv->egl_native_window == NULL)`. A plain-GJS control with no Octane code (a main `ApplicationWindow` plus a second window opened from `GLib.idle_add`, then `xdotool windowclose` on the second) crashes identically in 3 of 3 runs, so this is GDK X11 surface teardown, not renderer behavior. `GDK_DISABLE=gl,vulkan` does not prevent it. Closing through the window controller's `close()` (an in-window button) survives. Not verified on a real compositor; it may be specific to headless Xvfb. Separately, creating a window synchronously inside a D-Bus method handler produced the same `BadDrawable`; that trigger was ours, and `@octane-xplat/tray` now dispatches SNI/dbusmenu callbacks through `GLib.idle_add`. The desktop-shell journey closes the Inspector with its own button and runs the WM_DELETE probe last, under the `x11-wm-delete-message` input class, so this crash cannot mask other steps.
The mobile Video leaf hides its poster on `onPlaybackStart`. Android native
qualification observed loaded, visible posters with controls both enabled and
disabled, but no start callback or poster removal after playback requests.
This is partial lifecycle evidence, not proof of rendered frames or a complete
playback diagnosis. Source replacement after confirmed playback and visual
flicker remain unqualified. Xplat currently has no workaround for the missing
event; host object-driver dispatch does not prove that the plugin emits it.
Requalify the native event and poster lifecycle when changing the plugin or
its event integration. Keep detailed run evidence in Silo and local reports.

## iOS runtime-only class wrappers

[Issue #228](https://github.com/octane-xplat/octane-xplat/issues/228) records consumer diagnostics on NativeScript iOS runtime 9.1.0/core 9.1.3: CAFilter lookup returns an NSObject wrapper and class-method discovery fails. NativeScript documents build-time SDK-header metadata; the precise superclass substitution point remains unisolated. Xplat carries no patch or private API support. The [public boundary guidance](../../docs/testing/known-limits.md#ios-runtime-only-class-identity) describes an app-owned native factory route, consumer-reported physical-device evidence, and the public UIKit fallback. Recheck wrapper identity and native metadata when upgrading the runtime; this docs change supplies no independent device qualification.

## NativeScript iOS HTTP module fetch budget (9.1.0)

NativeScript iOS 9.1.0's
[`BuildModuleFetchRequest`](https://github.com/NativeScript/ios/blob/v9.1.0/NativeScript/runtime/HttpLoader.mm#L650-L655)
sets a 5-second request timeout for both synchronous and async graph loads.
The async session's 10-second setting does not extend it. NativeScript Vite
8.0.20 permits 120-second transforms, so valid cold responses can outlast
native discovery's request budget.

Verified on an arm64 iOS 27 simulator using the published 9.1.0 native host:
the [plain-ESM delayed-parent reproduction](../../tools/platform-qualification/ios-module-graph/README.md)
produced two async timeouts and three graph-miss warnings for the parent and
its undiscovered subtree. A test-only 30-second request override fetched the
parent once with no warnings; both runs returned 42. An isolated published
0.20.0 consumer cold start then reproduced native timeout traces and valid
HTTP responses taking 5-9 seconds. Within 60 seconds, the default run had
118 transport retries, 73 dependency failures and six fallback warnings;
its App graph had not finished. The request override produced no retries,
fetch failures or misses, and completed that graph in about 45 seconds.
These are graph-loading measurements, not usable-screen or OS-input timing.

[`AsyncGraphOnFetchCompleted`](https://github.com/NativeScript/ios/blob/v9.1.0/NativeScript/runtime/ModuleInternalCallbacks.mm#L1490-L1500)
leaves failed dependencies to synchronous resolution after a transport retry;
`LoadHttpModuleForUrl` then warns. A missed parent can therefore cause many
subtree warnings without an import-analysis or re-export defect. The isolated
control covers named and star re-exports. Cold serving latency triggers the
mismatch, but its division between upstream Vite, the canonical patch and
consumer plugins has not been profiled. No consumer import/configuration
repair is established; do not remove intentional dynamic entry imports based
on these warnings.

The [test-only native override](../../tools/platform-qualification/ios-module-graph/timeout-override.m)
changes the effective request deadline in the same runtime binary; it is not
a production workaround. The candidate 30-second source repair has not been
rebuilt or release-qualified. Upstream should reconcile request/retry,
server-transform and total graph deadlines, and preserve the original
fetch-failure reason in fallback diagnostics. Raising only the async session
timeout is insufficient. No upstream issue or repair has been submitted for
this finding.

Xplat mitigates server-side rather than patching the runtime: the canonical
@nativescript/vite 8.0.20 patch adds a boot graph crawl that walks the same
served-code specifier graph the device traverses — through the real /ns/*
middleware — during the prepare/install window, so the runtime's async walk
hits warmed transforms and memoized responses instead of cold pipelines that
outlast its 5-second request budget. Crawl traffic marks
`x-ns-vite-boot-crawl` and queues behind live device demand in the shared
transform runner's priority lanes; the dev link-check's nested target
transforms share that runner (deduped, still checked) and each target's
default-export verdict is cached by served code. The runtime's budget,
request/retry and graph deadlines remain upstream's to reconcile.
