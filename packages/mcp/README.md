# @octane-xplat/mcp

MCP server for agents working on Octane Xplat consumer apps. One entry point
gives the agent detected project identity, framework versions, guidance,
capability discovery, and the shared permission / session / evidence contracts
that every later subsystem (docs, code search, runtime, inspection,
development actions) plugs into.

Currently `private`: it is not published and carries no supported consumer API
yet. Publishing requires the one-time npm stub + trusted-publisher setup in
`.agents/docs/releases.md` before the `private` flag can come off.

## Run

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

For development inside this repository:

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
| `xplat_sessions`                        | Bound sessions: owned vs attached user-owned, state, build identity.                                                                                                                                           |
| `xplat_targets`                         | Launchable targets per platform (simulators, devices, host targets) with availability, missing-toolchain reasons, and busy/ownership state.                                                                    |
| `xplat_build`                           | Build the bound app for one platform as a job — same commands `xplat build` runs. `requestKey` dedupes retries.                                                                                                |
| `xplat_launch`                          | Owned dev session on one target as a job; completes at confirmed readiness, session owns the processes until `xplat_session_end`.                                                                             |
| `xplat_attach`                          | Bind a compatible already-running dev session (user-owned, preserved).                                                                                                                                        |
| `xplat_logs`                            | Bounded ordered logs for a session or build job: cursor, limit, stream filter, truncation/reset indicators, `historical` flag for dead sessions.                                                               |
| `xplat_dev_actions`                     | The bound app's live development-action registry: instance identity, revision, declarations (contracts, effects, availability). Empty vs disconnected vs no-bridge are distinct states.                          |
| `xplat_dev_action_invoke`               | Invoke an action against an exact app instance + registry revision. Pre-validates input, availability, grants and queue bounds; returns a job (`requestKey` dedupes retries).                                    |
| `xplat_dev_action_status`               | Invocation status/result — same job data restricted to dev-action jobs, with instance/request identity.                                                                                                          |
| `xplat_job_status` / `xplat_job_cancel` | Bounded job status and cooperative cancellation.                                                                                                                                                               |
| `xplat_session_end`                     | Ownership-safe cleanup: owned sessions release resources; attached sessions are preserved (our log taps still stop).                                                                                           |
| `xplat_evidence`                        | `list` / `retain` / `delete` evidence; retain takes an optional ISO expiration.                                                                                                                                |
| `xplat_code_search`                     | Exact identifier/token search over current source (`mode: 'exact'`), optional local semantic index (`mode: 'semantic'`), or both (`'auto'`). Corpus filters: `app`, `framework`; platform and package filters.   |
| `xplat_code_read`                       | Bounded read of current source by search ref (`xplat-code://…`) or explicit corpus + path; results carry freshness markers and continuation offsets.                                                           |

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

## Contract surface (`@octane-xplat/mcp/contracts/*`)

Later work packages integrate against these modules; the `.d.ts` files are the
documented surface and the `.mjs` files carry the runtime values and stores.

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

`src/runtime/` implements build/launch/attach/logs/cleanup for consumer apps
on all six platforms. Adapters (`src/runtime/adapters/*`) own platform
mechanics and always spawn the app's own toolchain — `pnpm exec vite`,
`pnpm exec ns run …`, the app's installed `@octane-xplat/cli` dev entry, or
its `dev` script — so a session behaves like the app's installed framework
version. `service.mjs` owns the shared contract behavior: explicit
app+target binding, `target_busy` contention, job dedupe/cooperative
cancel, ownership-safe cleanup, bounded logs, and capability-matrix entries.

| Platform | Launch | Attach | Host gate |
| --- | --- | --- | --- |
| web / Chromium | `pnpm exec vite` + headless Chromium (devtools endpoint reported) | probe common dev ports — identity heuristic | none |
| iOS | `ns run ios --device <udid>` | booted sim + app running → `simctl log stream` tap | macOS |
| Android | `ns run android --device <serial>` | package running → `adb logcat --pid` tap | none (adb) |
| macOS | `xplat.targets.macos.dev` → CLI dev entry, else `pnpm run dev` | pgrep on app root — no scrollback | macOS |
| Linux | `pnpm run dev` (app-owned script) | pgrep on app root | Linux |
| Windows | `ns run windows` | not yet qualified | Windows |

Readiness is probe/marker-confirmed (`ready` session state) — HTTP 200 for
web, the host-start marker for macOS, `Successfully synced application` /
first `CONSOLE` line for `ns run`. A timeout or pre-ready exit fails the job
and ends the owned session honestly. Chromium is located via
`XPLAT_MCP_CHROMIUM`, the Playwright browser cache, or system installs;
without it the web session still reports the server URL with an explicit
`browser.launched: false`.

Physical iOS devices, Windows attach detection, and non-simulator iOS log
taps are reported limitations, not silent gaps — the capability matrix
carries the detail and an alternative.

## Boundaries

This server complements the agent's editing tools. It is not an autonomous
code editor or deployment system: no arbitrary shell execution, no arbitrary
runtime expression evaluation, no universal component tree, no hook/signal
inspection, no profiling API, no cloud indexing by default, no app-store
operations, no credential management. Screenshots are permission-gated —
capability existence never implies capture approval.
