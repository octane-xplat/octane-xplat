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
settings and tokenizer dependencies. Public documentation commands own their
compute children directly and do not require a persistent owner or dev server.
The broader tokenizer corpus remains migration work.

The index gate covers empty inventories, useful guide retrieval, long fenced
sections with disclosed model previews and searchable tails, vector corruption
and repair, edited/deleted documents, offline queries, cancellation/resumption and
responsive prototype-owner RPC during native inference. Set
`XPLAT_GO_DOCS_DOWNLOAD=1` for fresh native HTTPS asset preparation; the default
test seeds checksum-verified assets and runs offline on macOS using a network
sandbox. Portable tests use invalid proxy settings rather than an OS network
sandbox. The optional assets are measured separately from the executable.

Measure the inference-enabled public executable with `turbo run
measure:go-cli-onnx --filter=@octane-xplat/cli`. Its
`startup-<target>-cli-onnx.json` report is separate from the core build's report;
warm help startup does not include loading the runtime or model assets.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation index"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
XPLAT_GO_DOCS_DOWNLOAD=1 goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native documentation downloads"}' -- bun run turbo run test:go-doc-index --filter=@octane-xplat/cli
```

The main development gate runs the public `dev` entry with project-installed
Vite, route preparation/recovery and multi-target exit handling. On macOS it also
runs headless AppKit app code through the installed macOS worker and checks normal
exit/cancellation, launch evidence and resource cleanup. It performs no image
inspection. POSIX tests check SIGINT forwarding and broken-stdout cancellation;
Windows owner termination checks Job cleanup, not console Ctrl-C.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go foreground development"}' -- bun run turbo run test:go-unit test:go-dev --filter=@xplat/cli-go-probe --filter=@octane-xplat/cli --concurrency=1
```

Frozen core snapshots expose `test:go-dev:portable` through root Turbo tasks,
alongside the portable native unit gate. These execute actual host binaries;
cross-compilation alone does not qualify a host.

The explicitly started dev-server gate runs real project Vite, short-lived HTTP
clients, canonical app aliases, nested cwd selection, duplicate starts and
foreground cancellation. Missing-server reads must neither create cache state nor
start workers. The focused race gate exercises discovery and authenticated HTTP
lifetime handling with the host Go race runtime; ordinary core builds disable CGO.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go foreground dev server"}' -- bun run turbo run test:go-unit test:go-cli test:go-dev test:go-dev-server test:go-dev-server-race --filter=@xplat/cli-go-probe --filter=@octane-xplat/cli --concurrency=1
```

Humans or instructed agents can explicitly start `dev`. Ordinary app-control
requests connect to it and never start servers, apps or browsers implicitly.
Clients finishing or disconnecting leave the engines running. App debug
WebSockets register the real framework action registry; attach/list/status and
action listing stay native. The gate exercises empty registries, heartbeat
stability, disconnect/reconnect, target-scoped proof and short-lived clients.
The foreground macOS gate also attaches to actual headless AppKit app code.
The same gate invokes actual handlers through canonical selected-project Node
validation. It checks JS lookbehind/default/UTF-16 behavior, result rejection with
partial effects, declared external-effect permissions, completed/unknown request
key dedupe and cooperative cancellation. The macOS foreground fixture also
invokes an actual AppKit app action. The reused job registry belongs to foreground
dev through a lifecycle interface; it never bootstraps the former detached owner.
The opt-in macOS Chromium gate separately verifies named-DOM inspection and
programmatic handler dispatch; this is not OS input or native UI inspection.
The NativeScript relay has host protocol coverage plus the opt-in Android
emulator and iOS simulator gates below; reconnect/HMR and physical devices
remain unqualified. Engine readiness alone is not an app connection. Use the [Go CLI entry](../../packages/cli/go/README.md)
for the current interface. The former detached-owner, asynchronous build/job and
browser-session runners are preserved in checkpoint `14a7117c`; they are
superseded experiments, not current release gates.

`test:go-device-relay` runs a real Node/Vite WebSocket proxy, a test-only Bun
upstream, and the native leaf with mocked Device/Node WebSocket. It checks device
origin URL resolution, unchanged Origin headers, exact target/startup routing,
catch-all proxy precedence, rejection of other paths, and HTTPS-to-WSS URL
selection. It does not exercise a device or TLS handshake. `test:go-dev-server`
also checks the same relay against the actual Go app endpoint: the private CLI
token is rejected, an app grant is accepted, and closing the client leaves the
foreground server alive. That case uses a web target as a transport carrier and
does not claim NativeScript runtime qualification.

```sh
bun run turbo run test:go-device-relay --filter=@octane-xplat/cli
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go app relay composition"}' -- bun run turbo run test:go-dev-server --filter=@octane-xplat/cli
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
The reviewed parser dependencies are bundled into the worker: npm packing omits
nested `node_modules`, so an unpacked standalone fixture alone cannot prove that
the worker will survive an npm tarball. The consumer gate checks the complete
release-worker inventory and executes an offline upgrade from the installed bin.
Final npm consumer packaging and Windows real-console events remain separate gates.

`test:go-package` builds a private host-specific npm tarball containing the
inference-enabled native bin, the release upgrade worker and curated Vite/worker
exports. It installs that tarball into an isolated consumer with lifecycle scripts
disabled, verifies no optional engine peers were installed, executes the native
bin and package-manager command, and runs the installed Node worker's action
validator. The bin is the executable itself; no postinstall or runtime launcher
is needed. The package is private and restricted to the current OS/architecture;
this is consumer qualification, not the final multi-platform registry layout.
It does not publish or change the production CLI package. The same gate is
available as `test:go-package:portable` in full inference snapshots.

`test:go-registry` exercises the single-name layout through a private loopback
registry. The main package keeps the small exports and upgrade worker; exact
optional `@octane-xplat/cli-native-<os>-<arch>` packages carry each native image.
Node runs only the install hook, which checks the payload version, size and hash
before replacing the bin. No runtime launcher or network downloader is added.
The test checks trusted Bun installation, manual repair after `--ignore-scripts`,
missing/corrupt payload refusal without changing a working bin, and that foreign
native tarballs are not downloaded. Registry metadata for other targets may be
requested. Reported download bytes sum the main and selected tarballs, excluding
registry metadata, HTTP overhead and optional model/runtime assets.
Keep the packaged `.exe` slot empty until selection: Bun's Windows bin shim caches
a placeholder shebang before postinstall and would keep trying that interpreter
after native replacement. With scripts disabled, the slot is not executable;
run the installed `install-native.mjs` with Node after installing optional payloads.

Build all three current inference targets with matching source inputs before
this gate; it refuses stale or mixed releases. Use the cross-build commands above
with `--filter=@octane-xplat/cli`, then run the host gate below. Full inference
snapshots include all three images for `test:go-registry:portable`. These private
fixtures cover darwin-arm64, linux-x64 and win32-x64 only; they do not publish
platform packages or change the production npm manifest.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native npm consumer"}' -- bun run turbo run test:go-package --filter=@octane-xplat/cli
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Go native registry consumer"}' -- bun run turbo run test:go-registry --filter=@octane-xplat/cli
```

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

`test:go-workshop-engine` validates the selected-project macOS engine binding
and an actual packed engine import with no CLI package installed. It rejects
nearer broken packages, missing APIs and escaped entries. The direct API removes
the workshop's old CLI host import; it is not a Go service readiness or UI test. On macOS the packed direct engine
also compiles and runs a headless NativeScript/AppKit fixture through the owned
Go process probe, checking normal app exit and signal shutdown after an actual
app output marker. Both must reap the host and remove its owned app bundle.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Workshop macOS project engine"}' -- bun run turbo run test:go-workshop-engine --filter=@octane-xplat/cli
```

Workshop service gates run actual Vite HTTP, virtual-catalog updates, cancellation
and port release through the Go CLI. `test:go-workshop-macos` runs the maintained
39-step offscreen text journey in an owned copy of the demo, with the Go binary
selected explicitly. It edits only the copy; source-linked dependencies make this
a source-host qualification, not an isolated published consumer. Actions use the
native recognizer/NSEvent automation seam, not OS-synthesized input. No images are
captured. Native units cover startup deadlines, identity rejection, final receipt
races, engine streams and resistant descendant cleanup.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"desktop_input":1},"purpose":"Go workshop services"}' -- bun run turbo run test:go-workshop test:go-workshop-macos test:go-unit --filter=@octane-xplat/cli --filter=@xplat/cli-go-probe --concurrency=1
```

The runtime-only host snapshot includes workshop source payloads and built Node
engines. `test:go-workshop:portable` runs the actual web service on Linux/Windows
with host-installed Node. Windows Node `child.kill('SIGTERM')` force-terminates
the owner: that gate checks listener release through Job kill-on-close, not
console Ctrl-C or graceful shutdown. Native units separately cancel through the
owned-process context. Keep Windows console delivery pending until exercised.

Native session-store units exercise log pagination against the actual Node
reader, bounded rotation, valid Unicode prefixes, incomplete append recovery,
private namespaces, symlink/hardlink refusal, active-record retention and owner
loss. Concurrent reader/writer cases permit explicit retryable read races, never
partial metadata or writer failure. Portable unit binaries run from their Go
package directory to match `go test` fixture resolution. The complete portable
unit suite has a 90-second deadline, with a 105-second outer watchdog; individual
SDK/process deadlines remain unchanged. These are store/transport
checks; main dev and app-debug integration remain separate gates.

Source-host `test:go-unit` disables Go's own test-result cache with `-count=1`.
Turbo's `cache: false` alone does not force Go tests to execute. Portable compiled
unit binaries already run directly and do not use Go test-result caching.

The foreground macOS packaging gate still checks actual C leaf compilation and
universal app/DMG publication. It does not start detached runtime jobs or apps.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native macOS foreground build"}' -- bun run turbo run test:go-build-macos-real --filter=@octane-xplat/cli
```

Frozen core snapshots expose `test:go-dev-server:portable` alongside
`test:go-dev:portable`, ordinary build/worker checks and native units. Execute the
actual binaries on each host before claiming qualification. Windows forced
process termination and Job cleanup do not qualify console Ctrl-C. These
headless gates do not launch a browser or inspect images.

The foreground server test also reads native diagnostics while the engine runs
and after it stops. It verifies capture owner identity, bounded pagination,
platform mismatch rejection, offline records and explicit unavailable crash-report
coverage. Engine capture IDs remain separate from observed app session IDs;
forced Windows shutdown does not prove a final metadata cleanup write.

The app-registry fixture executes the actual injected browser logger in a VM and
forwards its authenticated requests through real Vite into native diagnostics on
portable hosts. This does not prove browser APIs. Set `XPLAT_GO_BROWSER_LOGS=1`
for `test:go-dev-server` to additionally launch the existing Playwright Chromium
installation, assert real warnings/uncaught errors/rejections reach native logs,
and close the test-owned browser. It captures no images and is opt-in outside
lightweight PR checks. This does not qualify UI inspection or other controls.

`test:go-reports` compares native Apple parsing against the actual retained Node
engine, including null/empty fields, numeric JSON representations, identity/time
rejection and candidate/confirmed associations. Native units cover atomic bounded
retention, integrity, concurrent readers and complete 4 MiB originals. Set
`XPLAT_GO_APPLE_REPORTS_REAL=1` for `test:go-dev` to abort only its disposable
headless AppKit fixture, collect the OS .ips through the native CLI, and verify
its retained original hash. It uses the real macOS report directory and removes
only its own native history cache after preserving local evidence; OS reports
are left in place. No images are captured. This is opt-in outside PR checks.

Android diagnostics adds a nine-case Node comparison for exit kinds, process
scope, CRLF and unavailable formats. An explicit owned-device gate is split into
preparation (native build reservation) and runtime (resident Android reservation):

```sh
bun run turbo run prepare:go-android-reports --filter=@xplat/cli-go-probe
bun run turbo run test:go-android-reports-real --filter=@octane-xplat/cli --only
```

Reserve `native_builds:1` for preparation, which only reads the existing AVD
configuration. Release that reservation, then reserve `resident_devices:1` and
`exclusive:["android:elegant-fir-probe"]` for runtime. The runner requires the
existing API 35 Google APIs ARM64 AVD `elegant-fir-probe` and JDK 21. It never
creates, clones, wipes or reconfigures a device, or installs SDK images. Missing
or incompatible configuration fails explicitly. It refuses to start while any
Android emulator is already running or starting; wait for that session to end.
The fixture uses a unique Java activity, current binary/source hashes and no
images. It crashes only that owned package,
then checks real records and originals through the public Go CLI and shuts down
the emulator. Its sync line is constructed for the capture fixture; this is not
a NativeScript deployment qualification. Setup and disk-space failures remain
unqualified; preserve the existing device and unrelated files when a gate fails.

The opt-in NativeScript relay gate builds a small disposable app with the current
bridge sources and installed project dependencies. It boots only the existing
`elegant-fir-probe` AVD, rejects another running emulator, and checks a read-only
action through the real Go foreground server, project Vite and device WebSocket.
It checks that short CLI clients leave the app alive, then stops foreground dev,
uninstalls only its unique fixture package and shuts down the emulator it started.
Reserve `native_builds:1`, `resident_devices:1` and
`exclusive:["android:elegant-fir-probe"]` around this explicit native workflow;
it is excluded from ordinary PR checks. It captures text only and does not prove
OS input, rendering, TLS, reconnect/HMR or other devices/platforms.

```sh
bun run turbo run test:go-dev-android-real --filter=@octane-xplat/cli
```

Reproduce device-module routing without an emulator or native compilation by
selecting an existing private test app. This starts only a loopback Vite server,
requests the SDK's `source-map-js` module and app entry, then closes the server.
Its explicit exit status is independent of project exception handlers.

```sh
XPLAT_GO_ANDROID_HTTP_APP="$PWD/apps/mobile" bun run turbo run test:go-dev-android-http --filter=@octane-xplat/cli
```

The opt-in iOS relay gate builds the same small disposable app for the iOS
simulator. It asserts the designated existing simulator
`91D40099-A056-497D-A572-ADDDFD6A8F23` is present and available before starting —
it never creates, clones, erases or selects a device by name — then checks a
read-only action through the real Go foreground server, project Vite and the
device WebSocket. It checks that short CLI clients leave the app alive, then
stops foreground dev, terminates and uninstalls only its unique fixture bundle
id, and shuts the simulator down only when it started Shutdown. Reserve
`native_builds:1`, `resident_devices:1` and
`exclusive:["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"]` around this explicit
native workflow; it is excluded from ordinary PR checks. It captures text only
and does not prove OS input, rendering, TLS, reconnect/HMR or other
devices/runtimes.

```sh
bun run turbo run test:go-dev-ios-real --filter=@octane-xplat/cli
```
