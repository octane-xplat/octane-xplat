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
| Audio controls and growing queues | 31 unit regressions; packed web/mobile/AppKit declarations; Chromium trusted-click silent foreground fixture (9 assertions); native AppKit silent AVPlayer lifecycle/settings fixture and growing-queue retry (9 assertions); iOS 27 and Android API 35 foreground fixtures (9 assertions each) | Physical audible speech/pitch, MP3/range seek under network failure, background delivery, interruptions, routes/Bluetooth, memory and boundary-delay budgets |
| Streaming | 7 transport/parser tests including real local HTTP, exact binary PUT, abort, bounded unread data and Rouzer split UTF-8; packed exports in Bundler/NodeNext without DOM declarations; native runtime fixture below | Production TLS/proxy behavior, long sessions and physical background scheduling; adapter integration stays consumer-owned |
| Hosted sessions | 42 tests including real local synthetic exchange/refresh/revoke, PKCE, session races, deletion failure/retry | Real provider, packaged cold/warm OS callbacks, secure-storage restart on physical devices |
| UI and data foundations | All 139 UI suites / 1094 tests pass, including existing query/persistence/lifecycle contracts; 5 Lingui locale/extraction checks pass | A composed native listening/settings consumer, OS input, accessibility, text scaling/RTL and hardware keyboard acceptance |
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
SDK setup and an owned booted target. Browser tests remain outside PR CI.

```sh
pnpm exec turbo run test --filter=@octane-xplat/audio --filter=@octane-xplat/network --filter=@octane-xplat/auth
pnpm exec turbo run test:packed --filter=@octane-xplat/audio --filter=@octane-xplat/network
pnpm exec turbo run test:browser --filter=@octane-xplat/audio
pnpm exec turbo run test:runtime --filter=@octane-xplat/network -- --target web
pnpm exec turbo run test:runtime --filter=@octane-xplat/audio -- --target ios --device YOUR_OWNED_DEVICE
pnpm exec turbo run test:runtime --filter=@octane-xplat/network -- --target android --device YOUR_OWNED_DEVICE
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

Physical iOS/Android qualification and the complete composed external consumer
remain required before calling the plan complete. That includes startup/memory,
seek/boundary/progress-loss budgets, native assets/catalogs, callback setup,
restart/termination, and background queue growth. Existing unit coverage does
not close these runtime gates. Keep the [recipes](../recipes/README.md) and
Silo assessments aligned with actual evidence.
