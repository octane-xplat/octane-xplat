# Use xplat as an agent

The npm `xplat` command requires Bun >=1.4.4 on PATH. Standalone release
executables embed Bun and unpack their production payload into a writable
local cache; they still require the app's Node/Bun/platform toolchains.
See [CLI installation and executable builds](../../../../docs/packages/package-cli.md#single-file-executable).

The parallel Nim implementation is experimental and intended for the npm `nim`
tag. Its installed catalog distinguishes implemented commands from schema-only
discovery. Native `status` reports actual installed bindings, tool observations,
guidance and source coverage; `capabilities` describes the providers wired into
that build. Tool presence does not qualify an SDK/device or runtime check.
Native `typecheck` is available on macOS using the project-installed
TSRX checker and build package; it never executes baked loaders. Native `routes`
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
`@octane-xplat/build/worker`, so it needs that package and Node >=22.22.2. Use the
live instance/revision, follow the job, and preserve unknown/partial outcomes.
The native host owns admission workers too; shutdown awaits them. This host-side
qualification does not expand the app runtime transport limits in the
[development-actions reference](development-actions.md).
Native lint on macOS invokes the selected project's `@octane-xplat/lint/bin`
with Node >=22.22.2. Install that package in the project; it is not bundled with
the Nim tarball. Help is native. The engine owns its rules, ignores and safe
fixes; Nim owns process cleanup. Native `fmt` is still pending.
On Ubuntu x64, the native owner and web build workflow are qualified with the
project-installed route/baking worker and Vite, including job cancellation and
child/descendant cleanup. Keep macOS-specific engines on a Mac. Windows native
HTTP/process/owner adapters and its representative workflow remain unqualified.

```sh
# On a qualified host, from the selected app with its build tools installed:
xplat runtime build --platform web --json
# Substitute the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
```

Keep using the TypeScript CLI for unported workflows.
Project-installed plugins are available separately as
`@octane-xplat/build`. See the
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
