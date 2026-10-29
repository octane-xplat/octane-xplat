# Keep a session token private

ID: secure-storage
Targets: web, ios, android, macos, linux
Related APIs: @octane-xplat/secure-storage, secureStorage, Capability, SecureStore

## Starting point

A configured Octane app with a sign-in flow that supplies a token at runtime.
The reader wants to remember a session without putting tokens in ordinary preferences.

## Requirements

- Install the appropriate leaf and check availability before accessing secrets.
- Save, restore, and delete a token without displaying it or logging it.
- Handle missing entries and unavailable or restricted storage without a plaintext fallback.
- Understand macOS development and packaged storage scope and native setup.

## Acceptance criteria

- AC1: The reader installs the leaf and handles unsupported targets before using its async store.
- AC2: A successful write can be read, overwritten, and deleted; empty strings are preserved and removing a missing entry succeeds on macOS.
- AC3: The app handles unavailable storage and access failures without reporting success or logging keys, values, or native exception details. On AppKit, availability requires a complete callable bridge and operations capture one binding/method set with receivers. Lookup failures remain sanitized async unavailability; only item-not-found returns null, malformed/missing responses are read failures, and nonboolean native write/remove responses cannot report success.
- AC4: A macOS AppKit app loads the native implementation through the CLI, preserves packaged identity across releases, and understands why development entries are separate.
- AC5: Maintained examples and checks use runtime values and status-only output, clean up their test items, and distinguish native runtime checks from UI dispatch or OS input evidence.

## Documentation

- AC1: [Store a session token](../../../docs/platform/platform-services.md#store-a-session-token).
- AC2: [Store a session token](../../../docs/platform/platform-services.md#store-a-session-token) and [macOS contract](../../../packages/secure-storage/README.md#macos-appkit).
- AC3: [Store a session token](../../../docs/platform/platform-services.md#store-a-session-token), [macOS contract](../../../packages/secure-storage/README.md#macos-appkit), [captured bridge source](../../../packages/secure-storage/src/secure-storage.macos.ts), [nine authored source cases](../../../packages/secure-storage/tests/macos.test.mjs), [skill](../../skills/octane-xplat/references/services.md#appkit-secure-storage-bridge-and-read-failures) and [target note](../parity/appkit-progress.md#appkit-secure-storage-binding-and-read-failure-boundary). Six cases are new, all nine remain UNRUN for this task; native/packed/installed proof is pending.
- AC4: [macOS native setup and scope](../../../packages/secure-storage/README.md#macos-appkit) and [native prerequisites](../../../docs/platform/macos-native.md#prepare-the-app).
- AC5: [Verification commands and limits](../../../packages/secure-storage/README.md#macos-appkit), [AppKit status-only example](../../../packages/app/src/Services.macos.tsrx) with caught cleanup failure, [source bridge cases](../../../packages/secure-storage/tests/macos.test.mjs), and [isolated packed native check](../../../packages/secure-storage/tests/macos-runtime.mjs). These checks remain deferred/unrun for this task; the [target note](../parity/appkit-progress.md#appkit-secure-storage-binding-and-read-failure-boundary) records exact commands and qualification boundaries.
