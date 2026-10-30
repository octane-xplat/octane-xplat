# Use xplat as an agent

The npm `xplat` command requires Bun >=1.4.3 on PATH. Standalone release
executables embed Bun and unpack their production payload into a writable
local cache; they still require the app's Node/pnpm/platform toolchains.
See [CLI installation and executable builds](../../../../packages/cli/README.md#single-file-executable).

```sh
bun --version
pnpm xplat --help
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
The [CLI patch guide](../../../../packages/cli/README.md#framework-patches)
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
pnpm exec xplat --help
pnpm exec xplat catalog --json
pnpm exec xplat session --help
pnpm exec xplat session start --schema
```

The catalog is a command directory for the installed CLI version, not a live
support report. Its `data.commands` contains agent contracts;
`data.orchestration` contains summaries of other implemented commands;
`data.planned` is future work, not executable functionality. Filter the catalog
to relevant entries rather than loading every descriptor into context. Use live
discovery to distinguish declared targets from available toolchains and supported
operations; discovery does not boot devices or launch apps.

```sh
pnpm exec xplat status --json
pnpm exec xplat capabilities --json
pnpm exec xplat targets --json
pnpm exec xplat permissions --json
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
pnpm exec xplat build --targets web,android
```

For an exact development device, use `--device` with the returned target ID.
An optional positional platform restricts that selection. Xplat prepares iOS
simulators through `simctl`; it does not need Simulator.app. Physical-device
launch remains NativeScript's responsibility.

```sh
pnpm exec xplat dev ios --device DEVICE_UDID
pnpm exec xplat dev android --device DEVICE_SERIAL
```

## Bind the app and retrieve context

A sole app can bind from the working directory. In an ambiguous workspace, use
an explicit app ID/path/package from discovery; do not pick the first candidate.
`--app` selects for one call, while `app select` stores a client/workspace
preference. Keep independent agents' preferences separate with `--client` or
`XPLAT_AGENT_CLIENT` when persistent selection is needed.

```sh
pnpm exec xplat status --app APP_ID --json
pnpm exec xplat app select APP_ID --client skill-task --json
pnpm exec xplat guidance --client skill-task --json
```

Retrieve docs for the selected app's installed versions. Open search refs rather
than constructing them. Missing snapshots, explicit comparison versions, and
installed-source fallbacks have different provenance; do not quietly substitute
latest guidance. Code retrieval is current source, separately labeled as app or
framework code; it is not a historical release snapshot.

```sh
# From the intended app directory, or with the chosen --app/--client on each call:
pnpm exec xplat guidance --json
pnpm exec xplat docs search "navigation" --json
pnpm exec xplat docs read --ref DOC_REF --json
pnpm exec xplat code search "RouteOutlet" --corpus framework --mode exact --json
pnpm exec xplat code read --ref CODE_REF --json
```

## Choose an app-building operation

Use existing project scripts and focused help for ordinary changes. Formatting
writes by default; upgrades, platform additions, generated routes, fonts, and
OTA configuration can change the workspace. Keep them within the task. Start
with check modes when inspecting compatibility or source quality.

```sh
pnpm exec xplat doctor --help
pnpm exec xplat upgrade --check
pnpm exec xplat fmt --check
pnpm exec xplat lint --help
pnpm exec xplat routes --help
pnpm exec xplat add --help
```

Run platform additions from the intended app directory. In a monorepo, `add`
fills missing catalogs and patch configuration in the nearest enclosing pnpm
workspace while preserving existing settings. Review that shared file along
with the app changes; keep the app in its owning workspace.

```sh
pnpm exec xplat add ios --no-install
git diff
pnpm install
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
pnpm exec xplat diagnostics --platform ios --json
pnpm exec xplat diagnostics --session SESSION_ID --cursor 0 --limit 50 --json
pnpm exec xplat diagnostics --session SESSION_ID --cursor NEXT_CURSOR --limit 50 --json
```

Read log pages from `data.logs` and keep `logs.nextCursor` with its run ID.
Native summaries are in `data.reports`; their availability is reported by
`coverage.nativeReports`. A candidate association is not proof that this run
caused the failure. Discovering reports may write bounded local retained copies;
it does not start profiling or install a crash handler.

```sh
pnpm exec xplat diagnostics --session SESSION_ID --report REPORT_ID --json
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
pnpm exec xplat runtime build --platform web --request-key packing-web-build --json
pnpm exec xplat job status JOB_ID --json
pnpm exec xplat diagnostics --job JOB_ID --limit 50 --json
```

Start a session only when the task needs a running app. Choose a returned target
ID when several targets are available. The optional positional also accepts a
platform name; omitted/platform selection must identify exactly one eligible target.
Poll the returned session ID for launch progress and readiness; the session then remains available for logs/actions. Attach when a
compatible user-owned session already exists instead of restarting it.

```sh
pnpm exec xplat session list --json
pnpm exec xplat session start TARGET_ID --json
pnpm exec xplat session status SESSION_ID --json
# Alternative: bind an existing compatible target instead of starting another.
pnpm exec xplat session attach --platform web --target TARGET_ID --json
```

Use `logs.nextCursor` to continue bounded reads and disclose truncation or dropped
records. Empty sessions or an absent host do not establish that an app passed;
read-only status commands do not create a host. End owned work through the CLI:
attached user-owned sessions are preserved, while sessions the host started
release their owned resources. Session status and diagnostics resolve the same retained identity across
CLI and MCP, even after the owner exits. End requests go to the owner; an
unreachable owner is reported without signaling a guessed process.

```sh
pnpm exec xplat session status SESSION_ID --json
pnpm exec xplat diagnostics --session SESSION_ID --limit 50 --json
pnpm exec xplat diagnostics --session SESSION_ID --cursor NEXT_CURSOR --limit 50 --json
# When the task is done, or after requesting cancellation of its pending work:
pnpm exec xplat job cancel JOB_ID --json
pnpm exec xplat session end SESSION_ID --json
```

## Inspect and assert supported behavior

Check capabilities before using inspection/input. The current built-in inspection
path targets owned Chromium sessions and bounded named hosts; it does not imply
an arbitrary native view tree or attached-session inspection. Use stable IDs,
retain the returned document identity, and inspect resulting state after input.
A delivery record alone is not an app-state assertion. Re-inspect on stale
identity instead of replaying against an old document.

```sh
pnpm exec xplat inspect SESSION_ID --testid packing.add-item --json
pnpm exec xplat interact SESSION_ID --document DOCUMENT_ID --testid packing.add-item --mechanism dom-event --json
pnpm exec xplat inspect SESSION_ID --testid packing.item-count --json
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
pnpm exec xplat actions list --json
# Replace the input JSON with the selected action's declared payload.
pnpm exec xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key packing-action --json
pnpm exec xplat actions status JOB_ID --json
```

## Recover and keep evidence scoped

Use structured error recovery rather than repeatedly retrying an unchanged
request. Resolve ambiguous selection explicitly; fix missing prerequisites or
report unsupported capabilities. On stale document/action registry identity,
refresh discovery first. For an unknown mutation outcome, inspect the session,
job, and logs before retrying with a new request key.

```sh
pnpm exec xplat job status JOB_ID --json
pnpm exec xplat diagnostics --job JOB_ID --limit 50 --json
pnpm exec xplat evidence list --json
```

Artifacts are session-scoped unless retained. Retain only evidence the task
needs, and honor its privacy/lifetime requirements; deleting an artifact cannot
erase external transcripts. Capture and image analysis still require explicit
current-task approval, even when CLI permissions technically allow them. Help
and schema can be read without taking a screenshot.

```sh
pnpm exec xplat evidence retain --help
pnpm exec xplat evidence delete --help
pnpm exec xplat capture --schema
```
