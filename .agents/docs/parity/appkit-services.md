# AppKit services implementation-or-decision (issue #78 §3)

Working log for the section-3 services rows of
[#78](https://github.com/octane-xplat/octane-xplat/issues/78). Each row is
either a real AppKit leaf behind the existing facade with maintained tests,
or an accepted desktop decision recorded in Silo and
`.agents/design/decisions.md`.

Bridge capability evidence, source-read: `@octane-xplat/platform/macos`
re-exports generated `macos-impl` bindings that dlopen every SDK framework
on import — EventKit, Contacts, MapKit, StoreKit, Speech, Photos, MetricKit,
Foundation (`NSBackgroundActivityScheduler`), UserNotifications,
AuthenticationServices and Vision all bind classes, structs, enum objects
and block signatures. `NSObject.extend` supports multi-argument delegate
protocols via `exposedMethods` (see `auth/src/apple.macos.ts`,
`platform/src/auth-session.macos.ts`); JS functions bridge as ObjC blocks
(`addObserverForNameObjectQueueUsingBlock`, `addOperationWithBlock`).

## Implemented

### openSettings pane routing — `platform/open-url.macos.ts`

`OpenSettingsImpl.open()` gains an optional `pane?: SettingsPane` hint
(shared type in `platform/src/types.ts`). AppKit routes through the public
`x-apple.systempreferences:<paneId>?<anchor>` URLs via `NSWorkspace.openURL`,
falling back to launching System Settings bare. Other platforms keep
`open()` (the hint is optional; they open their app-level page).

Runtime-verified on macOS 27.2 (local Mac): pane id
`com.apple.settings.PrivacySecurity.extension` with anchors `Privacy_Camera`,
`Privacy_Microphone`, `Privacy_Photos`, `Privacy_Contacts`, `Privacy_Calendars`,
`Privacy_Reminders`, `Privacy_LocationServices`, `Privacy_Bluetooth`,
`Privacy_Accessibility`, `Privacy_ScreenCapture`, `Privacy_AllFiles`,
`Privacy_FilesAndFolders`, `Privacy_ListenEvent`, `Privacy_SpeechRecognition`,
`Privacy_Media`, `Privacy_Automation`, `Privacy_HomeKit`, `Privacy_Motion`,
`Privacy_PasskeyAccess` — enumerated via AppleScript `anchors of pane` and
`reveal`; `x-apple.systempreferences:` URL open lands on the pane.
`localNetwork` has no verified anchor → maps to the privacy pane root.
`notifications` → `com.apple.Notifications-Settings.extension`,
`wifi` → `com.apple.wifi-settings-extension`,
`network` → `com.apple.Network-Settings.extension`,
`general` → `com.apple.systempreferences.GeneralSettings`.
AppleScript pane enumeration on `skymac.local` (arm64, macOS 26.6.2)
timed out — anchors verified on the local host only.

Tests: `platform/tests/open-url.macos.test.mjs` — 6/6 pass (pane URL +
app fallback covered).

### Calendar — `calendar/src/calendar.macos.ts` (EventKit)

Full `Calendar` facade over `EKEventStore`: `ensure` maps
`authorizationStatusForEntityType` (0/1/2/3/4) and requests via
`requestAccessToEntityTypeCompletion` (the bound entry point — metadata
targets macOS 11, `requestFullAccessToEventsWithCompletion` is not bound;
the deprecated API still performs the macOS 14+ full-access prompt).
Calendars, events (predicate query resolving `calendarWithIdentifier` for
`calendarIds`), get/create/update/delete with `EKSpan.ThisEvent`. Registers
`__xplatPermissionOwners.calendar` as `{getPermissions, requestPermissions}`
returning `PermissionResponse` — `getPermissions` is read-only
(undetermined/denied/granted), `requestPermissions` prompts via `ensure`.

Tests: `calendar/tests/macos.test.ts` — 5/5 pass; `test` script added.

### Contacts — `contacts/src/contacts.macos.ts` (CNContactStore)

Full `Contacts` facade: ensure/status (`CNEntityType.CNEntityTypeContacts`,
`requestAccessForEntityTypeCompletionHandler`), `getAll` via
`CNContactFetchRequest` + `enumerateContactsWithFetchRequestErrorUsingBlock`,
`getByName` via `CNContact.predicateForContactsMatchingName` +
`unifiedContactsMatchingPredicateKeysToFetchError`, `getById` via
`unifiedContactWithIdentifierKeysToFetchError`, add/update/remove via
`CNMutableContact` + `CNSaveRequest` + `executeSaveRequestError`.
Field keys map `ContactField` → `CNContact*Key`; `CNContactNoteKey` is
entitlement-gated and never requested (`note` populates only when
`isKeyAvailable` already reports it); `image` returns `{data: base64}`
when `imageDataAvailable`. Sort/page in JS mirroring iOS. Permission owner
registered with `PermissionResponse` shape.

Tests: `contacts/tests/macos.test.ts` — 4/4 pass; `test` script added.

### saveToGallery — `media/src/photo-capture.macos.ts` (Photos)

`capturePhoto({saveToGallery:true})` no longer rejects. After a successful
capture the leaf writes the temp file to Photos through
`PHPhotoLibrary.performChangesCompletionHandler` +
`PHAssetChangeRequest.creationRequestForAssetFromImageAtFileURL`, after
`authorizationStatusForAccessLevel(PHAccessLevelAddOnly)` — authorized
writes immediately, notDetermined requests via
`requestAuthorizationForAccessLevelHandler`, denial/failure warns and still
returns the shot (mirrors mobile best-effort semantics). `types.ts`
comment updated.

Also repaired a stale portion of
`media/tests/photo-capture.macos.test.mjs`: its `requireShim` predated the
files-package refactor (`files.macos.ts` now imports
`./file-pick-filter.macos`, `./file-types.macos`, `./file-bytes`) — added
stubs; the suite was broken on main before this task.

Tests: 9/9 pass including a new saveToGallery case asserting the add-only
write path.

### Background tasks — `background-tasks/src/background-tasks.macos.ts`
### (NSBackgroundActivityScheduler)

`defineTask`/`register`/`unregister`/`isRegistered`/`getStatus` over the
Foundation scheduler: identifier `xplat.background.<name>`, `repeats`,
`interval` = `max(minimumInterval ?? 3600, 60)`, `tolerance` = interval/2,
`qualityOfService` = NSQualityOfServiceBackground (0x09). The scheduled
block defers when `shouldDefer` or the executor is missing; TaskResult maps
to NSBackgroundActivityResultFinished(2)/Deferred(1). Honest limits:
interval is an OS-honored request, the app must be running (no
launch-on-event), and there is no native wake — this is in-process
deferrable maintenance, not a phone-style BGTask.

Tests: `background-tasks/tests/macos.test.ts` — 3/3 pass; `test` script
added.

## Boundary audit (§3 last row)

macOS bundle conditions are `['macos','native']` and `xplatBoundary('macos')`
fails the build when `.web`/`.android`-tagged files enter the graph
(`cli/src/vite.ts`). Full inventory of `.macos.*` leaves importing other
platform tags: only `ads/src/ads.macos.ts` (`./ads.web`) and
`sentry/src/sentry.macos.ts` (`./sentry.web`) — both production-breaking,
and `ads/index.macos.ts` also exports `BannerAd` from `BannerAd.web.tsrx`.
`updates` has no `macos` export condition → resolves `native` →
`index.ts` → `native.mobile.ts` imports `@octane-xplat/platform/android`
(`.android` tag) — also foreign.

Fixes: ads.macos becomes an explicit `supported:false` facade plus a
`BannerAd.macos.tsrx` stub reporting unsupported once (mobile monetization
surface — see decisions). sentry.macos becomes a real leaf (see below).
updates gains `src/index.macos.ts` (unsupportedClient) + a `macos` export
condition.

## Decisions recorded (Silo + `.agents/design/decisions.md`)

Numbers allocated in Silo before ledger writes:

- **#136 push**: APNs is real on macOS but requires `aps-environment` plus
  provisioned signing; ad-hoc builds always fail registration. Deferred to §4.
- **#137 updates OTA**: runtime needs `native.txt`/`fingerprint.txt`/`mode.txt`
  boot wiring and a staged-bundle redirect the host lacks (`host.m` evaluates
  `Resources/app/main.cjs` directly). `createUpdates` returns the unsupported
  client via a new `macos` export condition — before this, the `native`
  condition pulled `index.ts` → `native.mobile.ts` → `@octane-xplat/platform/android`,
  a `.android` boundary violation in production builds.
- **#138 billing**: StoreKit is bound, but `SKPaymentQueue` cannot transact
  without App Store distribution (sandbox + entitlements). Deferred to §4.
- **#139 speech recognition**: `SFSpeechRecognizer` is bound, but the only
  consumer (`ChatDictationButton`) is already served by macOS system
  dictation in native text fields — the accepted desktop path.
- **#140 live BarcodeScanner**: `XplatCameraHost` has no per-frame callback;
  needs a designed `AVCaptureVideoDataOutput` + Vision frame leaf.
- **#141 sentry native crash**: leaf now probes `@sentry/browser` on a fetch
  transport instead of re-exporting `.web` (a boundary violation); MetricKit
  `MXCrashDiagnostic` is the designed native-capture path.
- **#142 ads**: explicit `supported:false` facade + `BannerAd.macos.tsrx`
  stub; the `.web` re-exports were production-breaking boundary violations.
- **#143 maps (provisional)**: MapKit/`MKMapView` is the accepted engine —
  Google Maps has no AppKit SDK and hosted WKWebView is out of scope. The
  declarative facade needs a delegate+annotation pipeline; the row stays
  open honestly rather than faking support.
- **WebAuthn**: covered by existing decision #66 (hosted `authSession`
  ceremony); the macOS leaf already resolves an explicit unsupported impl
  in `platform/src/index.macos.ts` — no new row needed.

## Older AppKit reports — reassessment (all closed)

- **#7 smooth-corners drops layout props — verified fixed.** Current source
  (`smooth-corners/src/layout-child.ts`, `layout-child.web.ts`) splits
  parent-metadata/flex props and `SmoothCornersProps` extends
  `LayoutChildProps`/`FlexContainerProps` + `flexDirection` (84502987).
- **#14 stack-view churn vs first responder — mechanism removed.** The named
  code paths (`moveStackChildren`, `syncMarginHost`, `syncStackLayout`,
  `removeArrangedSubview` re-parenting on prop updates) no longer exist:
  the classic layout engines were deleted (`a1f8e804f`, `d2cc9c5c8`,
  `0527886c2`) and `masonview`+Mason is the only layout host. Reparenting
  still occurs at bounded sites (index.ts ~8006, ~8465), so the residue —
  whether first responder survives ordinary prop updates under Mason —
  stays a runtime question, not a closed-by-refactor proof. The renderer
  now tracks `window.firstResponder` for `:focus`/`:focus-visible`/
  `:focus-within` diffing (index.ts ~9915).
- **#20 AppKit BOOL getters — upstream bridge quirk, still live.** No local
  coercion fix or workaround landed; it is a pinned-runtime
  (`@nativescript/macos-node-api`) bridging behavior, not Xplat code.
  Callers in current source read BOOLs defensively (`Boolean(...)`,
  `Number(...)`) or behaviorally, matching the issue's own workaround.
  Stays closed as an upstream limitation; worth a
  `.agents/docs/` note if it bites again.

## Runtime verification hosts

- `skymac.local`: reachable (arm64, macOS 26.6.2) but Data volume 93% full
  (~16GB free) — no installs; usable for copied-artifact runs only.
- Local Mac (macOS 27.2): used for the System Settings anchor evidence.

## Remaining verification

All new tests run (node --test, vm stubs — source evidence, not OS
behavior). Deferred: `turbo run typecheck --filter=...<pkg>` for touched
packages (platform, calendar, contacts, media, background-tasks, ads,
sentry, updates), real-Mac exercise of EventKit/Contacts/Photos/scheduler
through the proving host (needs Info.plist usage keys), packaged-build
boundary check for the audited leaves.
