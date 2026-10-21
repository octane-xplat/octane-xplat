# Read development logs

> Retrieve recent errors and output after an agent connects, including after a development process exits.

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
pnpm exec xplat logs --json
pnpm exec xplat logs --platform ios --json
```

Read a run using its returned `runId`. Replace `RUN_ID` below with that exact
value. Reads work without an agent session and after the app exits:

```sh
pnpm exec xplat logs --run RUN_ID --limit 50 --json
```

The first read returns the newest matching records. To continue, reuse the
same run ID and the returned `nextCursor`; replace `NEXT_CURSOR` below with
that number. Use cursor `0` to start at the oldest retained record instead:

```sh
pnpm exec xplat logs --run RUN_ID --cursor NEXT_CURSOR --limit 50 --json
pnpm exec xplat logs --run RUN_ID --cursor 0 --stream stderr --json
```

If your workspace has several apps, select the intended app explicitly.
Retained logs belong to that app's directory; a run ID from another app is
rejected. Existing session and job reads remain available as well:

```sh
pnpm exec xplat logs --app APP_ID --json
pnpm exec xplat logs --session SESSION_ID --json
pnpm exec xplat logs --job JOB_ID --json
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

## Retention and missing evidence

Output is stored locally under the app's
`node_modules/.cache/xplat/logs/`. Each run retains two rotating segments of
at most 512 KiB each. At most 20 completed runs are kept, alongside active
captures. Records include timestamps, stream, source, and sequence; the run
includes platform, target, capture owner PID, and start/end times.

Read `capturedFrom`, `coverage`, `historical`, `truncated`, `dropped`, and
`incompleteTail` before drawing conclusions. `historical: false` only means
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
pnpm exec xplat logs --run RUN_ID --cursor 0 --json
```

Capture does not recover output from before startup or from an app launched
outside `xplat dev`. Agent-owned session logs and retained development-run
logs are separate captures. Native crash reports, ANRs, hangs, network
payloads, and application state snapshots are outside this feature.

Log strings can contain private data. Capture stays local and files use
owner-only permissions where supported; it does not reliably redact arbitrary
strings. Avoid logging credentials, user input, or request bodies, and share
only the records needed to diagnose the problem.
