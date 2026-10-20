# Runtime diagnostics for agents

Status: proposal, 2026-10-20. Source assessment only; no new diagnostics
commands, transports, or device qualification have landed in this proposal.

An agent should be able to attach after a failure and retrieve the errors and
framework events that preceded it on web, iOS, Android, and macOS. The most
valuable evidence is transient history and framework decisions that cannot be
reconstructed from source or a current host-tree snapshot.

Recommend one event contract with platform collectors, a bounded history in
the app, and a second copy in the development host. Reuse development actions
for app-specific snapshots. Native macOS AppKit needs a transport before it
can participate; launching or attaching to its process does not provide one.

## Existing boundaries

Assessed against source at `e3634e376`. These are implementation findings,
not evidence of successful browser, simulator, emulator, or device runs.

| Boundary          | Current source evidence                                                                                                                                                                                                              | Consequence                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Session/job logs  | [Runtime log buffer](../../packages/cli/src/mcp/runtime/logs.ts) retains ordered, bounded records with cursors and explicit gaps.                                                                                                    | Reuse these read semantics; do not mistake process output for complete app diagnostics.            |
| Web               | [Web adapter](../../packages/cli/src/mcp/runtime/adapters/web.ts) captures owned Vite/Chromium process output; [CDP channel](../../packages/cli/src/mcp/inspection/cdp.ts) handles request responses and ignores unsolicited events. | Browser console, exception, and request-event collection needs additional wiring.                  |
| iOS               | [iOS adapter](../../packages/cli/src/mcp/runtime/adapters/ios.ts) captures NativeScript launch output; attach taps a booted simulator's log stream.                                                                                  | Physical-device collection and crash history are separate qualifications.                          |
| Android           | [Android adapter](../../packages/cli/src/mcp/runtime/adapters/android.ts) captures NativeScript launch output; attach starts PID-filtered logcat.                                                                                    | This is not a structured trace of framework operations; process replacement needs renewed binding. |
| macOS process     | [macOS adapter](../../packages/cli/src/mcp/runtime/adapters/macos.ts) captures owned dev-host output; attached output remains in the user's terminal.                                                                                | A warm attach currently supplies lifecycle notes, not the app's output.                            |
| macOS app channel | [macOS endpoint discovery](../../packages/platform/src/dev-bridge.macos.ts) describes WKWebView endpoint discovery and an unavailable AppKit channel.                                                                                | macOS qualification must name the renderer; WKWebView cannot qualify AppKit.                       |
| In-app bridge     | [Development actions](../../packages/platform/src/dev-actions.ts) start their bridge when an action is registered; [native endpoint discovery](../../packages/platform/src/dev-bridge.ts) uses the dev token and runtime origin.     | Diagnostics bootstrap must also work when zero actions are registered.                             |
| Host lifetime     | [Development middleware](../../packages/cli/src/mcp/dev-bridge.ts) runs in the dev server, independently of the CLI runtime host.                                                                                                    | Retain received diagnostics there before any agent connects.                                       |

## First increment

Include JS errors/rejections, framework warnings, app lifecycle, development
action outcomes, and a focused navigation/presentation failure trail. For
example, preserve the action, attempted presentation, missing owner, and
resulting failure as related records. Observe errors without suppressing the
runtime's existing reporting or termination behavior.

Native service outcomes are the next instrumentation slice: record operation
names, completion/failure/cancellation, and sanitized error codes at owned
service boundaries. Do not promise blanket interception of arbitrary plugins.
Network bodies, arbitrary object/heap inspection, render/signal tracing, and
continuous performance profiling are outside this first increment.

| Owner                      | Proposed responsibility                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform`                 | Renderer-independent event buffer and instance identity; platform files own error/lifecycle hooks. No DOM or SDK globals in shared code.                      |
| `ui`                       | Emit selected navigation/presentation diagnostics through a dependency-free seam consistent with the existing dependency graph; no new UI dependency or peer. |
| CLI development middleware | Authenticate batches, deduplicate replay, retain bounded history, and expose reads independent of app responsiveness.                                         |
| CLI agent and MCP services | Project the same read contract, coverage report, and explicit instance selection through their respective transports.                                         |
| Native development hosts   | Supply app-channel transport and lifecycle binding where HTTP endpoint discovery is unavailable.                                                              |

Before fixing package ownership, inspect the dependency graph and prove that
the producer seam does not create a cycle or retain diagnostics machinery in
production. Share the smallest existing buffer/contract utilities that fit;
do not create a new package solely to move this dependency-free code.

## Proposed event and read contract

The following JSON is a proposed wire example, not an installed API. Payloads
contain approved diagnostic fields rather than arbitrary native arguments.
An operation ID relates records only when instrumentation actually propagated
it; nearby timestamps alone do not establish causality.

```json
{
	"schemaVersion": 1,
	"appInstanceId": "app_41",
	"runtimeEpoch": "epoch_3",
	"buildId": null,
	"platform": "ios",
	"renderer": "nativescript",
	"sourceId": "app-js",
	"sequence": 82,
	"occurredAt": "2026-10-20T14:00:00.000Z",
	"level": "error",
	"category": "presentation",
	"name": "presentation.rejected",
	"operationId": "op_12",
	"data": {
		"reason": "owner-unmounted",
		"ownerId": "owner_7"
	}
}
```

| Read                      | Input                                                                                   | Output and failure boundary                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Discover sources          | Selected app; optional explicit instance                                                | Instances, renderer, available collectors, capture start, and source health. Multiple instances require a choice.   |
| Read events               | Explicit instance, opaque cursor, bounded limit; optional source/category/level filters | Records, next cursor, gaps, and capture coverage. A disconnected app can still have readable host history.          |
| Inspect current app state | Existing development-action instance, action ID, registry revision, and declared input  | Validated result with freshness supplied by the app. Unresponsive/disconnected apps cannot supply a fresh snapshot. |

An example proposed read response makes incomplete evidence explicit:

```json
{
	"records": [],
	"nextCursor": "opaque-host-cursor",
	"coverage": {
		"capturedFrom": "2026-10-20T13:59:00.000Z",
		"appConnected": false,
		"historical": true,
		"sources": [
			{ "id": "app-js", "state": "disconnected" },
			{ "id": "native-crash", "state": "unsupported" }
		]
	},
	"gaps": [{ "sourceId": "app-js", "reason": "buffer-overflow", "dropped": 16 }]
}
```

Required invariants:

- Each stream is ordered by instance, runtime epoch, source, and sequence.
  Epochs change on runtime replacement; build identity is independently
  reported as unknown until known. Hot reload must not silently mix builds.
- The host assigns its own receipt order and deduplicates reconnect replay.
  Cross-source receipt order is not a guarantee of execution order.
- Cursors bind to the host capture generation and filter selection. A host
  restart or incompatible cursor produces an explicit reset/stale result.
- Bound app and host buffers by event count and encoded bytes; bound each
  record and batch. Expose overflow, rejected oversized records, and missing
  sequence ranges. Collector failure must not recursively log itself.
- Event capture starts during development bootstrap, before an agent attaches.
  Unsynced app-buffer records are lost on process death; already acknowledged
  host records remain available until host shutdown or eviction. No disk
  persistence or crash-safe delivery is promised in the first increment.
- Authenticate with the existing dev trust boundary and bind announcements to
  the selected app. Associate process sessions with app instances only after
  a verified handshake; command-line matching alone is insufficient.
- Use approved fields and bounded serialization. Exclude tokens, input text,
  request bodies, URL query values, and raw native-call arguments by default.
  Arbitrary console strings can contain secrets; console forwarding needs an
  explicit collection/redaction policy and must not claim perfect redaction.
- Development instrumentation, endpoints, and tokens are absent from release
  artifacts. Multiple readers share collectors; ending an attached session
  does not stop a user-owned app or its development host.

## App-specific snapshots

Existing development actions can return declared structured state. For
example, an app can expose the size of its upload queue without exposing file
names or content. This is a handler-level read-only promise, not a sandbox.
The example belongs in a development-only app module, using the existing
production exclusion pattern from the [development-action guide](../../docs/testing/development-actions.md).

```ts
import { registerDevAction } from '@octane-xplat/platform/dev-actions'

export function registerUploadDiagnostics(pendingUploads: ReadonlySet<string>) {
	const action = registerDevAction({
		id: 'diagnostics.uploads',
		title: 'Read upload queue status',
		description: 'Returns the current queue size and capture time without starting uploads.',
		result: {
			fields: {
				pendingCount: { type: 'integer', minimum: 0 },
				capturedAt: { type: 'string' },
			},
		},
		effects: { summary: 'Reads upload queue size; no application changes.' },
		execution: { concurrency: 'overlap', retryable: true },
		run: () => ({ pendingCount: pendingUploads.size, capturedAt: new Date().toISOString() }),
	})

	return () => action.dispose()
}
```

Run the returned cleanup when unloading the development module. Do not invoke
a mutation action merely to inspect state.
The agent still follows the returned job to completion and checks the result;
job acceptance alone does not provide a snapshot.

## Platform work and qualification

| Target          | App-side work                                                                                                                                                          | Independent collector work                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Web             | Early bootstrap and error/rejection collection; qualify bridge connection and reload boundaries.                                                                       | Optional CDP event collection for owned browser sessions, without duplicating bridge records.         |
| iOS             | NativeScript JS/lifecycle hooks and authenticated dev-server communication.                                                                                            | Qualify simulator logs separately from physical-device logs; crash reports require a later collector. |
| Android         | NativeScript JS/lifecycle hooks and dev-server reachability on emulator and physical device.                                                                           | Rebind logcat on process replacement; Java/native crashes and ANRs require separate coverage.         |
| macOS AppKit    | Prove a local authenticated transport for the JavaScriptCore host, including warm attach. Existing host pipes are a feasibility lead, not a completed general channel. | Collect host output even when CLI attaches later; later qualify native crash/hang artifacts.          |
| macOS WKWebView | Qualify the dev-page bridge and distinguish page instance from native-host instance.                                                                                   | Cover native-host and web-content-process failures separately.                                        |

Linux and Windows retain explicit capability reports. The wire platform field
must accommodate them; this proposal does not qualify their transports or
claim that coverage of the four requested platforms closes six-platform work.

A dead or blocked JS runtime cannot provide fresh bridge responses. Native
crash reports, ANRs, hangs, memory-pressure termination, and symbolication
belong to a later OS collector increment. Report artifact availability and
symbolication quality rather than inferring a crash cause from disconnection.

## Delivery and acceptance

First prove the bootstrap, bounded buffering, and transport on web, iOS, then
macOS AppKit; qualify Android and WKWebView independently before calling this
increment cross-platform. Use temporary probes for feasibility and promote
the behavior below into maintained regressions. Runtime qualification is
separate from source tests and successful builds.

1. In an app with no development actions, emit an error before CLI connection;
   attach and retrieve it with its original instance/build identity.
2. Disconnect and reconnect the app; retrieve replayed records once, with
   explicit gaps for any app/host overflow or runtime replacement.
3. Acknowledge an event at the host, then terminate the app; retrieve the
   historical event without requiring the dead app to answer. Do not claim
   recovery of unsent events or a native crash report.
4. Run two instances; select one explicitly and verify no cross-instance
   records. Reject foreign, stale, and unauthenticated bindings.
5. Preserve uncaught-error behavior, default handlers, and user-owned process
   lifetimes. Verify idempotent installation/cleanup across hot reload.
6. Assert byte/count limits, filtered cursor progress, oversized payload
   handling, and omission of deliberately seeded sensitive fields.
7. Read a declared app snapshot and follow its job to a validated result;
   report unresponsive state rather than returning old state as fresh.
8. Inspect release artifacts for diagnostic bootstrap, hooks, tokens, and
   handlers; none may remain. Reconcile public docs, examples, CLI/MCP
   schemas, the Octane skill, and recipe coverage when implementation lands.

Record each actual target, renderer, device kind, capture source, and evidence
type. Keep browser/device execution local; do not add engines or emulation to
the lightweight PR checks. The existing [MCP consumer recipe](../docs/recipes/mcp-consumer-workflow.md)
remains scoped to its documented lane until new acceptance evidence lands.

Unresolved questions tracked in Silo: the AppKit transport for warm attach,
portable error-hook semantics, and the production-free producer seam. This
proposal changes no supported public workflow or release API.
