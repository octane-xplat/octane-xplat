# Evaluate Perry for the CLI

This contributor tool tests whether a native TypeScript core can replace the
runtime-embedded CLI distribution. It does not change the installed `xplat`
command. Start here when evaluating or upgrading Perry, rather than using its
hello-world size as an estimate for this framework.

## Run on a native host

Use Node 24, Bun 1.4.4, `tar`, a platform linker, and the repository's locked
dependencies. The installer supports macOS arm64, Linux x64, and Windows x64.
It downloads a large compiler toolchain into ignored local storage, verifies
the pinned archive checksum, and leaves system tools alone.

```sh
node tools/cli-perry/install.mjs
bun run turbo run test:perry-cli --filter=//
```

The installer refuses to overwrite an existing compiler directory. Set
`PERRY_BIN` to an absolute executable path to use another installation of the
pinned version. Each verification run writes binaries, build logs, staged
sources, and `results.json` under `research/perry-cli/<host>-<timestamp>/`.
Exit zero means the checks and budgets passed on that host; a compile or
behavior failure remains a failure even if other slices pass.

### Measure optimized release size

Perry's release compiler can link its full prebuilt standard library, which
produces larger binaries. Size optimization requires the matching source
checkout and Rust toolchain. Use a real Git checkout: the source-archive
fallback build stamp differs from the release compiler's Git stamp.

```sh
git clone --depth 1 --branch v0.5.1520 https://github.com/PerryTS/perry.git research/perry-cli/compiler-source
rustup toolchain install nightly-2026-08-20 --profile minimal
export PERRY_WORKSPACE_ROOT="$PWD/research/perry-cli/compiler-source"
bun run turbo run test:perry-cli --filter=//
```

On PowerShell, set the source path with
`$env:PERRY_WORKSPACE_ROOT = (Resolve-Path research/perry-cli/compiler-source).Path`
before the same Turbo command. On shared hosts, reserve `native_builds:1`
around compilation with the resource broker. Initial optimized builds can take
several minutes. A size result using the full library is not an optimized
release-size claim.

The manual [qualification workflow](../../.github/workflows/cli-perry-prototype.yml)
runs native macOS, Linux, and Windows jobs with the pinned Git revision and
retains result files and logs. It is outside the PR gate. A workflow definition
does not qualify platforms until its jobs actually run.

## What the prototype proves

`core.ts` combines command discovery, project discovery, and I/O into one
executable. Set `PERRY_SLICES=1` to also compile individual slices to localize
failures; the default builds only the core. The harness stages the real CLI
sources verbatim except `agent/identity.ts`, whose package name and version are
frozen at build time. It does not rewrite unsupported source to make it pass.

- Catalog, schemas, and help use the existing command descriptors and catalog
  implementation; JSON is compared with Node executing the same staged code.
- Project discovery and framework binding use the existing CLI implementation,
  including the installed YAML dependency. Fixtures exercise platform config,
  absent directories, malformed manifests, YAML/Bun JSONC lockfile versions, and symlinked installations that
  disagree with the lockfile.
- HTTP and child-process probes exercise APIs needed by a future native core.
  These are candidate adapters, not a port of the current agent host. Checks
  cover HTTP 200/404, connection failure, child streams, exit status, spawn
  failure, and POSIX termination forwarding.

Compilation rejects unsupported dynamic code, dynamic imports, and recognized
unimplemented APIs. A negative fixture verifies dynamic-import rejection.
The harness also requires the compiler's module summary to report zero
JavaScript modules. Runtime probes use an empty `PATH`; child-process checks
explicitly pass the absolute path of the project's runtime.

Acceptance budgets are **under 5,000,000 gzip bytes** per executable, including
the combined core, and **under 50 ms median warm process startup** for the
core's help path. Startup includes process launch, with five warmups and twenty
samples; it does not establish cold download/extraction or first-launch time.
Result files record compiler and source hashes, flags, artifact sizes, and
individual failures. Preserve reports outside scratch and index status in Silo.

This is bounded feasibility evidence. It does not qualify every command,
interactive TTY behavior, native addons, the daemon protocol/lifecycle,
arbitrary project plugins, or Windows console cancellation. Vite, NativeScript,
and other build engines remain project-installed tooling in this architecture.
Do not replace the production launcher until those boundaries are proven.
