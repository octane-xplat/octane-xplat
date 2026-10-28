# Still-shaped framework readiness

This record covers reusable Octane Xplat capabilities, not a Still app port.
Review date: 2026-10-28. The approved plan remains outside the repository at
`~/dev/plans/octane-xplat/still-native-migration-plan.md`.

## Implemented boundaries

- Audio has playback rate (0.5–3), volume, mute, and identity-preserving queue
  updates. Matching current ID/source retains position and intent. Incomplete
  queues wait for appended items; explicit pause cancels automatic resumption.
  Current-item replacement/removal selects the first new item paused. IDs and
  sources must be nonempty and IDs unique. See the [public guide](../../../docs/platform/media-services.md).
- The [network leaf](../../../packages/network/README.md) supplies incremental
  byte responses using browser fetch, NSURLSession, and OkHttp 4.12.0. Native
  unread buffering fails explicitly at its configured bound. It is a smaller
  HTTP contract, not a Fetch replacement or Coreframe client adapter.
- Hosted sign-out reports failed durable credential deletion while retiring
  memory immediately and still attempting revocation. See the
  [auth contract](../../../packages/auth/README.md).

## Evidence and limitations

Maintained checks run through Turbo. Unit tests, packaged declarations, native
builds, simulator execution, and physical acceptance are separate evidence.
No visual analysis or physical output observation was performed.

Initial local test environment: macOS 27.0.1 (26A434), Xcode 27.0 (27A266a), iOS 27.0
simulator, Android API 35 arm64 emulator, Playwright 1.63.0 Chromium, Octane
0.14.0, NativeScript core 9.1.3, iOS runtime 9.1.0, Android runtime 9.1.1,
and NativeScript Octane renderer 0.2.5.

| Area | Evidence collected | Remaining gate |
| --- | --- | --- |
| Audio controls and growing queues | 31 unit regressions; packed web/mobile/AppKit declarations; Chromium trusted-click silent foreground fixture (9 assertions); native AppKit silent AVPlayer lifecycle/settings fixture and growing-queue retry (9 assertions); iOS 27 and Android API 35 foreground fixtures (9 assertions each) | Physical audible speech/pitch, MP3/range seek under network failure, background delivery, interruptions, routes/Bluetooth, application memory and audible boundary-delay budgets |
| Streaming | 7 transport/parser tests including real local HTTP, exact binary PUT, abort, bounded unread data and Rouzer split UTF-8; packed exports in Bundler/NodeNext without DOM declarations; native runtime fixture below | Production TLS/proxy behavior, long sessions and physical background scheduling; adapter integration stays consumer-owned |
| Hosted sessions | 42 tests including real local synthetic exchange/refresh/revoke, PKCE, session races, deletion failure/retry | Real provider, packaged cold/warm OS callbacks, secure-storage restart on physical devices |
| UI and data foundations | All 139 UI suites / 1094 tests pass, including existing query/persistence/lifecycle contracts; 5 Lingui locale/extraction checks pass | OS input, accessibility, text scaling/RTL and hardware keyboard acceptance; composed consumer scope below |
| AppKit host | 509 CLI tests; native streaming abort no longer crashes on missing console.assert | No additional background/system-control guarantee |

Runtime transport fixture: `packages/network/tests/incremental.ts` with its
owned delayed HTTP server. iOS 27 simulator, Android API 35 emulator, Chromium,
and AppKit were exercised during development. First bytes arrived before
server completion. The maintained native fixture verifies binary PUT, readable
503 bodies, headers and abort: iOS, Android and AppKit passed all eight
assertions. A dedicated Chromium fixture also passed all eight. Earlier
smaller probes are not counted as the full fixture.
Mobile runtimes provide a streaming TextDecoder usable by Rouzer. AppKit has
no global TextDecoder: byte streaming and the leaf's owned UTF-8 text/JSON codec
work, but unmodified Rouzer decoding there remains unsupported.

The AppKit completion timeout was reproduced on `skymac.local` (macOS 26.6.2,
Xcode 27.1): four of five queue runs froze at position zero after rapid
pause/unmute/resume while reporting `playing`. A standalone Objective-C probe
reproduced it without JavaScript. The two-step AVPlayer `play` then `setRate:`
sequence can leave this transition stalled; one `playImmediatelyAtRate:` call
completed all three direct comparison trials. Xplat now submits that single
native transition. Five consecutive queue runs and the packed native regression
(three local and three HTTP rapid-resume cycles) passed after the fix. This
closes the reproduced timeout; it does not qualify physical output or routes.

Native audio's maintained runtime fixture uses silent WAV to establish queue
progression only. It cannot prove audible MP3 output, speech pitch quality,
seamless boundaries, background JS scheduling, or physical audio routes.
Background AVPlayer/Media3 playback does not guarantee delivery of new queue
items by suspended JavaScript. These gates remain open; native readiness is
not yet complete. Foreground timing measurements have their own limited
fixture budgets; they do not establish app startup, physical gaps, or
background performance.

Native passkey sheets, SHA-1 byte digests and oriented resize/WebP encoding
remain explicitly deferred optional lanes. Hosted authentication is the
available passkey ceremony route. Upload processing was not an active UI
workflow in the reviewed Still source; no upload-readiness claim is made.
Windows/native Linux network entries reject explicitly; they are not qualified.

## Scoped upstream findings and local fixes

NativeScript core 9.1.3's fetch uses XHR `onload`, and its iOS HTTP implementation
uses completion-handler data tasks. Source review of
`@nativescript/core/fetch/index` and `http-request/index.ios` shows complete-body
delivery, which cannot satisfy first-record-before-completion. The new leaf
uses native streaming delegates instead of patching global fetch. Recheck this
boundary when NativeScript adds an incremental response contract.

`@tsrx/oxc` 0.16.0 rejected Heading's expression tag `<{tag}>` with
`ParserOperationalError: reachable synthetic ESTree span`; six UI suites failed
to load. `Heading.web.tsrx` now binds a standard JSX `Tag` value. All UI suites
pass with that scoped workaround. Revisit it after an upstream parser fix;
this does not establish that every expression tag fails.

The CLI formatter pipeline (including `oxfmt` 0.70.0) rewrites `[...Buffer.concat(chunks)]` to
`Buffer.concat(chunks)` even when the array representation matters for JSON.
Reproduction: pipe `const bytes = [...Buffer.concat(chunks)]` into
`pnpm format --stdin-filepath /tmp/still-spread.mjs`. The fixture uses
`Array.from(Buffer.concat(chunks))` to preserve JSON number-array semantics.
Ordinary `[...items]` and object spreads were checked and remained intact.
The formatter itself is unchanged. The responsible pipeline stage has not
been isolated; inspect semantic edits until this transformation is corrected.

Android snapshots now sample the live Media3 position on the JS/main thread;
the old bridge returned the last event snapshot, so ordinary time progression
could remain stale between player events. The retained foreground fixture
checks that position advances before preserving it through an update.

AppKit's host bootstrap installed abort-controller/event-target-shim before
replacing console with log/warn/error only. Event dispatch called console.assert
and threw. The shim now supplies nonthrowing assert, with a regression exercising
the actual bootstrap order; no native host binary rebuild is required.

## Reproduce the retained checks

Run from the repository root. Device runs require the normal resource broker,
SDK setup and an owned booted simulator/emulator. The local media/HTTP
fixtures use virtual-device host addresses. Browser tests remain outside PR CI.

```sh
pnpm exec turbo run test --filter=@octane-xplat/audio --filter=@octane-xplat/network --filter=@octane-xplat/auth
pnpm exec turbo run test:packed --filter=@octane-xplat/audio --filter=@octane-xplat/network
pnpm exec turbo run test:browser --filter=@octane-xplat/audio
pnpm exec turbo run test:runtime --filter=@octane-xplat/network -- --target web
pnpm exec turbo run test:runtime --filter=@octane-xplat/audio -- --target ios --device YOUR_OWNED_SIMULATOR
pnpm exec turbo run test:runtime --filter=@octane-xplat/network -- --target android --device emulator-YOUR_OWNED_PORT
```

Implementation commits: `499fdaa40` (host), `f34a64dd3` (Heading),
`c2b6194af` (Lingui fixture), `87dcaef9e` (auth), `658ba882f` (network),
`e301146ab` (audio), and `8fb16c3ed` (demo/runtime diagnostics).
Dependent typechecks passed 67 tasks; the subsequent shared example check
passed 40 tasks. The public documentation build passed 27 tasks. Recipe
structure/local links and release-note validation passed.

## Release and qualification work still required

The new publishable network package follows lockstep metadata, but its initial
npm stub/trusted-publisher setup must be completed before a release. This task
does not publish packages or change registry credentials.

Physical iOS/Android qualification remains required before calling the plan
complete. The composed external consumer below covers foreground service
integration; it does not cover startup, full application memory, audible gaps,
durable progress loss, localized catalogs/native assets, actual provider
callbacks, restart/termination, or background queue growth. Existing unit
coverage does not close those runtime gates. Keep the
[recipes](../recipes/README.md) and Silo assessments aligned with actual evidence.

## Remote qualification on skymac.local (2026-10-28)

All follow-up builds, runtime checks and measurements ran on `skymac.local`,
in a dedicated detached worktree. The dev machine only edited and transferred
source. Host: macOS 26.6.2 (25G83), Xcode 27.1 (27A9275), 16 GiB RAM;
Node 26.5.0 and repository-pinned pnpm 11.24.0. Tests used an owned iPhone 17 Pro
simulator with iOS 26.2 and Chromium 153.0.8010.12 via Playwright 1.63.0.
No screenshots or visual inspection were used.

The maintained [packed consumer](../../../tools/native-readiness/README.md)
installs the selected package closure as tarballs through the packed creator,
outside the workspace. Its listening/settings screen composes shared UI, audio,
incremental HTTP, hosted sessions, secure storage and preferences. The iOS run
passed nine assertions, and the consumer's public `xplat typecheck` passed.
Assertions include UI subscription changes, preserving playback, the first
streamed record before completion, secure credential restoration/deletion,
isolated preference writes, and queue advancement. Restoration is within one
process. Hosted auth uses native randomness/storage with a synthetic browser
callback, not an external provider or an OS-delivered callback.

The iOS foreground audio fixture passed nine assertions and the incremental
transport fixture passed eight. Browser transport passed eight assertions.
AppKit passed eight transport assertions, five consecutive nine-assertion queue
runs, and the packed native regression described above.

The foreground budgets were fixed before collecting measurements. The silent
fixture passed all six on Chromium, iOS and AppKit. These are individual runs,
not percentile or sustained-load results:

| Measurement | Ceiling | Chromium | iOS 26.2 | AppKit |
| --- | --- | --- | --- | --- |
| First observed progress | 10000 ms | 269 ms | 443 ms | 582 ms |
| Preserving queue command | 250 ms | 1 ms | 1 ms | 0 ms |
| Position loss on update | 0.15 s | 0 s | 0 s | 0 s |
| Observable seek position | 1500 ms | 0 ms | 22 ms | 1 ms |
| Estimated extra boundary delay | 1500 ms | 164 ms | 337 ms | 359 ms |
| Appended queue resume | 2000 ms | 187 ms | 203 ms | 276 ms |

AppKit host RSS sampled every 200 ms peaked at 228.4 MiB over 39 samples,
below the initial 384 MiB ceiling. This excludes GPU and other processes and
is not a leak, startup, background or full Still performance qualification.
The timing fixture measures observable player state, not audible output.

Remote evidence logs live at `/tmp/still-readiness-*.log`; successful packed
iOS consumer artifacts are `/tmp/xplat-listening-consumer-W1y5Mo`. Completed
probe build caches and the owned iOS simulator were removed after recording
results to reclaim space. Existing remote worktrees and devices were preserved.

Android follow-up runtime checks could not start on this host. Emulator
36.3.10.0 with the installed API 36.1 Google Play arm64 image failed during boot,
first with `qemu_mprotect__osdep: mprotect failed: Permission denied`, then with
hung QEMU main/CPU threads and native process exit. A bounded retry with graphics
disabled also failed before Xplat launched. These are host startup failures,
not failed framework assertions. Earlier API 35 Android evidence above remains
separate; the new budget and packed composed consumer have no Android runtime
pass. The owned AVD was moved to
`/Volumes/Databody/still-readiness-c0a3bb48/android.avd` after the internal disk
could not fit its userdata; no unrelated files or devices were removed.

Remote setup also exposed missing cold-checkout CLI/Bamboo outputs in the
runtime task prerequisites; those tasks now prepare the outputs explicitly.
Android launch preserves explicit `JAVA_HOME`, and the doctor checks the selected
major version. Remote checks accepted Homebrew JDK 21 and rejected JDK 25.

No physical Android phone was attached, and the paired iPhone was offline.
Physical background delivery, audible speech/pitch, interruptions, routes,
real-provider cold/warm callbacks, and abrupt restart remain unverified.

Remote source checks: all 80 audio/network/auth unit tests passed; the focused
package/dependent typecheck passed 42 Turbo tasks, and the scripts typecheck
passed. Focused lint and recipe structure/local links passed. The root script
suite passed 118 of 119 tests; its unchanged CSS audit rejects native-dropped
properties in existing theme CSS. That unrelated audit failure remains open.
The browser-only audio harness entry now has a `.web.mjs` boundary so the
maintained lint rule recognizes its DOM access.
