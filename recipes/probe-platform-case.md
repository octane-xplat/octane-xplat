# Probe one platform case

ID: probe-platform-case
Targets: web, ios, android, macos, linux
Related APIs: pnpm probe, ProbeContext, --watch, --fresh-process, --deps, --resources

## Starting point

An installed repository checkout and existing platform toolchains/devices.
This is repository-local tooling; it excludes Windows and environment provisioning.

## Requirements

Run a script or component in isolation, iterate after edits, and report structured
platform evidence without changing the kitchen-sink harness.

## Acceptance criteria

- AC1: Discover prerequisites and select a supported target/device; unavailable targets cannot pass.
- AC2: Run maintained script and component cases with assertions and actual host inspection.
- AC3: Rerun edited cases with a fresh component root and optionally a fresh process.
- AC4: Isolate generated entries, build artifacts, app identities, and owned session cleanup from other work.
- AC5: Supply installed extra dependencies and native resources, and understand build invalidation and custom integration limits.
- AC6: Interpret JSON results, timeout/error behavior, and the difference between handler dispatch and OS input evidence.

## Documentation

- AC1: [Run a maintained case](../docs/probing.md#run-a-maintained-case) and
  [Android host recipe](../.agents/docs/android-lab.md#working-recipe).
- AC2: [Write a case](../docs/probing.md#write-a-case), [script](../examples/probes/signals.ts), and [counter](../examples/probes/counter.tsrx).
- AC3: [Iterate without harness edits](../docs/probing.md#iterate-without-harness-edits).
- AC4: [Iterate without harness edits](../docs/probing.md#iterate-without-harness-edits).
- AC5: [Iterate without harness edits](../docs/probing.md#iterate-without-harness-edits).
- AC6: [Read the evidence](../docs/probing.md#read-the-evidence).

## Verification gaps

Linux runtime checks require a real Linux host and remain unrun in this macOS
workspace. The shared Silo `recipe_audit.target` schema currently excludes Linux;
its audit cannot be recorded there without a schema change. Keep this gap explicit.
