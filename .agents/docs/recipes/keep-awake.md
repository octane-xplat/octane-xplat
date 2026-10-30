# Keep a screen awake during an activity

ID: keep-awake
Targets: web, ios, android, macos, linux
Related APIs: keepAwake, useKeepAwake, KeepAwakeOptions, @octane-xplat/platform

## Starting point

An app with a reading, presentation, or recording screen that should stay visible.

## Requirements

Own screen-sleep prevention only while needed, release it on cleanup, and handle
unsupported targets and OS-controlled release without promising permanent wakefulness.

## Acceptance criteria

- AC1: Keep a mounted screen awake with a hook and release its request when it unmounts.
- AC2: Use independent tags for overlapping activities; duplicates are a set rather than a reference count, and unknown cleanup is harmless.
- AC3: Check availability and held state, handle false results, and understand background release and automatic foreground retry.
- AC4: Understand display-only behavior, web prerequisites, Linux session dependence, and the unsupported Windows leaf; verify real sleep behavior on intended targets.
- AC5: On native AppKit, check both activity methods without acquiring, retain each token with its creating receiver/release method across bridge replacement or loss, preserve failed-release retry and the existing tag set. Hook callback/warning changes must not cycle its request; teardown retires callbacks and starts release even if optional listener removal fails. Author target models and an idle manual fixture, keeping physical sleep/bridge/input/memory/packaged evidence separate.

## Documentation

- AC1: [Keep a screen awake](../../../docs/platform/keep-awake.md#own-a-request-with-your-screen), [maintained example](../../../examples/keep-awake/ReadingScreen.tsrx).
- AC2: [Overlapping activities](../../../docs/platform/keep-awake.md#overlapping-activities).
- AC3: [Availability and release](../../../docs/platform/keep-awake.md#availability-and-release).
- AC4: [Target limits and verification](../../../docs/platform/keep-awake.md#target-limits-and-verification).
- AC5: [Native AppKit ownership](../../../docs/platform/keep-awake.md#native-appkit-request-ownership), [target backend](../../../packages/platform/src/keep-awake.macos.ts), [target hook](../../../packages/platform/src/use-keep-awake.macos.tsrx), seven [source models](../../../packages/platform/tests/keep-awake.macos.test.mjs), [idle fixture](../../../examples/probes/keep-awake.macos.tsrx) and [target note](../exploration.md#operational-evidence). All new cases and physical sleep/native bridge/input/AX/memory/installed consumers remain unrun/unqualified. The fixture run function only waits for mounting; both request screens start closed.
