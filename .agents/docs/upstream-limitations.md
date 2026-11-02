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

- `ApplicationDataContainer.Values.HasKey` is not projected: every
  `ApplicationSettings.getString`/`getBoolean`/`getNumber` call throws
  `TypeError: Windows.Storage.ApplicationData.Current.LocalSettings.Values.HasKey
  is not a function`. `storage.windows.ts` therefore bypasses
  ApplicationSettings and drives the `IPropertySet` surface itself (indexer,
  `Insert`, `Remove`, `First()`-iterator fallback).
- `FileSystemAccess` "sync" text/buffer APIs are fake-sync:
  `readTextSync`/`writeTextSync`/`readBufferSync`/`writeBufferSync` call the
  WinRT `PathIO.*Async` op with `.done()` and return before completion, so a
  sync read always yields `''`/`undefined`. The real async path works
  (`File.readText`/`writeText` resolve through `NSWinRT.toPromise`) — the
  service fixture records `syncText` as limitation evidence and qualifies
  content IO through the async APIs.

Upstream status: open; revisit both when the Windows core runtime rev changes.
