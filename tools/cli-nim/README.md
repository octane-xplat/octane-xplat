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
