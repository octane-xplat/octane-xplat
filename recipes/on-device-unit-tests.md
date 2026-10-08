# Test components on a device with Vitest

ID: on-device-unit-tests
Targets: ios, android
Related APIs: mountXplat, viewText, findByTestId, tap, enterText, waitUntil, @octane-xplat/platform/testing, @nativescript/unit-test-runner, test:ios

## Starting point

An Xplat app scaffolded for iOS or Android — the scaffold already carries
the on-device Vitest lane (`src/test.ts`, `vitest.config.mts`, a starter
spec, and the runner deps). The reader wants repeatable component checks in
the real native runtime, not a browser approximation, plus a maintained
framework example and an honest report of what the lane proves.

## Requirements

Explain what runs where (host Vitest orchestrates, specs execute on-device),
the mount/query/interact surface, device selection, spec-file conventions,
clean mount/unmount discipline, and the lane's limits versus OS input and
unverified targets.

## Acceptance criteria

- AC1: A scaffolded app runs `pnpm test:ios` on a selected simulator with no extra setup; apps created before the lane existed get documented add-on steps.
- AC2: Mount an Xplat component, drive tap and text entry, and assert on rendered text or testID using the packaged helper — no copying framework internals.
- AC3: Unmount between specs is automatic; repeated mounts cannot leak subscriptions or delayed work into the next case.
- AC4: Maintained examples cover a counter, a controlled text input, conditional mounting, and async loading/error states, plus a native runtime/import contract and an explicit failure-reporting expectation.
- AC5: A reproducible CI lane runs the iOS suite with explicit device selection; docs state that dispatch proves handler wiring, not OS hit-testing, and name unverified targets.

## Documentation

- AC1: [Run the lane](../docs/verify/testing.md#test-components-on-a-device), [older apps](../docs/verify/testing.md#add-the-test-lane-to-an-older-app), [starter spec](../packages/create/template/src/app.spec.tsrx)
- AC2: [Spec example](../docs/verify/testing.md#test-components-on-a-device), [helper source](../packages/platform/src/testing.mobile.ts)
- AC3: [Cleanup contract](../docs/verify/testing.md#test-components-on-a-device), [framework leak checks](../apps/mobile/src/tests/leak-check.spec.tsrx)
- AC4: [Framework suite](../apps/mobile/src/tests/counter.spec.ts), [starter spec](../packages/create/template/src/app.spec.tsrx), [failure reporting](../apps/mobile/src/tests/failure-reporting.spec.ts)
- AC5: [CI lane](../.github/workflows/ci.yml), [qualification notes](../.agents/docs/testing.md#on-device-unit-tests-ns-test-vitest)
