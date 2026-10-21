# Read development diagnostics

> Read captured output and available native failure reports, including after the app exits.

Start your app through `xplat dev` from its app directory. It records the
selected targets' output from startup while continuing to print it in your
terminal. For example, start just the web target:

```sh
pnpm exec xplat dev web
```

In another terminal, list that app's recorded runs. Each run identifies one
target started by one invocation; a new start creates a new run ID. You can
filter the list by platform, including `ios`, `android`, or `macos`:

```sh
pnpm exec xplat diagnostics --json
pnpm exec xplat diagnostics --platform ios --json
```

Read a run using its returned `runId`. Replace `RUN_ID` below with that exact
value. Reads work without an agent session and after the app exits:

```sh
pnpm exec xplat diagnostics --run RUN_ID --limit 50 --json
```

The first read returns the newest matching records. To continue, reuse the
same run ID and the returned `logs.nextCursor`; replace `NEXT_CURSOR` below with
that number. Use cursor `0` to start at the oldest retained record instead:

```sh
pnpm exec xplat diagnostics --run RUN_ID --cursor NEXT_CURSOR --limit 50 --json
pnpm exec xplat diagnostics --run RUN_ID --cursor 0 --stream stderr --json
```

If your workspace has several apps, select the intended app explicitly.
Retained logs belong to that app's directory; a run ID from another app is
rejected. Existing session and job reads remain available as well:

```sh
pnpm exec xplat diagnostics --app APP_ID --json
pnpm exec xplat diagnostics --session SESSION_ID --json
pnpm exec xplat diagnostics --job JOB_ID --json
```

## What is captured

| Target            | Captured output                                                                                                                       | Boundary                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Web               | Vite output plus browser warnings, console errors, uncaught errors, and unhandled rejections when the development bridge is installed | Browser forwarding requires the web Vite plugin below. Ordinary `console.log`/`info`/`debug` messages stay in the browser. |
| iOS and Android   | Output forwarded by `ns run`, including errors the native toolchain forwards                                                          | Not every OS diagnostic reaches this stream. Simulator/emulator and physical-device behavior must be checked separately.   |
| macOS             | The configured development host's forwarded output                                                                                    | AppKit command-bridge support is not required. WKWebView page errors need the web plugin in the page's Vite config.        |
| Linux and Windows | Output forwarded by the configured development command                                                                                | The capture path is shared; this does not qualify a native runtime on either platform.                                     |

Current web starters include the bridge. For an older or custom web Vite
config, add it to the existing plugins array. This small config illustrates
the addition; retain your app's other plugins and settings:

```ts
import { defineConfig } from 'vite'
import { xplatDevBridge } from '@octane-xplat/cli/vite'

export default defineConfig({ plugins: [xplatDevBridge()] })
```

Browser forwarding is installed only while Vite serves the development app.
Production builds receive no forwarding script or bridge endpoint. It keeps
normal console reporting and uncaught-error behavior. Browser object arguments
are represented as `[object omitted]`; strings and error stacks are forwarded.
For a quick check, temporarily add a warning to your app's startup code:

```ts
console.warn('Development log check: app started')
```

## Native reports

A run read returns `logs`, `reports`, and `coverage`. Logs contain output and
its cursor; reports are a separate snapshot of existing OS evidence. Repeat
the run read to discover reports that arrive later, even when the log cursor
has reached the end:

```sh
pnpm exec xplat diagnostics --run RUN_ID --cursor NEXT_CURSOR --json
```

The response separates these two kinds of evidence. The example below shows
an empty log page with a candidate native crash report:

```json
{
	"runId": "run_123",
	"logs": { "records": [], "nextCursor": 42 },
	"reports": [
		{
			"id": "report_456",
			"kind": "native-crash",
			"summary": "EXC_CRASH (SIGABRT)",
			"association": "candidate"
		}
	],
	"coverage": {
		"logs": "captured",
		"nativeReports": { "status": "available", "detail": "Local Apple .ips crash reports only." }
	}
}
```

To read an original, use an exact report ID returned for that run. Report reads
work from the retained copy even after the OS removes its original file or the
device disconnects. Report selection cannot be combined with log pagination
or stream filters:

```sh
pnpm exec xplat diagnostics --run RUN_ID --report REPORT_ID --json
```

| Target        | Report source                                                                                    | Limit                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS         | Local `.ips` crash reports matching recorded process ownership, or candidate bundle/time matches | Scans the current user's `~/Library/Logs/DiagnosticReports` on the Mac that ran the app.                                                                  |
| iOS simulator | Local `.ips` crash reports with the matching bundle id, simulator platform, and run time         | Known other-simulator paths are excluded. Redacted paths may leave device ownership uncertain. Physical iOS report extraction is unsupported.             |
| Android       | Package-scoped exit history from the recorded device through ADB                                 | Exit reason and status only. Full ANR traces and tombstones are not collected. Requires a connected, authorized device and an OS supporting exit history. |

A report is `confirmed` only when its observed host PID, process launch time,
and report time match the run. Any bundle id present must also match; Apple
reports can omit it after a temporary development bundle is removed. A bundle/time match alone is a
`candidate`; it must not be treated as proof of which run failed. Android exit
times use the device's current time zone. Review `associationReason` when
interpreting a report:

```sh
pnpm exec xplat diagnostics --run RUN_ID --json
```

`coverage.nativeReports.status` distinguishes `available`, `none-found`,
`partial`, `unavailable`, and `unsupported`. `none-found` means the supported
source was scanned without a matching report; it does not prove app health.
Android reports `partial` because exit records omit the underlying trace.
A missing device, app identity, directory access, or tool never becomes an
empty successful coverage claim:

```sh
pnpm exec xplat diagnostics --run RUN_ID --json
```

Native identity is recorded during a new `xplat dev` run. Mobile identity comes
from NativeScript's successful sync output; macOS identity comes from the
AppKit launch configuration, with observed host PIDs recorded across restarts.
An older run or a failure before mobile identity is reported may have logs
without native report coverage. Session/job selectors return their own log
captures and explicitly report native lookup as unavailable; use a retained
development run for native reports:

```sh
pnpm exec xplat diagnostics --session SESSION_ID --json
pnpm exec xplat diagnostics --job JOB_ID --json
```

## Retention and missing evidence

Output is stored locally under the app's
`node_modules/.cache/xplat/logs/`. Each run retains two rotating segments of
at most 512 KiB each. At most 20 completed runs are kept, alongside active
captures. Records include timestamps, stream, source, and sequence; the run
includes platform, target, capture owner PID, and start/end times.

Read the `logs` fields `capturedFrom`, `historical`, `truncated`, `dropped`,
and `incompleteTail`, plus the top-level `coverage`, before drawing conclusions. `historical: false` only means
the capture owner process appears present; it does not establish app health.
`dropped` counts records evicted over this run's lifetime, including on a first
read. Streams refer to the development command's stdout/stderr; a host may
already have combined the app's original output channels.
Long retained lines are capped at 8,192 characters and marked
`lineTruncated`; an interrupted file append is disclosed by `incompleteTail`.
Browser queues are bounded too, with a warning reporting lost deliveries.
Forwarded browser messages are capped at 2,048 characters and mark truncation
in their text.
This command requests all still-retained history so any eviction is explicit:

```sh
pnpm exec xplat diagnostics --run RUN_ID --cursor 0 --json
```

Capture does not recover output from before startup or from an app launched
outside `xplat dev`. Agent-owned session logs and retained development-run
logs are separate captures. Native reports are discovered separately as described below. Active hang
detection, network payloads, and application state snapshots are outside this feature.

Log strings and native reports can contain private data. Capture stays local and files use
owner-only permissions where supported; it does not reliably redact arbitrary
strings. Avoid logging credentials, user input, or request bodies, and share
only the records needed to diagnose the problem.

Native originals are retained separately from rotating logs, with at most 10
reports per run, 4 MiB per report, and 16 MiB total. Oversized or excess
reports are omitted, and coverage reports the limit. Discovery also bounds
Apple scanning to 100 recent files and 64 MiB of reads; any scan gap is
reported as partial. Report retention ends when its development run is pruned.
No OS reports are deleted, and no custom crash handler, root access, bugreport,
or profiling session is started.

The source formats are documented by [Apple's IPS reference](https://developer.apple.com/documentation/xcode/interpreting-the-json-format-of-a-crash-report)
and [Android's exit-history implementation](https://android.googlesource.com/platform/frameworks/base/+/android17-release/services/core/java/com/android/server/am/AppExitInfoTracker.java).

The alpha command is now `diagnostics`; the former `logs` command and
`xplat_logs` MCP tool have been removed. MCP exposes `xplat_diagnostics` with
`runId`, `reportId`, `sessionId`, and `jobId` selectors. Consumers of either
transport read log pages from `data.logs`, including `data.logs.nextCursor`:

```sh
pnpm exec xplat diagnostics --schema
```
