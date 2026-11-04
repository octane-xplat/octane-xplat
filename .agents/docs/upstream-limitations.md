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

Upstream status: reported — [NativeScript/NativeScript#11613](https://github.com/NativeScript/NativeScript/issues/11613)
(file-system-access member matrix) and
[NativeScript/NativeScript#11614](https://github.com/NativeScript/NativeScript/issues/11614)
(HSTRING marshalling loss + `Values` IMap unprojected). Revisit all when the
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
