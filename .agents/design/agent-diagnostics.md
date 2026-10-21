# Runtime diagnostics for agents

Status: retained development logs implemented, 2026-10-20. The original
proposal was narrowed to capture existing output with minimal new machinery.
Structured framework traces, application snapshots, and OS crash collection
remain separate future work.

## Chosen scope

An agent can list a selected app's retained development runs and retrieve
output produced before it connected, including after the capture process exits.
The [public guide](../../docs/testing/development-logs.md) owns commands,
configuration, retention limits, and user-facing coverage.

```sh
pnpm exec xplat logs --platform ios --json
pnpm exec xplat logs --run RUN_ID --cursor 0 --limit 50 --json
```

Use the existing development launcher as the collection boundary. All six
target branches pass their stdout/stderr through the same capture helper;
macOS AppKit does not need a new app-command transport to expose host output.
The web development bridge forwards warnings, console errors, uncaught errors,
and unhandled rejections into that process stream. Default error behavior is
preserved; ordinary object payloads are omitted.

## Ownership and persistence

- `commands/dev.ts` starts one capture per selected target. Ordinary build and
  type-generation subprocesses do not create retained development runs.
- `procs.ts` tees output to the terminal and capture, decodes split UTF-8,
  and bounds incomplete lines without truncating terminal output.
- `dev-logs.ts` owns private per-run metadata and two rotating JSONL segments
  under the app's local cache. Rotation and completed-run eviction bound storage;
  active runs are retained. Writes reach the local filesystem synchronously,
  without promising survival of power loss or storage failure.
- CLI logs handlers list/read those files directly with explicit app/run
  selection. No agent runtime host, running app response, or app inspection
  channel is required. Session/job logs retain their existing service path.
- `xplatDevBridge` authenticates browser batches using its existing server
  token. Its serve-only HTML hook installs the browser collector; production
  builds receive neither the collector nor endpoint.

Each record carries sequence, timestamp, stream, source, and text. Run metadata
carries platform, target, capture owner PID, and start/end times. Sequence cursors
belong to a specific run. Missing retained history, capped lines, and incomplete
file tails are reported; timestamp proximity does not establish causality.

## Evidence boundaries

Maintained regressions:

| Check                                                               | Evidence                                                                                                                                                                     | Limit                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Subprocess and storage](../../packages/cli/test/dev-logs.test.mjs) | Real Node subprocesses tagged with all six platforms, post-exit reads, bounded rotation, filtered cursors, UTF-8, partial/long lines, run isolation and active-run retention | Platform tags exercise common capture code; they do not qualify device or native-host output. |
| [CLI selection](../../packages/cli/test/agent-cli.test.mjs)         | CLI command dispatch, app/platform/run selection, pagination and reads without an agent host                                                                                 | Fixture apps; no native device.                                                               |
| [Browser client](../../packages/cli/test/dev-browser-logs.test.mjs) | Serialized script execution, original console calls, uncaught/rejection listeners, object omission and authenticated delivery                                                | VM execution alone is not browser qualification.                                              |
| [Development HTTP](../../packages/cli/test/dev-bridge.test.mjs)     | Real HTTP authentication, validation and forwarding to process stderr                                                                                                        | No OS crash collection.                                                                       |

Actual browser smoke and dependent typecheck results are recorded separately
in Silo's recipe audit for the committed revision. The native checks below
exercise real launchers and runtimes; subprocess platform tags alone do not
qualify a native target.

### Native runtime qualification (2026-10-21)

At revision `33c253a59`, isolated apps emit unique `console.log`,
`console.warn`, and `console.error` startup markers through `xplat dev`.
The first `xplat logs --run RUN_ID --cursor 0 --json` read happens after
all three markers appear. A second CLI read after stopping the development
process must retain every marker and return `historical: true`.

```sh
pnpm exec xplat dev TARGET_ID
# After the startup markers appear, in another terminal:
pnpm exec xplat logs --json
pnpm exec xplat logs --run RUN_ID --cursor 0 --json
# Stop xplat dev, then repeat the same run read.
```

| Target  | Runtime evidence                                                  | Result                                                   |
| ------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| iOS     | iPhone 18 Pro simulator, iOS 27.0; NativeScript 9.1.0 launcher    | All three startup markers retrieved live and after exit. |
| Android | Connected CPH2551 device, Android 16; NativeScript 9.1.1 launcher | All three startup markers retrieved live and after exit. |
| macOS   | Apple Silicon, macOS 27.0.1; AppKit/JavaScriptCore host           | All three startup markers retrieved live and after exit. |

All three launchers forward these messages on stdout, including warnings and
errors. The captured stream identifies the launcher's channel, rather than
JavaScript severity. CLI app/platform discovery and cursor continuation also
passed against each retained native run. These checks establish startup
console retention; they do not qualify uncaught exceptions, OS crash reports,
Android emulators,
physical iOS devices, WKWebView page forwarding, or OS input.

## Deliberate limits

The capture records only what a tool or host forwards. It cannot recover prior
output from a process launched outside xplat dev, report every OS diagnostic,
or explain internal state that was never logged. Raw log strings may contain
sensitive values; local owner-only files and object omission do not guarantee
redaction. Browser queues/batches are bounded and disclose lost deliveries.

A missing/dead capture owner marks history as historical; apparent PID liveness
is only a hint and does not prove the app is ready or healthy. Retained runs
are separate from agent-owned session/job captures. App-specific snapshots can
use existing development actions where available, but are not part of this slice.

Native crash/ANR/hang reports, symbolication, operation correlation, framework
state snapshots, and general native-plugin interception remain outside the
retained-log implementation. The AppKit application-command bridge remains an
independent gap rather than a prerequisite for reading development output.

The maintained Chromium qualification starts a real xplat dev process, loads
its page, retrieves warnings/errors/rejections through the CLI after process
exit, and checks that release HTML excludes forwarding. Run it locally after
building the CLI; it uses the existing apps/web Playwright installation and
captures no images. It is outside the ordinary test glob and PR checks:

```sh
pnpm --filter @octane-xplat/cli... --if-present build
node packages/cli/test/verify-dev-logs-browser.mjs
```
