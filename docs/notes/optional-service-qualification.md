# Optional-service qualification

> Qualify the capabilities your app installs and uses; keep setup coverage,
> adapter tests, target runtime behavior and physical output as separate evidence.

This recheck started from main `4b43f82` on 2026-09-30. Optional services live in
leaf packages: media, auth, push, audio, sounds, and advanced haptics.
`@octane-xplat/platform` remains free of runtime npm dependencies; hosted
`authSession` uses platform APIs and a package-owned Android Custom Tabs Gradle
dependency. Installing an unrelated optional package is not a core-release gate.

## Fresh results and boundaries

| Capability           | Web                                                                                                                                                                                                                                                 | iOS                                                                                                                                                                 | Android                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted `authSession` | Real Chromium reports unsupported; ordinary navigation/WebAuthn remain app-owned.                                                                                                                                                                   | Mocked adapter tests cover callback, cancel, error, invalid URL, failed start and native construction failure. System-browser ceremony not run.                     | Mocked adapter tests cover fresh callback, cancel without callback, stale intent rejection, busy session, failed launch and retry/listener cleanup. System-browser ceremony not run.                     |
| Provider SDK auth    | Real Chromium returns documented errors for unconfigured Apple/Google. No provider request is sent.                                                                                                                                                 | SDK registration/signing and real account credentials unavailable for qualification.                                                                                | Apple remains unsupported by contract; configured Google flow not qualified.                                                                                                                             |
| Passkeys             | JSON credential adapter exists; no configured HTTPS relying party or real authenticator ceremony tested.                                                                                                                                            | Hosted relying-party flow unqualified.                                                                                                                              | Hosted relying-party flow unqualified.                                                                                                                                                                   |
| Push                 | Setup/docs rechecked; no Firebase configuration, VAPID registration or delivery tested.                                                                                                                                                             | No APNs signing/registration or configured delivery tested.                                                                                                         | No configured FCM permission/token/delivery/tap test.                                                                                                                                                    |
| Pick/capture images  | Real file-input selection reads a synthetic payload and returns a usable object URL/data URL. No image is rendered or inspected. Failed-read cleanup tested separately with injected errors. Camera hardware and real picker dismissal unqualified. | Fresh Pods resolve with one image-picker declaration; mocked failed conversion cleans its generated JPEG. No permission dialog, picker or capture runtime pass.     | Existing direct camera-permission fix matches later historical successful physical capture evidence. No fresh physical denial/cancel/capture pass in this recheck; failed-conversion cleanup uses mocks. |
| Long-form audio      | Real Chromium playback, pause, seek, two-track advancement/end and teardown pass. Disposal clears metadata, source and all five registered Media Session actions. Browser background parity is not supported.                                       | Existing mocked interruption/resume and Now Playing contract tests pass. Fresh preparation succeeds; background/lock-screen/interruption/output checks unqualified. | Media3 AAR compiled in fresh preparation. Previous emulator state/metadata results are historical; fresh background/notification/headset/interruption/output checks unqualified.                         |
| UI sounds            | Real Chromium preloads and plays an effect, enforces a one-voice cap, stops voices and releases their sources. Player state remains playing beside effects. Audibility and output routes unmeasured.                                                | Fresh Pods resolve; audible effects, voice limits and route coexistence unqualified.                                                                                | Earlier emulator calls beside Media3 are historical. Audible output, route coexistence and interruptions unqualified.                                                                                    |
| Advanced haptics     | Web Vibration remains API/device-dependent; realtime is unsupported by contract. No physical output claim.                                                                                                                                          | Pulsar Swift package resolves in fresh preparation. No physical actuator test.                                                                                      | Pulsar AAR compiled after a constrained-worker retry. No physical actuator test.                                                                                                                         |

`node scripts/check-optional-services.mjs` (also `pnpm check:optional-services`)
runs focused web/native adapter typechecks, Node regression tests, and the
nonvisual Chromium probe. Node tests inject OS/backend APIs and do not count as
native runtime evidence. The Chromium probe uses synthetic PCM to measure
playback state, not audible output. It neither captures screenshots nor renders
selected images. It does not mock a successful provider sign-in or push delivery.

The broad mobile typecheck (`pnpm typecheck:mobile`) passes after correcting
audio bridge typings and the handwritten JSX component declarations. Focused
auth/media native adapter types and web media/audio/sound adapter types pass
independently. Native bundling can still continue despite type errors;
bundle emission alone cannot qualify the complete app. Repository-wide lint also
reports existing failures outside the changed files; targeted lint passes for the
changed TypeScript/JavaScript adapters and checks.

## Historical defects rechecked

The older Android null-after-granted-camera-permission result was followed by
Silo experiment `791f617c-5441-4ef9-860c-491d70f78578`, which recorded a real
`PickedImage` on a physical OnePlus after the direct permission fix. That fix
is already in main: `ensureCamera` bypasses the plugin's perms-version status
mapper. Do not treat the older failed row as an unfixed defect, or the later
historical success as a fresh pass on this revision. Recheck a granted capture
on real hardware before qualifying an app's capture workflow.

Fresh iOS preparation installs `QBImagePickerController` 3.4.0 from a single
image-picker Podfile declaration and resolves Pulsar 1.4.0. The earlier duplicate
CocoaPods source blocker is not reproduced. No patch or duplicate app-owned pod
entry is needed for this revision. Preparation success does not prove complete
native compilation, installation, or playback/haptics runtime behavior.

Fresh Android preparation compiled camera, image-picker and Media3 plugin AARs.
An initial haptics plugin build failed when AAPT2 daemons could not start. A retry
with `GRADLE_OPTS=-Dorg.gradle.workers.max=2` compiled the haptics AAR. A complete
APK build result and a fresh iOS final build result are not recorded here;
subsequent final build attempts found the shared target locks occupied and did
not proceed. A fresh complete native build and device pass remain blocked on an
available locked target session as well as the feature-specific prerequisites. No running session was reset, killed or replaced for these checks.

## Qualify a configured app

Use a separate app identity and test data. Acquire the shared per-target
advisory lock (`/tmp/octane-xplat-ios.lock` or
`/tmp/octane-xplat-android.lock` on this host) for builds and device operations;
keep it held for the whole operation. Do not remove lock files, reset another
app's permissions/data, or reuse an occupied device session. Use Temurin JDK 21
for Android. Install/launch an iOS build with `simctl` when the simulator is
already booted; do not use `ns run ios` in that case.

Each installed feature has its own remaining gate:

- Auth: register the callback and SDK clients, provide the app-owned RP/verifier
  and server attempt store, and exercise success/cancel/error and replay rejection.
  The [maintained exchange boundary](../../examples/auth/README.md) requires real
  cryptographic verification, code redemption and session-issuance adapters.
- Push: provide app-owned Firebase/APNs/VAPID setup; verify denied permission,
  token registration/rotation, foreground delivery, background delivery and
  notification taps including cold start using [the push guide](../platform/push-notifications.md).
- Media: exercise denial, cancel, capture after an already-granted permission,
  multi-pick and temporary-preview release using [the image workflow](../platform/platform-services.md#pick-and-capture-images).
- Audio/sounds: verify background continuation, lock-screen/notification and
  headset controls, queue actions, real interruptions, audible output and route
  preservation using [integration checks](../platform/media-services.md#check-your-integration).
- Haptics: verify presets, patterns and realtime stop on release/cancellation/
  teardown on physical supported hardware. The maintained press-in/out probe
  still lacks a complete gesture-cancellation example.

These are feature-specific release gates for an app relying on that capability.
Credentials/signing, a configured backend and available physical hardware remain
external blockers. No current result qualifies every optional capability across
Web, iOS and Android, and no error-only or mocked demo counts as end-to-end success.
