# Evaluate Nim for the CLI

This bounded contributor prototype evaluates a standalone control layer.
The [parallel implementation](../../packages/cli/nim/README.md) now owns the
shared core and public native entry; this tool retains the independent probe. It does
not replace `xplat`. Node runs the build and comparison harness; the resulting
executable runs with an empty PATH and contains no JavaScript engine.

## Run on macOS

Use the repository's Bun 1.4.4 install, Node 24 or later, Git, tar, and Xcode
Command Line Tools. Compiler downloads and C caches stay in `research/nim-cli`.
The private workspace pins `nim-toolchain@0.1.0` (Nim 2.2.12); the wrapper checks
the upstream archive SHA-256 before extraction. All Nim dependency revisions and
license paths are declared in
`nim-dependencies.json`; the installer checks the pinned source revisions and
keeps sources in task-local storage. Package staging includes their notices.

```sh
bun install --ignore-scripts
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim CLI prototype"}' -- node tools/cli-nim/prepare.mjs
bun run turbo run test --filter=@xplat/cli-nim-probe
```

`prepare.mjs` generates ignored catalog/schema data from the actual CLI and
compiles it into the executable. The harness stages the TypeScript reference
from `packages/cli`, reuses the Perry probe adapters, and compares JSON, streams,
and exit status. It preserves `results.json` under a host/timestamp directory.
Tests are deliberately uncached because the binary lives outside Turbo outputs.
No public workflow or recipe changes are made.

## Boundaries

Keep help, catalog/schema discovery, manifest/filesystem inspection, version
binding, diagnostics, and eventual HTTP control protocols in native code.
Build/dev/typecheck, Vite plugins, NativeScript hosts, formatting/linting engines,
and project JavaScript configuration execution should invoke project-installed
tools using explicit argv, cwd, and environment. Shipping a runtime wrapper would
not deliver the intended download reduction. Generating static command metadata
at build time preserves one authoring source without executing JS at startup.

```sh
research/nim-cli/core catalog
research/nim-cli/core binding "$PWD" "$PWD/apps/web"
```

The probe exercises shared workspace/package-manager code as well as discovery,
plain HTTP and child processes. Workspace membership uses a pinned pure Nim glob
engine, with filesystem traversal and compatibility rules qualified against Node.
The focused package-manager corpus also checks strict/JSONC distinctions, importer
ownership, installed-package shadowing and pnpm conflict behavior.

```sh
bun run turbo run test:nim-packages --filter=@octane-xplat/cli
```

The identity/corpus probe compares installation fingerprints, linked and
provisional docs bindings, release mappings, source-file enumeration and scoped
path resolution with the TypeScript reference. It exercises empty consumers,
real repository data, canonical symlink targets, private aliases, finite numeric
coercion, SHA-256 vectors and platform filters with an empty native PATH. Keep
this test entry out of the published executable.

```sh
bun run turbo run test:nim-identity --filter=@octane-xplat/cli
```

The code-provider gate compares native search/read commands and the shared local
index with the TypeScript providers. It covers Unicode decoding and lowercase,
UTF-16 continuation, ranking, stale chunks, corpus bounds, selection, provenance,
Git freshness, and short subprocess capture. The capture helper owns one direct
child; it does not establish runtime-session process-tree cleanup.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim code qualification"}' -- bun run turbo run test:nim-code --filter=@octane-xplat/cli
```

The local documentation gate compares Markdown sections, release ownership,
inventory, exact search, references and UTF-16 page reads against the live
TypeScript providers. Document ordering uses a lazy macOS system ICU adapter;
the gate compares actual language orders rather than substituting a byte sort.
Other host collation adapters, public docs search and embedding/index integration
remain migration work. ICU data differences across OS versions need qualification.
The same gate exercises real temporary Git repositories for snapshot metadata,
offline caches, annotated/moved/deleted tags, explicit rebinds and a tag that
moves between lookup and fetch. Explicit child environment/PATH cases qualify
the short Git capture boundary without claiming process-tree cancellation.
Service and public-command comparisons also cover installation refresh, linked
and release page reads, versioned refs, explicit comparisons, cold caches,
offline pins and POSIX directory/permission failures. Registry command fixtures
redirect only their child Git processes to owned local repositories; they do not
qualify HTTPS transport.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim documentation qualification"}' -- bun run turbo run test:nim-docs --filter=@octane-xplat/cli
```

The index gate compares the native SQLite C boundary and documentation index
with `node:sqlite` and the TypeScript search engine. It covers text/number
bindings, FTS5 rankings, shared on-disk caches, transactions/lock timeouts,
exact chunk fingerprints, resumable batches, model cache identities and real
Markdown data. Fixture embedding callbacks isolate the index algorithm; they do
not qualify a native model runtime. The SQLite library is loaded lazily from
macOS, with other hosts explicitly unimplemented. Record actual engine versions
from SQL queries rather than assuming Node's process metadata matches its engine.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim index qualification"}' -- bun run turbo run test:nim-index --filter=@octane-xplat/cli
```

The tokenizer gate prepares three small, checksummed files from the reference's
immutable MiniLM revision in task-local storage. It downloads no ONNX weights.
It compares the native BERT/WordPiece path with the pinned JS dependency over
the real vocabulary, special tokens, explicit 512-token truncation, repository
Markdown and all Unicode scalars. Lazy macOS ICU provides NFD normalization;
other host adapters and actual native inference remain migration work. The
modified port's Apache-2.0 attribution ships in `NOTICE.txt`.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim tokenizer qualification"}' -- bun run turbo run test:nim-tokenizer --filter=@octane-xplat/cli
```

The optional real-model gate downloads checksummed q8 weights and the official
ONNX Runtime 1.31.1 macOS arm64 archive into task-local storage. It extracts the
C API header, runtime library and notices. A small C shim preserves the pinned
function-table ABI; inference runs natively with no JS bridge. This task is
excluded from ordinary offline tests and the release gate. The upstream library
declares a macOS 14 minimum; only the development host has executed this probe,
and its qualification task currently supports only arm64.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native model qualification build"}' -- bun run turbo run build:nim-model --filter=@octane-xplat/cli
bun run turbo run test:nim-model --filter=@octane-xplat/cli --only
```

The model gate runs its native processes with network access denied. It compares
pooling, asset validation, batch independence, disposal, engine identities and
actual maintained-guide rankings with the WASM reference. It also records raw/
gzip runtime, weight and probe bytes in `research/nim-cli/model-qualification.json`.
The strict ranking assertion currently fails on one guide query: do not treat
successful native inference as a passing parity gate or enable public docs
search/index on that evidence. Basic native graph optimization reduces output
drift relative to extended/all, but does not eliminate it. Model engine assets
are not included in the current CLI tarball, and their measured delivery cost
must remain separate from the current partial executable's size/startup results.

Measure the public executable after a build. The benchmark checks the host,
source fingerprint and executable hash against the build record before recording
raw/gzip bytes and warm process startup. It refuses stale or replaced artifacts.
The download and startup goals are recorded separately from measured values.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim benchmark build"}' -- bun run turbo run benchmark:nim --filter=@octane-xplat/cli
```

Broader qualification remains necessary for advanced nested negated glob
combinations, unusual YAML scalar/collection keys and recursive aliases,
inaccessible files and Node's installation-prefix global lookup when
Node is absent from PATH. Those are open compatibility requirements for the full
rewrite. They are not implied by the passing common-pattern corpus. Project
metadata is read as data; JavaScript configuration is not evaluated.

HTTP uses Nim's standard client without TLS enabled. HTTPS, certificate trust,
redirect/proxy behavior, streaming, and cancellation during a network request are
unqualified. The executed cancellation check forwards SIGTERM to one direct
child; it does not qualify process-tree cleanup, SIGINT, or Windows console control.

```sh
research/nim-cli/core http http://127.0.0.1:8080/status
research/nim-cli/core child /absolute/path/to/project/tool --version
```

Build flags now select macOS dead stripping, Linux section collection, or the
Windows compiler defaults; only macOS has been executed locally. Native Linux and Windows
build jobs, libc baselines, TLS libraries, Windows process control, signing,
notarization, archive checksums, and installer/update behavior remain distribution
work. Nim emits C requiring a target C compiler and SDK; cross-compilation alone
would not qualify those hosts. The compiler wrapper supports Darwin arm64/x64,
glibc Linux arm64/x64, and Windows x64; its support matrix is not this probe's
runtime qualification. It is a build dependency, never part of the download.

Retain the differential harness as a migration gate during the full rewrite:
compile success and low size do not prove Node semantics. Resolve TLS delivery
and platform process behavior before qualifying production workflows. Operational measurements belong
in local reports and Silo rather than this guide.
