# Test components on a device with Vitest

ID: on-device-unit-tests
Targets: ios, android
Related APIs: mountXplat, viewText, findByTestId, tap, enterText, waitUntil, @octane-xplat/platform/testing, @nativescript/unit-test-runner, test:ios, test:android

## Starting point

An Xplat app scaffolded for iOS or Android. The starter includes `src/test.ts`,
`vitest.config.mts`, a starter spec, and the runner deps. The reader wants repeatable
component checks in the real native runtime, plus a maintained
framework example and an honest report of what the lane proves.

## Requirements

Explain what runs where (host Vitest orchestrates, specs execute on-device),
the mount/query/interact surface, device selection, spec-file conventions,
clean mount/unmount discipline, and the lane's limits versus OS input and
unverified targets.

## Acceptance criteria

- AC1: A scaffolded app includes test setup by default and runs `pnpm test:ios` on a selected simulator without another setup command.
- AC2: Mount an Xplat component, drive tap and text entry, and assert on rendered text or testID using the packaged helper — no copying framework internals.
- AC3: Unmount between specs is automatic; repeated mounts cannot leak subscriptions or delayed work into the next case.
- AC4: Maintained examples cover a counter, a controlled text input, conditional mounting, and async loading/error states, plus a native runtime/import contract and an explicit failure-reporting expectation.
- AC5: A reproducible CI lane runs the iOS suite with explicit device selection; docs state that dispatch proves handler wiring, not OS hit-testing, and name unverified targets.

- AC6: A scaffolded Android consumer runs independently on an explicitly authorized host, including native API, failure-reporting, and repeated teardown cases. Missing host, missing completion, empty tests, and cleanup failure return non-success; configuration or build-only evidence cannot qualify Android.

## Documentation

- AC1: [Starter tests](../../../docs/testing/testing.md#add-automated-tests), [run the lane](../../../docs/testing/testing.md#test-components-on-a-device), [starter spec](../../../packages/create/template/src/app.spec.tsrx)
- AC2: [Spec example](../../../docs/testing/testing.md#test-components-on-a-device), [helper source](../../../packages/platform/src/testing.mobile.ts)
- AC3: [Cleanup contract](../../../docs/testing/testing.md#test-components-on-a-device), [framework leak checks](../../../apps/mobile/src/tests/leak-check.spec.tsrx)
- AC4: [Framework suite](../../../apps/mobile/src/tests/counter.spec.ts), [starter spec](../../../packages/create/template/src/app.spec.tsrx), [failure reporting](../../../packages/create/template/src/failure-reporting.spec.ts), [native bridge](../../../packages/create/template/src/native-runtime.spec.ts)
- AC5: [CI lane](../../../.github/workflows/ci.yml), [qualification notes](../testing.md#on-device-unit-tests-ns-test-vitest)

- AC6: [Android qualification command](../android-starter-tests.md#check-the-packed-android-starter), [current gate](../android-lab.md#consumer-test-qualification-gate-2026-10-13), [gate checks](../../../scripts/verify-android-tests.test.mjs)
