# Parallel Nim CLI

This directory owns the native CLI implementation. The TypeScript entry and
package exports remain in place. The native command currently implements catalog,
clean, app selection, permissions, code search, code read, guidance and docs read;
other agent commands provide help and schemas with execution marked
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
embeddings and retrieval order relative to WASM. The strict comparison currently
exposes a ranking difference, so this adapter is not connected to public commands.
Keep that gate intact and preserve distinct engine/cache identities while
resolving inference and delivery; executing the C API alone does not qualify search.
`native_http.nim` provides asynchronous HTTP/TLS through the macOS system libcurl,
with header/body readiness, cancellation, byte streaming and explicit proxy/CA
options. `http_url.nim` statically compiles pinned Ada URL parsing for the
reference's WHATWG behavior. `actions_bridge.nim` ports authenticated registry,
submit, wait and cooperative-cancel envelopes; it does not establish runtime
ownership, action execution or a qualified app session. Other HTTP host adapters
remain unimplemented. The current public command coverage is unchanged.
`managed_process.nim` owns macOS child sessions and process groups, with explicit
argv/cwd/environment, independent pipe draining, byte passthrough, bounded UTF-16
log lines and cooperative/forced stop. Its manager exposes explicit close and
opt-in SIGINT/SIGTERM handling; normal owner exit also releases its groups.
`process_exit.nim` preserves native exit status bytes beyond Nim's `quit` range.
These boundaries are exercised by the combined core and focused process gate;
they do not establish build-tool, app-session or IPC orchestration. Descendants
that deliberately create a new session and abrupt owner SIGKILL remain outside
the process-group cleanup guarantee. Other process host adapters are unimplemented.
`metadata.json` is generated from the TypeScript descriptors and excluded from
Git. Build-time JavaScript is allowed; native startup does not require Node/Bun.
Installed versions drive guidance and documentation reads; advanced workspace
glob and unusual YAML compatibility still need qualification. App selection uses manifest and
filesystem discovery without making installed-version or runtime-readiness claims.

```sh
research/nim-cli/native/xplat status --schema
research/nim-cli/native/xplat clean --help
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
[`@octane-xplat/build`](../../build/README.md); the native build/dev/typecheck
commands and complete app workflows still require migration and qualification.

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
