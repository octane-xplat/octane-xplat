# Probes and regression tests

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Use [single-case probing](../../docs/verify/probing.md) for platform investigations:
`pnpm probe doctor` and `pnpm probe run <case> --target <target> --watch`.
For Android emulator setup, device isolation, and verified host commands, use the
[Android lab log](android-lab.md).

Prefer an isolated case over editing the harness or running a full sweep just
to answer one question. Windows is excluded from this runner.

Probes are temporary by default; keep task-specific cases in gitignored
`research/`. The runner and `examples/probes/` are maintained tooling fixtures.
Retain another probe only when it has an ongoing diagnostic purpose and a clear
owner. A retained probe is not automatically regression coverage.

When a probe establishes behavior we need to preserve, promote it into a
maintained test: focused unit/component tests for logic and component behavior,
targeted harness tests for platform integration and lifecycle behavior, and
harness sweeps for broad cross-platform coverage. Record the targets actually
run; handler dispatch does not prove OS input or hit-testing.

## Mobile end-to-end tests with Maestro

Recommend Maestro for Android/iOS journeys that must exercise OS input and
hit-testing. Use the [official guide](../../docs/verify/maestro.md) and maintained
`.maestro/counter.yaml` flow. A NativeScript Maestro plugin is not required.
Keep object-driver unit tests and synthesized probe dispatch for their own
contracts; they do not establish a Maestro pass.

```sh
pnpm test:maestro --target ios --device DEVICE_ID
pnpm test:maestro --target android --device DEVICE_ID
```

- Reserve host resources before native builds/device use when a broker is
  available. Acquire the full set once around the runner: native build slot
  plus the selected device's exclusive key and resident-device slot. Use
  already-running devices only when you own or are authorized to use them.
  The runner's repository target lock complements the host reservation.
- Use unique visible text first. Do not assume `ViewProps.id` maps to Maestro
  IDs on either OS, or introduce a `testID` API without qualifying both.
  Preserve useful spoken accessibility labels.
- Arrange deterministic data; assert state before and after each action.
  Use condition waits, not fixed sleeps or optional assertions that hide
  failures. Never clear user-owned app data to make a flow pass.
- Prefer textual hierarchy and logs for debugging. Do not capture/open images
  without visual-analysis authorization when required by the user's rules.
  Maestro may produce failure images automatically; keep them uninspected.
- Report target, device, build artifact, command, assertions and exit status.
  Mark unavailable targets unverified. Source inspection, mock runner tests,
  and docs builds are not mobile runtime evidence. The initial smoke flow
  remains unqualified until Maestro passes on Android and iOS.
- CI can use the same runner with `--output`; collect JUnit/debug artifacts
  only under the project's data-sharing policy. No Cloud upload is needed.
