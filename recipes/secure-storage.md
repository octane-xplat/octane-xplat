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
- AC3: The app handles unavailable storage and access failures without reporting success or logging keys, values, or native exception details.
- AC4: A macOS AppKit app loads the native implementation through the CLI, preserves packaged identity across releases, and understands why development entries are separate.
- AC5: Maintained examples and checks use runtime values and status-only output, clean up their test items, and distinguish native runtime checks from UI dispatch or OS input evidence.

## Documentation

- AC1: [Store a session token](../docs/platform/platform-services.md#store-a-session-token).
- AC2: [Store a session token](../docs/platform/platform-services.md#store-a-session-token) and [macOS contract](../packages/secure-storage/README.md#macos-appkit).
- AC3: [Store a session token](../docs/platform/platform-services.md#store-a-session-token) and [macOS contract](../packages/secure-storage/README.md#macos-appkit).
- AC4: [macOS native setup and scope](../packages/secure-storage/README.md#macos-appkit) and [native prerequisites](../docs/platform/macos-native.md#prepare-the-app).
- AC5: [Verification commands and limits](../packages/secure-storage/README.md#macos-appkit), [AppKit status-only example](../packages/app/src/Services.macos.tsrx), and [isolated packed native check](../packages/secure-storage/tests/macos-runtime.mjs).
