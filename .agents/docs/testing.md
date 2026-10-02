# Probes and regression tests

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

Use [single-case probing](../../docs/probing.md) for platform investigations:
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
