# Go CLI

This directory owns the Go implementation of `xplat` — the sole CLI. The package
bin dispatches to this executable per platform. The native executable never
calls a JavaScript CLI as a fallback.

Build the public entry and run contract tests through Turbo. Use the repository's
Bun 1.4.4 and Go 1.27.3. Node is a prerequisite for explicit JavaScript workers;
Go does not bundle, download, or manage a Node installation.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go CLI build and contracts"}' -- bun run turbo run test:go-cli --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli catalog --json
research/go-cli/xplat-go-darwin-arm64-cli status --project . --app apps/web --json
research/go-cli/xplat-go-darwin-arm64-cli capabilities --project . --app apps/web --json
```

The catalog and schemas report execution coverage for this build. Pending
operations fail explicitly. A schema, parser or primitive probe is never evidence
that the corresponding command or platform provider is implemented. Current
migration status and qualification evidence live in Silo and local reports.

`entry_cli.go` is the public entry; the separate `cmd/probe` main is the retained
primitive harness. Both use the same process, HTTP, worker and native
model code in `internal/`. The [evaluation tooling](../../../tools/cli-go/README.md) owns compiler
pins, source/artifact fingerprints, measurements, project fixtures and portable
qualification snapshots. Command metadata comes from the checked-in
`internal/assets/catalog.json`, embedded at build time; help and schemas need no runtime Node.

`internal/cli/cli_contract.go` handles descriptor parsing, errors and exit groups. `internal/project/workspace.go`
keeps explicit selection and client preferences separate from sole-app discovery;
read-only discovery does not persist a selection. `internal/cli/policy.go` reports grants
without granting visual capture, retention or external effects. Workspace cache
writes use Go's directory-root API rather than a check followed by an unbounded
path operation. Host/request secrets still require separate private permissions
and Windows ownership/DACLs.

Package binding reads the selected app's installed manifests before lockfile
versions, and reports installation/lockfile conflicts. Ordinary workspace
patterns such as `apps/*`, literal paths, and leading `!` exclusions are matched
natively. Advanced glob expressions are rejected with an instruction to simplify
the workspace configuration; workspace matching does not start a Node worker.

Native project guidance uses the same installed-package identity as source
retrieval. It labels linked checkouts and installation/lockfile conflicts, and
describes the providers available in this Go build. Guidance does not download
assets or prepare documentation snapshots.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go package binding verification"}' -- bun run turbo run test:go-binding --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli guidance --project . --app apps/web --json
```

Inference remains native. Optional ONNX/model assets and project compiler engines
have separate costs from the executable. Keep project Vite plugins and small
workers in `@octane-xplat/cli`; language boundaries do not require package splits.
Go owns argv, cwd, environment, timeouts, publication, sessions, logs, cancellation
and cleanup. Use small workers for operations requiring the project's JavaScript
compiler, plugin or configuration execution, never a general CLI fallback.

Main `dev` selects native SDK targets, preflights project engine entries, publishes
initial routes and watches their sources, then owns the selected project engines.
Run it from the application directory. Node and the selected project's Vite,
official `@nativescript/vite` and platform runtime, or optional macOS build
worker must be installed first. Simulator/emulator development embeds the public
NativeScript Go library; `--no-hmr` selects restart mode. The pinned source lives
in `../vendor/nativescript-cli`; initialize repository submodules before building.

```sh
/absolute/path/to/xplat-go dev web
/absolute/path/to/xplat-go dev macos
/absolute/path/to/xplat-go dev ios --device SIMULATOR_ID
/absolute/path/to/xplat-go dev android --no-hmr
/absolute/path/to/xplat-go dev --targets web,android
```

Project configuration stays with those engines. For macOS without a dev profile,
the optional macOS diagnostic worker checks canonical native-leaf discovery before
allowing a direct project script; native leaves require a dev profile. Go retains
prefixed stdout/stderr and bounded log records in its separate versioned history
store, outside disposable project caches. It preserves nonzero tool exits and
awaits cancellation/group cleanup. Interactive workspace typegen is auxiliary and
stops when all selected targets finish. Slow terminal readers can omit terminal
lines with a diagnostic; retained logs have separate bounds and failure reporting.
Host spawn alone does not imply application readiness. SDK command construction
and compilation do not establish device runtime or Windows console qualification.

Foreground `dev` publishes a private discovery record keyed by the canonical app
directory. Humans or explicitly instructed agents can start it. Other CLI clients
normally connect to that existing server; reads never start a missing server,
launch an app/browser, or terminate a human-owned app. Disconnecting a short-lived
client leaves development engines running.

```sh
# Explicit start, from the selected app or with workspace selection:
/absolute/path/to/xplat-go dev --project /work/repo --app apps/web --targets web
# Separate terminal; nested cwd and symlink aliases resolve the same app:
/absolute/path/to/xplat-go targets --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go session list --project /work/repo --app apps/web --json
```

One dev server owns the foreground engines for an app directory. Separate
worktrees have separate identities; ambiguous workspace roots require `--app`.
The discovery record lives in current-user-only cache storage outside the app.
Each explicit start creates a fresh instance and credential. Clients verify both
app and instance over authenticated loopback HTTP, reject redirects, and bypass
ambient proxies. Ordinary RPC rejects browser-origin requests. No login or agent
registration is involved; the credential authorizes the same local user.

`internal/dev/dev_server_record.go` owns discovery and its stable lifetime lock;
`internal/dev/dev_server_http.go` owns bounded versioned requests and authenticated lookup.
The foreground caller holds the claim until engines and request handlers finish
cleanup. A missing, dead or stale record reports `disconnected_runtime`; it does
not authorize automatic startup. Never use descriptive cached PIDs as signal
authority. `XPLAT_DEV_CACHE` can select an isolated cache parent for tests.

The target response distinguishes an engine's reported readiness from connected
app instances. `session attach` selects an existing app debug connection and
returns an observed session identity; it creates no app process or persistent
agent registration. Select `--instance` when a target contains several apps.
Session status preserves a disconnected app observation; it does not signal it.

```sh
/absolute/path/to/xplat-go actions list --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go session attach --platform web --instance APP_INSTANCE --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go session status SESSION_ID --project /work/repo --app apps/web --json
```

The selected project's compatible CLI Vite plugin receives a target-scoped app
credential from foreground dev. The app's existing framework action registry
connects over WebSocket, updates its actions, and reconnects after transport loss.
The app credential cannot authenticate CLI RPC or register another target. Tokens
are carried in the bounded first frame, never in socket URLs. Browser origins
must match an observed target dev origin; ordinary CLI HTTP still rejects Origin.
`actions list` distinguishes connected empty registries from disconnected apps.
`actions invoke` validates the live declaration/input through the selected
project's canonical Node worker, checks revision and declared effects, and submits
one bounded app request. `actions status` reads its asynchronous result natively.
The real app registry still owns handler execution, serialization and validation.
Native diagnostics reads retained foreground engine logs; scoped native Apple report discovery and retained originals are available for macOS captures with recorded identity. Read-only browser inspection is available through an announced app inspector; explicit programmatic interaction is available on announced browser hosts; CDP/OS input and visual capture remain unsupported. The development Vite plugin forwards bounded browser warnings/errors into native history.

The same app socket also carries devtools channels: an app declares
`channels: {id, version}` in its registry and the hub routes opaque bounded
JSON between that app session, a per-target Node backend (`/backend`, granted
through `XPLAT_DEV_BACKEND` in the engine environment) and devtools panels
(`/devtools`, authenticated by the discovery record's `devtoolsToken`). Each
party uses a distinct first-frame credential; none of them authorize CLI RPC
or each other's sockets, and the backend grant never enters served app code.
App channel declarations scope routing (`'*'` reaches only declaring sessions
of the right target), a same-key backend reconnect replaces its socket, and a
full 256-frame receiver queue closes just that consumer with 1013 rather than
blocking the hub. The Vite fallback bridge has no channels.

```sh
/absolute/path/to/xplat-go actions invoke --action fixture.read --instance APP_INSTANCE --revision REVISION --input '{}' --request-key read-once --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go actions status JOB_ID --project /work/repo --app apps/web --json
```

A short client's exit does not cancel an accepted action. Request keys are scoped
to this app's dev-server startup and bind instance/action/revision/normalized input.
An identical retained request returns its original job; a conflicting key is
rejected. Results retain 200 completed jobs and at most 1,024 request-key records.
An expired result or full key registry fails explicitly instead of repeating an
action. Keys are not durable across dev-server restarts. Declared external effects
need the invoking client's explicit `external-effects` grant.

```sh
XPLAT_PERMISSIONS=external-effects /absolute/path/to/xplat-go actions invoke --action fixture.external --instance APP_INSTANCE --request-key external-once --json
```

Canonical action deadlines default to 30 seconds and cap at five minutes. A
cancellable action gets a bounded cooperative-cancel grace; only app confirmation
becomes a cancelled result. In-flight disconnect, delivery ambiguity, or expired
observation becomes an unknown outcome and is never automatically retried. An
invalid result does not undo completed effects. Failed action jobs retain raw
stacks and may add `sourceStack` using the current maps of modules already served
by the selected Vite engine. `stackResolution: "vite-current"` means at least one
frame mapped; other frames can remain raw. This is current-revision information,
not a retained map of the failure's exact revision. Missing/stale maps, unsupported
`file://` or device frames, and unavailable engines leave `runtime-raw` stacks.
Source lookup cannot change the action outcome or discard partial effects.
Node validation is
bounded and native group/Job cleanup finishes before private worker data removal.
Unconfirmed worker cleanup blocks further action admission and retains evidence.

`diagnostics` lists this app's engine captures, with IDs separate from observed
app sessions. Read a capture using its returned ID; `--cursor` continues after a
sequence and `--stream` filters stdout, stderr or lifecycle. Without a cursor,
reads return the most recent records. An authenticated running dev server can
confirm which captures belong to its current instance; offline reads mark
unfinished captures disconnected and preserve cleanup uncertainty. Reads create
no missing cache or dev server.

```sh
/absolute/path/to/xplat-go diagnostics --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go diagnostics --session ENGINE_CAPTURE_ID --cursor 0 --limit 50 --stream stderr --project /work/repo --app apps/web --json
```

Logs remain readable after foreground dev exits. Native Apple .ips discovery requires the Mac that ran the app and recorded native identity. The Go development Vite plugin injects
the existing bounded browser logger for warnings, console errors, uncaught errors
and rejected promises. It omits object values, preserves local console calls and
reports lost deliveries. Diagnostics identifies forwarded browser records in the
returned page; no full console coverage or absence of errors is inferred. Stacks
remain runtime-raw.

`--report` reads a complete retained original directly from the private native
history store, so the local HTTP response bound cannot truncate a large original.
IDs are content hashes, not paths. Summaries distinguish confirmed observed
PID/launch-time evidence from bundle/time candidates. Missing sources, malformed
reports, bounded scans and retention limits remain explicit coverage states and
do not hide readable engine logs. Up to ten complete originals are retained,
4 MiB each and 16 MiB of raw content total, independently of log rotation. A
single atomic base64 JSON envelope preserves original bytes with about one-third
encoding overhead; hashes are checked on reads. This differs from the retained
TypeScript store layout and does not migrate that store.

```sh
/absolute/path/to/xplat-go diagnostics --session ENGINE_CAPTURE_ID --report REPORT_ID --project /work/repo --app apps/macos --json
```

NativeScript captures record package identity only from bounded, non-truncated
SDK sync output matching the selected device. They record no PID and do not infer
app attachment/readiness. Conflicting package identities require a fresh capture.
Android diagnostics uses only that recorded device/package, two bounded `adb`
queries and the device's current timezone. Exit records are candidate evidence;
they include Java/native crashes, ANRs and other exits, not full traces or
root-only tombstones. Unrecognized/unavailable output remains a coverage gap.
No commands read trace paths or start/stop apps. Source queries share an eight
second budget; diagnostic RPC budgets include managed-process cleanup. Unknown
cleanup stays a failure and blocks additional source queries in the foreground
server while retaining readable log evidence.

Mobile identity and report parsers have unit/reference coverage. Real Android
exit-record collection and public original retention pass on the designated API 35
ARM64 emulator using a disposable Java activity. Its sync identity is constructed,
so it does not qualify NativeScript identity ingestion. iOS simulator report
collection remains unqualified. macOS identity/Apple collection retain actual runtime evidence. The removed
detached build-job surface has no diagnostics `--job` selector.

This direct socket requires a runtime WebSocket implementation and same-host
loopback access. The maintained test runs the actual registry through project
Vite and a headless AppKit JavaScriptCore host, including native action invocation
and status. The experimental NativeScript relay has real registration, read-only
invocation/status, short-client lifetime and foreground engine cleanup evidence on
an API 35 ARM64 Android emulator and an iOS 27 arm64 simulator. Reconnect/HMR,
physical devices and other runtimes remain unqualified. With an explicit
Go dev grant, the ordinary NativeScript preset configures the relay automatically
and the native client resolves it against its existing HTTP origin. The provider
reports partial Android and iOS attachment/actions.

```ts
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'

export default defineConfig((environment) => native(environment))
```

Browser inspection attaches through the existing app socket
and reuses the canonical fixed named-host operation. It returns bounded main-document
hosts, private-value redaction, a per-document identity and session evidence. It
never focuses a control, sends input, starts a browser or requires ownership of
its process. Component trees, shadow roots and frames are excluded. Programmatic HTML interaction uses the explicit `handler-dispatch` mechanism.
It is `HTMLElement.click()` with an untrusted event, not a CDP click or OS input.
It refuses hidden, disabled, private and obscured controls. CDP/OS input, screenshot
capture remains unsupported. Explicit text evidence retention is available with its own grant.
Browser console forwarding has separate headless Chromium evidence. Actual Chromium inspection, programmatic interaction and browser action invocation
have separate macOS evidence; portable protocol checks do not qualify other hosts
for browser UI behavior. A spawned SDK tool is not proof of an attached app. Go never uses a JavaScript CLI as fallback. The project-installed JS
worker channel remains unchanged outside explicit Go
configuration. Production builds receive no native bridge definition.

Read a connected browser session's named hosts and inspect its ephemeral evidence.
Evidence list/delete combine current session records (at most32/2MiB) with explicitly
retained text records from the native cache. Session records expire on server exit;
oldest session records may be evicted. Retained records survive restart and use
a separate16-record/1MiB budget without silently evicting unexpired data. Deleting
a server record cannot erase a client transcript. A page that exceeds the response
bound must be retried with a smaller limit. Reloading the document changes its
identity; use the new session rather than sending work to the old one.

```sh
/absolute/path/to/xplat-go session list --json
/absolute/path/to/xplat-go inspect APP_SESSION_ID --testid counter.value --limit 20 --json
/absolute/path/to/xplat-go evidence list --kind inspection --json
/absolute/path/to/xplat-go evidence delete EVIDENCE_ID --json
```

Retain a text record explicitly with the invoking command's permission grant.
Omit expiration for manual deletion, or supply a future ISO timestamp including
`Z` or a UTC offset. Retention stores a checksummed record in the private native
user cache outside the app; it never follows an app-supplied artifact path. Reads
filter expired records; retain/delete collect expired files. Corruption and budget
exhaustion are errors. List/renew/delete work after dev exits, without Node or
starting a server. Unretained session records do not survive exit.

```sh
XPLAT_PERMISSIONS=evidence-retain /absolute/path/to/xplat-go evidence retain EVIDENCE_ID --expires-at 2099-01-01T00:00:00Z --json
/absolute/path/to/xplat-go evidence list --kind inspection --json
/absolute/path/to/xplat-go evidence delete EVIDENCE_ID --json
```

Use the inspected document and an explicit key for each intended programmatic
click. Repeating identical arguments/key reads its receipt without clicking again.
Changed bindings fail. The receipt proves dispatch only; inspect state independently.
Receipts keep delivery metadata and an evidence reference, so deleting/evicting an
evidence body releases its recorded UI text without forgetting dispatch identity.

```sh
/absolute/path/to/xplat-go interact APP_SESSION_ID --document DOCUMENT_ID --testid counter.increment --mechanism handler-dispatch --request-key CLICK_KEY --json
/absolute/path/to/xplat-go inspect APP_SESSION_ID --testid counter.value --json
```

An accepted interaction outlives a short client's disconnect. Observation is
bounded to three seconds; ambiguous delivery, disconnection or an invalid reply
can leave effects unknown. Reuse the same key to read its receipt; never
implicitly retry with a new key. A not-run receipt confirms no dispatch and stays
bound to that attempt too. The startup admits at most 256 keys and never evicts
bindings to make room for replay. Keys/receipts do not survive dev-server restart.

There is no detach command: clients simply finish or disconnect. The former Go
`session start/end`, `runtime build`, `job status/cancel` and hidden `_owner`
entry are absent. `capture` is absent too: it captured a CLI-owned Chromium
viewport, and attached clients own no browser. The `screenshot` capability
reports unavailable. Ordinary build and typecheck remain foreground operations.

```sh
/absolute/path/to/xplat-go build --targets web
/absolute/path/to/xplat-go typecheck
```

The previous detached-owner implementation was removed; its last state is
preserved in local checkpoint `14a7117c`. Its browser lifecycle qualification is
superseded by the explicitly started dev-server architecture, not evidence that
the new app-debug workflow is complete.

Workshop inspection delegates to the selected project's `@octane-xplat/workshop/node`
through that small worker. Story discovery is static; project configuration executes
with the project's Vite. JSON discovery diagnostics remain data with exit zero;
human diagnostics fail after printing the inventory. Doctor reports prerequisites,
not qualified platform support. Initialization uses its shared read-only plan: Go validates raw before-images,
preserves existing templates and scripts, and publishes under an app output lease.
Only the missing workshop package script may change in the manifest. Publication
is atomic per file, with partial effects disclosed on interruption. Service launching calls the project engine in an owned Node worker, with a
five-minute startup deadline and live stdout/stderr plus explicit foreground input.
The schema labels its evidence: web listening, native host spawn or mobile tool
spawn; none implies a fully initialized app. The foreground process awaits the whole
service lifetime and group/job cleanup, then removes its private resources.
Windows workshop launch retains the project's explicit unqualified-host blocker.

```sh
/absolute/path/to/xplat-go workshop dev --target web --port 5173
/absolute/path/to/xplat-go workshop dev --target macos
```

```sh
# From a project with its CLI worker and workshop package installed:
/absolute/path/to/xplat-go workshop list --json --target web
/absolute/path/to/xplat-go workshop doctor --json
```

`routes` uses that boundary: the selected project's `@octane-xplat/cli/worker`
parses source, runs baked loaders through its Vite installation, and renders the
canonical 18-artifact plan. Go validates the complete destination set, checks raw
input/output bytes for concurrent edits, and stages adjacent files before native
rename. Unchanged files keep their timestamps; changed existing files retain
their permissions. Each rename is atomic; the complete set is not a transaction.
An interrupted publication reports partial effects and any retained staging.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go route workflow"}' -- bun run turbo run test:go-routes --filter=@octane-xplat/cli
# From an application directory with its CLI worker and Vite installed:
/absolute/path/to/xplat-go routes --dir app --out routes.gen
/absolute/path/to/xplat-go routes --watch
```

Watch uses a bounded 500 ms poll with one active generation. Changes cancel and
await the old worker before starting another; stale results cannot publish.
The generated output path stays fixed until watch restarts. Fingerprints cover
the route tree, configured source references and common project configuration,
not arbitrary files read by user JavaScript. Worker diagnostics are bounded and
printed after completion. Route traversal rejects cycles and bounds entries,
depth and text bytes. Authorized external route/output directories are supported;
an output alias cannot overwrite route inputs or leave its authorized output scope.

`typecheck` prepares those route contracts without executing baked loaders or
replacing existing baked data. The selected project's worker reuses canonical
JSONC/environment expansion, including its disposable combined-program cache.
Go validates program selection and starts the installed
`typescript` checker as `tsc --runExternalCode` with Node. Missing tools produce installation
instructions; Go does not invoke a package manager to download them.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go typecheck workflow"}' -- bun run turbo run test:go-typecheck --filter=@octane-xplat/cli
# From a project with its CLI worker and TypeScript installed:
/absolute/path/to/xplat-go typecheck
```

Each program prints a heading and inherits stdout/stderr directly, preserving
live compiler diagnostics without buffering them into a worker response. The
same native process group/job owns cancellation and descendant cleanup. Compiler
runs have the command's cancellation context; the short configuration worker
has a two-minute deadline. Programs run in reference order and stop on the first
failure. An empty project with no routes or programs needs no Node worker.

`fmt` reuses canonical Node discovery, Git ignores and the selected project's
`@octane-xplat/fmt` engine. Go validates all returned source identities and scopes
before writing, then publishes each changed file beside its target, preserving
permissions and unchanged timestamps. Writes across files are not a transaction;
failures disclose partial publication. `--check` exits 1 for differences; usage,
configuration, transformation and I/O errors exit 2. Stdin mode writes only the
formatted text to stdout; worker/library diagnostics go to stderr.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go formatter workflow"}' -- bun run turbo run test:go-fmt --filter=@octane-xplat/cli
# From a project with its CLI worker and formatter installed:
/absolute/path/to/xplat-go fmt src tests
/absolute/path/to/xplat-go fmt --check
/absolute/path/to/xplat-go fmt --stdin-filepath src/example.ts < src/example.ts
```

`lint` invokes the selected project's `@octane-xplat/lint/bin` export with Node.
The installed engine owns configuration, discovery, companion TSRX checks and
explicit `--fix` writes. Go preserves raw arguments, live stdout/stderr and the
engine's exit code while owning cancellation and descendant cleanup. No additional
CLI worker or global tool installation is used for this operation.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go lint workflow"}' -- bun run turbo run test:go-lint --filter=@octane-xplat/cli
# From a project with its lint engine installed:
/absolute/path/to/xplat-go lint src
/absolute/path/to/xplat-go lint --fix src
```

`build` preflights selected project engines before baked-route generation and
runs targets in declaration order. Web uses the installed Vite executable;
Debug iOS/Android targets call the pinned NativeScript Go library in-process;
its results supply the artifact identity and path. Release signing, device archives
and copy-to remain explicit upstream operations (`XPLAT_NATIVE_ENGINE=upstream`),
using the installed `nativescript` bin with `--release` when requested, plus
validated store-artifact options: Android `--aab`,
`--key-store-path`/`--key-store-alias` and the `*-env` password references
(also `xplat.targets.android.signing`, which refuses raw password keys), iOS
`--for-device`/`--provision`/`--team-id`, and `--copy-to` on a single native
target. Secrets are resolved from their named environment variables and the
printed `ns build` line redacts forwarded values; each iOS/Android build then
reports its produced `Artifact:` path and type. macOS uses the separate
project packaging worker and a native
locked staging/publication boundary for its app and DMG. Interactive terminals
use a bounded comma-list selection; noninteractive commands select all available
targets. Missing tools are installation errors, never permission to download them.
Projects with routes also need their installed `@octane-xplat/cli` worker for
automatic baking. Linux packaging runs the selected CLI worker on macOS/Linux,
using the canonical GTK/GJS or WebKitGTK packager and the same native locked
staging/publication owner as macOS. The application directory and versioned tar
archive are published together with recoverable backups; launchers keep their
executable mode. Linux packaging requires macOS or Linux. NativeScript SDK builds
need separate target
qualification; invoking a fixture engine only proves the adapter contract.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go build workflows"}' -- bun run turbo run test:go-build --filter=@octane-xplat/cli
# From a project with the selected build engine installed:
/absolute/path/to/xplat-go build --targets web
/absolute/path/to/xplat-go build --targets macos
# On macOS arm64, compile a native C leaf and verify actual app/DMG packaging:
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go macOS packaging"}' -- bun run turbo run test:go-build-macos-real --filter=@octane-xplat/cli
```

`clean` needs no Node. It removes `dist`, `.ns-vite-build`, `node_modules/.vite`,
`node_modules/.cache/xplat` and generated application children under `platforms/`,
following the reference command's selection. It preserves NativeScript plugins'
authored platform trees and the app's authored macOS tree.
A present `package.json` must be a valid JSON object. Cleanup validates the whole
plan before removing anything, rejects linked ancestors, and unlinks output leaf
links without traversing their targets. It also removes broken output links and
preserves case variants of the macOS directory name.

```sh
# From the project whose generated outputs should be removed:
/absolute/path/to/xplat-go clean
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go cleanup contracts"}' -- bun run turbo run test:go-clean --filter=@octane-xplat/cli --concurrency=1
```

Build, clean, doctor, upgrade and `patches apply` share a kernel lease in the OS user cache, keyed by physical
project identity so directory aliases share ownership. The cache must live outside
the selected project. Keep its lock files in place after release; deleting a live
lock would let another process acquire a different identity. This coordinates Go
invocations sharing that cache. Separate JavaScript worker or direct engine runs need
their own coordination. Cleanup checks cancellation between output trees;
individual recursive removals may finish before cancellation is observed. A failed
or interrupted cleanup reports removed/attempted outputs and preserves the failure
cause. Removal across multiple outputs is not a transaction.

`patches check` and `patches apply` use the selected project's small Node worker
and canonical patch assets. Go owns command parsing, workspace and package-manager
selection, write-scope preflight, leases, deadlines and descendant cleanup. The
canonical helper owns patch selection and Bun JSONC/pnpm YAML behavior, including
comments, catalogs and lockfile reporting. These operations need `yaml` and
`jsonc-parser`, without requiring Vite or a JavaScript compiler/parser.

```sh
/absolute/path/to/xplat-go patches check --dir ./apps/mobile
/absolute/path/to/xplat-go patches apply --dir ./apps/mobile --package-manager bun
# Inspect conflicts before choosing to replace the canonical patch destinations:
/absolute/path/to/xplat-go patches apply --dir ./apps/mobile --force
```

Application does not install dependencies. It preserves identical alternative
patch mappings and reports differing mappings/files as conflicts unless `--force`
is explicit. Before application, Go rejects linked configuration files, patch
directories and canonical patch destinations. The selected worker remains trusted
project code; this preflight and cooperative lease do not isolate it from unrelated
concurrent writers. Application copies files and updates configuration sequentially,
so failure or cancellation can leave partial changes. Inspect those changes and
rerun `patches check`; the CLI preserves this uncertainty in its error and exit.

`upgrade` uses the invoked release's canonical compatibility engine for catalog,
patch and manifest policy. Go validates the complete rooted plan, holds the
workspace and every package's output lease, and requires a fresh plan digest
before apply. Preview writes nothing; ordinary apply retains the canonical
rollback behavior. Abrupt cancellation can interrupt several writes, so failures
disclose possible changed files instead of implying a workspace transaction.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go upgrade qualification"}' -- bun run turbo run test:go-upgrade --filter=@octane-xplat/cli --concurrency=1
/absolute/path/to/xplat-go upgrade --check
/absolute/path/to/xplat-go upgrade --no-install
/absolute/path/to/xplat-go upgrade
```

Default installation runs the actual Bun/pnpm engine with live stdout/stderr in
the native process group/job, followed by compatibility and patch inspection.
The fixed Windows launcher supports package-manager command shims; it accepts no
caller-supplied shell fragments. Install has a 15-minute deadline; other upgrade
workers have a two-minute deadline. Use `--no-install` to manage installation
separately. Foreground installation inherits the invoking CLI's input file.
Default worker calls and contexts without an explicit foreground input receive
EOF. Build/lint/typecheck engines and packaging workers use the same opt-in input
boundary. Unix controlling terminals hand foreground ownership to the contained
child and restore ownership and input settings before returning; Ctrl-C still
triggers descendant cleanup. Raw-mode cancellation has a separate terminal test.
Windows uses a separate job release handle so containment does not consume stdin.
Actual Windows console events remain a separate qualification gate.

```sh
/absolute/path/to/xplat-go upgrade --no-install
bun install --no-frozen-lockfile
/absolute/path/to/xplat-go doctor
```

Experimental standalone archives include `native-worker` beside the executable.
An invoked CLI package supplies the same sidecar from its own release; Go verifies
its bounded inventory and stages it privately before upgrading an older project.
Default installation also stages a bounded copy of the invoked native executable
for containment gates. Replacing both the executable path and original worker
during installation does not prevent verification. Preview and `--no-install`
do not copy a native helper; normal completion removes the private copy, while
uncertain cleanup retains both helper and policy with a diagnostic.
Node must be installed, but the project need not already have this release's worker.
Loose development binaries still require a matching project worker. An invalid
invoked package fails without falling back to an older policy. This qualification
layout does not switch the production npm package or its bin entry.

`doctor` runs the shared diagnostic report through the selected project's CLI
worker. Go owns the native help/schema, process lifecycle and presentation. The
worker owns compatibility pins, dependency/source analysis, declaration checks
and tool observations. Its small compatibility module is compiled from the
creator's canonical source and JSON; creator templates, Vite and a compiler are
not prerequisites for ordinary diagnostics.

```sh
# From the project whose configuration and tools should be checked:
/absolute/path/to/xplat-go doctor
/absolute/path/to/xplat-go doctor --schema
```

Mac targets also need the selected project's `@octane-xplat/macos-build` diagnostic
worker. It owns host-payload verification and native-leaf SDK inspection. Those
assets stay outside the CLI download. Inspection may materialize a tool cache;
Go holds the project output lease until worker cleanup finishes. Each worker has
a three-minute deadline within a five-minute overall operation.

The report preserves the reference severity policy: ordinary SDK failures appear
as warnings, while compatibility, declaration and Linux checks can return exit 1.
Tool presence and verified host files do not establish an app/device runtime pass.
Go rejects missing observation states and omitted required checks, and preserves
repeated dependency labels that describe distinct physical copies.

Source search/read keeps app files separate from installed framework packages and
labels checkout content as development source. Intent search builds a bounded
local identifier/TF-IDF index in Go; exact search reads current files. Reads check
both an alias name and its canonical target, reject private/generated/binary
content and return a continuation offset for larger files. Search results are
leads to open before changing code.

```sh
research/go-cli/xplat-go-darwin-arm64-cli code search Button --project . --app apps/web --mode exact --corpus framework --package @octane-xplat/ui --json
research/go-cli/xplat-go-darwin-arm64-cli code read --project . --app apps/web --ref xplat-code://framework/@octane-xplat/ui/chat/ChatDictationButton.tsrx --json
```

The documentation snapshot service pins exact release tags and package metadata
under a separate `go-v1` cache. It extracts bounded Markdown blobs without a Git
checkout, validates cached raw bytes before reuse, and reports offline reads,
moved/deleted tags and corrupt caches explicitly. An owned native compute child
contains binding, Git work and retrieval. Public read/search use this boundary.
Ordinary search and page reads do not download optional model/runtime assets.
Project Markdown guidance is returned separately from release results.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go documentation snapshots"}' -- bun run turbo run test:go-doc-snapshot --filter=@octane-xplat/cli
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go documentation commands"}' -- bun run turbo run test:go-docs --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli docs search dictation --project . --app apps/web --package @octane-xplat/ui --mode exact --json
research/go-cli/xplat-go-darwin-arm64-cli docs read --project . --app apps/web --package @octane-xplat/ui --path docs/app/components.md --json
```

The inference-enabled entry supports explicit index preparation and native hybrid
retrieval. Index preparation downloads checksum-pinned MiniLM and ONNX Runtime
assets into the private cache. On macOS arm64 those first-use downloads total
60,621,482 bytes, separate from the executable. The core entry omits this optional
feature. Missing or invalid assets/index data produce a labeled lexical fallback
during search; preparing the index explicitly repairs invalid cached vectors.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation index"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
research/go-cli/xplat-go-darwin-arm64-cli-onnx docs index --project . --app apps/web --package @octane-xplat/ui --json
research/go-cli/xplat-go-darwin-arm64-cli-onnx docs search dictation --project . --app apps/web --package @octane-xplat/ui --mode hybrid --json
```

Completed vector batches survive cancellation. Model, runtime, inference settings
and tokenizer dependencies contribute to cache identity; fresh document inventory
keeps edited or deleted content from returning stale hits. The compute child
reuses one native model session per operation. Large fenced sections keep their
full text for lexical search and reads; model previews are bounded to 64 KiB,
with `truncatedInputs` reported alongside the model's 512-token context limit.
The public CLI owns and joins a native compute child for each documentation
operation. Documentation reads, searches and indexing do not require a dev
server. The retained probe-host cancellation test exercises a separate
experimental boundary; it does not imply that ordinary documentation commands
must attach to a dev server. Foreground `dev` owns development engines and
app-control connections.


`add` enables web, iOS or Android in an existing Bun app. The selected project
needs the matching `create-octane-xplat` version in addition to its CLI worker.
The creator is an optional tool dependency; native help and schema discovery do
not load it. Desktop targets are not offered by this command.

```sh
# Use the same version as your installed @octane-xplat/cli.
bun add --dev create-octane-xplat@0.19.0
/absolute/path/to/xplat-go add ios --no-install
/absolute/path/to/xplat-go add android
```

The project creator plans template, patch and catalog changes. Go checks raw-byte
inputs and output scope, preserves existing source files, and publishes through
workspace directory handles while holding workspace/app leases. Default install
runs the project's Bun with live input and output. `--no-install` leaves that step
to you. No-argument terminal selection requires an explicit choice; Enter cancels.

Publication and installation can leave partial changes after interruption. Inspect
files and incomplete generated platform directories before retrying: existing
target directories are deliberately preserved, so a retry does not fill an
incomplete directory automatically. These operations are not a whole-workspace
transaction. Windows pipe/job cancellation coverage does not qualify console
Ctrl-C or interactive Windows terminal selection.


`updates init` writes the canonical NativeScript after-prepare hook and adds
`.xplat/` to the selected app's ignore file. Install the optional update runtime
and fingerprint tool in that project first; the worker resolves their actual Node
entry points without executing them. Rebuild iOS/Android binaries after committing
the hook. Initialization does not qualify native update delivery.

```sh
bun add @octane-xplat/updates
bun add --dev @octane-xplat/fingerprint
/absolute/path/to/xplat-go updates init --dir .
```

Go shares the exact hook text with the retained worker and publishes only the hook and
`.gitignore` through app directory handles. Custom nonempty hooks and output
aliases fail before publication. Existing ignore bytes and source modes are
preserved; repeat initialization leaves unchanged file timestamps intact. This
includes preserving invalid UTF-8 bytes rather than decoding/re-encoding them.
Partial file effects can remain after a publication failure; inspect both files
before retrying. The command does not download or install optional packages.


`fonts add` uses the selected project's small Node worker for the canonical font
metadata, WOFF/WOFF2 conversion, Fontsource selection and CSS registration engine.
Go owns command selection, output leases, bounded plan validation, native file
publication and process cleanup. The standalone binary embeds no converter or JS
runtime. TTF/OTF and WOFF use the existing engine; WOFF2 needs its optional codec.
Inputs and individual outputs are limited to 16 MiB, with a 32 MiB total plan.
Use subsets or separate registrations for larger collections.

```sh
bun add --dev wawoff2@2.0.1
/absolute/path/to/xplat-go fonts add ./Inter.woff2 --token sans
/absolute/path/to/xplat-go fonts add @fontsource-variable/inter --install
```

`--install` invokes the selected project's Bun/pnpm to add a missing Fontsource
package and can change dependencies before conversion fails. Inspect those changes
before retrying. Conversion staging is private to the managed worker operation;
source files are published only after the complete plan validates. An existing font file is refreshed only when the previous saved manifest
registers it; conflicting unregistered files are preserved and rejected. Repair invalid saved registration JSON instead of discarding
it. These checks qualify generated files, not rendered typography or SDK builds.
