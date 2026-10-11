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

## Documentation

- AC1: [Keep a screen awake](../docs/platform/keep-awake.md#own-a-request-with-your-screen), [maintained example](../examples/keep-awake/ReadingScreen.tsrx).
- AC2: [Overlapping activities](../docs/platform/keep-awake.md#overlapping-activities).
- AC3: [Availability and release](../docs/platform/keep-awake.md#availability-and-release).
- AC4: [Target limits and verification](../docs/platform/keep-awake.md#target-limits-and-verification).
