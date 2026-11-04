# Parallel Go CLI feasibility

These evaluation tools support the [full Go migration](../../packages/cli/go/README.md)
and retain the feasibility probe alongside the retained
[Nim implementation](../../packages/cli/nim/README.md). It does not replace the
CLI, change the npm channel, or fall back to the TypeScript CLI. Build-time
metadata comes from the TypeScript reference. The primitive probe catalog describes reference
contracts, not the probe's implemented command coverage; `--help` lists the
bounded probe operations.

Use Go **1.27.3**, Bun **1.4.4**, and Node with TypeScript stripping. The core
build disables cgo. The optional `onnx` build uses
`github.com/yalue/onnxruntime_go@v1.38.0`; native ONNX Runtime **1.31.1** and the
existing pinned MiniLM model are separate local inputs. Checksums and compiler
pins are explicit. Caches and artifacts stay in ignored `research/go-cli`.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go CLI feasibility"}' -- bun run turbo run test:go-unit test:go build:go-onnx --filter=@xplat/cli-go-probe
bun run turbo run test:go-model --filter=@xplat/cli-go-probe --only
```

The optional model gate currently prepares and compares on macOS arm64. It
reuses checksummed Nim evaluation assets without modifying Nim source. It runs
native inference without network access or a runtime PATH, compares token IDs
and vectors with the Node reference, and checks relevance on maintained-guide
sections. Exact native/WASM ranking equality is not a requirement. The portable
model gate consumes the resulting reference cases and verifies actual native
inference on the destination host.

## Boundaries

The probe covers command/schema metadata, selected-project JSON and installed
worker discovery, lockfile inventories, HTTP/TLS, captured child streams and
exit status, native host bootstrap/authenticated loopback RPC, cancellation,
and a real project-installed route/baking worker. The worker fixture retains
curated CLI plugin/worker exports and declares Vite, with no old CLI runtime or
separate build-package installation. All 18 planned route artifacts are compared
with the canonical Node worker. The probe does not publish those plans or
implement the full CLI command/provider surface.

The public entry separately implements `routes` and `routes --watch`, reusing
that canonical worker for rendering and baking. Its gate compares all18 output
bytes, including seven copied application trees on the source host, and exercises
complete-plan validation, concurrent edits, permissions, aliases, watch recovery
and worker cleanup. Windows watch fixtures cancel the real native watcher through
a Go test context; that proves worker/job cleanup, not public console interrupt
delivery. POSIX fixtures exercise public SIGTERM and its 143 exit.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go route workflow"}' -- bun run turbo run test:go-unit test:go-cli test:go-routes --filter=@xplat/cli-go-probe --filter=@octane-xplat/cli --concurrency=1
```

The typecheck gate installs its own declared TSRX checker/TypeScript pins, compares
canonical environment expansion, verifies non-baked route preparation, malformed
and stale plan rejection, compiler diagnostics/exits and cancellation. Project
worker archives are private to each source-host test run; portable snapshots
consume already-frozen archives. The snapshot producer refreshes those fixtures
after its worker/library build prerequisites instead of carrying an older worker
from an unrelated qualification run.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go typecheck workflow"}' -- bun run turbo run test:go-unit test:go-typecheck --filter=@xplat/cli-go-probe --filter=@octane-xplat/cli --concurrency=1
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Actual project Go typecheck"}' -- bun run turbo run test:go-typecheck-real --filter=@octane-xplat/cli
```

The actual-project gate checks the web/macOS host programs, the combined Lightbox
library program and shared application route preparation. The source-only library
normally invokes a relative repository script, so the fixture supplies a temporary
workspace CLI worker link and removes only that link afterward. This is explicit
test installation; the native command itself must continue rejecting an absent
selected-project worker. No GUI execution or OS renderer qualification follows
from a TypeScript check.

Go owns timeouts, bounded streams, operation directories and process cleanup.
Unix uses a dedicated process group; Windows uses a job with a gate that blocks
project execution until assignment. Owner and operation storage use private
permissions or explicit current-user Windows ownership/DACLs. These bounded
checks do not establish production-grade path-race resistance, descendant
containment against deliberately escaping children, persisted-job recovery,
or owner survival across every shell/SSH/task-runner teardown.

The pnpm/Bun lock command reports inventory and version conflicts. It does not
yet implement the reference's importer selection, installed-version binding,
or package-manager precedence. Bun JSONC accepts comments/trailing commas;
project JSON remains strict. Do not relabel these inventories as doctor parity.

HTTP uses Go's transport and URL semantics. The tests exercise trust, hostnames,
task CA, redirects, proxy CONNECT, limits and cancellation, not the full existing
WHATWG/Fetch corpus. A Go migration should preserve meaningful public behavior
without reproducing every incidental JavaScript encoding or ordering choice.

Inference is native. The public inference-enabled CLI downloads pinned model and
runtime assets only during explicit index preparation. Ordinary queries never
download those assets; Node is used only by the test reference and explicit
project workers. Each owned compute child reuses one native session across
bounded batches. Its cache identities include the model/runtime pins, inference
settings and tokenizer dependencies. Public integration with the persistent owner
and the broader tokenizer corpus remain migration work.

The index gate covers empty inventories, useful guide retrieval, long fenced
sections with disclosed model previews and searchable tails, vector corruption
and repair, edited/deleted documents, offline queries, cancellation/resumption and
responsive prototype-owner RPC during native inference. Set
`XPLAT_GO_DOCS_DOWNLOAD=1` for fresh native HTTPS asset preparation; the default
test seeds checksum-verified assets and runs offline on macOS using a network
sandbox. Portable tests use invalid proxy settings rather than an OS network
sandbox. The optional assets are measured separately from the executable.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation index"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
XPLAT_GO_DOCS_DOWNLOAD=1 goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation downloads"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
```

## Cross-compilation and execution

The Go core needs no C cross-compiler. For inference builds, the qualified
cross-compiler configuration is pinned Zig **0.17.0**; use explicit C targets.
The wrapper dynamically loads a separately pinned CPU runtime, so these commands
compile the Go/cgo wrapper, not ONNX Runtime itself.

```sh
GOOS=windows GOARCH=amd64 CC='zig cc -target x86_64-windows-gnu' CXX='zig c++ -target x86_64-windows-gnu' goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go Windows cross-build"}' -- bun run turbo run build:go build:go-onnx --filter=@xplat/cli-go-probe --concurrency=1
GOOS=linux GOARCH=amd64 CC='zig cc -target x86_64-linux-gnu.2.28' CXX='zig c++ -target x86_64-linux-gnu.2.28' goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go Linux cross-build"}' -- bun run turbo run build:go build:go-onnx --filter=@xplat/cli-go-probe --concurrency=1
bun run turbo run snapshot:go --filter=@xplat/cli-go-probe
```

`snapshot.mjs` verifies source/artifact hashes and prepares a disposable runtime
snapshot containing both targets, fixtures, and pinned model/runtime assets.
Run its root Turbo tasks `test:go-unit:portable`, `test:go:portable`,
`test:go-model:portable`, `test:go-doc-snapshot:portable` and
`test:go-doc-index:portable` on the
actual target under a host reservation. Use `ssh andromeda.local` and its
existing `octane-linux` OrbStack guest for Linux, and `ssh windy` for Windows.
No compiler or shared-checkout mutation is required on the destination.
Cross-compilation itself does not qualify execution or distribution.

For a smaller route-only snapshot, cross-build `build:go` for `@octane-xplat/cli`
and `build:go-tests` for `@xplat/cli-go-probe` on both targets, then run
`snapshot:go-routes`. The resulting `routes-source.tgz` carries the public core,
native unit executables and curated project workers without model/runtime assets.
Run its root Turbo tasks `test:go-unit:portable` and `test:go-routes:portable`
on the destination host. The real application copies remain source-host evidence.

Zig supplies the C cross-compiler for the wrapper; it does not remove dependencies
from Microsoft's prebuilt ONNX library. That Windows library still requires the
[Visual C++ runtime](https://onnxruntime.ai/docs/install/#requirements). Keep that
optional feature's installation check and assets separate from the pure-Go core.
A pass on a developer host does not establish clean-machine installation, older
OS support, or an npm installer. Linux runtime libraries and deployment baselines
also need qualification beyond the selected Ubuntu guest.

Each build records stripped bytes, executable gzip6 bytes, and the actual
binary/notices/license download archive. Qualification records five warmups,
20 process-start samples, median and p95, separately from the goals of under
5,000,000 compressed bytes and under 50 ms median. Model/runtime assets have
separate costs; neither executable measurements nor one target's archive
establish all-platform npm package size. Reports and structured current status
live outside Git in the project's report directory and Silo.

## Native unit executables on another host

The pinned builder can produce a standalone Go test executable and its source-input
record. This needs no Go compiler on the destination host. It tests the native
primitives, including cache ownership/kernel-lock release and HTTP/TLS; it is
separate from public CLI and full workflow qualification.

```sh
GOOS=linux GOARCH=amd64 goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Compile Linux Go unit executable"}' -- bun run turbo run build:go-tests --filter=@xplat/cli-go-probe
GOOS=windows GOARCH=amd64 goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Compile Windows Go unit executable"}' -- bun run turbo run build:go-tests --filter=@xplat/cli-go-probe
```

Copy `research/go-cli/go-tests-<os>-<arch>` (with `.exe` on Windows) into an owned
host scratch run. Verify the adjacent record's SHA-256, set that process's temp
directory to the run, and execute the binary with `-test.v`. Reserve the host for
execution, retain stdout/stderr and the exact executable hash, then remove the
owned upload/run. These test executables include Go's test runner and do not
represent CLI download or startup size.
