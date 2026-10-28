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
| Floating layers/focus return | Dedicated NativeScript useLayer leaf; Windows XamlRoot-scoped return helper uses the declaring host | Minimal resolver and mocked focus contracts only; native mounting, geometry, activation/identity projection, Tab/IME and focus remain unqualified |
| Media queries | Windows leaf samples fine/coarse/hybrid pointer, pen hover and animation preferences; listens to root layout and app lifecycle/resize | Standalone NativeScript input/preference projection passed with synthetic screen size; hook rendering, real resize, hotplug/settings events and secondary windows unqualified |
| Gradient controls | Windows LinearGradientBrush helper supplies the previously missing leaf | Native bridge projection, repaint ownership and pixels unverified |
| Files | Windows-only text/binary I/O leaf removes the mobile document-picker import; bounded reads, owned temporary writes and cleanup | Standalone reads/writes and owned-only release passed against a task folder; packaged TemporaryFolder, cancellation, deterministic cleanup and picker/export unqualified |
| Clipboard | WinRT text read/write, format check, async bridge, flush, false/null failures | OS clipboard access, foreground restrictions and persistence need Windows checks; rich formats excluded |
| Random | WinRT CryptographicBuffer entropy, bounded hex conversion, byte-range preservation | Standalone NativeScript byte bounds/chunks passed; production app integration unqualified; no JS PRNG fallback |
| Controlled text | Windows text-write leaf preserves TextBox selection around guarded value updates | Mocked range/lifecycle tests only; actual WinUI selection, IME, secure fields and focus unqualified |
| Scroll observation | Windows useScrollableArea composes viewport/content layout, scroll and lifecycle handlers | Scripted-hook/fake-metric contracts only; real compiler/renderer, Mason measurements, OS scrolling and RTL unqualified |
| Connectivity/query environment | Windows WinRT profile-level reader and native environment export; shared monitor ownership and stopped-listener guards | 17 focused contracts and one native snapshot comparison passed; reconnect/event delivery, app/window lifecycle and real query refresh unqualified |
| Keep-awake | Windows WinRT DisplayRequest with deduplicated tags, direct core UI dispatch and suspend/resume/exit cleanup | 12 focused contracts and native construction/method projection passed; actual grants, UI-thread/app lifecycle and physical sleep prevention unqualified |
| Credentials | Package-family-scoped PasswordVault adapter avoids mobile plugin fallback | Standalone task-namespace operations/cleanup passed; actual packaged identity, persistence across launches and policy behavior unqualified |
| Device | Explicit Windows OS identity, core metadata | Version/model/language metadata unqualified |
| App metadata | Windows appInfo lazily reads package identity and four-part version | Four mocked contracts and standalone unpackaged-unavailable result passed; packaged values, startup and production integration unqualified |
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

## Windows media queries and current metric source

The source at pinned NativeScript commit `abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`
already derives [Screen.mainScreen DIPs](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/platform/screen/index.windows.ts)
from the primary window's XamlRoot and [emits orientationChanged on resize](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/application/application.windows.ts#L302).
The earlier audit's missing-window-resize description must not be treated as
proof of absence in this preview. No replacement sizing mechanism was added;
actual resize geometry remains unqualified.

`use-media-query.windows.tsrx` adds a Windows input/animation capability leaf.
The shared fallback's fixed coarse/no-hover traits misclassify mouse desktops;
its grammar does not recognize the reduced-motion query used by
`useStreamingText`. Existing adaptive-dialog and menu examples under
`apps/astryx-sandbox/src/examples` also use the compact-touch query. The new
helper keeps primary input, hybrid any-pointer support and unknown host data
distinct. The preference order is mouse, pen, touch. Pen hover uses reported
MaxPointersWithZDistance; missing capability data does not become none/false,
and negation does not turn an unknown predicate into a match.

The leaf retains a restricted native grammar: px/DIP width/height bounds and
exact values, orientation, pointer/any-pointer, hover/any-hover,
prefers-reduced-motion, and/or/comma and per-term not. It does not promise the
browser's full CSS grammar. The existing [core query engine](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/css-mediaquery/index.ts#L73)
rejects string-valued pointer/hover features, so it cannot supply this behavior.
No UI dependency was added. Root loaded/layoutChanged and application
resize/launch/resume events resample the primary window. Input-device hotplug,
settings-change notifications and secondary-window ownership remain unqualified;
this does not implement hover event dispatch or focus modality.

Six new tests at `packages/ui/tests/windows-media-query.test.mjs` passed on
`windy` in the isolated Turbo fixture (19 focused tests total, exit 0). They cover
hybrid input, touch/pen/no-pointer and unknown states, query bounds/precedence,
root rebinding/disposal and reduced-motion sampling. One initial failure was a
missing animation-preference default in the test fixture; after correcting the
fixture, the complete focused run passed. Raw output:
`research/windows61/windy-media-contracts.log`. The helper was transpiled for
Node; the hook leaf has lint/syntax evidence only, not native renderer execution.

Four additional read-only Windows PowerShell/.NET checks instantiated
MouseCapabilities, TouchCapabilities and UISettings, checked numeric/boolean
property types and called GetPointerDevices. All passed (exit 0), without logging
hardware identities, capability values or user preference values. Raw output:
`research/windows61/windy-input-api-types.log`. These prove OS API availability
in that .NET/SSH process, not NativeScript bridge behavior. API references:
[input capabilities](https://learn.microsoft.com/en-us/windows/apps/develop/input/identify-input-devices),
[pen hover capacity](https://learn.microsoft.com/en-us/uwp/api/windows.devices.input.pointerdevice),
[animation preference](https://learn.microsoft.com/en-us/uwp/api/windows.ui.viewmanagement.uisettings.animationsenabled).

The native UI test task includes this helper regression. The full UI suite,
package/dependent typecheck and actual NativeScript renderer/runtime checks
remain deferred. Public Windows guidance and the styling skill record the
subset. No supported downstream Windows workflow or recipe target was added;
responsive examples already use the shared import and require no source change.

## Standalone NativeScript DLL checks on windy

Using the existing `@nativescript/windows@0.1.0-alpha.144` x64 DLL, a short-lived
PowerShell process initialized the runtime, ran transpiled source, consumed the
last-JS-error diagnostic and deinitialized it. No native build, dependency
install, package registration or app launch was performed. Device ownership was
reserved with `goddard-agent resource run` using `exclusive: ["device:windy"]`.
The DLL was read from the existing experiment's
`apps/windows/platforms/windows/libs/x64/nativescript.dll`; SHA-256:
`748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C`.

Three focused checks passed, each exit 0 and its explicit success marker:

- Random: the actual CryptographicBuffer projection filled a 70,000-byte
  DataView spanning two chunks, preserved surrounding sentinel bytes and
  returned the same view; a separate 32-byte request retained its length.
  This does not statistically certify entropy. Log:
  `research/windows61/windy-native-random.log`.
- Input capabilities: actual mouse/touch property types, pointer-vector
  Size/GetAt, pointer enum comparison and animation-preference projection
  passed. The helper produced known traits. Screen was deliberately supplied
  as a synthetic 800×600 object; no hook, geometry, resize, hotplug or UI event
  claim follows. No hardware/preference values were logged. Log:
  `research/windows61/windy-native-media.log`.
- Files: the updated source read every byte of a task-owned 70,000-byte fixture
  across 64 KiB chunks, rejected a 69,999-byte limit and read UTF-8 text including
  a snowman. This used actual StorageFile/WinRT async operations and timer/message
  pumping. Log: `research/windows61/windy-native-files.log`.

The file probe exposed gaps hidden by the mocks. `OpenReadAsync` returned a
projection without inherited GetInputStreamAt; the leaf now requests the input
interface directly through OpenSequentialReadAsync. GetBasicPropertiesAsync
supplies the initial size bound. DataReader.LoadAsync then caused an access
violation in this standalone host after requesting the load; two isolated
processes reproduced it. This does not establish whether the packaged WinUI
host has the same fault. Direct IInputStream.ReadAsync with bounded Buffer
objects passed and replaces that route. Input-stream Close is also absent in
this projection, so explicit close remains best effort and reclamation depends
on runtime proxy release. Deterministic handle cleanup is **not** qualified.
Failure logs: `windy-native-files-sequential-crash.log`,
`windy-native-files-load-crash.log`, `windy-native-files-close-projection.log`
under `research/windows61/`. An initial fixture path used mixed separators;
canonicalizing the task-owned Windows path resolved its earlier async-open
error. Neither that fixture error nor the native crashes are passing evidence.

Task-owned reproduction files remain on windy at
`C:\Users\alecs\dev\octane-windows61-checks-88a67da`: `native-media-probe.ps1`,
`native-files-probe.ps1`, and `native-smoke/random-smoke.js`. The probes inline
transpiled repository implementations after removing imports; file-byte helpers
are included, and media uses synthetic Screen/Application objects. They do not
exercise production export resolution, bundling, hooks or the full app. Repeat
one probe under a device reservation, for example:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows file-read probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-files-probe.ps1'
```

After updating the stream-shaped fixture, all 19 focused mocked contracts passed
again through the isolated Turbo task (exit 0), including read cancellation,
size growth and cleanup where the host supplies Close. Log:
`research/windows61/windy-direct-stream-contracts.log`. App-host writes,
ApplicationData/package identity, cancellation, deterministic cleanup, release,
pickers/export and production imports still need qualification. Full package
checks and the exact deferred commands above remain deferred. No evidence-gated
issue checkbox or supported recipe target was closed by these probes.

## Windows output-stream projection repair

A follow-up standalone alpha.144 x64 DLL probe reproduced
`TypeError: stream.WriteAsync is not a function` after successful CreateFileAsync
and OpenAsync. The failure path deleted the new copy. The binary writer now
requests `GetOutputStreamAt(0)` from IRandomAccessStream, writes and flushes that
IOutputStream, then attempts cleanup of both projections. Its mocked parent
stream deliberately has no WriteAsync/FlushAsync. A new regression verifies that
failure acquiring the output still closes the parent where supported and removes
the new file. No fallback to unbounded FileIO or mobile plugins was added.

The updated source passed actual WinRT write/read round trips for a 70,000-byte
offset view spanning two write chunks, an empty byte view, and repeated names
that produced distinct paths. Unicode/CRLF text writes round-tripped unchanged.
After files.release, the owned text file was absent; a foreign task fixture
remained readable. Release completion was checked after native async pumping,
then independently checked through StorageFile.GetFileFromPathAsync. The binary
fixtures were explicitly deleted by the probe. All use canned data. Logs:
`research/windows61/windy-native-write-missing-method.log` (reproduction) and
`research/windows61/windy-native-write.log` (final success, exit 0, both explicit
write and release success markers).

The probe supplies an actual StorageFolder for the task's scratch directory in
place of ApplicationData.Current.TemporaryFolder. All other file, stream, buffer
and async operations use the real projection. This qualifies that folder's
I/O and owned-release behavior, **not** packaged app identity or the app's
TemporaryFolder. Production imports, packaged WinUI integration, cancellation,
partial-write/flush-failure injection and deterministic stream cleanup remain
unqualified. No native build/install/package registration/app launch occurred.

The write probe initially failed during setup because its top-level Windows
binding collided with the runtime global. Wrapping the inlined implementation
in a local function fixed the probe. A release-polling attempt also found no
setTimeout in the bare runtime (the normal app obtains timers through core);
the final probe uses host-driven phases and pumps native completions. Neither
setup error is evidence of a file-service failure or pass. The probe now checks
the initial JavaScript diagnostic before the completion assertion.

The task-owned runner on windy is `native-write-probe.ps1` beside the earlier
probe files. Repeat under the same device reservation:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows file-write probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-write-probe.ps1'
```

The final focused Turbo suite passed all seven file tests, 20 mocked contracts
in total (exit 0). Its result is recorded separately from the native probe in
`research/windows61/windy-output-stream-contracts.log`. Broad package checks and
all exact deferred commands above remain deferred. No evidence-gated issue row
or recipe target is closed by this subset.

## Native Windows Credential Locker candidate

Common session persistence is the next everyday-service gap after file I/O.
The shared hosted-auth adapter calls secureStorage from persist/readStoredCredentials;
`packages/app/src/Services.macos.tsrx` is also an existing service harness. There
is no Windows-specific sign-in example to qualify. The audit selected the
mobile secure-storage plugin on Windows. A new Windows root export condition
and leaf now avoid that import and use the OS PasswordVault API, without adding
dependencies. Package/typegen manifests include the dedicated root; public
Service<SecureStore> types remain shared.

The leaf requires actual package identity and uses package family in its resource
namespace; it reports unsupported without identity or credential classes.
Availability constructs the vault but does not promise access policy success.
Keys and values are JSON strings internally so empty strings and control
characters survive WinRT's nonempty credential fields. A missing item returns
null and removal of an absent key succeeds. Other reads reject with the fixed
message `Credential Locker read failed`; writes/removals return false. Native
error text, keys and values are never forwarded or logged. A read-only probe of
a fresh absent task key found Error.message ending in `(HRESULT 0x80070490)` and
no numeric code/hresult field; the leaf recognizes only that missing-item suffix.
Unexpected failures do not masquerade as absence. This is alpha.144-specific
bridge evidence, not a general WinRT error-serialization guarantee.

The same existing x64 DLL passed actual PasswordVault operations in isolated
short-lived processes: missing get/remove, overwrites, empty keys and values,
Unicode/NUL/CRLF strings, two separate resource namespaces, and named removal.
The final probe removed every created test entry in a finally block and verified
all were absent, printing only roundtrip/cleanup status markers. It did not
retrieve or enumerate unrelated vault entries. Log:
`research/windows61/windy-native-vault.log`, exit 0. The earlier read-only error
shape log is `research/windows61/windy-native-vault-projection.log`.

The probe substitutes fresh task family names for Package.Current identity;
credential classes and all vault operations are actual WinRT projections.
Consequently real packaged identity, cross-launch persistence, account roaming,
locked/access-policy failures and production import/app integration remain
unqualified. Package family prevents accidental resource collisions, not access
by other desktop apps. Microsoft's [PasswordVault contract](https://learn.microsoft.com/en-us/uwp/api/windows.security.credentials.passwordvault)
allows regular desktop apps to access other user lockers; [Credential Locker](https://learn.microsoft.com/en-us/windows/apps/develop/security/credential-locker)
can roam entries under Windows/account policy. The 20-entry limit applies to
AppContainer apps per the [Add contract](https://learn.microsoft.com/en-us/uwp/api/windows.security.credentials.passwordvault.add).
No local-only or isolation guarantee is added by this adapter.

Five mocked Windows regressions passed in the existing isolated Turbo fixture
(25 focused tests total, exit 0), covering Node's Windows export resolution,
unavailable hosts, string/replacement/missing semantics, package namespaces,
malformed values and sanitized failures. No mobile module is allowed to load in
the adapter fixture. These are mocked host contracts, except that the root-path
assertion invokes Node's actual conditional resolver. Log:
`research/windows61/windy-vault-contracts.log`. Native probes inline the leaf
and a minimal UnavailabilityError after removing imports; they do not exercise
production bundling. The task-owned `native-vault-probe.ps1` remains beside the
other windy runners and can be repeated under the device reservation:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"Focused Windows credential probe"}' -- ssh windy 'powershell -NoProfile -File C:/Users/alecs/dev/octane-windows61-checks-88a67da/native-vault-probe.ps1'
```

Full maintained package checks remain deferred, including:

```sh
pnpm exec turbo run test:windows --filter=@octane-xplat/secure-storage
pnpm exec turbo run test:packed --filter=@octane-xplat/secure-storage
pnpm exec turbo run typecheck --filter=...@octane-xplat/secure-storage
```

A Turbo dry run also resolved only secure-storage#test:windows with no
dependency tasks; the dry run executed no tests. The focused task is now included in
this package's existing packed-test script. No native build, install, app launch,
package registration or visual work ran. Public guide, package README, service
skill and release note describe the subset. The passkey-sign-in recipe excludes
Windows, and hosted auth remains unavailable; this does not qualify that workflow
or add a Windows recipe target. No shared audit snapshot was regenerated and no
evidence-gated issue row is closed.

## Windows UI declaration entrypoint reconciliation

The Windows root package export added by the import foundation work was missing
from the UI declaration target's explicit runtime/types lists. Both Windows paths
are now declared alongside the existing variants. The TypeScript project's
`src/*.ts` include already includes index.windows.ts, and the shared public
exports remain unchanged. This reconciles the maintained manifest; it does not
prove declaration generation or the package consumer graph. UI typegen,
pack-check, dependent checks and native app verification remain deferred:

```sh
pnpm exec turbo run typegen --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
```

A targeted JSON parse/path comparison checked that the Windows runtime/types
paths match package.json and that the source entry exists. No broad generation
or new test suite ran for this manifest-only change.

## Windows controlled-text selection candidate

The common text-write helper preserved only Android selections; Windows reached
the plain write path. Pinned core `abae298` assigns TextBox.Text without selection
restoration in TextBase._setNativeText. This is source evidence of missing
preservation, **not** an OS reproduction of a cursor jump. The form example
`apps/astryx-sandbox/src/examples/dialog/DialogFormDialog.tsrx` controls both
TextInput and TextArea values; SearchInput, date/time inputs and composer paths
also call this helper. Assume ordinary mid-string editing deserves priority
over specialist integrations. Existing examples already use the shared API and
need no source change; they are not Windows runtime passes.

A Windows-only text-write leaf now snapshots SelectionStart/SelectionLength and
calls TextBox.Select after changed controlled writes. It clips the range after
shrink, skips unchanged values, retains synchronous echo suppression through
nested writes, and avoids restoring an old selection after native identity or
text was changed reentrantly. Secure/absent/invalid selection surfaces take the
plain guarded write path. Selection restoration failure does not discard an
accepted value; text setter failures still propagate and clear the guard.
Public exports and signatures match the default leaf. No shared component,
renderer, core patch, lockfile or external dependency changed. API reference:
[WinUI TextBox.Select](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.textbox.select)
and [SelectionStart](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.textbox.selectionstart).

Six projected-host regressions passed on windy through the existing isolated
Turbo fixture: range/caret retention and echo suppression; shrink/UTF-16 bounds;
secure/missing/invalid surfaces; write/selection failures; native replacement;
and nested writes preserving the latest value. The full focused fixture passed
31 mocked contracts, exit 0. Log:
`research/windows61/windy-text-write-contracts.log`. These evaluate transpiled
source against a fake TextBox whose write resets selection; they do not execute
a real WinUI TextBox, import the production UI root or transform hooks. No native
UI process, OS keyboard input, screenshots or build was used for this batch.

The maintained native UI task includes the new regression. Targeted lint,
format, syntax and whitespace checks passed. UI typegen, native suite,
package/dependent checks and Windows app verification remain deferred at the
exact commands above. Real selection projection/lifecycle, IME, secure input,
OS focus and form/modal keyboard behavior remain unqualified. Keyboard bridging
still needs shared core native-event ownership (TextField already owns a KeyDown
subscription for submit); this helper does not supply that bridge or close the
focus/keyboard checklist. The form/overlay recipe exclusions remain unchanged.
This fixes an unreleased Windows candidate, so no additional release note was
added. Public Windows guidance and the primitives skill record the boundary.

## Windows raw key-event prerequisite

The pinned Windows View had no keyDown/keyUp notification bridge. The driver
maps onKeyDown to keyDown, while TextField already owns a native KeyDown
subscription for submit. The preview-core patch now adds a dedicated raw key
module and Windows View lifecycle calls, reusing the shared event subscriber.
Each channel attaches only while loaded and observed. Removing one leaves the
other and TextField's submit owner intact. Unload/dispose/native replacement
retire callbacks; late callbacks, disabled targets and stale identities do not
forward. Once-handler removal is reconciled after Observable.notify returns.
Cleanup tries every owned channel, and base unload/dispose still runs if detach
fails. Retained source and published-file integration delta:
[windows-keyboard](../../patches/windows-keyboard/README.md).

```ts
// Windows-native core event shape; this is not the portable UI KeyboardEvent.
view.on('keyDown', (event) => {
  if (event.nativeEvent.Key === Windows.System.VirtualKey.Enter) event.preventDefault()
})
```

Subscriber priority makes raw callbacks run before submit in either registration
order. Ordinary pointer/input subscribers retain priority zero and their prior
relative order. A weak event marker records only explicit consumption by this
bridge; TextField consumes that marker before raising returnPress. A native
Handled flag by itself does not alter the earlier submit behavior. This also
allows a once-handler to consume Return after Observable removes it. Portable
key naming/code/modifier/composition normalization is still missing, so the
public useKeyboard hook deliberately remains unsupported on Windows. Raw core
notification is a prerequisite, not qualified menu/dialog keyboard support.

Twelve new mocked key regressions and all 19 retained pointer regressions passed
on windy in an isolated Turbo task (31 total, exit 0). They cover both key
channels, independent removal, submit sharing, registration order/cancellation,
prehandled legacy behavior, once-handlers, disable, unload/reload/replacement,
disposal during dispatch, failed registration rollback and cleanup failures.
The key suite evaluates the actual published helper and extracts the affected
View/TextField methods with TypeScript's parser into a fake base. It does not
instantiate the full class, NativeScript renderer, WinUI controls or WinRT event
projection. The pointer suite reads the unchanged gesture body plus the updated
subscriber. Log: `research/windows61/windy-keyboard-pointer-contracts.log`.
Earlier 8/10-case runs are superseded by the final combined result.

The canonical patch's seven affected Windows targets were reverse/reapplied
against copied exact published preimages, whose original blob hashes matched
the prior canonical patch; the result matches the tested
candidate byte for byte. Every other patch section was compared byte for byte
and is unchanged. To respect the no-install boundary, no pnpm patch/patch-commit
or dependency install ran: targeted published-file diffs were generated from
those private copies. The authored helper was syntax-transpiled to ES2021, not
built with the package. The generated patch-package copy, manifest explanation,
workspace metadata and lockfile hash are synchronized; pnpm check:patches passed.
The lockfile changes only substitute the preview-core patch hash. Final SHA-256:
`f6bf77c513902a1106ad9d22f8efe024c80f0ae0a5bc3ab6e3e5fec643ef82e2`.
Installed dependencies and the Windows app still have the earlier patch.

The new focused task has no build dependencies (confirmed by Turbo dry run), is
uncached, and accepts WINDOWS_CORE_ARTIFACT for private candidate files. The
retained pointer test accepts the same override. The task-owned remote fixture
is `C:\Users\alecs\dev\octane-windows61-checks-88a67da\core-keyboard`; its Turbo
task is test:keys. The maintained default task and frozen adoption are deferred:

```sh
pnpm install --frozen-lockfile
pnpm exec turbo run test:keyboard --filter=@xplat/windows
pnpm exec turbo run typecheck --filter=...@octane-xplat/cli
pnpm exec turbo run typecheck --filter=...@octane-xplat/patches
pnpm exec turbo run typecheck --filter=...@xplat/windows
pnpm exec turbo run build:windows --filter=@xplat/windows
```

After authorized adoption/build, qualify real KeyDown/KeyUp projection, repeated
keys, consumed Return, modifier/IME handling, secure replacement, focus/window
transitions and event teardown in the packaged app. No install/build, OS input,
UIA, screenshot or app launch ran for this batch. Existing shared forms and
menus are the demand assumption; key-bridge prerequisites take priority over
niche integrations. The keyboard-clipboard/shared-overlays recipes still exclude
Windows, and no acceptance criterion or issue checkbox was closed. This is an
internal prerequisite for an unreleased Windows API, so no release note was
added. The primitives skill warns against advertising portable support early.

## Windows floating-layer backend selection

Windows previously resolved useLayer to use-layer.tsrx, which requires the
AppKit showLayer bridge. The NativeScript implementation was only available in
the mobile leaf, excluded from the Windows suffix chain. The new Windows leaf
adopts that existing implementation: anchored presentation uses Popover, while
fixed/custom surfaces use the declaring RootLayout and native portal. At commit
`4809eba88`, its body matched the retained mobile implementation exactly except
for its platform comment; public exports and signatures match. The focus-return
work below adds an explicit Windows host getter. No new engine/dependency or
AppKit bridge emulation was added. Mobile and AppKit source files are unchanged.

`apps/astryx-sandbox/src/examples/layer/LayerHookUsage.tsrx` supplies the concrete
demand: a trigger ref, show/hide and an anchored layer body. Assume this basic
popup flow matters before specialist integrations. It already uses the shared
API, so no example edit is needed. Its Windows runtime behavior is not qualified.

A minimal Vite resolver diagnostic passed seven path checks plus a body
comparison (exit 0): Windows selects use-layer.windows.tsrx; iOS and Android
retain use-layer.mobile.tsrx; Windows resolves Popover, root-layout, native-portal
and platformProps to their existing NativeScript defaults. The extension arrays
were evaluated from the actual CLI nativePlatformExtensions function with an
explicit target. Vite's resolver came from the existing UI toolchain, with
config-file loading disabled. No server, browser, dependency scan, transform,
full preset/import graph or UI was started. Log:
`research/windows61/layer-backend-resolution.log`.

Targeted TSRX formatting/lint, unchanged-body comparison, UI web-barrel check and
whitespace checks passed. No new low-impact mirror test was added for the source
adoption. Existing use-layer.mobile object-driver tests and full Windows
transform/declaration/import/app checks remain deferred with the UI commands
above; the minimal resolver is not production evidence. RootLayout ownership,
geometry, RTL/resize, controlled/context updates, nested dismissal, keyboard/IME
and focus still require Windows checks. No recipe target or evidence-gated
checkbox was closed. The Windows guide and primitives skill state the boundary.

A neutral shared extraction was investigated, but lint requires a supported
renderer boundary and the AppKit default has separate ownership. The final
change is a Windows-specific leaf. No lint rule was weakened and no inactive
placeholder sibling was introduced. Keep the two NativeScript implementations
aligned when their common logic changes. This is an unreleased Windows backend
repair, so no additional release note was added.

## Windows layer focus-return candidate

The Windows suffix chain also selected the default AppKit layer-keys helper.
A dedicated Windows leaf now captures the declaring XamlRoot's focused control
and returns a best-effort restore callback. The existing dismissal stack calls
it only for the retiring top layer when restoration is enabled. The helper
owns no listeners or subscriptions, so skipped restoration needs no cleanup.

Popover passes its anchor as getHost; the Windows fixed-layer backend passes
its declaring sentinel. These are ownership inputs already used by dialogs and
sheets, not a new public API. An explicitly supplied but unattached host never
falls back to the primary window. Without a host, the explicit target's root or
Application root can provide the owner. The latest explicit target is read at
restore time and may be a NativeScript view or a public handle containing it.

Restoration requires a visible root, an Activated InputActivationListener for
that root's AppWindowId, and an attached/enabled control still in the same root.
A host moved to another root, foreign target, retired projection or missing
activation/focus API skips restoration. The helper calls Focus(Programmatic);
it never calls a window-activation API. It does not read text or credentials.
See Microsoft's [root-scoped focus lookup](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.input.focusmanager.getfocusedelement?view=windows-app-sdk-1.8)
and [activation listener](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.input.inputactivationlistener?view=windows-app-sdk-1.8).
Use the explicit metadata name GetFocusedElementWithRoot: relying on generic
overload dispatch risks the zero-argument lookup on older projections. Its
presence, XamlRoot proxy identity and InputActivationListener behavior still
need qualification in the pinned native host; missing APIs fail closed.

Nine maintained mocked contracts passed on windy through a new isolated Turbo
test:focus task, exit 0. Its dry run has one task and no dependency builds.
They cover root capture, latest view/handle targets, absent hosts versus
unattached hosts, hidden/inactive windows, foreign/moved roots, unloaded/disabled
controls, missing APIs and throwing proxies/getters. The Windows source is
transpiled and executed against mocked imports; no actual FocusManager, native
control, window, OS input, UIA or renderer ran. Log:
`research/windows61/windy-layer-focus-contracts.log`.

The minimal resolver diagnostic also selects layer-keys.windows.ts and confirms
that the Windows layer backend differs from mobile only in its platform comment
and declaring-host getter (eight path checks plus comparison, exit 0). Log:
`research/windows61/layer-focus-resolution.log`. Targeted formatting/lint, UI
barrel synchronization, recipe structure and whitespace checks passed.

The test is registered in UI test:native. The full suite, package/dependent
typechecks, Windows build and app checks remain deferred at the commands above.
After authorized native adoption, check ordinary and nested close, explicit
finalFocusRef replacement, removed/disabled controls, owner-window changes,
inactive/secondary windows and no foreground activation. Initial focus, Tab
containment/background exclusion, Escape, IME and production overlay behavior
remain separate gaps. This is an unreleased Windows fix; no new release note or
supported recipe target was added. No evidence-gated issue checkbox was closed.

## Windows headless scroll observation

The basic ScrollableArea component already resolves to Mason's scroll shell;
the existing Windows offset helper uses its scrollTo surface. No substitute
ScrollViewer engine was added. Demand assumptions come from the six-row notes
viewport in ScrollableAreaShowcase and the shared 24-row ScrollBoxDemo. Their
source is unchanged and is not a Windows runtime pass.

The default headless hook measured scroll and viewport layout, but its content
getter only forwarded a ref. Source inspection found no content-layout
subscription, so content growth without viewport resize could leave edge state
stale until another observed event. This is a source gap, not a new OS-level
reproduction. A Windows-only hook now composes scroll, viewport/content layout,
and load/unload props through the existing native driver event path, following
the retained AppKit observer pattern without changing its files.

The leaf samples Mason's scroll/client sizes and offsets in layout units,
normalizes non-finite geometry and uses the shared clamped edge-state helpers.
It updates the snapshot before forwarding caller callbacks and avoids redundant
state writes. Refs and caller props are preserved; callbacks read the latest
options. Foreign retired-host events are skipped. Detached/unloaded or failed
geometry resets to a neutral edge state; a later load remeasures. It owns no
manual listeners. Axis filters state; caller dimensions/orientation still
configure scrolling. Keyboard access, overscroll chaining and sticky
containment remain inert; logical/RTL behavior is not newly qualified.

Eight maintained source-logic contracts passed on windy through isolated Turbo
test:scroll, exit 0. Its dry run contains one uncached task with no dependencies.
The tests cover growth/shrink without viewport resize, callback timing and
composition, latest axis/handlers, nested refs, invalid/sub-unit ranges,
overscroll clamping, replacement/detach, unchanged-state coalescing, unmount,
late load and reload. They transpile the actual source and its shared state/ref
helpers, with scripted hook slots and fake view metrics. They do not run the
Octane compiler/renderer, Mason engine, native events or any OS input. Log:
`research/windows61/windy-scrollable-area-contracts.log`.

The regression is registered in UI test:native. A minimal resolver diagnostic
passed five paths: Windows selects its dedicated hook and shared state/ref
helpers; iOS/Android retain their default hook. An AST comparison confirms
matching public generic parameters, arguments and result type. Log:
`research/windows61/scroll-observer-resolution.log`, exit 0. Targeted lint/format,
barrel/recipe and whitespace checks passed. Full UI and
dependent checks, native build/app and package gates remain deferred at the
commands above. Native qualification must check actual content-only growth,
resize, edge notifications, callbacks and renderer updates, retention/reload,
wheel/touch/keyboard scrolling, both axes, RTL, zoom/scaling and teardown. The
Windows guide and primitives skill state the current subset. Existing
platform-leaves/shared-overlays/keyboard-clipboard recipes still exclude
Windows; no criterion, audit snapshot or evidence-gated checkbox was changed.
This is an unreleased Windows hook repair, so no new release note was added.

## Windows picker host prerequisite review

The existing generated test project on windy references
Microsoft.WindowsAppSDK 1.6.250205002. This was a read-only project-file check,
not a regenerated current project or runtime picker test. The inspected
NativeScript Windows source template also names that version, but its source
cache is not proof of the installed binary's internals.

Microsoft's [current picker guide](https://learn.microsoft.com/en-us/windows/apps/develop/files/using-file-folder-pickers)
requires App SDK 1.8 or later for Microsoft.Windows.Storage.Pickers. Its
WindowId constructor cannot be assumed present in this existing 1.6 artifact.
The older Windows.Storage.Pickers classes require the actual owner's HWND via
[IInitializeWithWindow](https://learn.microsoft.com/en-us/windows/apps/develop/ui/display-ui-objects).
Constructor-time console-window association in inspected runtime source does
not establish correct WinUI owner/modality or multi-window behavior; it was not
verified against the pinned DLL. No qualified owner-initialization bridge is
available in this task's evidence yet.

Therefore pick/pickMultiple and user-directed export retain their explicit
unavailable results. No SDK/package upgrade, install, host change, picker launch
or OS automation was performed. The existing FileInputDemo asks for image/* and
PDF attachments; that remains the demand assumption. Opening a legacy picker
without its owner or adopting a newer namespace without its SDK would not
complete that workflow. After authorized host work, qualify single/multiple
selection, filters, cancellation versus failure, window ownership, read/retain
of selected paths and absence of deletion of external files before enabling it.

## Windows app metadata candidate

The native default app-info module imports the iOS subpath and returns
unsupported outside Android/iOS. A Windows leaf now avoids that foreign import
and reads Package.Current.Id lazily. bundleId is Id.Name, version retains all
Major.Minor.Build.Revision components, and build is the literal Build field.
Unpackaged/missing hosts return unsupported/null metadata. Usable identity can
remain available when its version fields are absent, invalid or unprojected;
those fields stay null. Reads are not cached across startup failures.

The existing Services.tsrx readout displays appInfo.supported/version/build/
bundleId. That is the concrete demand assumption for About/support metadata;
it needs no example workaround. It was reviewed as source, not run on Windows.
The shared AppInfo type and public import paths are unchanged. Microsoft's
[Package.Current contract](https://learn.microsoft.com/uwp/api/windows.applicationmodel.package.current)
requires package identity; its [PackageVersion fields](https://learn.microsoft.com/en-us/uwp/api/windows.applicationmodel.packageversion)
provide the four numbers. There is no fallback to CLI settings, browser host
metadata, assembly versions or mobile APIs.

Four projected-host contracts passed on windy through the isolated uncached
Turbo test:app-info task (one task, no dependency builds, exit 0). They cover
lazy startup/retry, exact names and version components including zeros,
unavailable/error hosts and partially usable metadata. A minimal Vite resolver
using the current CLI extension function and package manifest passed nine
root/subpath/relative-path checks across Windows/iOS/Android; an AST comparison
confirms the same AppInfo annotation and four getters. No server, full preset,
production import graph, dependency scan or transform ran. Logs:
`research/windows61/windy-app-info-contracts.log` and
`research/windows61/windy-app-info-resolution.log`.

A resource-reserved standalone x64 native DLL check passed the unpackaged
unavailable contract, exit 0. Win32 GetCurrentPackageFullName independently
confirmed APPMODEL_ERROR_NO_PACKAGE (15700). The actual preview projects
Package.Current as undefined in this host; the adapter returned false and all
null fields. An initial diagnostic expected a propagated WinRT no-package
HRESULT and stopped before adapter assertions when that assumption was not
met. The final check verifies process identity independently and preserves the
adapter's required false/null assertions. These are unavailable-host results,
not packaged metadata evidence. The DLL remains alpha.144 with SHA256
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C. Logs:
`research/windows61/windy-native-app-info.log` (initial diagnostic failure) and
`research/windows61/windy-native-app-info-unpackaged.log` (pass). No app or UI
was launched, no package identity was fabricated, and metadata values were not
logged.

The existing windy formatter 0.1.0 formatted the two source/test files. Current
0.1.1 formatting and targeted lint could not start from the shared local
installation: @alloc/cmd-ts and picomatch were missing. No dependency install or
shared repair was performed. The local changelog check also could not start
because this worktree lacks yaml. The same current checker and all 14 pending
source notes passed in a private windy snapshot using existing dependencies,
exit 0. The first transfer included macOS AppleDouble files and failed; the
final archive contains every actual source note and no generated transfer
metadata. Logs: `research/windows61/windy-app-info-notes-check.log` and
`research/windows61/windy-app-info-notes-source-check.log`. Recipe structure
passed. The canonical changelog check subsequently passed (see connectivity
follow-up below). Exact remaining commands in the canonical workspace:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run build --filter=@xplat/docs
```

Native packaged names, all version-field projections, app startup/integration,
architecture coverage, current declaration/packaged-consumer behavior and
Windows builds remain unqualified/deferred. A release note, service guide and
agent guidance record the subset. The platform-leaves recipe still excludes
Windows; no supported recipe target, shared audit snapshot or evidence-gated
checkbox changed. Hosted auth and deep-link activation remain separate gaps.

## Native connectivity ownership and Windows bridge checks

The existing core Windows connectivity implementation was inspected before
replacing it. Its actual read, NetworkStatusChanged registration and removal
passed in the resource-reserved alpha.144 x64 DLL, exit 0. A second check
matched its sampled connection classification against managed WinRT and checked
that a connected reference profile was not returned as none. No network
connection was changed or status-change delivery forced. The module body was
transpiled from installed core 9.1.4-next.0, SHA256
36e50258bca3bed7a7bde8d44c0cfeede63074158cd52786aa572789ce553a77.
The host supplied an identity zonedCallback shim; this did not import the full
NativeScript application. The DLL hash is unchanged from the earlier probes.
Logs: `research/windows61/windy-native-connectivity-core.log` and
`research/windows61/windy-native-connectivity-reference.log`. These checks do
not qualify app integration, event delivery, every adapter type or reconnect.
The one-argument asDelegate form works here; no core delegate patch was needed.

Before reusing that backend for Windows queries, seven lifecycle regressions
all failed against the retained previous platform connectivity source. They
now pass against the repair in the isolated windy Turbo test:network-owner
fixture, exit 0, one uncached task and no dependency builds. The tests run the
actual TypeScript module with a fake NativeScript Connectivity object. Each
registration owns its callback even when callbacks repeat; failed initial
reads/callbacks and partial native startup roll back. Dispatch skips removed
callbacks and does not deliver an extra initial event to newly added readers.
Reentrant startup shares one monitor; teardown is idempotent. A failed rollback
preserves the original startup error. Log:
`research/windows61/windy-connectivity-lifecycle-contracts.log` (expected
baseline failures and final seven-pass run kept together).

This repair changes the shared NativeScript default used by iOS/Android and
Windows; separate AppKit/browser leaves are unchanged. The initial module
shipped in stable tags containing b24fdf3 (including v0.10.0), so a fix note was
added. Public docs and service guidance show independent teardown. Recipes
retain their existing target scope. NativeScript iOS/Android and real Windows
subscription/transition behavior, full platform/dependent tests/typechecks,
consumer/declaration checks and app builds remain deferred at the existing
commands; this is not a Windows workflow qualification.

The shared local tooling dependencies are available again. Current formatter
and targeted lint checks now pass for the changed connectivity/environment
files and tests, plus the earlier Windows app-info source/test. Earlier
missing-dependency attempts remain recorded; the app-info formatter/lint debt
is cleared. Recipe structure and whitespace checks passed. No dependency
install or shared installation repair was performed by this task.

## Windows connectivity and default query environment

The Windows environment manifest selected the browser implementation and its
browser declarations, even though query-cache.ts imports this entry by default.
It now selects the native environment and native declarations. The concrete
demand is the maintained shared-query-data.ts session workflow and the Services
network readout. Assume server-backed lists, reconnect and background polling
matter before niche integrations. Services now displays an unavailable binding
as network unknown, rather than offline; no app render was run.

The published core profile parser returns none for unrecognized adapters. This
is source evidence, not a reproduced unknown-adapter OS failure. The Windows
leaf keeps the proven core status-change channel but supplies a fresh WinRT
profile-level reader. Missing profiles/None are known offline; local, constrained
and internet access permit work independently of the transport label. Only
recognized Wi-Fi, mobile and Ethernet are labeled; unknown transports remain
online when connected. Missing/malformed/throwing projection reports supported
false, which the environment maps to online undefined so queries may run. The
reader does not claim HTTP reachability. Microsoft's
[connection-level contract](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkconnectivitylevel)
and [profile contract](https://learn.microsoft.com/en-us/uwp/api/windows.networking.connectivity.networkinformation.getinternetconnectionprofile)
support those distinctions.

The repaired subscription ownership is extracted into a small dependency-free
helper shared by the default and Windows leaves. NativeScript imports remain
inside those leaves; separate browser/AppKit implementations are unchanged.
An unavailable initial Windows binding publishes its unknown snapshot without
attaching the core monitor. Native environment teardown now suppresses queued
callbacks, remains idempotent and removes app listeners even if network teardown
throws. Windows Application source derives suspension from window visibility;
this is not per-window keyboard activation. No lifecycle policy was changed.

The final isolated windy Turbo test:windows-network task passed all 17 contracts,
exit 0: seven generic subscription ownership, four Windows SDK-state groups and
six Windows environment composition/resolution groups. Actual source modules
run with fake Core/WinRT objects. Node condition resolution checks actual
manifest paths for Windows runtime/types and unchanged web/macOS/iOS selection;
it does not load generated declarations. The task is uncached, with one task
and no dependency builds. Log:
`research/windows61/windy-windows-network-contracts-final.log`. Before the
teardown guard, two of the original five environment contracts failed; the
retained baseline/candidate log is
`research/windows61/windy-environment-contracts.log`.

A resource-reserved standalone alpha.144 x64 DLL check ran the actual Windows
reader body after type stripping/import substitution and matched supported,
online and transport against a separately sampled managed WinRT reference,
exit 0. No identity/network details were logged. DLL SHA256 remains
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
Log: `research/windows61/windy-native-connectivity-state.log`. This verifies
one sampled native state, not every connectivity level/adapter. No network
change, HTTP request, app bootstrap, query execution or native lifecycle event
was performed. Core status-change delivery still needs qualification.

Current targeted formatting/lint and whitespace checks passed. Recipe structure
passed; canonical release-note validation passed all 16 notes using a temporary
link to existing yaml, removed immediately afterward. No install or dependency
repair occurred. This also clears the earlier app-info local changelog debt.
Public services/query guidance, agent guidance, a release note and the maintained
Services example distinguish unknown state and experimental Windows support.
Reviewed recipes keep their existing targets; Windows coverage/verification was
not inserted into another target or inferred from these contracts. Shared audit
snapshots and issue checkboxes are unchanged.

Full package/dependent tests, declarations, packed consumers, native app and docs
builds remain deferred. Relevant exact commands, including the touched example:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@xplat/app
pnpm exec turbo run build --filter=@xplat/docs
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Real reconnect/disconnect delivery, suspend/resume across multiple windows,
query pausing/refetch/polling in a Windows app, packed source resolution, all
architectures and native dependency patch compatibility remain unqualified.

## Windows keep-awake candidate

The existing Windows leaf returned false for every operation. It now uses
Windows.System.Display.DisplayRequest with one owned request shared by a
set of independent tags. The maintained examples/keep-awake/ReadingScreen.tsrx
supplies the concrete reading/presentation demand; its shared hook and source
are unchanged. This everyday capability follows the earlier common-flow/input
prerequisites; actual keyboard/focus/overlay qualification still requires the
deferred core adoption and app checks. No new engine, dependency or permission
was added, and AppKit/GTK/mobile leaves are unchanged.

Creation, RequestActive and RequestRelease run through the core's direct
Utils.dispatchToMainThread channel and a serialized operation queue. This avoids
relying on the core isMainThread heuristic, whose missing-queue fallback is true.
The published core 9.1.4-next.0 Windows helper forwards dispatch to
__nsRunOnUIThread; source SHA256
0F4FE51C9FFAB4881670DAA0142CD2F9DAE53D287FEAC747D463EAC485CBA527.
Log: research/windows61/windy-core-mainthread-helper-source.log. This is source
inspection of the available published artifact, not proof of actual app-thread
execution. The same installed application source emits exit after its last
registered window closes or on the host Exit notification, rather than every
window close (research/windows61/windy-core-application-exit-source.log).
Microsoft's [DisplayRequest contract](https://learn.microsoft.com/en-us/uwp/api/windows.system.display.displayrequest)
identifies the object as non-agile and requires matched release calls.

Duplicate tags do not multiply native requests. Background activation accepts
ownership while isActivated remains false; suspension releases the held object,
resume retries requested tags, and exit releases all owners. Failed release
retains the request for cleanup retry. Failed resume can retry the existing tag
rather than treating it as already held. Listeners detach on final cleanup and
partial setup failure; retired lifecycle callbacks remain inert even after a
new ownership cycle starts. The shared type comment now includes background
deferral; exported types, names and method signatures are unchanged.

The isolated windy Turbo test:windows-keep-awake task passed 12 contracts,
exit 0: 11 new Windows ownership/lifecycle/failure/serialization groups and the
existing macOS tag-set regression containing the Windows unavailable-host check.
The latter now supplies missing-host import mocks to the implemented Windows
leaf. Other tests in that file were filtered out, not run. The dry task has one
uncached task and no dependency builds. Source executes with mocked Core/WinRT
and a controlled UI-dispatch queue; it does not prove OS thread affinity,
activity, power grants or lifecycle delivery. Log:
`research/windows61/windy-keep-awake-contracts-final.log`.

A resource-reserved standalone alpha.144 x64 DLL check constructed DisplayRequest
and verified RequestActive/RequestRelease method projection, exit 0. It did not
call either method, create a power request, launch UI, change timeout settings or
wait for sleep. DLL SHA256 remains
748D95864AC032DE2D1BB69FEC1E5B2CDD393BAA1671E349AA670160AA66D47C.
Log: `research/windows61/windy-native-keep-awake-construction.log`.

Targeted current formatter/lint, whitespace and recipe structure passed.
Canonical release-note validation passed all 17 notes using the temporary link
to existing yaml, removed after the check. Public keep-awake target limits,
agent services guidance and a release note describe the candidate and preserve
the physical-evidence boundary. The maintained reading-screen example already
uses the shared hook, so no platform workaround or example edit was needed.
Existing recipe scopes are unchanged; no Windows qualification was inserted
under another target, no shared audit snapshot was regenerated and no issue
checkbox was closed.

Exact deferred package/app checks remain:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run build --filter=@xplat/docs
pnpm exec turbo run build:windows --filter=@xplat/windows
```

Native app UI-thread dispatch, successful grants/releases, multiple-window
suspend/resume, packaged/unpackaged hosts and architectures remain unqualified.
Physical display sleep prevention and ordinary sleep after final cleanup need
separate human-authorized power/lifecycle checks. Constructor/method presence
and fake dispatch do not close the keep-awake issue item.

## Authorized native qualification: adoption and first typecheck

The human approved the bounded native pass with "ok go": isolated dependency
adoption, Windows harness build, and nonvisual text/keyboard, modal focus/Escape
and scrolling checks. This permission supersedes the earlier deferral for that
phase only; no screenshot/image analysis is authorized.

The laptop's existing checkout has uncommitted Windows build work and was left
unchanged. A separate detached repository was materialized at
C:/Users/alecs/dev/win61-c905842a3 from local c905842a3 through a Git bundle,
using read-only object alternates to the existing repository. No branch, reset,
stash, push or merge occurred. Its app identifier is qualification-only
org.octanexplat.windows61, preserving the existing package and app data.
A frozen pnpm 11.24.0 install passed with lifecycle scripts disabled; required
generation subsequently ran through Turbo. Patch synchronization passed.
Log: research/windows61/windy-native-adopt.log.

The installed preview core now contains the canonical f6bf77c513902a1106ad9d22f8efe024c80f0ae0a5bc3ab6e3e5fec643ef82e2
repair. All 31 maintained keyboard/pointer regressions passed against those
installed files via Turbo test:keyboard, exit 0. This closes the earlier
installed-JavaScript adoption gap for that repair only; the tests still use
mocked native events and do not establish OS input, padding/Intl binary adoption
or app behavior. Log: research/windows61/windy-native-build.log.

The first standalone Windows typecheck failed with one TS2345: HumanQA passed
the expanded device.os union into a separate four-target QaTarget union.
QaTarget now derives from DeviceInfo['os']; existing per-check target arrays
are unchanged. The corrected standalone Windows typecheck passed in the retry:
37 of 38 executed Turbo tasks succeeded; the remaining task was the separate
native build. The latter failed its full kitchen-sink Vite boundary because
packages/audio/src/audio.ios.ts remained reachable. No app was produced or
launched by this attempt. Log: research/windows61/windy-native-build-retry1.log.

That build's upstream delegated checker still reported 12 foreign-root/context
errors across 11 files, including macOS focus-clock, Linux bridge imports,
Android Utils/AndroidApplication and web-host router type identity. It explicitly
continued under the existing configuration. The standalone pass is not a pass
for that delegated checker; no diagnostic policy was weakened.
