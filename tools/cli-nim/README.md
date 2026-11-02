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

The HTTP gate uses native asynchronous macOS libcurl with SecureTransport and
the pinned Ada 4.0.0 WHATWG parser. Ada is compiled as C++20 with URLPattern
disabled; its exact source revision and MIT notice follow the same task-local
dependency conventions as the Nim libraries. No JS runtime is embedded. The
gate checks real loopback TLS, explicit CA files, hostname rejection, proxies
and CONNECT, redirects, Latin-1 headers, UTF-8 bodies, gzip/deflate, cancellation,
streaming and authenticated bridge envelopes against TypeScript/Node. Its URL
corpus also covers IDNs, escaped dot segments and UTF-16 edge cases.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native HTTP qualification"}' -- bun run turbo run test:nim-http --filter=@octane-xplat/cli
bun run turbo run test:nim-http-live --filter=@octane-xplat/cli --only
```

The separate live task fetches only pinned public JSON and checks its exact
bytes against Node and the model's SHA-256. It is excluded from offline gates.
HTTP uses the OS certificate store; explicit per-request CA files do not change
the user's keychain. Ambient proxy variables are disabled by default, matching
the reference without Node's environment-proxy opt-in; explicit proxy settings
are qualified. Compression negotiation advertises gzip/deflate; Brotli/zstd and
other platform backends remain unqualified. This is a CLI transport boundary,
not a replacement for every browser Fetch API or Node runtime option.

The bridge port preserves the reference's successful null payload when body or
JSON parsing fails after headers. Pre-aborted waits keep the same response but
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
escape the owned group; owner SIGKILL cannot run cleanup. Windows/Linux control,
full session shutdown/IPC and real app workflows still need qualification.

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
outer test process manager closes. The native host composes public session state;
real app launch/attach remains pending.

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
evidence on macOS, not authenticated daemon or runtime-command qualification.

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
and discovery surviving project cache cleanup. These are lifecycle checks on
macOS, not application build/launch qualification.

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

Build flags now select macOS dead stripping, Linux section collection, or the
Windows compiler defaults; only macOS has been executed locally. Native Linux and Windows
build jobs, libc baselines, TLS libraries, Windows process control, signing,
notarization, archive checksums, and installer/update behavior remain distribution
work. Nim emits C requiring a target C compiler and SDK; cross-compilation alone
would not qualify those hosts. The compiler wrapper supports Darwin arm64/x64,
glibc Linux arm64/x64, and Windows x64; its support matrix is not this probe's
runtime qualification. It is a build dependency, never part of the download.

Retain the differential harness as a migration gate during the full rewrite:
compile success and low size do not prove Node semantics. Qualify remaining host
adapters and complete app ownership before production workflows. Operational measurements belong
in local reports and Silo rather than this guide.


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
only for the host lifetime; persisted session history remains migration work.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native web build qualification"}' -- bun run turbo run test:nim-runtime-build test:nim-runtime-logs --filter=@octane-xplat/cli
```
