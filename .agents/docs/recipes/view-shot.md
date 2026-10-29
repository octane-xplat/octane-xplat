# Capture an app-owned view and release the image

ID: view-shot
Targets: web, ios, android, macos, linux, windows
Related APIs: @octane-xplat/view-shot, ViewShot, captureRef, captureScreen, releaseCapture

## Starting point

A working app with a laid-out card. Phone/native macOS apps rebuild their
native plugins after installation. GTK uses the gtk condition; native Windows
is experimental. Capture output qualification is still open.

## Requirements

- Install the leaf and capture a mounted host or component ref.
- Select supported formats, dimensions and result types with explicit refusals.
- Keep manual and automatic resource ownership distinct.
- Handle layout, lifecycle, protected-surface and capability failures.
- Preserve platform and verification boundaries.

## Acceptance criteria

- AC1: A reader can install, rebuild native plugins, mount a visible wrapper, wait for assets, and capture a real host or component ref without numeric React handles.
- AC2: Options validate dimensions/limits, encoding and result types; unsupported strategies reject rather than silently returning a different result.
- AC3: Manual temporary results remain alive until explicitly released; automatic results release on replacement/disposal, and late results do not reach stale callbacks or delete foreign files.
- AC4: Capabilities distinguish view capture from primary app-screen capture, platform subsets and unsupported/protected subtrees; capture errors remain visible.
- AC5: Documentation distinguishes source/compiler/API evidence from real captures, deferred Android compilation/runtime, and unverified encoding/pixel fidelity/native consumer behavior.

## Documentation

- AC1: [First card](../../../packages/view-shot/README.md#capture-a-card), [existing hosts](../../../packages/view-shot/README.md#capture-an-existing-host) and [maintained ownership example](../../../packages/view-shot/examples/capture-card.ts).
- AC2: [Options](../../../packages/view-shot/src/types.ts), [validation](../../../packages/view-shot/src/options.ts) and [platform subsets](../../../packages/view-shot/README.md#platforms-and-qualification).
- AC3: [Cleanup](../../../packages/view-shot/README.md#automatic-captures-and-cleanup), [lifecycle tests](../../../packages/view-shot/tests/controller.test.ts) and [service ordering](../../../packages/view-shot/tests/service.test.ts).
- AC4: [Capabilities](../../../packages/view-shot/README.md#platforms-and-qualification) and [owning note](../notes/view-shot.md#platform-engines).
- AC5: [Qualification](../../../packages/view-shot/README.md#platforms-and-qualification) and [verification record](../notes/view-shot.md#verification).
