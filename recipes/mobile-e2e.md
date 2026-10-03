# Test mobile journeys with Maestro

ID: mobile-e2e
Targets: ios, android
Related APIs: Maestro, NativeScriptConfig.id, test:maestro

## Starting point

An Xplat phone app with a buildable native shell and a test device. The
reader wants repeatable UI journeys; code checks alone do not tap the app.

## Requirements

Recommend an end-to-end tool, explain setup and selectors, and provide a
maintained example with repeatable execution and honest verification limits.

## Acceptance criteria

- AC1: Install the runner, identify the app and device, and execute a short journey on each mobile target without a NativeScript plugin.
- AC2: Select controls reliably, arrange known state, and wait for observable results without fixed sleeps or assumed native ID mappings.
- AC3: Run a maintained framework example with explicit device selection, build/install steps, failure status, and machine-readable results usable in CI.
- AC4: Distinguish runtime passes from source/unit evidence, preserve user data and artifact privacy, and identify unverified targets and journeys.

## Documentation

- AC1: [First flow](../docs/verify/maestro.md#run-your-first-flow)
- AC2: [Reliable checks](../docs/verify/maestro.md#choose-reliable-checks)
- AC3: [Framework runner](../docs/verify/maestro.md#framework-smoke-runner), [maintained flow](../.maestro/counter.yaml), [fixture](../apps/maestro/src/Counter.tsrx)
- AC4: [Framework qualification](../docs/verify/maestro.md#framework-smoke-runner), [agent guidance](../.agents/docs/testing.md#mobile-end-to-end-tests-with-maestro)
