# @octane-xplat/mcp

MCP server for agents working on Octane Xplat consumer apps. One entry point
gives the agent detected project identity, framework versions, guidance,
capability discovery, and the shared permission / session / evidence contracts
that every later subsystem (docs, code search, runtime, inspection,
development actions) plugs into.

Published as a normal lockstep package on npm. The qualified surface today is
the Chromium consumer lane (status/docs/code/build/launch/inspection/
interaction/development actions); native-platform inspection and input
adapters report honest `unavailable` results until they are qualified — see
[Remaining acceptance](#remaining-acceptance).

## Install and run

Add the server to a consumer app and point the agent's MCP client at the
installed `xplat-mcp` bin:

```sh
pnpm add -D @octane-xplat/mcp
```

```json
{
	"mcpServers": {
		"octane-xplat": {
			"command": "xplat-mcp",
			"args": ["--workspace", "/path/to/app-workspace"]
		}
	}
}
```

A one-off run without a devDependency also works:

```sh
pnpm dlx @octane-xplat/mcp --workspace /path/to/app-workspace
```

For development inside this repository — `start` runs the TypeScript source
directly (Node ≥22.18 strips types); `test` and `prepack` run `vite build` so
the checked and packed surface is the emitted `dist/`:

```sh
pnpm --filter @octane-xplat/mcp start -- --workspace <path>
pnpm --filter @octane-xplat/mcp test
```

Transport is stdio; stdout is protocol-clean (diagnostics go to stderr).
Options: `--workspace` / `XPLAT_MCP_WORKSPACE` (default cwd), `--app` /
`XPLAT_MCP_APP` (pre-select an app id), `--permissions` /
`XPLAT_MCP_PERMISSIONS` (comma-separated scope grants), `--evidence-dir` /
`XPLAT_MCP_EVIDENCE_DIR`.

## Tools

| Tool                                    | Purpose                                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xplat_project_status`                  | Detected apps, selection state, framework version binding, guidance sources, docs/code-index status, declared platforms, runtime prerequisites, capability summary, permissions, boundaries, next steps.       |
| `xplat_select_app`                      | Explicitly bind an app by id/path/name. Ambiguous or unknown selections fail with the candidate list — the server never picks silently.                                                                        |
| `xplat_capability_matrix`               | Per-platform capability entries: build, launch, logs, inspection, screenshot, interaction, and the rest are separate rows with status, detail, and alternatives.                                               |
| `xplat_permissions`                     | Grant states per scope plus the action-time check result and recovery path.                                                                                                                                    |
| `xplat_sessions`                        | Retained sessions and launch progress; optional `sessionId` selects exact status, including failures and ended sessions.                                                                                                                                           |
| `xplat_targets`                         | Launchable targets per platform (simulators, devices, host targets) with availability, missing-toolchain reasons, and busy/ownership state.                                                                    |
| `xplat_build`                           | Build the bound app for one platform as a job — same commands `xplat build` runs. `requestKey` dedupes retries.                                                                                                |
| `xplat_launch`                          | Start an owned session and return its durable ID immediately; poll `xplat_sessions` for readiness, end with `xplat_session_end`.                                                                              |
| `xplat_attach`                          | Bind a compatible already-running dev session (user-owned, preserved).                                                                                                                                         |
| `xplat_diagnostics`                     | Retained session discovery; log pages under `logs`, native summaries under `reports`, explicit source `coverage`, and original report reads. Build/action jobs retain their own logs.                    |
| `xplat_dev_actions`                     | The bound app's live development-action registry: instance identity, revision, declarations (contracts, effects, availability). Empty vs disconnected vs no-bridge are distinct states.                        |
| `xplat_dev_action_invoke`               | Invoke an action against an exact app instance + registry revision. Pre-validates input, availability, grants and queue bounds; returns a job (`requestKey` dedupes retries).                                  |
| `xplat_dev_action_status`               | Invocation status/result — same job data restricted to dev-action jobs, with instance/request identity.                                                                                                        |
| `xplat_job_status` / `xplat_job_cancel` | Bounded job status and cooperative cancellation.                                                                                                                                                               |
| `xplat_session_end`                     | Ownership-safe cleanup: owned sessions release resources; attached sessions are preserved (our log taps still stop).                                                                                           |
| `xplat_evidence`                        | `list` / `retain` / `delete` evidence; retain takes an optional ISO expiration.                                                                                                                                |
| `xplat_code_search`                     | Exact identifier/token search over current source (`mode: 'exact'`), optional local semantic index (`mode: 'semantic'`), or both (`'auto'`). Corpus filters: `app`, `framework`; platform and package filters. |
| `xplat_code_read`                       | Bounded read of current source by search ref (`xplat-code://…`) or explicit corpus + path; results carry freshness markers and continuation offsets.                                                           |
| `xplat_docs_search` / `xplat_docs_read` | Installed-version docs search and bounded page reads, with snapshot/version provenance and unavailable/conflict results.                                                                                       |
| `xplat_guidance`                        | Tailored guidance for the selected app's installed packages.                                                                                                                                                   |

## Retrieve the app's documentation

Select your app first. Search defaults to maintained guides for its actual
installed versions; design notes and recipes require an explicit corpus.
The provider validates release tags and preserves cached snapshot commits.
Missing matching docs return an installed-source fallback instead of latest docs.

```json
{
	"name": "xplat_docs_search",
	"arguments": { "query": "testID", "package": "@octane-xplat/ui", "platform": "web" }
}
```

Read a result using its `ref`. A ref from an older installation remains tied
to that version and is labeled outside the installed binding after an upgrade.
`xplat_project_status` reports provider readiness; each search reports actual
snapshot availability, so readiness alone is not a successful retrieval.

```json
{
	"name": "xplat_docs_read",
	"arguments": {
		"package": "@octane-xplat/ui",
		"path": "docs/testing/test-identifiers.md",
		"limit": 2000
	}
}
```

Code search reads the bound application's source plus its installed
`@octane-xplat/*` package sources — corpora stay labeled and distinguishable.
The semantic index is local TF-IDF (`local-tfidf`): it builds in the
background, reports `preparing` / `ready` / `stale` / `unavailable`, and stale
hits are revalidated against current file content before serving. Nothing
leaves the machine; there is no remote embedding path. Secrets, private
configuration, generated output, and paths outside the bound scope are
excluded and unreadable.

Every result is `{ ok: true, data } | { ok: false, error }` where `error` is a
`ContractError` from the shared vocabulary.

The service layer lives in `packages/cli/src/mcp/` — the `xplat` CLI projects
the same contracts through its agent commands (`xplat catalog --json` is the
entry point). `packages/mcp/src/` holds the stdio transport adapter: tool
registration wraps the shared services, and the published `.d.ts` contract
surface stays here under `types/contracts/`. Sources are TypeScript; `pnpm
build` emits the runnable ESM to `dist/` (`pnpm test` builds first).

## Contract surface (`@octane-xplat/mcp/contracts/*`)

Later work packages integrate against these modules; the `.d.ts` files under
`types/contracts/` are the documented surface and the compiled `dist/` modules
carry the runtime values and stores (re-exported from `@octane-xplat/cli`).

- `errors` — `ContractErrorCode` vocabulary (`invalid_selection`,
  `ambiguous_selection`, `permission_denied`, `unsupported_capability`,
  `prerequisite_missing`, `target_busy`, `stale_identity`,
  `disconnected_runtime`, `execution_failure`, `not_found`, `cancelled`,
  `timeout`, `unavailable`) with `recovery` (smallest corrective action) and
  `retryable` semantics.
- `identity` — `Platform`, `AppRef`, `FrameworkBinding` (installed / workspace /
  lockfile / provisional version sources), `GuidanceStatus`,
  `RuntimePrerequisite`, `AppSelection` (`bound` / `ambiguous` / `none`).
- `capabilities` — `CapabilityId`, `CapabilityStatus`, `CapabilityEntry`,
  `PlatformCapabilityMatrix`, and the `CapabilityProvider` / registry seam
  adapters use to report real support.
- `policy` — `PermissionScope` grants (`workspace`, `runtime-actions`,
  `visual-capture`, `evidence-retain`, `external-effects`), `PolicyStore` with
  task-authorization baseline, action-time checks, expiry, revocation, and an
  elicitation channel for explicit developer grants. `visual-capture` is never
  baseline-granted.
- `sessions` — `SessionBinding` (`owned` / `attached`, `starting` / `ready` /
  `disconnected` / `stopped`), `Job` (`queued` → `running` → terminal, with
  `cancelling` / `cancelled`), request-key deduplication, and ownership-safe
  `end` / `shutdown`.
- `evidence` — `EvidenceRecord` with provenance (app, platform, target,
  session, build identity, time, interaction mechanism), session-scoped
  default retention, `retain` with expiration, ownership-safe deletion, and
  `TRANSCRIPT_LIMITATION_NOTE`. `isOsInputEvidence` is the guard that keeps
  handler-dispatch results from being labeled OS-input verification.
- `status` — `ProjectStatusReport`, the shape `xplat_project_status` returns.
- `code` — the `CodeProvider` seam the context's `code` slot consumes, plus
  `CodeHit` / `CodeSearchResult` / provenance and freshness shapes.
- `boundaries` — `PRODUCT_BOUNDARIES`, the advertised out-of-scope list.
- `actions` — the app-declared development-action wire contract (package G):
  `DevActionDeclaration` (stable id, title, description, runtime-validatable
  input/result field contracts, disclosed effects, availability, execution
  policy), `DevActionRegistryAnnouncement` (instance identity + revision +
  declarations), invocation request/outcome types, and the field-subset
  validators both sides share. The app announces its registry through a
  dev-bridge (`xplatDevBridge` vite middleware in `@octane-xplat/cli`, included
  in the `xplatNative` preset); the server scans the app's bridge session
  files under `node_modules/.cache/xplat/dev-bridge/` and polls live
  announcements — an empty registry is never confused with a disconnected app.

## Runtime (work item D)

The shared `runtime/` service (in `packages/cli/src/mcp/runtime/`, re-exported
here) implements build/launch/attach/logs/cleanup for consumer apps
on all six platforms. Adapters (`runtime/adapters/*`) own platform
mechanics and always spawn the app's own toolchain — `pnpm exec vite`,
`pnpm exec ns run …`, the app's installed `@octane-xplat/cli` dev entry, or
its `dev` script — so a session behaves like the app's installed framework
version. The shared `runtime/service` module owns the contract behavior: explicit
app+target binding, `target_busy` contention, job dedupe/cooperative
cancel, ownership-safe cleanup, bounded logs, and capability-matrix entries.

| Platform       | Launch                                                            | Attach                                             | Host gate  |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| web / Chromium | `pnpm exec vite` + headless Chromium (devtools endpoint reported) | probe common dev ports — identity heuristic        | none       |
| iOS            | `ns run ios --device <udid>`                                      | booted sim + app running → `simctl log stream` tap | macOS      |
| Android        | `ns run android --device <serial>`                                | package running → `adb logcat --pid` tap           | none (adb) |
| macOS          | `xplat.targets.macos.dev` → CLI dev entry, else `pnpm run dev`    | pgrep on app root — no scrollback                  | macOS      |
| Linux          | `pnpm run dev` (app-owned script)                                 | pgrep on app root                                  | Linux      |
| Windows        | `ns run windows`                                                  | not yet qualified                                  | Windows    |

Readiness is probe/marker-confirmed (`ready` session state) — HTTP 200 for
web, the host-start marker for macOS, `Successfully synced application` /
first `CONSOLE` line for `ns run`. A timeout or pre-ready exit marks the session `failed`
and releases its owned resources. Chromium is located via
`XPLAT_MCP_CHROMIUM`, the Playwright browser cache, or system installs;
without it the web session still reports the server URL with an explicit
`browser.launched: false`.

Physical iOS devices, Windows attach detection, and non-simulator iOS log
taps are reported limitations, not silent gaps — the capability matrix
carries the detail and an alternative.

Launch accepts an optional exact target ID or platform name. Platform or omitted
selection requires exactly one eligible target; ambiguity returns candidates.
Use the same session ID for status, diagnostics, and cleanup:

```js
const launch = await client.callTool({name: "xplat_launch", arguments: {target: "ios"}});
const {sessionId} = launch.structuredContent.data.session;
await client.callTool({name: "xplat_sessions", arguments: {sessionId}});
await client.callTool({name: "xplat_diagnostics", arguments: {sessionId}});
await client.callTool({name: "xplat_session_end", arguments: {sessionId}});
```

Ending a session
also cancels startup when it has not reached readiness.

## Inspect and interact with Chromium

This development package adds `xplat_inspect`, `xplat_interact`, and
`xplat_screenshot` for the Chromium browser started by `xplat_launch`.
Select a DOM `id` or shared `testID` explicitly; duplicate names fail.
Inspection returns bounded text/value/geometry, a document identity, and
session/build provenance. Main-document DOM hosts are the qualified surface;
shadow roots, frames, component ownership and signals are excluded.

```json
{
	"name": "xplat_inspect",
	"arguments": {
		"sessionId": "SESSION_FROM_LAUNCH",
		"control": { "kind": "testID", "name": "counter.increment" }
	}
}
```

Pass the returned `documentId` when interacting. A `dom-event` interaction
clicks the control center through CDP. `os-input` sends Space or Enter through
the macOS event system to the owned headed Chromium process. It requires
Swift, OS event-posting permission, and a desktop-input reservation. The
server does not open permission prompts. Inspect the resulting app state
separately; sending input alone is not an assertion.

```json
{
	"name": "xplat_interact",
	"arguments": {
		"sessionId": "SESSION_FROM_LAUNCH",
		"documentId": "DOCUMENT_FROM_INSPECTION",
		"control": { "kind": "testID", "name": "counter.increment" },
		"mechanism": "os-input",
		"key": "Space"
	}
}
```

Screenshot requests require an explicit current-task `visual-capture` grant
before connecting or sending a capture command. No grant means no capture.
Password fields, hidden inputs and hosts marked `data-xplat-private` are
redacted in nonvisual inspection; this does not guarantee complete redaction
of arbitrary application data.

```json
{ "name": "xplat_screenshot", "arguments": { "sessionId": "SESSION_FROM_LAUNCH" } }
```

## Run the consumer acceptance lane

Use a fresh directory outside your existing app. These commands scaffold the
normal web starter and add one app-owned development action. The in-repo lane
links framework packages to this checkout; other dependencies
install normally. The runner checks docs and current code, build/readiness,
the counter's `0 → 1` transition, action discovery/invocation, screenshot
denial, logs, and owned browser/server/profile cleanup. It also checks that
the fixture declaration and handler are absent from production artifacts.

```sh
node packages/mcp/tests/prepare-consumer.mjs /tmp/new-xplat-mcp-app
pnpm --dir /tmp/new-xplat-mcp-app install
node packages/mcp/tests/consumer-workflow.mjs /tmp/new-xplat-mcp-app
```

The default run supplies browser-event evidence. On macOS, reserve the full
resource set and add `--os-input` for a headed Chromium OS keyboard journey.
Only the owned browser receives the events; the helper attempts to restore the
previously active application and reports when restoration is unconfirmed.
The runner captures no images.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"desktop_input":1},"purpose":"MCP consumer OS keyboard acceptance"}' -- node packages/mcp/tests/consumer-workflow.mjs /tmp/new-xplat-mcp-app --os-input
```

The packed-artifact lane qualifies the same checks against release-evidence
packaging: `prepare-packed-consumer.mjs` packs the needed packages, scaffolds
through the packed `create-octane-xplat` bin, installs `file:` tarballs (no
registry/latest resolution for framework packages), and tags the framework
HEAD as `v<installed version>` in a local bare release fixture. The runner
spawns the consumer's own installed `xplat-mcp` bin over stdin/stdout and
redirects the canonical release-repo URL to the fixture through a per-process
`url.insteadOf` (never user git config). Snapshot cache and evidence roots are
isolated under the work dir. OS keyboard input additionally requires an
unlocked console — the window server refuses activation while the screen is
locked, and the run reports that block honestly.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"desktop_input":1},"purpose":"packed MCP stdio consumer acceptance"}' -- bash -c '
  node packages/mcp/tests/prepare-packed-consumer.mjs /tmp/xplat-packed-mcp &&
  node packages/mcp/tests/packed-stdio-consumer.mjs /tmp/xplat-packed-mcp'
```

For an existing consumer, declare actions behind the development build gate.
Registration automatically starts the bridge when the dev-server endpoint is
present. The action's contracts and effects appear in `xplat_dev_actions`;
no action-specific MCP tool definition is needed.

```ts
if (import.meta.env.DEV) {
	const { registerDevAction } = await import('@octane-xplat/platform/dev-actions')
	registerDevAction({
		id: 'fixture.describe-counter',
		title: 'Describe the counter',
		description: 'Identify this test fixture without external effects.',
		result: { fields: { label: { type: 'string' } } },
		effects: { summary: 'Read fixture identity.' },
		run: () => ({ label: 'starter-counter' }),
	})
}
```

## Remaining acceptance

The Chromium lane is an incremental milestone. All six platforms remain
required by the original plan. Native inspection/input adapters, attached
Chromium inspection, approved screenshot qualification, and the complete
platform-by-capability acceptance matrix remain unfinished. Runtime adapters
and honest unavailable responses do not establish native behavior.

| Target          | Inspection/input qualification boundary                                        |
| --------------- | ------------------------------------------------------------------------------ |
| Chromium        | Owned main-document DOM; browser events plus macOS scoped OS keyboard path     |
| iOS / Android   | Native host inspection and OS-input adapters still required                    |
| macOS           | AppKit host inspection/input still required; Chromium on macOS is web evidence |
| Linux / Windows | Target-host adapters and independent consumer qualification still required     |

## Boundaries

This server complements the agent's editing tools. It is not an autonomous
code editor or deployment system: no arbitrary shell execution, no arbitrary
runtime expression evaluation, no universal component tree, no hook/signal
inspection, no profiling API, no cloud indexing by default, no app-store
operations, no credential management. Screenshots are permission-gated —
capability existence never implies capture approval.
