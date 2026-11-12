# iOS HMR reload cancellation qualification

This diagnostic driver continues the iOS acceptance work for issue #188. It
starts the Go-backed `xplat dev` session in an isolated consumer worktree,
forces two rapid whole-graph reloads, and checks that reload cancellation does
not surface as an unhandled rejection while a genuine module error still
reports. It edits only the consumer's `apps/mobile/src/index.ts` and
`src/lottie-probe.ts`, restores both during cleanup, and writes run evidence to
the supplied report directory.

The driver is retained for a later, explicitly assigned acceptance run. Its
presence does not establish a passing result. Use the prescribed iPhone
simulator only after reserving it and confirming that its current owner permits
the run. Do not run it against a shared or user-owned app.

Invoke it with Python 3, a prepared isolated consumer worktree, and the locally
built Go CLI at `research/go-cli/xplat-go-darwin-arm64-cli`:

```sh
python3 tools/platform-qualification/ios-hmr-reload/driver.py \
  --consumer /absolute/path/to/isolated-consumer \
  --report /absolute/path/to/ignored-report-directory
```

The report directory contains the CLI log, progress snapshots, and final
result. Keep those generated artifacts out of Git.
