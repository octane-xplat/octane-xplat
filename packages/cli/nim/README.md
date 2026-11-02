# Parallel Nim CLI

This directory owns the native CLI implementation. The TypeScript entry and
package exports remain in place. The native command currently implements catalog,
status, capabilities, clean, typecheck, routes, app selection, permissions, code search, code read, guidance
and docs read; other agent commands provide help and schemas with execution marked
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
refresh, version-bound reads, provenance and tag-conflict resolution. Public docs
search and local embedding/index integration remain migration work.
`docs_index.nim` now owns the FTS5 and embedding-cache algorithm behind an
explicit embedding-provider boundary. Its macOS system SQLite adapter and
fixture-embedding comparisons do not qualify actual tokenizer/model inference;
public docs search/index remain pending until that provider is connected.
`minilm_tokenizer.nim` implements the pinned single-sequence BERT/WordPiece
encoding path, using checksummed model metadata and lazy macOS ICU normalization.
Its differential gate covers exact token IDs and Unicode normalization; it does
not yet provide native ONNX inference. The Apache-2.0 port attribution is included
in the native package notices.
`minilm_model.nim` and its ONNX C adapter are exercised by a separate real-model
qualification task. CPU graph optimizations and quantized rounding can change
embeddings and retrieval order relative to WASM. Inference stays in Nim. Evaluate
useful retrieval quality rather than exact native/WASM ranking equality; the
observed ranking difference alone is not a blocker. Preserve distinct engine/cache
identities and qualify meaningful query results and explicit model/runtime
delivery before enabling public search.
`native_http.nim` provides asynchronous HTTP/TLS through the macOS system libcurl,
with header/body readiness, cancellation, byte streaming and explicit proxy/CA
options. `http_url.nim` statically compiles pinned Ada URL parsing for the
reference's WHATWG behavior. `actions_bridge.nim` ports authenticated registry,
submit, wait and cooperative-cancel envelopes; it does not establish runtime
ownership, action execution or a qualified app session. Other HTTP host adapters
remain unimplemented. The current public command coverage is unchanged.
The bridge accepts an explicit fetch procedure; the ordinary client adapter and
header-controlled test transport share the same envelope/cancellation logic.
`managed_process.nim` owns macOS child sessions and process groups, with explicit
argv/cwd/environment, independent pipe draining, byte passthrough, bounded UTF-16
log lines and cooperative/forced stop. Its manager exposes explicit close and
opt-in SIGINT/SIGTERM handling; normal owner exit also releases its groups.
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
runtime/session/evidence operations remain unavailable and semantic retrieval
remains partial. Contract IDs and product boundaries are embedded from the
canonical reference at build time.
`target_discovery.nim` adds bounded read-only simctl/adb inventory and host
eligibility helpers. Its simulator parser validates availability and identities
before offering targets. Public `targets` remains pending until session ownership
and busy-state composition land; inventory does not establish launch readiness.
`sessions.nim` owns session identities, progress, usable/historical states and
owned cleanup. Concurrent ends share completion; attached bindings preserve their
external process. Snapshot mutation and observer exceptions cannot change private
ownership or bypass cleanup. Its process fixture verifies cleanup before the outer
test owner closes. Runtime/IPC composition and public session commands remain
pending; an in-memory registry does not establish a persistent app session.
`jobs.nim` adds request deduplication, progress, bounded terminal history and
cooperative cancellation. It retains runner ownership until completion and drains
runners on close. Immediate completed futures can produce a terminal start result;
no JS microtask schedule is assumed. `contract_failure.nim` carries structured
errors across async boundaries with a fallback for ordinary/uninitialized errors.
Public jobs/runtime commands remain pending until the native host is connected.
`unix_rpc.nim` supplies bounded one-request NDJSON over macOS Unix sockets, with
Node interoperability, input/output byte limits, I/O deadlines and draining close.
It preserves existing/replacement socket paths and never owns an application's
process merely because its client disconnects. Authentication, descriptor/startup
coordination and persistent host composition remain separate work.
`host_bootstrap.nim` provides a private lifetime lock and explicit detached launch
on macOS. It resets signal dispositions, creates a separate session, redirects
stdin/logs and closes unrelated descriptors. Unpublished startup can be terminated
and reaped; default handles cannot close stdin or signal a process group. The
native host's authentication, publication/handoff and runtime dispatcher remain
unimplemented.
These boundaries are exercised by the combined core and focused process gate;
they do not establish build-tool, app-session or IPC orchestration. Descendants
that deliberately create a new session and abrupt owner SIGKILL remain outside
the process-group cleanup guarantee. Other process host adapters are unimplemented.
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
public `routes` and bake-skipped `typecheck`. `route_watch.nim` owns readiness,
serial generation, invalidation, error recovery and close. Its macOS FSEvents
adapter queues C-owned bytes; the Nim event loop drains them. Input fingerprints
before publication and a periodic backstop reject stale work even when an OS
event arrives late. Publication is atomic per file. Other watcher hosts remain
unimplemented; no runtime is bundled.
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
[`@octane-xplat/build`](../../build/README.md); native build/dev commands and
complete app workflows still require migration and qualification.

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

Linux/Windows build flags and native jobs are supplied but remain unqualified
until those jobs execute. Other host TLS adapters, full argument/error parity, runtime sessions,
project tool dispatch, updates, and most commands remain migration work. Do not
promote the `nim` tag to `latest` until command contracts, separately installed project build tools,
real project journeys and native OS behavior have equivalent coverage.
