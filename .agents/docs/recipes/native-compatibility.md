# Keep JavaScript updates compatible with native binaries

ID: native-compatibility
Targets: ios, android
Related APIs: @octane-xplat/fingerprint, createFingerprintAsync, createProjectHashAsync, diffFingerprints, diffFingerprintChangesAsync, xplat-fingerprint, xplat updates init

## Starting point

A NativeScript phone app with installed dependencies, a Bun lockfile and a
working native release build. The app owns signing and OTA backend deployment.

## Requirements

- Install a Node build tool and inspect deterministic native input records.
- Identify native changes while allowing JavaScript-only changes.
- Capture the actual build context and preserve private records.
- Reject incompatible updates before downloaded code executes.
- Preserve recovery and report platform qualification boundaries.

## Acceptance criteria

- AC1: The reader can install the development dependency, collect a per-platform hash/source list and compare saved records with API or JSON CLI, without importing Node tooling into app code.
- AC2: Native code, resources, dependency resolutions, resolved config and custom declared inputs change identity; unrelated JavaScript and checkout location do not. Missing/ambiguous inputs fail explicitly.
- AC3: The prepare hook records actual compiler context and build mode, bakes native identity, preserves an ignored private build record, and stamps only minimal payload metadata. The reader can reproduce a comparison with that record.
- AC4: Publishing rejects stale native sources and debug payloads. Server routing, client staging and native boot enforce the same exact identity, including mismatched manifest and payload cases before execution.
- AC5: Compatible cold-launch activation, confirmation, failed boot recovery and manual rollback retain user data; current Android, signed iOS, desktop OTA and hosted-deployment qualification limits remain explicit.

## Documentation

- AC1: [Node install and first comparison](../../../packages/fingerprint/README.md) and [packed consumer](../../../packages/fingerprint/tests/packed-consumer.mjs).
- AC2: [Custom inputs and coverage](../../../packages/fingerprint/README.md#include-a-custom-native-input) and [source tests](../../../packages/fingerprint/tests/fingerprint.test.mjs).
- AC3: [Compare with an OTA binary](../../../packages/fingerprint/README.md#compare-with-an-ota-binary), [binary setup](../../../docs/app/updates.md#set-up-the-binary-once) and [hook tests](../../../packages/updates/tests/prepare.test.mjs).
- AC4: [Publish and validate](../../../docs/app/updates.md#publish-and-validate), [publisher dry runs](../../../tools/ota-server/publisher.test.mjs) and [native guard](../../../packages/updates/tests/native-guard.test.mjs).
- AC5: [Recovery](../../../docs/app/updates.md#recover-a-release), [maintained lifecycle](../../../packages/updates/tests/native-lifecycle.mjs) and [qualification record](../notes/fingerprint.md#verification-and-limits).
