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
the upstream archive SHA-256 before extraction. NimYAML's exact source revision
and license are declared in `nim-dependencies.json`.

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

The port intentionally stops at discovery, platform config, framework binding,
plain HTTP, and child process control. Production package-manager-root selection
has richer workspace glob/exclusion behavior; this probe searches ancestors only
through its supplied workspace root. Node's global package lookup paths, malformed
lockfile behavior, unusual scalar types, filesystem permission failures, symlink
loops, and all Bun identity variants still require a wider differential corpus.
The program reads JSON manifests, never evaluates `vite.config.ts`.

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

Prefer Nim for further small-core investigation if a rewrite is acceptable.
Retain the differential harness as a migration gate: compile success and low size
do not prove Node semantics. Resolve TLS delivery and platform process behavior
before committing to a production architecture. Operational measurements belong
in local reports and Silo rather than this guide.
