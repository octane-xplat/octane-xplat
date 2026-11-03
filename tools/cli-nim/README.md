# Native CLI migration tooling

These contributor tools support the full parallel CLI rewrite and retain an
independent bounded evaluation core. The
[parallel implementation](../../packages/cli/nim/README.md) owns the shared core
and public native entry. Node runs the build and comparison harness; the native
executable runs with an empty PATH and contains no JavaScript engine. Keep
command and real app-workflow coverage separate from successful primitive probes.

## Run on macOS

Use the repository's Bun 1.4.4 install, Node 24 or later, Git, tar, and Xcode
Command Line Tools. Compiler downloads and C caches stay in `research/nim-cli`.
The private workspace pins `nim-toolchain@0.1.0` (Nim 2.2.12); the wrapper checks
the upstream archive SHA-256 before extraction. All Nim dependency revisions and
license paths are declared in
`nim-dependencies.json`; the installer checks the pinned source revisions and
keeps sources in task-local storage. Package staging includes their notices.

```sh
bun install --frozen-lockfile --ignore-scripts
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim CLI build"}' -- bun run turbo run build:nim --filter=@octane-xplat/cli
bun run turbo run test --filter=@xplat/cli-nim-probe
```

`prepare.mjs` generates ignored catalog/schema data from the actual CLI and
compiles it into the executable. The harness stages the TypeScript reference
from `packages/cli`, reuses the Perry probe adapters, and compares JSON, streams,
and exit status. It preserves `results.json` under a host/timestamp directory.
Tests are deliberately uncached because the binary lives outside Turbo outputs.
Probe success does not establish complete command or app-workflow coverage.

## Boundaries

Keep help, catalog/schema discovery, manifest/filesystem inspection, version
binding, diagnostics, and eventual HTTP control protocols in native code.
Build/dev/typecheck engine work, Vite plugins, NativeScript hosts, formatting/linting
engines, and project JavaScript configuration execution should invoke project-installed
tools using explicit argv, cwd, and environment. Shipping a runtime wrapper would
not deliver the intended download reduction. Generating static command metadata
at build time preserves one authoring source without executing JS at startup.

## Project-installed build plugins

`@octane-xplat/build` compiles the three Vite preset entry points from the
TypeScript reference plugin sources. Its published dependency graph has no CLI
runtime edge; the CLI is a build-only workspace dependency tracking that source.
The ordinary packed check installs the plugin tarball outside the workspace
without a CLI installation. It checks typed exports, real Vite production/dev
CSS handling, application PostCSS configuration, platform-file selection,
foreign-module rejection and development session-file cleanup.

```sh
bun run turbo run build typecheck test:packed --filter=@octane-xplat/build
```

The native variant also installs a host-only native CLI tarball, checks its
empty-PATH catalog, and verifies that the old CLI JS plugin import is absent.
On macOS, the native HTTP probe calls the real packed Vite bridge: registry,
submit, poll and outcome waiting use simulated app messages. This does not
establish a browser, mobile renderer or live macOS app session. Desktop preset
exports are imported/typechecked; their host builds are separate qualification.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native CLI and project tool boundary"}' -- bun run turbo run test:nim-build-tools --filter=@octane-xplat/cli
```

New qualification/staging runs use disposable folders under
`~/agent-scratch/octane-xplat/nim-cli-<workspace-hash>/`. Retained JSON evidence
stays in `research/nim-cli`; reports stay outside scratch. Native packaging
accepts `--destination DIR` so concurrent consumers do not share tarball/stage
state. Import migration lives in the
[public guide](../../docs/packages/package-build.md). Existing TypeScript CLI
exports remain available during the parallel migration.

```sh
research/nim-cli/core catalog
research/nim-cli/core binding "$PWD" "$PWD/apps/web"
```

The probe exercises shared workspace/package-manager code as well as discovery,
native HTTP/TLS and managed child processes. Workspace membership uses a pinned pure Nim glob
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
other tokenizer host adapters remain migration work. Native inference is
qualified separately below. The modified port's Apache-2.0 attribution ships
in `NOTICE.txt`.

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
Native/WASM ranking differences are recorded for comparison, not treated as a
release blocker. Keep inference in Nim and judge useful retrieval on concrete
queries. Basic native graph optimization reduces numeric drift relative to
extended/all, but exact engine equality is not required. Model engine assets
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

The HTTP gate uses native asynchronous host libcurl: SecureTransport on macOS
and OpenSSL on the qualified Ubuntu 24.04 x64 host. Linux loads `libcurl.so.4`;
the build fetches only pinned curl 8.5 public headers into its task-local cache.
It does not install system packages or compile/bundle a curl runtime on Unix.
The isolated Windows x64 build statically links commit-pinned curl 8.23.0 and
zlib 1.3.2, with only HTTP/HTTPS enabled, threaded DNS and Schannel for OS TLS and
trust. Its Git-tag build identifies itself as `libcurl/8.23.0-DEV Schannel
zlib/1.3.2`; that is the actual version string. The existing MSVC/CMake/Ninja tools
build into a task-local cache, using static CRT and a recorded SDK link closure.
No curl/OpenSSL/JS runtime DLL is shipped. Updating static curl/zlib requires a
new CLI binary; their notices are included with the other native dependencies.
All three qualified hosts use the pinned Ada 4.0.0 WHATWG parser. Ada is compiled as C++20 with URLPattern
disabled; its exact source revision and MIT notice follow the same task-local
dependency conventions as the Nim libraries. No JS runtime is embedded. The
gate checks real loopback TLS, explicit CA files, hostname rejection, proxies
and CONNECT, redirects, Latin-1 headers, UTF-8 bodies, gzip/deflate, cancellation,
streaming and authenticated bridge envelopes against TypeScript/Node. Its URL
corpus also covers IDNs, escaped dot segments and UTF-16 edge cases. Windy's
Node 24.13.1 embeds Ada 3.4.2: 913 of 920 cases match Node exactly, and seven
explicit punycode-host cases require Ada 4.0.0's pinned WPT results while recording
Node's rejection. Modern Node/Ada 4.0.0 matches all 920. This exception is bound to
that exact reference version and input set, with both outputs retained.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native HTTP qualification"}' -- bun run turbo run test:nim-http --filter=@octane-xplat/cli
bun run turbo run test:nim-http-live --filter=@octane-xplat/cli --only
```

The separate live task fetches only pinned public JSON and checks its exact
bytes against Node and the model's SHA-256. It is excluded from offline gates.
HTTP uses the host transport's trust store; explicit per-request CA files do not
change that store. Ambient proxy variables are disabled by default, matching
the reference without Node's environment-proxy opt-in; explicit proxy settings
are qualified. Compression negotiation advertises gzip/deflate; Brotli/zstd and
other platform backends remain unqualified. This is a CLI transport boundary,
not a replacement for every browser Fetch API or Node runtime option.

Invalid JSON retains the reference's null fallback. Body transport failures
remain failures instead of becoming successful null registries; the gate records
that deliberate difference. Pre-aborted waits keep the same response but
avoid the reference's timer retention tracked in
[issue #99](https://github.com/octane-xplat/octane-xplat/issues/99). These transport
and envelope checks do not qualify app ownership or full runtime workflows.

For focused transport iteration after the initial build, use `build:nim-http`
through Turbo with `--only` under a build reservation, followed by the test task
with `--only`. Rebuild the complete native artifacts before final size/package
qualification. The combined core uses the managed process boundary for child
launch, byte passthrough and isolated-group cancellation.

```sh
research/nim-cli/core http http://127.0.0.1:8080/status
research/nim-cli/core child /absolute/path/to/project/tool --version
```

The managed-process gate compares the real TypeScript boundary for argv, cwd,
environment/PATH resolution, raw bytes, streaming UTF-8, UTF-16 line limits,
exit codes, signal termination and cooperative/forced stop. Its native-only
ownership cases cover simultaneous children, callback failure, explicit manager
close, normal owner exit and handled SIGINT/SIGTERM. The launcher uses child-only
cwd actions and explicit descriptor inheritance; it does not run an implicit CLI
runtime. Raw pipe bytes and decoded log lines remain separate interfaces.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native process qualification"}' -- bun run turbo run test:nim-process --filter=@octane-xplat/cli
```

Group ownership continues after the direct child exits. The reference's early
return can skip descendant escalation and leave inherited pipes open, tracked in
[issue #100](https://github.com/octane-xplat/octane-xplat/issues/100). The gate
records that reference observation with bounded cleanup while requiring native
shutdown to pass. A descendant that deliberately starts another session can
escape the owned group; owner SIGKILL cannot run cleanup. The same process gate
also runs on Ubuntu 24.04 x64. Linux uses GNU spawn close-from actions and a
separate `/proc` process-group adapter; tests include unusual process names and
require kernel identities to be gone before native completion. It requires glibc
2.34+ and ordinary OS orphan reaping; non-reaping container init processes remain
unqualified. Native no-shebang text is deliberately rejected with `ENOEXEC`,
while the actual Linux Node reference uses a shell fallback. Windows private owner/RPC and the joined Windows worker workflow still
need qualification.

The separate Windows process gate uses actual SDK job handles, explicit
inherited stdio handles, UTF-16 command/environment input and bounded pipe
polling. It compares literal argv/cwd/environment, raw streams and ordinary exit
status with Node, then requires job/descendant release after cancellation,
capture failure, leader-first exit and abrupt supervisor death. Windows job
termination is immediate; the POSIX graceful-signal/escalation cases stay skipped.
The job is assigned during process creation with `PROC_THREAD_ATTRIBUTE_JOB_LIST`
and has kill-on-close enabled, closing the suspended-child ownership gap. This
requires Windows10 APIs; actual execution is on Windows11 x64 with MSVC.
It is noninteractive process evidence, not private host/RPC,
project-worker, console-event or full app qualification. The gate rejects batch
scripts without an explicit interpreter; it never adds an implicit shell.

For focused process iteration use `build:nim-process --filter=@octane-xplat/cli
--only` through Turbo under a build reservation, then `test:nim-process` with
`--only`. Probe records bind source bytes and host/executable identity. Keep
final benchmark runs separate from concurrent tests.

The environment-program gate compares native `tsconfig.envs.json` loading and
expansion with the TypeScript reference, including generated bytes, ambient
ordering, file coverage, invalid manifests and real repository sources. Its
route-configuration cases compare strict JSON validation, allowed fields,
source-reference checks, navigation settings and actual tracked configs without
executing referenced modules. Syntax errors remain parser-specific. Its
filesystem walker keeps explicit dependency/hidden paths available while the
workspace-discovery wrapper retains its existing exclusions. Glob matching
preserves Node's UTF-16 wildcard and character-class behavior.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native environment-program qualification"}' -- bun run turbo run test:nim-env --filter=@octane-xplat/cli
```

The gate passes the reference source root for ambient declarations; that is an
internal generator test, not installed-consumer or public `typecheck` evidence.
Use `build:nim-env --filter=@octane-xplat/cli --only` for focused iteration after
the initial build. Appending `-- --debug` to a focused probe build enables Nim
stack/line traces. Syntax-error text remains parser-specific; both paths must
reject malformed JSONC. The corrected TypeScript reference uses its existing
JSONC dependency and checks all reported parse errors
([issue #101](https://github.com/octane-xplat/octane-xplat/issues/101)).

The native prerequisite gate reuses the environment probe and compares real
TypeScript tool checks with controlled executable fixtures and the host PATH.
It covers literal argv/cwd/environment, version text, absent tools, pnpm selection,
bounded stdout, simultaneous stderr draining and owned process-tree cleanup on
deadline, overflow or cancellation. Node is queried explicitly because the native
CLI does not run inside Node. A tool's presence is not SDK/device readiness;
Chromium remains unknown without a browser launch.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native prerequisite qualification"}' -- bun run turbo run test:nim-prerequisites --filter=@octane-xplat/cli
```

`test:nim-status` exercises public status/capability reports against Node for
empty, sole-app, ambiguous, explicit and preferred selections, installed-version
changes, scoped permissions, guidance, actual repository app bindings and source
coverage. It independently asserts current native capability coverage rather than
copying the reference's runtime claims. PATH-empty reporting remains usable;
pnpm selection does not require Bun. A marker-observed cancellation test verifies
the version probe and its uncooperative descendant have exited. Human rendering
is compared with the canonical renderer using the native report.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native status qualification"}' -- bun run turbo run test:nim-status --filter=@octane-xplat/cli
```

`test:nim-targets` compares read-only simctl/adb inventories and host eligibility
with the TypeScript helpers. It checks stable booted-first ordering, runtime
labels, connected-device filtering, literal tool argv/cwd/environment, missing
tools and pre-aborted queries. Simulator JSON also requires typed availability
and nonempty identities; malformed positive reference rows are deliberately
rejected. A macOS-only case reads the actual available simulator list through
both implementations without booting, launching or stopping devices. Synthetic
host strings do not qualify Linux/Windows execution. Desktop/browser inventory,
session/busy-state composition and the public `targets` command remain pending.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native target inventory qualification"}' -- bun run turbo run test:nim-targets --filter=@octane-xplat/cli
```

`test:nim-sessions` compares session states, progress, usability, ordinary cleanup,
failure reporting and notifications against the reference registry. Native
ownership guarantees also reject duplicate/retired IDs and new bindings during
shutdown, isolate nested snapshot mutation, contain observer exceptions, serialize
reentrant notifications and wait for a single cleanup on concurrent end calls.
The macOS process case arms both a child and descendant against SIGTERM, verifies
attached end preserves them, then verifies owned end releases both before the
outer test process manager closes. Attached bindings can also own an observer
cleanup: concurrent end calls wait for it once while preserving external ownership.
The packed macOS workflow below qualifies actual launch and attachment.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native session ownership qualification"}' -- bun run turbo run test:nim-sessions --filter=@octane-xplat/cli
```

`test:nim-jobs` compares provider-driven jobs, scoped request deduplication,
progress, successful/failed runners, cooperative cancellation and bounded history
with the actual TypeScript registry. It separately qualifies immediate native
completion, queued cancellation history, snapshot isolation, invalid futures and
structured-exception fallback. An active owned runner cannot be manually marked
terminal; close waits for cancellation cleanup. Its macOS process case checks
an armed child and descendant are absent before the outer test owner closes.
These are registry/ownership gates. The native host composes public job control;
real web build qualification is separate below.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native job lifecycle qualification"}' -- bun run turbo run test:nim-jobs --filter=@octane-xplat/cli
```

`test:nim-rpc` qualifies the native Unix socket boundary against independent Node
clients/servers. It covers fragmented Unicode NDJSON, malformed/oversized frames,
request/reply deadlines, connection limits, shutdown with idle reads, existing
files/listeners, replacement socket identities and descriptor growth across 160
requests. Incomplete stalled frames are disconnected without dispatch; complete
client requests waiting too long receive a timeout result. This is transport
evidence on macOS arm64 and Ubuntu 24.04 x64, separately from authenticated
daemon or runtime-command qualification. Descriptor-growth checks use the host's
actual descriptor inventory: lsof on macOS and procfs on Linux.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native RPC qualification"}' -- bun run turbo run test:nim-rpc --filter=@octane-xplat/cli
```

`test:nim-host-bootstrap` qualifies the native lifetime lock and detached-launch
primitives. A native fixture survives its launcher with PATH empty, its own
session/group, explicit cwd/environment, `/dev/null` stdin and private combined
logs. The launcher lock is not inherited, including when stdin was closed before
launch. Other cases cover lock contention/reuse, symlink/unsafe-file preservation,
unpublished startup termination/reaping and harmless default ownership handles.
Fixtures self-terminate. `test:nim-host` additionally qualifies the authenticated
persistent host through separate native invocations: concurrent startup, private
credentials, idle exit, cross-invocation session/job control, crash recovery,
child/descendant cleanup, foreign/replacement path preservation, FIFO refusal,
and discovery surviving project cache cleanup. These lifecycle checks run on
macOS arm64 and Ubuntu 24.04 x64. They do not qualify a project build/launch
engine, or recovery of app resources after abrupt owner death.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native host bootstrap qualification"}' -- bun run turbo run test:nim-host-bootstrap --filter=@octane-xplat/cli
```

Route path primitives have a separate differential gate for the shared route
vocabulary, layouts and suffix precedence. The emitter compares `bake: false`
generated bytes, warnings, failure behavior, symlink publication, unchanged mtimes
and caller umask. Real repository trees are copied with their source-reference
topology into owned scratch. Compiler analysis runs through an actual selected-
project worker; stale metadata injection is restricted to the rejection test.
`test:nim-worker` exercises real analysis/baking, protocol failures, selected-
project resolution, diagnostics, timeout and process-group cancellation.
`test:nim-route-command` compares public baking and watch workflows against Node
on real copied trees and controlled fixtures. It exercises failure/obsolete-bake
publication guards, macOS file events, config repair, generated-file exclusions,
source ownership and process cleanup. The public native
`typecheck` gate runs real project checker programs, verifies installed ambient
assets and covers cancellation/process cleanup through `test:nim-typecheck`.

`route-templates.mjs` extracts only the command descriptor. Route rendering is
shared by the TypeScript reference and the selected-project build worker through
`src/route-generator.ts`; no template slots or expression fingerprints are
maintained in Nim. The `route-plan` operation returns a versioned output plan.
Nim rejects stale inputs and invalid/incomplete destinations before publishing,
while retaining watch lifecycle, cancellation and process ownership. The public
route gate includes corrupt-plan and changed-input checks.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native route discovery primitives"}' -- bun run turbo run test:nim-routes --filter=@octane-xplat/cli
bun run turbo run test:routes --filter=@octane-xplat/cli
```

Build flags select macOS dead stripping, Linux section collection, or the
Windows compiler defaults. The isolated portability gates below distinguish
help/catalog execution from usable host adapters. A representative Linux
HTTP/TLS, owner, project-worker and cancellation workflow passes on Ubuntu x64;
full Linux command coverage, deployment baselines, Windows native providers, signing,
notarization, archive checksums, and installer/update behavior remain distribution
work. Nim emits C requiring a target C compiler and SDK; cross-compilation alone
would not qualify those hosts. The compiler wrapper supports Darwin arm64/x64,
glibc Linux arm64/x64, and Windows x64; its support matrix is not this probe's
runtime qualification. It is a build dependency, never part of the download.

Retain the differential harness as a migration gate during the full rewrite:
compile success and low size do not prove Node semantics. Qualify remaining host
adapters and complete app ownership before production workflows. Operational measurements belong
in local reports and Silo rather than this guide.

## Isolated native portability builds

`portability-snapshot.mjs` verifies the current local native build record and
archives its source, generated command metadata, compile-time asset manifests
and pinned build tools. It does not copy a platform's `node_modules`, change a
shared remote checkout, include model bodies, or prepare a publishable package.
The transport snapshot also includes the actual TypeScript bridge and its
independent Node comparison harness.
The archive and its checksums stay under ignored `research/nim-cli`.

```sh
bun run turbo run snapshot:nim-portability
```

Extract the archive into a task-owned run folder on the destination host, install
its minimal dependency tree with Bun 1.4.4, and reserve native build capacity
before compiling. `XPLAT_NIM_PORTABILITY_CACHE` selects a task-owned shared cache
for repeated source snapshots; its path must satisfy nim-toolchain's no-spaces
constraint. On Windows, configure the existing Visual C++ environment and set
`XPLAT_NIM_CC=vcc`; the compiler package does not install a C compiler or SDK.
The task invokes `cl.exe` directly in that prepared environment, avoiding Nim's
per-compilation Visual Studio setup wrapper, and bounds parallel C compilation.
Its Turbo task explicitly forwards `INCLUDE`, `LIB` and `LIBPATH`; a developer
shell alone does not preserve those variables through Turbo's strict environment.

```sh
# From the extracted snapshot root, under the destination host's reservation:
bun install --ignore-scripts --linker isolated
bun run turbo run build:portability --filter=@xplat/nim-portability-source --concurrency=1
```

The build rechecks source hashes, uses the exact Nim/compiler-library pins, and
records compilation separately from native help/catalog execution. Linux ELF and
Windows PE signatures are checked. Linux is stripped; the Visual C++ baseline
does not claim stripping. A successful baseline does not qualify HTTP/TLS,
bootstrap/RPC, project workers, cancellation or descendant cleanup. Those are the
next required actual-host gates before expanding the CLI further. Use
`ssh andromeda.local` with its reserved Linux guest and `ssh windy` for these
checks; preserve existing checkouts and machine-wide tools.
An SSH supervisor's cancellation does not establish remote descendant cleanup.
Keep ownership on the remote host, await its release, and verify that the exact
owned compiler phase has ended before replacing its source or starting a retry.

The extracted snapshot can build and execute the HTTP differential gate on
Linux and Windows x64. It verifies the source manifest and native probe hash before running;
native requests have an empty PATH. This qualifies the transport and bridge
envelopes, separately from owner bootstrap, workers and process cleanup. The
proxy fixture supports both forward requests and CONNECT tunnels, including
CONNECT for plaintext HTTP, and asserts traversal independently for each client.

```sh
# From the extracted snapshot, under the destination build reservation:
bun run turbo run build:portability-http --filter=@xplat/nim-portability-source --concurrency=1
# Release native_builds before these runtime gates; retain the host reservation:
bun run turbo run test:portability-http --filter=@xplat/nim-portability-source --only
bun run turbo run test:portability-http-live --filter=@xplat/nim-portability-source --only
```

The live gate checks pinned public JSON over HTTPS using the OS trust path, with
empty PATH and exact native/Node response hashes. It never installs a test CA.
Windows loopback TLS tests use Git's existing OpenSSL only to generate disposable
certificates; Unicode/spaced explicit CA paths are exercised too. These Windows
checks currently use the isolated snapshot driver, not the root workspace's full
multi-probe build. Local RPC, detached owner launch and the joined Windows worker
workflow remain unqualified.

A separate Windows storage gate exercises actual current-user-only SDK ACLs,
local NTFS volume/file identities and nonblocking lifetime locks. It refuses
broad/foreign ACLs, hardlinks, reparse ancestors, UNC/device paths and ambiguous
Windows filename aliases. The lock pins its file and ancestor handles until
release, including cleanup after process death. Identity-bound cleanup preserves
a replacement file; POSIX-style NTFS rename keeps open readers on the old bytes
while new readers observe complete publications. Node's token-default owner can
differ from the current user, so private worker responses must be precreated
natively and written in place; ordinary inherited ACLs alone do not prove ownership.
These primitive checks do not enable a Windows host or installed-worker workflow.

```sh
# In the isolated snapshot, compile under native_builds plus device:windy:
bun run turbo run build:portability-storage --filter=@xplat/nim-portability-source --concurrency=1
# Release native_builds and retain the host reservation for actual execution:
bun run turbo run test:portability-storage --filter=@xplat/nim-portability-source --only
```

The current Linux build dynamically needs glibc and the C++ runtime in addition
to libcurl's own dependency closure. The Ubuntu-built ELF imports symbols through
`GLIBC_2.38` and `GLIBCXX_3.4.31`; this is build evidence, not qualification of
older distributions or musl. Define and execute a supported deployment baseline
before treating a small compressed ELF as a self-contained Linux distribution.

The snapshot also exposes the real TypeScript managed-process reference and
native process probe. The gate checks literal arguments/environment, descriptor
inheritance, raw bytes, exit status, cooperative and forced stop, owner signal
handling and descendant reaping. It does not qualify a persistent host or worker
workflow by itself.

```sh
# From the extracted snapshot, under the Linux guest/build reservation:
bun run turbo run test:portability-process --filter=@xplat/nim-portability-source --concurrency=1
```

The snapshot's RPC and host gates build the native probes and full CLI, then
exercise independent Node peers, private lifetime locks and authenticated
cross-invocation ownership. Runtime checks use empty PATH for the native control
plane. Detached launches reuse the same platform spawn options as managed
children, so unlisted descriptors, including the launcher's lifetime lock, stay
out of the daemon. These gates preserve the existing 104-byte socket-path bound;
other procfs/container configurations remain unqualified. The production worker
workflow below is separate from these owner fixtures.

```sh
# From the extracted snapshot, under the Linux guest/build reservation:
bun run turbo run test:portability-rpc test:portability-host --filter=@xplat/nim-portability-source --concurrency=1
```

Use the optional worker snapshot to exercise the production owner and actual
project-installed JavaScript tools on macOS or Linux. It packs the current build
and lib leaf packages through Bun, records their hashes and the exact Vite pin,
and installs them in a disposable project with spaces in its path. These fixture
packages belong to the selected project, never the native CLI download.

```sh
# From the authoritative repository, after the local native build is current:
bun run turbo run snapshot:nim-portability-worker
```

The workflow verifies canonical route parsing/baking, all generated artifact
bytes, real Vite/CSS output, separate diagnostics and cleared Node preload/global
module variables. Cancellation must release a resistant worker and descendant
before their failure-cleanup expiry, remove private sidecars and preserve the
last-good artifacts. It then authenticates owner shutdown and restart. The
worker directory must be private while active, not only empty after cleanup.
Windows stays explicitly disabled until its native adapters are qualified.

```sh
# In the extracted snapshot, reserve native capacity only for compilation:
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native portability workflow build"}' -- bun run turbo run build:portability build:portability-http --filter=@xplat/nim-portability-source --concurrency=1
# Keep the host/device reservation, release build capacity, then execute:
bun run turbo run test:portability-http --filter=@xplat/nim-portability-source --only --concurrency=1
bun run turbo run test:portability-workflow --filter=@xplat/nim-portability-source --only --concurrency=1
```

The HTTP predecessor qualifies the real transport probe and TypeScript bridge;
it does not claim an additional public HTTPS command. Source manifests and
artifact hashes bind these separate runtime gates to the same native source.
They establish this representative workflow, not full Linux app, inference,
owner-loss recovery or deployment qualification.

`portability-smoke.mjs` independently checks the actual native binary with empty
PATH and measures warm help startup (five warmups, twenty launches). Its record
identifies the executable hash and keeps those limited runtime checks separate
from the required provider workflow. In this repository use the root task; a
prepared snapshot exposes the same script as `benchmark:portability`.

```sh
XPLAT_NIM_SMOKE_BINARY="$PWD/research/nim-cli/native/xplat" XPLAT_NIM_SMOKE_RECORD="$PWD/research/nim-cli/standalone-smoke.json" bun run turbo run benchmark:nim-portability
```


## Real web build jobs and logs

`test:nim-runtime-build` invokes the actual installed Vite and build-package CSS
plugin from disposable apps without installing a CLI JS payload. It compares the
wire result and exact generated artifacts with the TypeScript web adapter, then
checks compiler errors, selected-app deduplication, cancellation of engine and
descendant processes, engine deadlines, foreground build selection and rejection
before writes. This qualifies web builds on the executed macOS host; it does not
qualify a development server, browser UI or native app package.

`test:nim-runtime-logs` compares cursor/filter/reset behavior against the real
TypeScript log store. Native checks additionally enforce a byte bound, private
snapshots and containment of throwing observers. Public job logs are retained
only for the host lifetime for build jobs; development sessions also retain
app-scoped metadata and logs in the private native history namespace.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native web build qualification"}' -- bun run turbo run test:nim-runtime-build test:nim-runtime-logs --filter=@octane-xplat/cli
```

## macOS package worker and publication

`@octane-xplat/macos-build` compiles the canonical TypeScript packager/compiler
and carries the verified JSC host assets separately from the native CLI and
web build package. Its packed-worker path uses project-only package resolution
and colocated dist assets. It returns a staged app/DMG plan without publishing;
Nim validates that plan, holds a per-app advisory lock, publishes with native
renames and restores both previous artifacts on reported publication failures.

`test:nim-macos-build` installs packed workers and the native CLI in a disposable
consumer. It checks real C leaf compilation, ad-hoc signing, DMG verification,
headless host-architecture execution, complete app-payload comparison with the
TypeScript operation, public jobs/diagnostics/foreground builds, absent workers,
build contention and cancellation before publication. App execution is headless;
it does not qualify GUI input, development sessions, Intel execution on an arm64
host or notarization. Its signing/notarization environment is explicitly local.

`test:nim-macos-publication` tests malformed plans and an actual immutable-file
rename failure after app publication, requiring rollback of the previous app and
DMG. Abrupt owner death during publication can leave recovery files; automatic
crash recovery is still migration work. The native build lock coordinates native
invocations; do not run the reference CLI against the same output concurrently.

`test:nim-macos-dev` installs packed project tooling and the native CLI, runs a
headless native C app, edits JavaScript and owned local C sources, and verifies
rebuild failure/recovery, target busy state, pending deduplication, cancellation,
unexpected exit, retained logs and resource/process cleanup. It never changes a
shared dependency-store source. The development worker reuses the canonical
Vite/compiler/HMR engine with structured readiness metadata; Nim owns the outer
process group and session. Spawn readiness does not prove UI rendering or input.
The session directory is outside project dependency caches and is removed after
owned process cleanup. Session history also covers reads after graceful shutdown, abrupt owner loss
and authenticated owner replacement. Lost-owner cleanup is explicitly unconfirmed;
the qualification harness releases its own deliberately orphaned fixture group.
The same test starts an external canonical engine and verifies native attachment,
external HMR, lifecycle-only logs, conflicts, observer cleanup, owner shutdown and
reattachment. Its synthetic independent-engine fixtures qualify explicit target
selection separately from real app execution. The workflow deliberately aborts
its own headless app to qualify actual OS .ips association, complete original
reads and post-owner retention; rebuilds update structured app PID/time history.
Automatic abrupt owner-death recovery remains unqualified. The worker's optional WKWebView path is
not exercised by this test.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"macOS worker qualification"}' -- bun run turbo run test:nim-macos-build test:nim-macos-dev test:nim-macos-publication --filter=@octane-xplat/cli
```


`test:nim-history` exercises the native-only retained store independently of app
engines. It compares log records, tail/filter pagination and cursor progress with
the TypeScript reader, checks concurrent rotation, incomplete append handling,
app isolation, owner generations, active/historical retention, file safety and
explicit persistence failures. The adapter is test-only and is not shipped in
the executable. Retained diagnostic reads are app-scoped and never start a host.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native session history qualification"}' -- bun run turbo run test:nim-history test:nim-macos-dev test:nim-host --filter=@octane-xplat/cli
```


`test:nim-attach` exercises same-user/canonical-cwd SDK observations, process birth
identity, command classification, ancestry grouping and independent selectors.
It compares the single-engine DTO and lifecycle-only contract with TypeScript,
rejects unrelated/eval/suffix lookalikes and checks argument privacy. A directly
owned Node fixture verifies discovery with an empty PATH and stale birth/exit
rejection; it is process-discovery evidence, not actual app readiness.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native attachment qualification"}' -- bun run turbo run test:nim-attach test:nim-sessions test:nim-macos-dev --filter=@octane-xplat/cli
```


`test:nim-reports` compares macOS .ips parsing, association and original retention
with the TypeScript provider. It covers byte/count bounds, source deletion,
malformed and unsafe files, private cache corruption, timestamp offsets/fractions,
worker app identity and cleaned-up executables. Report reads are independent of
log rotation; cache failures must preserve readable logs. Discovery yields between
files and discloses bounded directory/file/byte/time coverage. This fixture evidence
is separate from the real OS report generated by the packed macOS workflow.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native crash-report qualification"}' -- bun run turbo run test:nim-reports test:nim-history test:nim-macos-dev --filter=@octane-xplat/cli
```


The inference execution boundary is `docs_compute.nim`, with explicit asset
preparation in `inference_assets.nim`. It uses an owned same-executable child for
blocking tokenization/model/index work. Requests and results are private, versioned
and bounded; cancellation/deadlines await process cleanup and remove owned staging.
Runtime extraction inherits that worker's process group. Completed verified assets
and index batches remain reusable. Ordinary search and empty inventories never
download optional assets. Public docs index/search/read and guidance use this same
boundary, including version binding, Git and corpus enumeration. The owner registers
separate snapshot staging on the docs cache filesystem and awaits group cleanup
before deleting either staging root. Native docs state uses `XPLAT_MCP_CACHE/nim-v1`;
model/runtime assets use the absolute `XPLAT_NIM_INFERENCE_CACHE` override or its
default private inference cache. A native lock serializes cache mutation.

Build headers come from the complete checksummed ONNX public C API closure under
`ort-headers.mjs`. Normal CLI builds prepare only these small headers, not the
optional runtime or model. `ort-runtime.json` and `model-assets.json` own asset
identities and exact byte counts; model/runtime costs are separate from CLI
executable/tarball measurements. The ONNX API license is included in native notices.

`test:nim-docs-compute` streams real pinned fixture bytes through a loopback HTTP
server, checks explicit preparation, corruption and interrupted downloads, exercises
real native retrieval under a network-denying sandbox, and qualifies the owner's
responsive dispatcher, cancellation, deadlines, SQLite integrity and staging
cleanup. It executes both the production internal entry and public index/search/read
with an empty PATH and actual model assets, and cancels an in-flight Git descendant
before confirming snapshot cleanup. `test:nim-docs` compares public exact/lexical/
cold-hybrid contracts, real Git release tags, conflicts, offline refs and project
guidance against TypeScript. Safety cases cover external symlinks, cycles and
oversized files without asking the reference to follow unsafe input. `test:nim-model` separately checks numerical behavior and useful
retrieval on maintained guides; exact native/WASM ranking equality is not required.
These optional tests prepare about 61 MB of model/runtime download inputs and stay
outside the ordinary offline/PR gate. Run them under a build reservation:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native inference qualification"}' -- bun run turbo run test:nim-docs-compute test:nim-model --filter=@octane-xplat/cli
```

Native action control is composed in `action_service.nim` and
`action_endpoints.nim`. `test:nim-actions` runs public commands against the built
project Vite plugin and canonical app registry, loaded with its macOS leaf in a
headless Node realm. It qualifies host-side discovery, input/defaults, real state
mutation, job results, permission/revision rejection, scoped live dedupe, queues,
cooperative cancellation, partial/unknown outcomes and result validation. Its
PID-recording Node shim is test instrumentation around the actual Node executable,
not part of the native package. A pathological JavaScript regex exercises the real
five-second worker bound and responsive native host shutdown, including pre-job
admission cleanup. These checks do not establish AppKit/NativeScript fetch or UI.

The `action-validate` project worker reuses the existing reference JS field validator;
no native RegExp translation is maintained. The packed build-tools consumer also
executes that operation outside repository dependency resolution. Listing/status,
HTTP, queues, permissions and jobs remain native. Bridge credentials stay within
same-app loopback requests: redirects are refused and response bodies are bounded.
Body transfer failures remain failures, deliberately strengthening the reference's
successful-null fallback after header/body errors. Malformed JSON still maps to
null at the transport boundary and is rejected as an invalid registry by the service.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native development actions"}' -- bun run turbo run test:nim-actions test:nim-http test:nim-host test:nim-build-tools --filter=@octane-xplat/cli
```

## Project lint engine

`test:nim-lint` installs a packed lint leaf into an isolated disposable consumer,
then exercises the public native entry against the TypeScript/Node reference.
It checks real regular/TSRX diagnostics and safe fixes, project tool resolution,
clean Node environment, byte streams, exit status and owned descendant cleanup.
It is a host-side source check, not an app UI/device check. Native `fmt` remains
pending. No lint/formatter runtime is added to the standalone download.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native lint qualification"}' -- bun run turbo run test:nim-lint --filter=@octane-xplat/cli
```
