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

For a smaller project-command snapshot, cross-build `build:go` for both
`@octane-xplat/cli` and `@xplat/cli-go-probe`, plus `build:go-tests` for
`@xplat/cli-go-probe` on both targets, then run
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

The native formatter gate uses `test:go-fmt` on `@octane-xplat/cli`. It installs
only the curated worker and explicitly pinned formatter, without Vite, and compares
discovery/transforms with the canonical packed planner. It covers check/stdin
outputs, diagnostics, permissions, no-op timestamps, malformed/stale write plans
and one-shot pipe cancellation. This gate does not qualify a persistent host's
stdin/stdout lifecycle or Windows console events.

Snapshot producer paths such as `research/go-cli/routes-source.tgz` are replaceable
build outputs. Before indexing a snapshot in Silo, copy its bytes to a filename
containing the content hash and index that retained path. Check its hash before
using remote evidence; a matching filename or base Git revision is insufficient.

`test:go-lint` packs and installs the workspace lint engine explicitly without
Vite. It checks known clean/error TypeScript and TSRX cases, canonical config and
ignore behavior, an actual fix, raw argv/environment/exit handling and live
cancellation. Other project-worker fixtures do not install this optional engine.

Foreground build qualification uses `test:go-build` (actual Vite config/plugins
and baked routes, engine preflight, NativeScript argv/failure adapter, macOS pair
publication and cancellation) and `test:go-build-macos-real` (packed macOS worker,
compiled native C leaf, signed universal executable, verified app/DMG). The latter
requires macOS arm64 and a native-build reservation. It never launches an app or
performs visual analysis, retains failed fixtures for diagnosis, and records
structured package evidence under `research/go-cli/`.

`test:go-nativescript-real` runs the selected installed NativeScript CLI against
the repository's actual mobile app and retains its engine/runtime versions,
source-bound executable identity, diagnostic tails, exit and produced artifacts.
It compiles only: no device, simulator or app is launched. The SDK and project
dependencies must already be installed. The default target is iOS on macOS;
select Android explicitly. A passed adapter fixture does not establish an SDK
build, and SDK compilation does not establish application runtime behavior.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go iOS SDK build"}' -- bun run turbo run test:go-nativescript-real --filter=@octane-xplat/cli --concurrency=1
XPLAT_GO_NS_TARGET=android goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go Android SDK build"}' -- bun run turbo run test:go-nativescript-real --filter=@octane-xplat/cli --concurrency=1
```

The runner forwards interruption to the native CLI and awaits its owned engine
cleanup before writing the qualification record. On Windows, Node signal delivery
is forced termination; it cannot qualify graceful console cancellation.

`test:go-linux-build` compares the packed worker's actual GTK/GJS and WebKitGTK
output to canonical Node construction, extracts and compares each tar archive,
and checks executable permissions, relocation, failed compilation, invalid plans,
preflight of both destinations, output locking and cancellation. The worker's small
Linux host scripts ship beside its emitted modules; system GJS/GTK/WebKit libraries
are not bundled. Packaging verification does not establish app/window runtime or
visual qualification. Windows executes only the explicit unsupported-host case.

`test:go-patches` exercises the native command group using the real canonical
worker and patch files in a minimal installed CLI fixture. Its dependencies are
only `yaml` and `jsonc-parser`; checks assert that Vite, Babel, TSRX and the framework
library are absent. Cases cover Bun/pnpm workspace selection, YAML comments and
catalogs, JSONC/multi-document lock warnings, force/conflict handling, linked
destinations, an actual patched Bun install and frozen reinstall, partial effects,
and cancellation with descendant cleanup. Windows forced termination qualifies
job cleanup, not graceful console cancellation or its partial-effect diagnostic.
The runtime snapshot includes this fixture as `test:go-patches:portable`.

`test:go-doctor` compares native diagnostic rows, warnings and exit policy with
the actual shared engine in the minimally installed worker. It covers omitted or
foreign reports, multiple singleton copies, the separate macOS handoff, and
cancellation/descendant cleanup during both worker phases. The differential
reference runs in process containment: installed tool
probes can leave descendants even after a successful report. The test-only Go
probe owns that reference tree; the public executable has no test dispatch.
A source-host macOS case packs the real platform worker, verifies its payloads and loads the installed
C leaf metadata generator; it does not compile, package or launch an application.
Portable snapshots expose `test:go-doctor:portable`; they skip that real macOS
asset case on Linux/Windows, while testing ordinary diagnostics and the platform
protocol. Forced Windows termination establishes job cleanup, not console delivery.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go doctor verification"}' -- bun run turbo run test:go-doctor --filter=@octane-xplat/cli --concurrency=1
```

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go patch management"}' -- bun run turbo run test:go-patches --filter=@octane-xplat/cli --concurrency=1
```

`test:go-clean` compares ordinary app/plugin cleanup with the actual TypeScript
command on the source host and exercises native filesystem contracts on portable
hosts. Fixtures include strict metadata rejection, output aliases, Windows
junctions, unsafe ancestors, cancellation and the shared native build/clean lease.
The native unit gate checks stale plans, replaced parents and partial-effect
reporting. All cases use disposable projects; never point this gate at a proving
app with valuable generated outputs or local recovery state.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go cleanup verification"}' -- bun run turbo run test:go-clean test:go-unit --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```

The POSIX terminal fixture uses Python's standard-library PTY support to exercise
yes/no/EOF and public SIGTERM. Python is an evaluation-tool prerequisite for that
case; the native command needs neither Python nor Node. Windows skips terminal
input and broken-symlink cases explicitly while running junction, filesystem,
build-exclusion and kernel-lease cases. Its Node-triggered termination checks
forced-exit/job cleanup, not graceful public console delivery.


`test:go-response-roots` (portable: `test:go-response-roots:portable`) checks
required Doctor and patch report roots for omission, null and empty paths. It
uses the existing worker fixtures, including both Doctor phases and patch checks
before mutation; native units run separately. Empty user path defaults do not
supply a missing required provider-response identity.

`test:go-upgrade` uses canonical Node plans for Bun/pnpm catalog and patch edits,
then runs actual Bun 1.4.4 and task-local pnpm 11.24.0 installations. The pnpm
case serves the source-owned config package through a private loopback registry;
it asserts the tarball request instead of depending on a published framework
release. Registry fixtures and install hooks are owned and removed with the test.
Windows exercises an actual `.cmd` shim; forced termination proves job cleanup,
not graceful console delivery. The test covers failed installs, both streams,
resistant descendants, stale/escaping plans and lease recovery.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go upgrade verification"}' -- bun run turbo run test:go-upgrade test:go-unit --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```

Portable snapshots expose the same fixture as `test:go-upgrade:portable`. Ordinary
workspace discovery still uses the small native glob matcher; upgrade policy
reuses its existing Node workspace expansion. `test:go-release-worker` (portable:
`test:go-release-worker:portable`) qualifies the invoked release policy sidecar:
older projects with no installed worker, corrupt inventory rejection, native help
without Node, real installs deleting the original policy or replacing both it and the native
executable path, and the actual standalone archive. `release-worker.mjs` builds
only upgrade operations plus the reviewed
YAML/JSONC module closure and licenses. No JS runtime or old CLI is included.
Final npm consumer packaging and Windows real-console events remain separate gates.

`test:go-foreground-input` (portable: `test:go-foreground-input:portable`) exercises
project tool input without waiting for parent EOF and an actual Bun postinstall
prompt through the release worker. POSIX hosts also run an isolated controlling
terminal through `foreground-terminal.py`: Unicode answer, ordinary/resistant
Ctrl-C, raw-mode cancellation, and a follow-up parent read after terminal ownership
and input settings are restored.
Native unit tests cover explicit input grants, default EOF, blocked readers and
cancellation cleanup. These are non-visual terminal fixtures. Windows pipe/job
coverage is distinct from actual Windows console qualification.

For a prebuilt ONNX-enabled CLI, set `XPLAT_GO_RELEASE_BINARY` to that exact binary
when running `test:go-release-worker` through Turbo. The gate checks its binary
and source fingerprints before executing the same replacement cases. This tests
native-helper compatibility, not inference accuracy or model installation.

```sh
# macOS arm64 example; select the artifact actually built for your host.
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go ONNX helper build"}' -- bun run turbo run build:go-onnx --filter=@octane-xplat/cli
XPLAT_GO_RELEASE_BINARY="$PWD/research/go-cli/xplat-go-darwin-arm64-cli-onnx" goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go ONNX helper replacement"}' -- bun run turbo run test:go-release-worker --filter=@octane-xplat/cli
```


`test:go-add` (portable: `test:go-add:portable`) compares generated files against
the actual project creator for web/iOS/Android, including shared native setup,
workspace catalogs, patches and existing user files. It exercises bounded plan
validation, output aliases, stale raw-byte inputs, explicit missing-tool
instructions, real Bun installation and descendant cleanup after cancellation.
POSIX runs also exercise explicit selection and cancellation in an isolated
terminal without visual evidence. Creator archives are opt-in fixture payloads.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go platform addition"}' -- bun run turbo run test:go-add test:go-unit test:scaffold --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --filter=create-octane-xplat --concurrency=1
```


`test:go-updates` (portable: `test:go-updates:portable`) verifies the shared update
hook, conditional-export resolution without executing packages, custom-hook and
alias preservation, malformed worker identities and cancellation cleanup. Source
hosts compare the actual built TypeScript initializer; portable snapshots label
that reference-only case as skipped. Byte/mode preservation is a POSIX-only case.
The default gate uses actual project-installed worker files; fake workers cover
only protocol rejection and blocked-worker cancellation.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go update-hook initialization"}' -- bun run turbo run test:go-updates test:go-unit test:updates --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```


`test:go-fonts` (portable: `test:go-fonts:portable`) runs real Geist TTF/WOFF and
Inter WOFF2 data through the project engine. It checks Fontsource static/variable
selection, subset/weights, names/tokens, custom source paths, existing fonts,
output aliases, malformed/stale plans with a positive control, cancellation and
actual Bun installation through a private loopback package registry. Only the
source-host test imports the built TypeScript reference; snapshots label that
case skipped. Fonts are parsed and hashed without visual analysis. The converter
peer is installed only for this fixture; its absence has an actionable diagnostic.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go font registration"}' -- bun run turbo run test:go-fonts test:go-unit test:fonts --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```

`test:go-workshop` compares native inspection against the actual workshop Node
engine and project Vite configuration, including static story discovery, JSON/human
diagnostic exit behavior, package boundaries, malformed responses with a valid
control, and POSIX cancellation of a config-started descendant. The fixture uses
the actual built workshop manifest/backend staged beside an installed curated
CLI worker, with its real pinned scanner dependency. It is not a released
workshop tarball or a running native workshop host. Initialization also compares
raw output bytes, modes and reports with the pre-refactor Node engine at a fixed
Git revision; portable snapshots explicitly skip that one comparison when the
Git object is unavailable. Plan controls cover custom files/scripts, manifest
preservation, stale observations and read-only planning.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go workshop inspection"}' -- bun run turbo run test:go-workshop test:go-unit --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```
