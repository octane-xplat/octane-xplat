# Windows native support candidates

Issue: [Windows #61](https://github.com/octane-xplat/octane-xplat/issues/61).
This note records implementation candidates after audit commit `720c9ef93`.
The shared [export audit](native-desktop-support.md) remains a historical snapshot;
its TSVs, findings and hashes have not been regenerated during parallel work.

## Priorities and evidence boundary

Prioritize app startup, forms, navigation, overlays, scrolling and everyday
services. `packages/demos/src/ControlsDemo.tsrx` uses Slider, Switch and shared
layout; `FileInputDemo.tsrx` uses attachment selection. `apps/windows` consumes
the shared app and demos. Assume those common flows matter more than optional
billing, ads and specialist integrations.

The initial pass used source inspection, targeted lint/format, syntax/manifest
checks and diff review. Focused laptop test results are recorded below. No compilation, broad tests, package installation, Windows launch,
OS input, UIA, screenshots, packaging or distribution qualification was run.
The existing source audit is not runtime proof. No evidence-gated issue checkbox
is complete because of these changes.

## Implemented candidates

| Area | Candidate | Remaining boundary |
| --- | --- | --- |
| UI import | Native preset includes the Windows condition; UI root has a Windows export and neutral KeyboardAvoiding | Production import graph and packed declarations need verification; mobile status-bar imports are excluded from this root |
| Animated-image import | GIF manifest selects the existing Windows entry instead of an explicit mobile visual import | Existing unsupported placeholder remains; no GIF playback claim |
| Command palette | Unsuffixed announcement import selects a WinUI automation-peer leaf | Screen-reader delivery and peer projection unverified |
| Dialogs/sheets | Windows keyboard-overlay host resolves independently of the mobile-only helper | Neutral software-keyboard binding; Windows occlusion, modal focus/Tab/Escape/background exclusion and OS dismissal remain unqualified |
| Gradient controls | Windows LinearGradientBrush helper supplies the previously missing leaf | Native bridge projection, repaint ownership and pixels unverified |
| Files | Windows-only text/binary I/O leaf removes the mobile document-picker import; bounded reads, owned temporary writes and cleanup | Picker/export interop unavailable; WinRT stream/promise projection and actual I/O unqualified |
| Clipboard | WinRT text read/write, format check, async bridge, flush, false/null failures | OS clipboard access, foreground restrictions and persistence need Windows checks; rich formats excluded |
| Random | WinRT CryptographicBuffer entropy, bounded hex conversion, byte-range preservation | API binding/runtime must be checked; no JS PRNG fallback |
| Device | Explicit Windows OS identity, core metadata | Version/model/language metadata unqualified |
| App settings | Package-family-specific Settings URI; unavailable without package identity | Packaged and unpackaged host behavior, launch acceptance and navigation unqualified |
| Preferences | Windows leaf preserves ApplicationSettings string operations and returns false for unconfirmed blocking flush | OS persistence/crash durability unqualified; no blocking commit API bound |
| Auth session | Explicit unavailable Windows leaf rejects with UnavailabilityError | Hosted OAuth/WebAuthn callback/activation adapter still missing; this corrects availability, not auth support |

Underlying SDK references: [clipboard text](https://learn.microsoft.com/en-us/uwp/api/windows.applicationmodel.datatransfer.clipboard.getcontent),
[brushes](https://learn.microsoft.com/en-us/windows/apps/develop/platform/xaml/brushes),
[CryptographicBuffer](https://learn.microsoft.com/en-us/uwp/api/windows.security.cryptography.cryptographicbuffer),
[Settings URIs](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings).
These document OS APIs, not the preview NativeScript projection.

## Deferred commands and qualification

The human subsequently authorized focused testing through `ssh windy`.
Connection to the Windows laptop succeeded. Targeted results will be recorded
separately; the following broad/package checks remain deferred. Run these from
the repository root when those verification phases are authorized:

```sh
pnpm exec turbo run build --filter=@octane-xplat/cli
pnpm exec turbo run test --filter=@octane-xplat/cli
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/files
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/gif
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm exec turbo run typecheck --filter=...@octane-xplat/gif
```

Host-contract regressions are in
`packages/platform/tests/windows-services.test.mjs`; their focused laptop run is
recorded below. The Windows resolver subtest in
`packages/cli/test/vite-native-runtime.test.mjs` remains unexecuted. Neither is
WinRT or OS evidence. The CLI test uses a fake package to isolate condition
selection; the real package graph still needs production qualification.

After permission, use the [Windows test-host runbook](../windows-test-host.md)
for the real host and its resource reservation. From the authorized Windows
checkout, build the private harness with:

```sh
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Then run explicit native checks for clipboard Unicode/empty/nontext/busy cases,
random bytes and subviews, packaged/unpackaged app settings, device metadata,
controls, overlays and automation-peer announcements. The probe runner excludes
Windows; do not substitute a successful mobile probe for Windows evidence.

## Recipes and remaining work

Reviewed `platform-leaves`, `shared-overlays`, `keyboard-clipboard` and
`passkey-sign-in`. Windows remains outside these recipes' supported targets;
existing criteria and maintained examples are unchanged. Source candidates do
not add a supported downstream Windows workflow. Public service guidance and
the Octane services skill distinguish the candidates from qualification.
`recipe_audit.target` currently accepts only web/iOS/Android/macOS: do not insert
Windows coverage under another target or weaken the schema during parallel work.

Lightweight checks passed: targeted lint (after correcting the inherited default
announcement helper), syntax-only transpilation of ten new TypeScript files,
Node syntax checks of regression files and targeted diff whitespace checks.
These are not type, behavior or runtime checks.

Recipe structure/local links passed with `pnpm check:recipes`.
`pnpm check:changelog` validated ten notes after temporarily reusing the existing
installed yaml dependency; the isolated worktree has no dependency install.

Next high-demand work: inspect native keyboard/focus and scroll geometry before
specialist packages; qualify file picker window ownership and core persistence.
Keep the layout binary adoption and explicit-width flex overlap gates open.

## Focused Windows host-contract run

At source revision `88a67da75`, all five tests in
`packages/platform/tests/windows-services.test.mjs` passed on `windy`
(Windows x64, Node 24.13.1, pnpm 12.15.0, Turbo 2.11.4; exit 0).
The isolated scratch workspace was `dev/octane-windows61-checks-88a67da`.
Its node_modules junction reuses the existing qualification checkout's installed
tooling; no install, native build or old experiment change was needed.

```powershell
Set-Location "$env:USERPROFILE/dev/octane-windows-qualification"
pnpm exec turbo --cwd "$env:USERPROFILE/dev/octane-windows61-checks-88a67da" run test --concurrency=1
```

These execute our TypeScript adapters against mocked projected APIs. They prove
error paths, bounds and dispatch contracts only; they do not execute NativeScript
or WinRT, inspect the user's clipboard, exercise settings navigation, or establish
secure entropy from the actual runtime. The CLI resolver regression, full
package suites, declarations and all native qualification remain pending.

The opensrc cache labeled `abae298` lacked Windows implementation files, so the
Windows core sources were read directly from the upstream GitHub commit
`abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`.
[Color source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/color/index.windows.ts)
uses plain rounded ARGB structs; the gradient candidate follows that shape.
[Utils source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/utils/index.windows.ts)
returns true when an async URL launch is submitted, before OS acceptance.
Accordingly, the settings candidate's boolean is request submission only.
[ApplicationSettings source](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/application-settings/index.windows.ts)
returns true from a no-op flush, relying on OS persistence; this is not a
blocking durability confirmation. The Windows leaf reports false instead. These are upstream source findings,
not runtime qualification.

A follow-up run on the same scratch workspace passed seven tests (six platform
contracts plus the Windows gradient projection regression), exit 0. The source
overlay added `storage.windows.ts` and replaced ColorHelper calls with plain ARGB
structs. Raw output: `research/windows61/windy-contracts-followup.log`. The UI
regression is maintained at `packages/ui/tests/windows-gradient.test.mjs` and
included in `test:native`; the full suite is still deferred.

The same upstream commit supplies a concrete
[view-relative coordinate method](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/ui/core/view/index.windows.ts#L1207).
Do not treat the older no-op-coordinate record as proof that this preview lacks
source support. Geometry under actual scrolling remains unqualified. The shared
`useKeyboard` still reports no native hardware-key attachment; the reviewed core
View file does not forward KeyDown/KeyUp. A target input adapter and actual
keyboard/focus checks remain necessary before claiming shared-keyboard support.

## Windows file I/O candidate

`packages/files/src/files.windows.ts` selects a Windows service without importing
`@nativescript-community/ui-document-picker`. It implements text reads/writes,
64 KiB binary streaming, maxBytes checks before and during reads, cancellation,
partial-write/flush failure handling, unique temporary copies and owned-only
asynchronous release with retry. External references are never released as owned
files. Temporary copies are not durable documents.

The six maintained regressions at `packages/files/tests/files.windows.test.mjs`
passed through the same isolated Turbo fixture on `windy` (13 total focused tests,
exit 0). Raw output: `research/windows61/windy-files-contracts.log`. They use mocked
projected APIs, not real files or WinRT. Actual `DataReaderLoadOperation`, uint32
write-result and boolean flush-result projection remain unqualified, as do
ApplicationData availability and packaged filesystem permissions.

Picker operations explicitly reject `UnavailabilityError`; export returns
`unavailable`. The installed runtime package exposes no public bridge declaration
for initializing a picker with a window, and no such adapter is qualified in
this repository. This does not prove a bridge implementation is impossible.
Microsoft's [desktop picker requirements](https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers#use-winrt-pickers-with-hwnd-interop)
require HWND initialization for legacy pickers. SDK 1.8's newer WindowId-based
picker is not a reason to claim support on the existing 1.6 preview host.

Read the [Windows Files subset](../../../packages/files/README.md#experimental-native-windows-file-io)
before using the service. The `date-picker` recipe owns FileInput's default-picker
workflow and excludes Windows; its criteria remain unchanged. No downstream
Windows picker workflow or recipe completion is claimed. Silo's recipe target
constraint still prevents Windows assessments.

## Resolver-test environment boundary

The isolated laptop fixture attempted the maintained
`packages/cli/test/vite-native-runtime.test.mjs` after bundling the committed CLI
preset sources through Turbo and the existing esbuild 0.27.7. The small bundle
build succeeded. Its runtime import of `@octane-xplat/lib/server-boundary` was
satisfied with the committed library source; the older laptop dependency graph
then lacked `@babel/core`, so the maintained test could not start. This is an
environment dependency failure, not a failed Windows-condition assertion or a
passing resolver test. No dependency install was performed.

```powershell
Set-Location "$env:USERPROFILE/dev/octane-windows-qualification"
pnpm exec turbo --cwd "$env:USERPROFILE/dev/octane-windows61-checks-88a67da" run test:resolver --concurrency=1
```

Raw output: `research/windows61/windy-resolver-contracts.log` (exit 1 before the
regression body). Use a current, separately installed qualification checkout
before rerunning the maintained CLI test and production import graph. The
scratch bundle is not the package build or a native app artifact.
