# Parallel Nim CLI

This directory owns the native CLI implementation. The TypeScript entry and
package exports remain in place. The native command currently implements catalog,
status, capabilities, clean, typecheck, routes, lint, web/macOS builds, app selection, permissions, code search, code read, guidance
and docs read/search/index, actions list/invoke/status, macOS targets/session start/attach, session list/status/end, job status/cancel and diagnostics; other agent commands provide help and schemas with execution marked
`pending`. Pending operations exit 3 and never invoke the old CLI.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim CLI"}' -- bun run turbo run test:nim --filter=@octane-xplat/cli
research/nim-cli/native/xplat catalog --json
```

`core.nim` contains discovery, platform detection and framework-binding routines
shared with the differential probe. `main.nim` owns the public command entry.
`workspace.nim` owns per-invocation selection, client preferences and task policy.
`package_manager.nim` and `workspace_glob.nim` own workspace/lockfile interpretation;
`jsonc.nim` validates comment-bearing Bun data separately from strict manifests.
`docs_binding.nim` resolves installation identities and release mappings without
executing package code. `code_scope.nim` owns source enumeration and direct-read
boundaries, including symlink targets and private/generated exclusions. These
modules are qualified by independent TypeScript differential probes. `docs_retrieval.nim` and
`markdown_chunks.nim` provide exact local Markdown retrieval and release-aware
sections. Their macOS locale-order adapter is exercised independently.
`docs_snapshots.nim` acquires exact Git tags into commit-pinned caches, validates
package metadata, preserves offline bindings and reports moved/deleted tags.
It never executes fetched package scripts. `docs_service.nim` owns installation
refresh, version-bound reads/search/index, provenance and tag-conflict resolution.
Exact and lexical search need no model; hybrid search uses prepared native vectors
and discloses its fallback. Project guidance stays separately labeled.
`docs_index.nim` now owns the FTS5 and embedding-cache algorithm behind an
explicit embedding-provider boundary. Its macOS system SQLite adapter and
fixture-embedding comparisons are complemented by the real-model and public
compute-boundary gates. Native and WASM vector caches retain separate identities.
`minilm_tokenizer.nim` implements the pinned single-sequence BERT/WordPiece
encoding path, using checksummed model metadata and lazy macOS ICU normalization.
Its differential gate covers exact token IDs and Unicode normalization;
`minilm_model.nim` connects its output to the native ONNX C API. The Apache-2.0 port attribution is included
in the native package notices.
`minilm_model.nim` and its ONNX C adapter are exercised by a separate real-model
qualification task. CPU graph optimizations and quantized rounding can change
embeddings and retrieval order relative to WASM. Inference stays in Nim. Evaluate
useful retrieval quality rather than exact native/WASM ranking equality; the
observed ranking difference alone is not a blocker. Preserve distinct engine/cache
identities; the optional model gate checks meaningful queries on maintained guides.
`inference_assets.nim` prepares optional checksummed model/runtime files explicitly;
ordinary search and empty inventories do not download them. `docs_compute.nim`
isolates blocking model/index execution in an owned same-executable child, with
bounded private messages, timeouts/cancellation and staging cleanup. The production
binary runs the entire public docs binding/Git/inventory/index pipeline in that
child. Native docs caches live at `XPLAT_MCP_CACHE/nim-v1` (the parent defaults to
`~/.cache/octane-xplat/mcp-docs`); status reports that namespace. An OS lock serializes
mutations. The owner registers snapshot staging on the snapshot cache filesystem
and asset staging on the asset filesystem, then awaits group cleanup before
removing either. Model/runtime assets default to
`~/.cache/octane-xplat/nim-inference`; `XPLAT_NIM_INFERENCE_CACHE` can select an
absolute private directory. Optional pinned download bodies total about 61 MB,
with about 69 MB retained; these costs are separate from the CLI size. Only macOS
arm64 execution is qualified. No Node/Bun is required for these docs operations.

```sh
research/nim-cli/native/xplat docs search navigation --project "$PWD" --app apps/web --mode lexical --json
research/nim-cli/native/xplat docs index --project "$PWD" --app apps/web --package @octane-xplat/ui --json
research/nim-cli/native/xplat docs search "remember input between pages" --project "$PWD" --app apps/web --json
```

Markdown discovery rejects external symlink targets, skips directory cycles, and
bounds traversal depth/entries/files. Individual docs are limited to 4 MiB and
indexed inventory/project guidance to 32 MiB; limit failures are explicit. Search
refs retain lexical names while scope checks use canonical targets.
Complete pinned public C API headers are build inputs; no ONNX runtime is linked or
loaded during ordinary help/status startup.
`native_http.nim` provides asynchronous HTTP/TLS through the host libcurl on macOS
and Linux,
with header/body readiness, cancellation, byte streaming and explicit proxy/CA
options. `http_url.nim` statically compiles pinned Ada URL parsing for the
reference's WHATWG behavior. `actions_bridge.nim` ports authenticated registry,
submit, wait and cooperative-cancel envelopes; it does not establish runtime
ownership, action execution or a qualified app session. The Linux transport is
qualified on Ubuntu 24.04 x64 with libcurl 8.5/OpenSSL; it requires `libcurl.so.4`
at runtime. Pinned task-local curl headers are build inputs, not a bundled engine.
Windows HTTP remains unimplemented. The representative Linux workflow runs the
production native owner, installed route/baking worker and Vite web build, then
cancels a resistant worker and descendant while preserving generated output.
The bridge accepts an explicit fetch procedure; the ordinary client adapter and
header-controlled test transport share the same envelope/cancellation logic.

`action_endpoints.nim` scans bounded same-user regular sidecars, checks canonical
app ownership and loopback origins, and excludes external/symlink destinations.
Bridge calls refuse redirects and bound response bodies; body transfer failures
remain failures rather than becoming successful null registries. Tokens stay out
of public instance/job metadata. `action_service.nim` owns live instance refresh,
permissions, bounded FIFO/overlap admission, revision checks before dispatch,
scoped request identities, jobs and cooperative cancellation/unknown outcomes.
Read-only listing never starts a host. Invocation is owned by the native host;
status requires that owner and its bounded history.

The selected project's build worker validates action input/output through the
existing JS field validator, including JavaScript regex/default semantics. This
operation neither executes project config nor invokes an action. Native ownership
bounds validation CPU time and awaits worker teardown, including pre-job admission
during shutdown. Node and a compatible `@octane-xplat/build` installation are
required for invocation; listing/status remain native. Inference stays Nim.

```sh
research/nim-cli/native/xplat actions list --project "$PWD" --app apps/web --json
# Replace these values with an action/instance/revision from the live listing.
research/nim-cli/native/xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key fixture-setup-1 --project "$PWD" --app apps/web --json
research/nim-cli/native/xplat actions status JOB_ID --project "$PWD" --json
```

Serialized admission is bounded to eight live jobs per instance; declared overlap
uses a sixteen-job cap. Queued cancellation never dispatches that action or releases
another ticket's slot. Registry changes reject queued work before dispatch. A live
request key returns its job even at capacity; changed input/revision is rejected.
Request IDs are scoped and URL-safe, including across independent instances.
Bridge outcome retention is bounded; keys do not promise indefinite exactly-once
execution. Inspect unknown outcomes before retrying. Cancellation is best-effort
and preserves reported effects; app-reported output received during cancellation
is labeled as not revalidated. A failed result contract never undoes an action.
Headless macOS-host qualification uses the actual Vite middleware and canonical app
registry; it does not establish AppKit/NativeScript fetch or UI/input coverage.
`managed_process.nim` owns macOS and Linux child sessions and process groups, with explicit
argv/cwd/environment, independent pipe draining, byte passthrough, bounded UTF-16
log lines and cooperative/forced stop. Its manager exposes explicit close and
opt-in SIGINT/SIGTERM handling; normal owner exit also releases its groups.
Linux uses GNU spawn close-from actions (glibc 2.34+) and `/proc` group
observation. Qualified Ubuntu cancellation waits for both leader and descendants
to be reaped, including leader-first exits. Deliberately detached descendants,
non-reaping container init processes and abrupt owner death remain unqualified.
Native launches reject no-shebang executable text with `ENOEXEC`; declare the
interpreter instead of relying on Node/Linux's implicit shell fallback.
`process_exit.nim` preserves native exit status bytes beyond Nim's `quit` range.
`command_probe.nim` supplies bounded, read-only version queries using that process
owner. Missing tools, nonzero exits, output overflow and deadlines produce absent
observations; cancellation propagates after cleanup. `prerequisites.nim` checks
the actual selected PATH and package manager. Browser readiness remains unknown
without launching a browser. These helpers do not qualify SDKs/devices.
`project_status.nim` composes fresh selection, installed bindings, guidance,
docs/code status, permissions and native capabilities. It supplies owned async
observations to synchronous read services instead of starting another Git process
there. `capabilities.nim` reports only the providers wired into the native build;
web/macOS build/log/job providers report partial support; macOS target/launch/session-end providers report partial support; other runtime/session creation and evidence providers remain unavailable and semantic retrieval
remains partial. Contract IDs and product boundaries are embedded from the
canonical reference at build time.
`target_discovery.nim` adds bounded read-only simctl/adb inventory and host
eligibility helpers. Its simulator parser validates availability and identities
before offering targets. Public `targets` composes macOS host eligibility with native session ownership
and busy state. Other platforms report explicit pending composition; device
inventory alone does not establish launch readiness.
`sessions.nim` owns session identities, progress, usable/historical states and
owned cleanup. Concurrent ends share completion; attached bindings preserve their
external process. Snapshot mutation and observer exceptions cannot change private
ownership or bypass cleanup. Its process fixture verifies cleanup before the outer
test owner closes. The native host now retains these records across CLI invocations. macOS development launch composes the installed engine with this registry;
macOS attachment instead observes same-user compatible engines in the selected
app's canonical working directory, using SDK process birth times to detect exit
or PID reuse. It infers identity, captures lifecycle events only and leaves
external processes untouched on end/shutdown. Other launch/attach engines remain
pending. `process_observation.nim` keeps bounded command-line observations
transient; `process_snapshot.c` uses SDK declarations without decoding kernel
argument buffers.
`jobs.nim` adds request deduplication, progress, bounded terminal history and
cooperative cancellation. It retains runner ownership until completion and drains
runners on close. Immediate completed futures can produce a terminal start result;
no JS microtask schedule is assumed. `contract_failure.nim` carries structured
errors across async boundaries with a fallback for ordinary/uninitialized errors.
Public job status/cancel and web/macOS build creation use the native host. Other application
job creators still need their project-engine adapters.
`unix_rpc.nim` supplies bounded one-request NDJSON over macOS and Linux Unix sockets, with
Node interoperability, input/output byte limits, I/O deadlines and draining close.
It preserves existing/replacement socket paths and never owns an application's
process merely because its client disconnects. `host_bootstrap.nim` provides the
private lifetime lock and detached same-executable launch; `host_storage.nim`
provides a native-only per-workspace namespace under `~/.cache/octane-xplat/`.
Host discovery stays outside project dependency caches so `clean` or reinstalling
dependencies cannot erase a live owner's credentials or publication lock.
`host_client.nim` discovers authenticated hosts without spawning on reads.
`agent_host.nim` composes RPC authentication, private descriptor publication,
retained jobs/sessions, idle/signal shutdown and ownership-safe cleanup.
Unpublished startup termination is guarded by the publication lock; descriptor
PIDs never authorize signalling. Default handles cannot close stdin or signal a
process group. Public session list/status/end and job status/cancel connect to
this native owner. Web/macOS builds use project-installed engines. macOS development sessions use a project-installed compiler/HMR worker with
versioned readiness metadata. Other build/launch/attach engines remain pending.
Spawn readiness does not establish application rendering or input behavior.
These boundaries are exercised through independent CLI invocations and actual
native child/descendant processes on macOS. The same bootstrap, RPC and private
host fixture gates execute on Ubuntu 24.04 x64, including public job/session
control of test-owned native resources. The separate representative workflow also
runs the actual project-installed route/baking worker and Vite web build through
the production owner, with worker cancellation, last-good artifact preservation
and authenticated shutdown/restart. This does not qualify Linux native app
engines or the full command surface. Descendants
that deliberately create a new session and abrupt owner SIGKILL remain outside
the process-group cleanup guarantee. Windows managed-process jobs pass a separate actual Windows11 x64 gate for
arguments, pipes, exit status and descendant cleanup, including abrupt supervisor
death. Windows HTTP and private owner/RPC adapters remain unimplemented.
`typecheck_envs.nim` expands the combined environment program natively, preserving
ambient precedence, root-file union, compiler-option checks and generated JSON
bytes. Its differential gate exercises real repository manifests and filesystem
glob semantics. The caller still supplies an ambient source root explicitly;
`typecheck_command.nim` connects installed declaration assets from the selected
project's build package, route generation and tagged project checker execution.
It runs the default and combined environment programs (or the legacy native
program), preserves compiler diagnostic bytes/streams and owns cancellation.
`route_config.nim` validates declarative route paths, source references and
navigation settings without executing application modules. Its checks cover
the repository's actual route configurations and feed the discovery and emitter
modules below.
`route_paths.nim` preserves the shared parameter vocabulary, platform/presentation
suffix ordering and layout rules. `route_generation.nim` owns route locations,
input fingerprints, artifact-plan validation and native publication. The selected
project's `@octane-xplat/build/worker` shares `src/route-generator.ts` with the
TypeScript reference for compiler analysis, rendering and baking. It returns a
versioned plan without publishing generated files. Native checks reject changed
inputs, unexpected/duplicate destinations and missing required artifacts before
publication. Warnings, per-file atomic publication, symlinks and caller umask are
compared against Node on copied repository route trees. Typecheck retains its
`bake: false` behavior, preserving existing baked data.
`build_worker.nim` bounds worker requests/results and owns Node process groups,
timeouts, cancellation and diagnostics. Analysis never executes route modules;
baking delegates loader execution to project-installed Vite and Markdown parsing
to the build package. `route_operation.nim` shares preparation/publication between
public `routes`, builds and bake-skipped `typecheck`. `route_watch.nim` owns readiness,
serial generation, invalidation, error recovery and close. Its macOS FSEvents
adapter queues C-owned bytes; the Nim event loop drains them. Input fingerprints
before publication and a periodic backstop reject stale work even when an OS
event arrives late. Publication is atomic per file. Other watcher hosts remain
unimplemented; no runtime is bundled.
`lint_command.nim` resolves the selected project's `@octane-xplat/lint/bin`
export through its app/ancestor installation, then runs it with Node and owned
process-group cleanup. A broken nearer installation never falls back to a farther
one or a global module path. Nim preserves argv, cwd, output bytes and ordinary
exit status; the engine owns rules, selection, ignores and safe fixes. Help is
embedded at build time and needs no runtime. Lint execution requires the project
lint package and Node >=22.22.2; the core tarball bundles neither. Native `fmt`
is still pending.

```sh
research/nim-cli/native/xplat lint --help
research/nim-cli/native/xplat lint src
research/nim-cli/native/xplat lint --fix src
```

`metadata.json` is generated from the TypeScript descriptors and excluded from
Git. Build-time JavaScript is allowed; native startup does not require Node/Bun.
Installed versions drive guidance and documentation reads; advanced workspace
glob and unusual YAML compatibility still need qualification. App selection uses manifest and
filesystem discovery without making installed-version or runtime-readiness claims.

```sh
research/nim-cli/native/xplat status --schema
research/nim-cli/native/xplat status --project "$PWD" --app apps/macos --json
research/nim-cli/native/xplat capabilities --project "$PWD" --app apps/macos --platform macos --json
research/nim-cli/native/xplat clean --help
```

On macOS, `build --targets web` runs in the foreground, while `runtime build`
starts an owned web build job. Both regenerate routes when configured and invoke
the selected project's installed Vite through its package manager. Configuration
and plugins execute in that toolchain. No global Vite or old CLI fallback is used.
Install project dependencies first. Builds have a 15-minute engine deadline and
release owned process groups before reporting cancellation or timeout. macOS builds use the separate project-installed
[`@octane-xplat/macos-build`](../../macos-build/README.md) worker and native host
assets. macOS development uses that package's `./dev-worker` through native
`session start macos`; other build/launch platforms remain pending.

```sh
# From the app directory, with the built xplat executable on PATH:
xplat build --targets web
xplat runtime build --platform web --json
# Substitute the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --cursor 0 --json
```

`macos_session.nim` owns a development worker and its isolated process group.
The worker reuses the canonical Vite/compiler/HMR engine, with atomic versioned
readiness metadata instead of parsing diagnostic text. Native resources live
under the private host cache, outside dependency caches removed by `clean`.
Ending a session awaits process cleanup and removes only its owned directory.
Session metadata and bounded logs remain readable after the host exits.
`session_history.nim` owns private atomic metadata and rotating JSONL captures,
retaining the newest historical runs per app and preserving active captures.
Authenticated owner generations distinguish live records from historical data;
retained PIDs never authorize signals. A cleanup-confirmed checkpoint follows
actual owned process/resource release. Owner loss leaves disconnected evidence
with cleanup unconfirmed, not a recovered live session. Attachment preserves
external engines while observing app-process births through the SDK. Native
macOS report lookup retains complete .ips originals independently of rotating
logs, with bounded reads, content hashes and explicit confirmed/candidate
association. Worker readiness protocol 2 retains bounded app PID/time history
across rebuilds and final cleanup. Other report platforms and automatic abrupt
owner-death recovery remain migration work.

```sh
xplat targets --platform macos --json
xplat session start macos --json
xplat session status SESSION_ID --json
xplat diagnostics --session SESSION_ID --json
xplat session end SESSION_ID --json
```

`runtime_logs.nim` retains ordered stdout/stderr/lifecycle records with sequence
cursors and explicit retention gaps. Captures are bounded to 2,000 records and
2 MiB of encoded JSON per capture. The host retains 40 build captures and prunes
finished session captures when creating sessions beyond 40; live session captures
remain until their work ends.
Build-job memory captures disappear when the host exits. Development sessions
also write the bounded native history store; disk retention and its cursor
semantics are qualified against the TypeScript reader. A failed append stops
further disk appends, preserving the complete prefix and exposing retention
errors. Retained reads do not create a host or cache. Job history is not persisted.
`runtime_service.nim` applies request permissions and app selection. Live request
keys deduplicate within an app/platform; public request keys remain unchanged.
`runtime_build.nim` owns route generation, managed engine execution, output and
Git build identity. `macos_build.nim` serializes native builds for an app, owns
staging and validates the worker artifact plan before publishing. It backs up
both existing artifacts and restores them on reported rename failures. Normal
cancellation before publication preserves previous outputs; abrupt owner death
during publication can leave recovery files in staging and is not qualified as
automatic recovery. `build_command.nim` shares it for foreground orchestration.

On macOS, `typecheck` uses the project's installed package manager and
`tsrx-tsc`. It generates route types without executing baked loaders, then runs
the ordinary and combined environment programs. Install the compatible build
package and checker in that project before running it. Compiler errors exit 1;
SIGINT/SIGTERM propagate after owned child cleanup.

```sh
research/nim-cli/native/xplat typecheck --help
# Run the executable from the selected app directory:
xplat typecheck
```

On macOS, `routes` generates the contracts/catalogs and bakes loader or Markdown
data through the project's build worker. Loader execution requires its installed
Vite. Watch mode keeps the last successful artifacts when a build fails or becomes
obsolete, cancels the owned worker, and recovers on later edits. Keep output paths
stable while watching; moving them requires stopping and updating client imports.

```sh
xplat routes --dir app --out routes.gen
xplat routes --watch
```

Code retrieval searches selected app and installed framework sources, respects
private/generated file exclusions and checks symlink targets. Reads use UTF-16
offsets to preserve the existing continuation contract. Exact search remains
available while the bounded local semantic index prepares.

```sh
research/nim-cli/native/xplat code search useStore --project "$PWD" --app apps/web --json
research/nim-cli/native/xplat code read --ref xplat-code://app/apps/web/src/main.tsrx --project "$PWD" --app apps/web --json
```

App selection writes a client-scoped cache preference. Explicit `--app` choices
beat that preference on subsequent commands; several matching apps remain an
error. Client IDs for writes must contain 1–64 ASCII letters, digits, underscores
or hyphens. Nim rejects traversal values rather than reproducing the TypeScript
write-path bug tracked in [issue #97](https://github.com/octane-xplat/octane-xplat/issues/97).

```sh
research/nim-cli/native/xplat app select apps/web --project "$PWD" --client agent_one --json
research/nim-cli/native/xplat permissions --scope visual-capture --project "$PWD" --client agent_one --json
```

Guidance reports the selected app's installed framework versions, linked source
status and install/lockfile discrepancies. Its instructions retain the existing
CLI contract; use catalog coverage to check which native operations are ported.

```sh
research/nim-cli/native/xplat guidance --project "$PWD" --app apps/web --json
```

Read documentation from the selected app's linked checkout or exact release
snapshot. Missing snapshots and moved tags are reported; cached snapshots can
serve offline. A reference from an earlier search retains its requested version.
The page slice uses UTF-16 offsets, matching the existing continuation contract.

```sh
research/nim-cli/native/xplat docs read --project "$PWD" --app apps/web \
  --package @octane-xplat/ui --path docs/packages/package-cli.md --limit 800 --json
```

Permission reporting preserves the existing task-authorization baseline. A
visual-capture permission is required unless explicitly granted; discovering an
app never grants it. Reporting permissions neither starts an app nor opens a
visual capture.

The [evaluation tooling](../../../tools/cli-nim/README.md) owns compiler pins,
probe qualification and package staging. Clean only removes known generated
outputs, preserves macOS native sources and NativeScript plugin platform sources,
and prompts on a terminal. Human output styling differs from the TypeScript CLI.

## Parallel npm channel

The release workflow accepts track `nim` and an exact `x.y.z-nim.N` version.
All five native host jobs must pass before packaging/publishing. Publication
uses the existing `release.yml` npm trust binding and explicitly passes
`--tag nim`; stable and nightly paths still package the TypeScript CLI.
No native release is implied by the presence of this workflow.

```sh
# After the workflow changes land on main:
gh workflow run release.yml -f track=nim -f nim_version=0.19.0-nim.1
```

The Nim npm tarball contains native executables, their checksum manifest, and a
small install-time selector. It has no JavaScript implementation payload,
JavaScript exports, or runtime dependency tree. TypeScript remains in the
repository as the migration reference; stable/nightly packaging is unchanged.
Existing `@octane-xplat/cli/vite` and MCP imports are not provided by this
experimental tarball. Project build plugins are separately packaged as
[`@octane-xplat/build`](../../build/README.md); web builds invoke the selected project
toolchain; macOS packaging uses a separate project-installed
[`@octane-xplat/macos-build`](../../macos-build/README.md) worker. Other build/dev commands and complete app workflows still require
migration and qualification.

```sh
# After a Nim prerelease is published:
bun add --dev @octane-xplat/cli@nim
```

Postinstall verifies the matching bundled binary and copies it to
`bin/xplat.exe`; npm links directly to the native file on Unix and Windows.
Node runs only the installer. The `.exe` suffix lets npm use one bin path across
OSes. Disabling install scripts leaves a diagnostic placeholder; run the
selector explicitly if needed. There is no executable download during install.

```sh
node node_modules/@octane-xplat/cli/install-native.mjs
```

```sh
# Local host-only staging; this package is private and cannot be published:
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim package check"}' -- bun run turbo run pack:nim --filter=@octane-xplat/cli -- --host-only
```

Actual Linux x64 and Windows x64 binaries pass standalone help/catalog checks.
Linux HTTP/TLS, authenticated owner bootstrap/RPC and fixture-owned descendant
cleanup pass their separate gates. The representative canonical project-worker
and web-build workflow also passes on Linux. Windows managed-process jobs pass their separate gate; HTTP/private owner/RPC
and the joined workflow remain unqualified. Windows TLS, remaining command contracts,
launch/attach engines, automatic owner-loss recovery, inference delivery and updates remain
migration work. Do not
promote the `nim` tag to `latest` until command contracts, separately installed project build tools,
real project journeys and native OS behavior have equivalent coverage.
