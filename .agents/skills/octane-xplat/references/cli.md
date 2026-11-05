# Use xplat as an agent

The npm `xplat` command requires Bun >=1.4.4 on PATH. Standalone release
executables embed Bun and unpack their production payload into a writable
local cache; they still require the app's Node/Bun/platform toolchains.
See [CLI installation and executable builds](../../../../docs/packages/package-cli.md#single-file-executable).

The parallel [Go migration](../../../../packages/cli/go/README.md) retains both
Nim and TypeScript; it has not replaced production packaging. Its experimental
upgrade archives carry the invoked release's small policy worker and dependencies,
staged privately across installation. This release-policy exception does not move
compiler/plugin resolution away from the selected project, embed Node, or invoke
the old CLI. Consult that entry and Silo for actual command/target qualification.

Go workshop inspection calls the selected project's workshop Node engine. JSON
discovery diagnostics are data with exit zero; human diagnostics fail. Static
story discovery does not execute story modules, though Vite configuration does
execute. Doctor availability does not qualify a native host. Consult the group
schema before using service launching in the parallel CLI. Initialization shares
a read-only plan with the reference: preserve custom files/scripts, use ordinary
paths under the 1 MiB input bound, and rerun after inspecting a stale-input error.

MacOS workshop launch requires the selected project’s optional
`@octane-xplat/macos-build/dev-engine`. Keep this engine and its host assets
separate from the native executable; the workshop calls its Node API directly
in the existing operation worker. Go workshop services use native lifetime
ownership and a bounded startup sidecar. Schema evidence labels distinguish web listening, host spawn and mobile
tool spawn from actual app readiness. Inspect those scopes before automating
interactions. Main Go `dev` now owns foreground project engines after initial
route publication. It retains bounded logs and validates macOS launch sidecars;
launch metadata alone does not prove app initialization. Humans or explicitly
instructed agents can start `dev`; ordinary agent commands normally connect to an
already-running app. Missing discovery reports no running dev server and never
starts one. Do not start apps or browsers implicitly to satisfy an observation.

```sh
/absolute/path/to/xplat-go dev --project /work/repo --app apps/web --targets web
# In a separate invocation, after explicit startup:
/absolute/path/to/xplat-go targets --project /work/repo --app apps/web --json
/absolute/path/to/xplat-go session list --project /work/repo --app apps/web --json
```

Go uses one foreground dev server per canonical app directory, with private
same-user discovery and authenticated loopback requests. Nested directories and
symlink aliases converge; worktrees stay separate. A short-lived client never
owns app lifetime, and disconnecting it leaves the app running. App debug
WebSockets now register framework action metadata, with native observation and
action listing. `session attach --instance APP_INSTANCE` observes an existing
app; it never owns or terminates it. Engine progress remains separate from app
connections. Direct loopback transport requires same-host reachability and a
runtime WebSocket implementation; NativeScript device relay/runtime WebSocket adapters remain unimplemented,
and non-browser UI adapters remain unqualified. Actual Chromium action invocation and programmatic interaction have macOS
evidence; protocol checks do not qualify browser UI behavior on other hosts. Browser console
forwarding has separate headless Chromium evidence. Native action invocation/status now use canonical project-worker validation and
the app's existing execution policy. Read the registry revision, use an explicit
request key, and poll `actions status` rather than a removed generic job command.
Disconnect/deadline outcomes can remain unknown; do not automatically retry them
with a new key. Keys/results are bounded to this dev-server startup, with no
cross-restart idempotence guarantee. Failed action jobs keep raw stacks and may add `sourceStack` from current cached
Vite maps (`stackResolution: "vite-current"`). This does not prove exact-revision
mapping or resolution of every frame. Unserved, file/device or unavailable frames
remain raw; lookup failure does not alter the action outcome or partial effects.
Go `diagnostics` lists retained foreground engine captures and reads bounded logs,
including after dev exits. Its capture IDs differ from observed app sessions.
Never infer liveness or cleanup from a recorded PID. The Go Vite plugin forwards bounded browser warnings, errors, uncaught failures
and rejected promises using the existing client. Diagnostics reports observations
in the returned page; absent records do not prove an error-free app. Scoped Apple crash-report discovery and complete retained originals are available
for macOS captures with recorded identity. Candidate bundle/time matches are not
confirmed process ownership. Diagnostics preserves report coverage gaps without
hiding logs. NativeScript package identity is captured only from selected-device SDK sync
output, without PID or readiness claims. Android exit-history reads are scoped to
that package/device and retain candidate records, not full traces. Mobile identity,
iOS parsing and Android collection have unit/reference evidence; device runtime
qualification is still pending. A failed device setup is not a runtime pass. Read-only browser inspection uses the
connected app's fixed named-host inspector and per-document identity. It redacts
private values and never focuses controls, dispatches input or starts a browser.
Evidence list/delete combine bounded current-session records and explicitly retained
text records scoped to the selected app. Retention requires the invoking command
to grant `evidence-retain`; records survive restart in the private native cache.
List/renew/delete work offline without Node or server startup. Expiration is a
future ISO timestamp or manual deletion; expired records are filtered on reads.
Corruption and full retained capacity fail explicitly. Deletion cannot erase a client transcript. Programmatic `interact --mechanism handler-dispatch` uses an untrusted HTML click,
not CDP or OS input. Require document/selector/request key, then inspect state
separately. A repeated identical key returns the original delivery receipt; never
change its binding or automatically use a new key after unknown effects. Admission
outlives the HTTP client and observations are bounded. Receipts are limited to 256
keys/current dev-server startup and retain no duplicate UI-text body. CDP/OS input,
visual capture remains unsupported; explicit retention currently covers text records only.

```sh
/absolute/path/to/xplat-go inspect APP_SESSION_ID --testid counter.value --limit 20 --json
/absolute/path/to/xplat-go interact APP_SESSION_ID --document DOCUMENT_ID --testid counter.increment --mechanism handler-dispatch --request-key CLICK_KEY --json
XPLAT_PERMISSIONS=evidence-retain /absolute/path/to/xplat-go evidence retain EVIDENCE_ID --json
/absolute/path/to/xplat-go evidence list --kind inspection --json
/absolute/path/to/xplat-go diagnostics --json
/absolute/path/to/xplat-go diagnostics --session ENGINE_CAPTURE_ID --limit 50 --stream stderr --json
```

```sh
/absolute/path/to/xplat-go actions invoke --action ACTION_ID --instance APP_INSTANCE --revision REVISION --input '{}' --request-key REQUEST_KEY --json
/absolute/path/to/xplat-go actions status JOB_ID --json
```

Consult the native schema
for actual coverage. The superseded detached `session start/end`, `runtime build`
and job-control surface is absent from Go; use ordinary explicit foreground builds
and typechecks. The retained Nim and TypeScript surfaces below describe their
older implementation, not the Go migration's lifecycle contract.

```sh
/absolute/path/to/xplat-go build --targets web
/absolute/path/to/xplat-go typecheck
```

The parallel Nim implementation is experimental and intended for the npm `nim`
tag. Its installed catalog distinguishes implemented commands from schema-only
discovery. Native `status` reports actual installed bindings, tool observations,
guidance and source coverage; `capabilities` describes the providers wired into
that build. Tool presence does not qualify an SDK/device or runtime check.
Canonical compatibility checks accept an exact same-release `@octane-xplat/cli`
Nim prerelease; its installed version must match. The reference upgrade planner
preserves this choice and rejects shared-catalog or override conflicts before
writes. Keep other framework pins strict. Native doctor/upgrade execution is
still pending; the compatibility core alone does not qualify those commands.
Native `typecheck` is available on macOS using the project-installed
TSRX checker and CLI-owned worker; it never executes baked loaders. Native `routes`
bakes data and watches route/configuration edits on macOS, with owned worker
cancellation and last-good publication. Keep generated output paths stable while
watching. Route planning/rendering runs in the selected project's build worker;
Nim validates the artifact plan and owns publication and the worker's lifecycle.
Session list/status/end and job status/cancel use the authenticated native host
on macOS. Reads never start it. Its private per-workspace cache survives project
cache cleanup. Web `build --targets web` and `runtime build --platform web` invoke the selected
project's installed Vite. Build-job diagnostics retain bounded output while the
host lives; inspect with `diagnostics --job JOB_ID`. Native macOS builds use
the separate `@octane-xplat/macos-build/worker` and its host assets. Nim validates
and publishes staged app/DMG artifacts after the worker exits; cancellation
before publication preserves the previous artifacts. Overlapping native builds
for one app report target busy. Native macOS target discovery includes live
session ownership. `session start macos` uses the project's installed development
worker for Vite/compiler/HMR; Nim owns readiness, logs and process cleanup.
End the returned identity with `session end SESSION_ID`. App-scoped retained
session logs survive host exit; build-job captures still last only while the
host lives. An unavailable owner makes uncompleted history disconnected and
cleanup unconfirmed: historical end never signals recorded PIDs. macOS attachment
observes compatible same-user engines in the selected app's working directory.
It infers identity and captures lifecycle events only; end/shutdown releases its
observer while preserving external processes. Native macOS diagnostics retain
complete local .ips originals separately from logs and disclose report availability
and confirmed/candidate association. Other report platforms, launch/attach engines
and automatic owner-death recovery remain pending.
Native docs read/search/index are available on macOS arm64 without Node/Bun.
`docs index` explicitly prepares about 61 MB of optional pinned model/runtime
downloads; ordinary search never downloads them. Check its reported retrieval
mode and provenance, keep returned refs, and re-index edited linked docs. Native
cache state is separate from TypeScript; backend vector caches are not interchangeable.
Native development-action listing/status and HTTP control are available on macOS.
Invocation validates JS field contracts in the selected project's compatible
`@octane-xplat/cli/worker`, so it needs that package and Node >=22.22.2. Use the
live instance/revision, follow the job, and preserve unknown/partial outcomes.
The native host owns admission workers too; shutdown awaits them. This host-side
qualification does not expand the app runtime transport limits in the
[development-actions reference](development-actions.md).
The Nim package retains its Vite subpaths and a bounded worker export. Engine
packages are optional peers, and native-only installs do not fetch them. The
native build-worker/declaration lookup uses the selected project's compatible
`@octane-xplat/cli` installation, without a separate build-package requirement.
Native lint on macOS invokes the selected project's `@octane-xplat/lint/bin`
with Node >=22.22.2. Install that package in the project; it is not bundled with
the Nim tarball. Help is native. The engine owns its rules, ignores and safe
fixes; Nim owns process cleanup. Native `fmt` on macOS uses the project's
`@octane-xplat/fmt@0.1.1` and Node; check mode writes nothing, and transform
errors leave the whole batch untouched. Help remains native. The small formatter
operation shares the reference planner; it is not a second formatter engine.
On Ubuntu x64, the native owner and web build workflow are qualified with the
project-installed route/baking worker and Vite, including job cancellation and
child/descendant cleanup. Keep macOS-specific engines on a Mac. Windows process
jobs have separate descendant-cleanup checks, and HTTP/TLS has a separate native
transport gate. Private owner/bootstrap/RPC also pass with PowerShell ancestry
and Bun script-run cross-SSH handoff. Windows Turbo task teardown ends the owner
in the observed context; survival after that task remains unqualified. The
representative Windows 11 x64 web-build workflow now passes with Bun 1.4.4, the
canonical project worker and Vite, including private sidecars, cancellation and
last-good artifacts. Other Windows commands/engines still require their own gates.

```sh
# On a qualified host, from the selected app with its build tools installed:
xplat runtime build --platform web --json
# Substitute the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
```

Keep using the TypeScript CLI for unported workflows.
Small plugins and workers are available through the project-installed
`@octane-xplat/cli` package. See the
[native migration boundaries](../../../../packages/cli/nim/README.md).

```sh
bun --version
bun run xplat --help
bun run xplat catalog --json
```

Use the app's installed CLI for discovery and supported operations. It
complements source editing; it is not an arbitrary shell/evaluation service or
a deployment tool. Choose the commands needed for the task instead of running
all discovery commands before every edit. Uppercase placeholders below must be replaced with exact returned values.

`xplat patches` supports Bun and pnpm. It selects the workspace root and uses
the declared `packageManager` before lockfile detection. Bun catalogs live in
root `package.json`; Bun patches use top-level `patchedDependencies`. pnpm 11
patches always use `pnpm-workspace.yaml`, including standalone apps. Require
Bun >=1.4.4 for the complete framework patch set; 1.4.3 failed the NativeScript
Vite patch. A retained binary `bun.lockb` needs conversion to `bun.lock` first.
The [CLI patch guide](../../../../docs/packages/package-cli.md#framework-patches)
owns setup and recovery. `xplat dev` and `build`, including agent adapters,
use the selected project's package manager.

```sh
xplat patches apply --package-manager bun
bun install
xplat patches check
```

## Discover the installed contract

Start with help when the command is known; use the catalog to discover command
families. Agent-command schemas describe inputs, effects, permissions, output
kinds, and errors without executing the operation. Other commands, such as
upgrade, lint, and formatting, own their reference in `--help`; do not assume
they accept the agent commands' `--json` or `--schema` flags.

```sh
bun run xplat --help
bun run xplat catalog --json
bun run xplat session --help
bun run xplat session start --schema
```

The catalog is a command directory for the installed CLI version, not a live
support report. Its `data.commands` contains agent contracts;
`data.orchestration` contains summaries of other implemented commands;
`data.planned` is future work, not executable functionality. Filter the catalog
to relevant entries rather than loading every descriptor into context. Use live
discovery to distinguish declared targets from available toolchains and supported
operations; discovery does not boot devices or launch apps.

```sh
bun run xplat status --json
bun run xplat capabilities --json
bun run xplat targets --json
bun run xplat permissions --json
```

Read `ok`, `data` or `error`, and `context` in the JSON envelope. Command acceptance
is distinct from async completion. Exit/error meanings are in the catalog;
structured output is on stdout and diagnostics on stderr. A permission report
is not an authorization grant. Honor project/task restrictions, including visual
approval, rather than changing permission settings to bypass them.

An explicit build selection is all-or-nothing: every kind in `--targets` must
be available. A mixed valid/unavailable selection fails before code generation
or process launch. Use the error's available-kind list to correct the command.

```sh
bun run xplat build --targets web,android
```

For an exact development device, use `--device` with the returned target ID.
An optional positional platform restricts that selection. Xplat prepares iOS
simulators through `simctl`; it does not need Simulator.app. Physical-device
launch remains NativeScript's responsibility.

```sh
bun run xplat dev ios --device DEVICE_UDID
bun run xplat dev android --device DEVICE_SERIAL
```

## Bind the app and retrieve context

A sole app can bind from the working directory. In an ambiguous workspace, use
an explicit app ID/path/package from discovery; do not pick the first candidate.
`--app` selects for one call, while `app select` stores a client/workspace
preference. Keep independent agents' preferences separate with `--client` or
`XPLAT_AGENT_CLIENT` when persistent selection is needed.

```sh
bun run xplat status --app APP_ID --json
bun run xplat app select APP_ID --client skill-task --json
bun run xplat guidance --client skill-task --json
```

Retrieve docs for the selected app's installed versions. Open search refs rather
than constructing them. Missing snapshots, explicit comparison versions, and
installed-source fallbacks have different provenance; do not quietly substitute
latest guidance. Code retrieval is current source, separately labeled as app or
framework code; it is not a historical release snapshot.

```sh
# From the intended app directory, or with the chosen --app/--client on each call:
bun run xplat guidance --json
bun run xplat docs search "navigation" --json
bun run xplat docs read --ref DOC_REF --json
bun run xplat code search "RouteOutlet" --corpus framework --mode exact --json
bun run xplat code read --ref CODE_REF --json
```

For questions phrased differently from the docs, prepare local embeddings with
`docs index`. This explicit step may download a pinned model; ordinary search
never downloads one. Check `data.retrieval` for the actual mode and fallback
reason. Re-index after editing linked-checkout docs or upgrading the embedding
backend; vectors from the previous backend are not reused. Release entries have
their own `releaseVersion`, separate from snapshot provenance. See
[local documentation search](../../../../docs/packages/package-cli.md#local-documentation-search).

```sh
bun run xplat docs index --json
bun run xplat docs search "remember input between pages" --json
bun run xplat docs search "navigation" --corpus changelog --json
```

## Choose an app-building operation

Use existing project scripts and focused help for ordinary changes. Formatting
writes by default; upgrades, platform additions, generated routes, fonts, and
OTA configuration can change the workspace. Keep them within the task. Start
with check modes when inspecting compatibility or source quality.

```sh
bun run xplat doctor --help
bun run xplat upgrade --check
bun run xplat fmt --check
bun run xplat lint --help
bun run xplat routes --help
bun run xplat add --help
```

When font registration rejects an invalid `fonts/fonts.json` in the app source
directory, repair the existing file. Do not delete it to make registration pass:
that discards saved family/token registrations.

```sh
bun run xplat fonts add ./Inter.ttf
```

Run platform additions from the intended app directory. In a monorepo, `add`
fills missing catalogs and patch configuration in the owning Bun
workspace while preserving existing settings. Review that shared file along
with the app changes; keep the app in its owning workspace.

```sh
bun run xplat add ios --no-install
git diff
bun install
```

For setup/build/package tasks, follow [getting started](getting-started.md) and
[toolchain](toolchain.md). For tests, use [testing](testing.md); do not invent an
`xplat test` command. Workshop, patches, fonts, and updates are discoverable
through their installed help when those tasks apply.

## Follow jobs and sessions through completion

For output from an ordinary `xplat dev` invocation, list retained runs for the
bound app, then read an exact returned run ID. No runtime host or agent session
is needed, and the files remain readable after the dev process exits. Read
[diagnostic coverage](../../../../docs/testing/diagnostics.md) before
interpreting empty output; browser warning/error forwarding needs the web
development bridge. Native log output includes only what the toolchain forwards;
OS reports have a separate discovery result.

```sh
bun run xplat diagnostics --platform ios --json
bun run xplat diagnostics --session SESSION_ID --cursor 0 --limit 50 --json
bun run xplat diagnostics --session SESSION_ID --cursor NEXT_CURSOR --limit 50 --json
```

Read log pages from `data.logs` and keep `logs.nextCursor` with its run ID.
Native summaries are in `data.reports`; their availability is reported by
`coverage.nativeReports`. A candidate association is not proof that this run
caused the failure. Discovering reports may write bounded local retained copies;
it does not start profiling or install a crash handler.

```sh
bun run xplat diagnostics --session SESSION_ID --report REPORT_ID --json
```

Report IDs belong to the selected run; they are separate from log cursors.
Session selectors include retained logs and native reports. Standalone build
jobs have output captures without native reports.

Keep cursors with their run ID. Report capture start, truncation/dropped records,
incomplete tails, and historical status; capture-owner liveness is not app
readiness. Ordinary dev and agent launches share retained session identities; build jobs
keep separate output captures.

For an agent-owned build, use `runtime build` and follow its returned job to a
terminal result. Poll with bounded reads and read job logs when it fails or
stalls. A successful invocation can mean a job was accepted, not that the build
passed. Preserve returned identities; do not invent job IDs or launch a second
build merely because the first response was lost. Use a task-specific request key to recover live
requests; keys do not deduplicate arbitrary later reruns.

```sh
bun run xplat runtime build --platform web --request-key packing-web-build --json
bun run xplat job status JOB_ID --json
bun run xplat diagnostics --job JOB_ID --limit 50 --json
```

Start a session only when the task needs a running app. Choose a returned target
ID when several targets are available. The optional positional also accepts a
platform name; omitted/platform selection must identify exactly one eligible target.
Poll the returned session ID for launch progress and readiness; the session then remains available for logs/actions. Attach when a
compatible user-owned session already exists instead of restarting it.

```sh
bun run xplat session list --json
bun run xplat session start TARGET_ID --json
bun run xplat session status SESSION_ID --json
# Alternative: bind an existing compatible target instead of starting another.
bun run xplat session attach --platform web --target TARGET_ID --json
```

Use `logs.nextCursor` to continue bounded reads and disclose truncation or dropped
records. Empty sessions or an absent host do not establish that an app passed;
read-only status commands do not create a host. End owned work through the CLI:
attached user-owned sessions are preserved, while sessions the host started
release their owned resources. Session status and diagnostics resolve the same retained identity across
CLI and MCP, even after the owner exits. End requests go to the owner; an
unreachable owner is reported without signaling a guessed process.

```sh
bun run xplat session status SESSION_ID --json
bun run xplat diagnostics --session SESSION_ID --limit 50 --json
bun run xplat diagnostics --session SESSION_ID --cursor NEXT_CURSOR --limit 50 --json
# When the task is done, or after requesting cancellation of its pending work:
bun run xplat job cancel JOB_ID --json
bun run xplat session end SESSION_ID --json
```

## Inspect and assert supported behavior

Check capabilities before using inspection/input. The current built-in inspection
path targets owned Chromium sessions and bounded named hosts; it does not imply
an arbitrary native view tree or attached-session inspection. Use stable IDs,
retain the returned document identity, and inspect resulting state after input.
A delivery record alone is not an app-state assertion. Re-inspect on stale
identity instead of replaying against an old document.

```sh
bun run xplat inspect SESSION_ID --testid packing.add-item --json
bun run xplat interact SESSION_ID --document DOCUMENT_ID --testid packing.add-item --mechanism dom-event --json
bun run xplat inspect SESSION_ID --testid packing.item-count --json
```

`dom-event` input is not proof of OS input. The separately qualified `os-input`
path has platform, headed-browser, and desktop-input prerequisites; consult
focused help and the reported capability before selecting it. Follow
[test identifiers](../../../../docs/testing/test-identifiers.md) for stable targets
and [testing](testing.md) for evidence boundaries.

For app-declared development actions, first inspect the live registry, the exact
instance, availability, input contract, declared effects, and revision. Invoke
only an action within the task's authorization, follow its returned job, and
assert state independently. Do not invent action IDs or treat an empty registry
as a broken CLI. Actions supplement UI checks; they do not prove user input.
To add actions or diagnose missing registration, read
[authoring development actions](development-actions.md), including bridge setup
and platform qualification limits.

```sh
bun run xplat actions list --json
# Replace the input JSON with the selected action's declared payload.
bun run xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key packing-action --json
bun run xplat actions status JOB_ID --json
```

## Recover and keep evidence scoped

Use structured error recovery rather than repeatedly retrying an unchanged
request. Resolve ambiguous selection explicitly; fix missing prerequisites or
report unsupported capabilities. On stale document/action registry identity,
refresh discovery first. For an unknown mutation outcome, inspect the session,
job, and logs before retrying with a new request key.

```sh
bun run xplat job status JOB_ID --json
bun run xplat diagnostics --job JOB_ID --limit 50 --json
bun run xplat evidence list --json
```

Artifacts are session-scoped unless retained. Retain only evidence the task
needs, and honor its privacy/lifetime requirements; deleting an artifact cannot
erase external transcripts. Capture and image analysis still require explicit
current-task approval, even when CLI permissions technically allow them. Help
and schema can be read without taking a screenshot.

```sh
bun run xplat evidence retain --help
bun run xplat evidence delete --help
bun run xplat capture --schema
```
