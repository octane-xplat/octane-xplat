# CLI implementation guidance

The full Go migration lives in `go/`; retain the Nim implementation in `nim/`
until the replacement is ready. Keep the TypeScript implementation as the
behavioral reference during migration. Node is an assumed prerequisite for explicit
JavaScript workers; do not bundle or download it. Inference remains native.
See [the Go entry](go/README.md) for build and ownership boundaries. Native
commands must not fall back to executing the old CLI. Project-installed JavaScript build engines remain a
separate execution boundary. Keep the executable native, without embedded
Node/Bun or an old-CLI fallback. Small operation workers and Vite exports may
live in this package; language boundaries do not require npm package boundaries.
Keep heavy engine dependencies opt-in and large platform host assets separate.

The Nim tarball retains the small Vite/worker exports in this package using
the curated `@octane-xplat/build` output closure and optional engine peers.
Native-only installs must not fetch those peers. Native worker/declaration
lookup uses the selected project's `@octane-xplat/cli` installation. Reject a
nearer broken install or worker symlink outside its canonical package root; do
not supply a missing project worker from another installation or global paths.
Project-installed plugins also remain in `@octane-xplat/build`. That package compiles
the Vite plugin closure from the TypeScript reference at build time; its published
code has no CLI runtime dependency. Those current package locations are not a
requirement for future worker/plugin placement. For native commands, invoke the
app's installed compiler/build tools with explicit argv, cwd and environment, and keep command/session orchestration in Nim.

Node-based project operations can import `@octane-xplat/macos-build/dev-engine`
from the selected project to reuse the canonical engine in their existing worker.
Do not start a nested worker just to cross an API boundary already within Node.
Keep outer process ownership native, validate project package exports, and await
the engine’s shutdown. Host launch metadata does not establish app readiness.
Large host assets stay in the optional macOS package. When qualifying cancellation,
wait for an app output marker if the test requires initialized app code; a fixed
delay after host launch can cancel before that code runs.

The macOS development worker is `@octane-xplat/macos-build/dev-worker`.
It runs the canonical Vite/compiler/HMR engine and publishes versioned readiness
metadata; Nim owns target claims, session identities, captured logs and the outer
process group. Keep readiness separate from printed diagnostics. Put owned session
resources in the host's private cache, outside dependency caches removed by clean,
so cancellation before worker readiness can still release them.

Keep bounded app-process launch history in the versioned readiness sidecar and
consume updates after every rebuild, including the final worker response. The
worker's engine PID is not the app PID. Launch evidence outlives temporary bundle
cleanup: validate its recorded path boundary without requiring that executable
to exist after exit. Process observation/report association never grants signal
ownership. Keep complete report originals separate from rotating log captures;
a report-cache failure must disclose unavailability without hiding readable logs.

Persistent-owner admission and shutdown must share a synchronization barrier:
close admission before waiting for registered operations or request handlers.
Register an operation before starting it and release its claim only after awaited
cleanup. An idle timer may retire an owner only with no active operations or RPC
handlers; client disconnects do not end admitted work. Hold a kernel lifetime
lease across descriptor publication and teardown. Retain a cleanup-unknown
descriptor when resource release fails. An existing running descriptor after
lease release can be crash evidence too: reject automatic replacement rather
than treating a dead PID or released lock as cleanup proof.

Detached native startup uses a private pipe separate from caller stdin. Before
handoff, only maintenance RPC is allowed and EOF cancels the unadopted child;
after a handoff byte can be observed, caller exit must not kill that generation.
Bind readiness to the retained process handle, launch nonce, project and staged
binary checksum. Claim fresh stage directories atomically; a pre-existing private ACL is not
ownership proof. Publish a manifest before copying bytes, and commit adoption
before admitting work. A per-launch kernel claim prevents late obsolete starters.
Collect stages only under the bootstrap/global/launch claims: unadopted stages need
no descriptor/adoption witness; adopted stages need explicit cleanup confirmation.
Preserve unknown files and modified verified images. Remove the executable before
the manifest so Windows refusal preserves recovery evidence. Request Windows Job
breakaway explicitly and report refusal instead of inheriting a caller's Job.
Owner creation does not make the first client's grants global: send validated
permissions and operation environment per request when connecting public services.
Cleanup RPC deadlines must cover the bounded engine/browser teardown sequence;
keep ordinary reads shorter. A client timeout proves neither owner loss nor
resource release, and must not authorize replacement.

Job admission and request-key deduplication must be atomic before a runner starts.
Include selected app identity, platform, operation and session in that key. A caller
cancelling an RPC does not cancel owner-admitted work; explicit job cancellation
stays `cancelling` until the runner has awaited resource cleanup. Bound progress,
results and completed history independently, and return immutable snapshots.
Preserve structured provider errors. Partial file publication must remain visible
as failure even during cancellation, but does not itself prove a live process leak;
reserve cleanup-unknown ownership for unconfirmed resource release or provider panic.

Persistent build workers must use the invoking request's explicit Node executable,
cwd and sanitized environment. Resolve project entries inside that app's installation;
do not change process-wide cwd/environment or execute the old CLI. Keep request
credentials out of descriptors, job metadata and logs. Revalidate selected app id
and canonical root inside the owner. Distinguish genuine output-lease contention
from cache/permission errors. Best-effort Git metadata may omit an unavailable
revision, but must preserve dirty state and propagate unconfirmed process cleanup.

Claim target identity and owner admission before launching a session. Keep that
claim until awaited cleanup, including when a state is failed or disconnected.
Separate creation checks from cleanup authority: edits/removal of a project must
not prevent ending a known registered process. Scope cleanup by authenticated
owner, registered app binding and session id; never rediscover signal authority
from a PID. Preserve nonempty project-lease cleanup witnesses across kernel lock
release and clear them only while holding the lease after confirmed cleanup.

For native macOS workers, require the validated launch sidecar rather than a generic
"ready" log line. Report host-spawn evidence separately from app initialization.
Normalize ANSI sequences in log-based readiness parsing: Vite can color the port
inside its URL even with piped output. Preserve original retained log bytes.
A browser owns its private profile and process group/Job until joined cleanup;
DevTools port metadata is descriptive and never signal authority. Capture bounded
native launch history before copying it into public live session snapshots.
Windows sharing violations can briefly outlive process exit or atomic sidecar
publication. Retry those specific OS errors within an existing deadline; do not
mask malformed metadata or general access failures. Join process cleanup before
retrying private browser-profile removal, and preserve it if bounded retries fail.
Close an owned Chromium browser through the validated private DevTools endpoint
before escalation through its retained process group/Job. Keep cancellation and
joining separate so a parent cancellation cannot race the graceful close.
Browser qualification must forward explicit browser configuration through the task
runner and assert the selected executable as well as its observed DevTools version.
A filtered environment can silently exercise a fallback browser instead.
Collect each qualification archive into a fresh directory. A missing result from
a failed run must never inherit an older JSON file; validate source/binary hashes
before treating a collected result as current evidence.
Windows may reject removing a live engine's working directory with EBUSY after
its files have already been removed. Verify ending through the registered binding,
then require directory removal and retained reads to succeed. Report this apart
from hosts where the whole workspace was removed before ending the session.

Session evidence is separate from disposable session resources. Keep retained
metadata/logs in the native history namespace; use authenticated owner generations
to distinguish live records from historical evidence. PID existence alone cannot
establish ownership or authorize cleanup. Publish a cleanup-confirmed checkpoint
only after awaiting process/resource release, rather than inferring it from a
stopped state emitted before an async cleanup finishes. Keep terminal-state
metadata observers until explicit end or capture retirement so later state changes
remain visible after the host exits.
Do not require global history enumeration before releasing a known live session:
validate its selected-app ownership from the live registry, so an unrelated
corrupt retained record cannot prevent process cleanup.

An attachment owns its observer and lifecycle capture, never the observed
process. Await that observer's cleanup on end/shutdown while preserving external
processes. Read-only process observations need same-user, canonical-cwd and
birth-time checks; a matching PID alone is insufficient even for continued
observation. Keep command arguments transient and out of public/retained metadata.
Disclose inferred identity and lifecycle-only coverage instead of claiming app
readiness or captured output from an external terminal.

After an append failure, stop adding bytes to that JSONL stream. A failed write
may leave an incomplete final record; appending another record can turn that tail
into an invalid complete line and hide a readable prefix. Preserve the complete
prefix, disclose incomplete tails and retention errors, and use a new capture
identity when restarting. Bound disk retention separately from memory retention.

Project operations that already need JavaScript use small, versioned workers
from the selected project's `@octane-xplat/cli/worker` or platform-specific
`@octane-xplat/macos-build/worker`. Keep parser/compiler
AST details and JS execution there; pass stable validated metadata to Nim.
Nim owns explicit argv/cwd/environment, response bounds, timeout, cancellation
and process-group cleanup. Sidecar JSON separates results from library diagnostics
on stderr. Do not resolve a missing project dependency from global module paths.
Keep catalog, discovery, permissions, source/document reads, HTTP control and
process ownership native. Inference stays in Nim; useful retrieval quality takes
precedence over incidental equality with WASM search ranking.

Development-action input/output validation uses the selected project's
`@octane-xplat/cli/worker` (`action-validate`). Reuse the existing JS field
validator: its RegExp and default semantics belong to that runtime; do not add a
third validator or a partial native regex translation. Listing, HTTP, policy,
queues and job outcomes remain native. Treat pre-job admission workers as owned
resources too: register cancellation/completion before starting them, and await
their teardown during host shutdown. Cancelling a queued FIFO ticket removes
only that ticket; it must not release the running owner's slot. Preserve partial
effect evidence when cancellation races a runner exception.

Choose language boundaries by the operation's existing requirements and semantic
ownership. When compiler work already starts Node, keeping its renderer in the
same project-installed worker can remove duplicated language-specific logic.
Fast native help startup does not establish an end-to-end speed benefit for that
renderer. Formatting follows this rule too: share discovery, Git ignore and
formatter planning with the reference command; let the project's formatter engine
load its configuration and native binding. Nim validates the complete plan before
any source publication, then stages adjacent files and performs native rename.
Keep raw-byte source digests and permissions in stale-input checks; decoding two
different invalid UTF-8 byte sequences can yield the same text. Worker/library
stdout belongs on stderr when stdout carries formatted stdin text.
Prefer one canonical implementation; keep validated artifact plans,
stale-input rejection, publication and lifecycle ownership explicit at the boundary.
Preserve user-visible contracts and data/process safety without expanding a
general JavaScript compatibility layer to reproduce incidental coercion behavior.

When a child environment table overlays inherited variables, omitting a key
does not unset it. Pass explicit empty `NODE_PATH` and `NODE_OPTIONS` values for
selected-project tool operations that must ignore global resolution or preloads.
Keep ordinary project variables intact, and qualify the effective child values.

An `async` caller does not make synchronous CPU work nonblocking. Native model
inference and index preparation need an execution boundary with cancellation and
bounded work before joining a responsive persistent host; qualifying model outputs
in a standalone probe does not establish that host behavior.
Use an owned same-executable process for blocking native model/index work when
cooperative cancellation inside a C call is unavailable. Keep its request/result
files private and bounded, await process/group cleanup before removing its owned
operation directory, and leave completed cache batches reusable. Child processes
started inside that worker must inherit its group so outer cancellation can reach
them; a nested detached process manager would require separate ownership transfer.
Downloads belong to explicit preparation; empty inventories and ordinary search
must not fetch optional model/runtime assets.

Keep version binding, Git and document enumeration inside that same owned child,
not just the C inference call. Register temporary snapshot clones on the snapshot
cache filesystem and asset staging on the asset filesystem before starting the
child; cancellation must reap the inherited Git group before deleting either.
Keep native mutable caches private and separate from reference caches, and report
the namespace actually used. A kernel lock released on process exit can serialize
cache mutation without trusting stored PIDs. Scope document reads by canonical
targets while preserving lexical reference names; bound traversal, reject external
symlinks, and skip directory cycles instead of reproducing unsafe reference walks.

## Foreground process input

Only one-shot CLI dispatch attaches a foreground input file to its context.
Default process/worker calls still receive EOF. Use the explicit foreground
process entry for project engines, and pass input only to selected interactive
worker operations (installation or packaging), not configuration/inspection
workers or owner requests. Inherit an OS file rather than forwarding stdin with
a Go goroutine that can remain blocked after child cancellation.

The Windows job gate uses a separately inherited release handle; never consume
stdin for containment. On Unix, a controlling terminal needs an atomic
`SysProcAttr.Foreground` handoff and restoration after group cleanup. A private
close-on-exec interrupt pipe lets a foreground gate trigger cancellation even
when the project tool ignores Ctrl-C. Restoration failure is cleanup failure.
The one-shot CLI temporarily ignores SIGTTOU for restoration, then restores its
inherited default/ignored state; merely catching it can produce EIO for orphaned
background groups. A noncontrolling PTY can pass terminal detection while
TIOCGPGRP returns ENOTTY; it needs no job-control handoff.

Keep real controlling-terminal tests separate from pipe and isTTY checks. Verify
an answer, Ctrl-C with resistant descendants, and a subsequent parent read after
foreground restoration. Snapshot and restore terminal settings too: killing a
raw-mode tool must not leave later input raw. Termios also includes driver
state: BSD sets PENDIN during raw-to-canonical restoration. Compare complete
settings after a subsequent real parent read rather than masking that flag. Windows pipe/job tests do not
qualify console control. Ctrl-C tests do not qualify POSIX stop/resume.
Read a native selection line without buffering bytes intended for the next tool.

## Go project orchestration

Upgrade uses the canonical compatibility planner/apply/inspection engine through
explicit operations in `src/upgrade-worker.ts`. Preserve the invoked framework
release: packaged native builds use the invoked CLI package's checksum-inventoried
`native-worker` policy, not an older project's worker. Stage that bounded closure
privately before mutation so replacing the package during installation cannot
remove the running policy or its verification code. Remove it after confirmed
child cleanup; retain it with a diagnostic when cleanup is unknown. Before an
installation can replace its invoked native package, also stage a bounded,
readback-verified copy of the executable and bind containment gates to that copy
for the operation. `os.Executable()` names a mutable path, not a stable loaded
image: a Windows install-hook fixture renamed it and later verification tried
the replacement. Stage the helper only for default installation, not preview or
`--no-install`; retain helper and policy together if cleanup is uncertain.
Loose development binaries may use a matching project worker; broken invoked packages fail explicitly.
Keep build/compiler workers project-resolved and authored engine ranges unchanged.

The release worker bundles only compatibility operations; YAML and JSONC remain
normal, small Node modules with licenses and a reviewed dependency closure.
Bun-bundling the JSONC UMD entry produced unresolved relative requires under Node;
exercise the generated artifact under Node, not just its TypeScript source.
Keep Unicode installation fixtures. Windows Node 24.13.1 recursive `cpSync`
returned success while omitting the requested Unicode destination in qualification;
fixture staging uses explicit manifest-file reads/writes and checks the real archive
separately, rather than removing Unicode coverage.
Keep a native binary plus its policy sidecar in experimental standalone archives.
This does not authorize changing production package entry points.

The plan includes every workspace package for native output leases, not only
packages with managed dependencies. Validate the complete file inventory before
mutation and require a freshly recomputed plan digest before canonical apply.
Reject omitted/null/empty response roots: canonicalizing an empty path resolves
to cwd and does not establish response identity.
Apply retains its own stale-preview checks and rollback; abrupt cancellation can
still interrupt several writes, so retain possible-partial-effect errors through
installation, verification and final output. The fixed Bun/pnpm install operation
uses Node's platform launcher for Windows command shims; Go still owns its entire
process tree and live stdout/stderr. Never interpolate project paths or arbitrary
arguments into that Windows shell. Refuse an aliased workspace `node_modules`
before installation. Re-resolve project workers after installation; an invoked
release policy uses its retained staged copy through verification.

For pnpm 11 fixtures, use `pnpm_config_*` environment settings, not
`npm_config_*`; the older prefix is ignored for registry/store selection. Keep
tool installation and state task-local, serve the source release's config package
from the private fixture registry, and assert its tarball was actually requested.
A successful install alone can otherwise conceal use of published assets.

Reuse `inspectDoctor` in `src/doctor-checks.ts` for diagnostic policy; command
presentation stays in `commands/doctor.ts`. Its explicit exit code is independent
of failed-row count: compatibility/declaration/Linux checks can fail the command,
while ordinary SDK observations remain warnings. Preserve repeated check names:
they can describe different physical copies of a singleton dependency. Keep
boolean presence explicit across Go/JSON handoffs so missing/null states cannot
silently become a failed or successful observation.

The common project worker receives macOS observations from the selected project's
`@octane-xplat/macos-build/doctor-worker`; it must not inspect absent host assets
relative to the curated CLI. The canonical platform helper is
`src/macos/doctor-checks.ts`. SDK inspection can materialize a project-local tool
cache, so the Go doctor holds the shared output lease through worker cleanup.
Required tool/platform observations are part of the report contract; reject
omitted rows instead of reporting an empty inventory as healthy.
Keep large one-shot reports and diagnostics cancellable through
`go/command_io.go`. A blocked downstream pipe must not retain the output lease
after cancellation. Give critical final error evidence a brief independent write
attempt when the root is cancelled, while retaining its failure exit. This helper
can leave a blocked writer until process exit; never reuse it in the persistent
host.
Do not embed `bytes.Buffer` in a bounded capture writer: its promoted `ReadFrom`
lets `io.Copy`/`os/exec` bypass an overridden `Write` and silently remove the cap.
Keep the buffer private and test through an actual subprocess pipe. Captured
worker diagnostics must disclose truncation independently of the result sidecar.

The curated worker compiles only the creator's canonical compatibility module
into `dist/compatibility-data`, with its JSON beside it. Keep those pins and
functions sourced from the creator; do not copy their policy into Go or require
creator templates at runtime. Route/parser/Vite dependencies stay lazy.

Keep build/clean/patch-application leases outside generated outputs and dependency caches. Use the
physical directory identity for the key: canonical path text alone can retain
case aliases on macOS, while Windows junctions need handle-based identity. Never
unlink a reusable kernel-lock file. Cleanup uses retained parent-directory handles,
validates metadata and every planned target before deletion, and reports partial
effects when later removal fails or cancellation arrives between trees. Keep this
foreground terminal flow out of a persistent host's event loop. See
[native cleanup](go/clean.go) and [output ownership](go/project_lock.go).

Patch inspection/application delegates to the canonical `patches.ts` helper in the
selected CLI worker. Keep YAML/JSONC selection and comments there; do not maintain
a second package-manager implementation in Go. Ship root `patches/` assets with
that worker. Load route/compiler engines only in their own operations, so patch
management needs only `yaml` and `jsonc-parser`. Go validates the workspace/manager
returned by inspection, preflights ordinary configuration/patch destinations, and
holds both workspace and selected-app leases during application. Those leases
coordinate native invocations, not arbitrary project code or direct engine runs.
Canonical application is sequential and can partially mutate before failure;
retain a typed uncertainty error even when cancellation races the result. Do not
claim atomic publication or an unchanged workspace on that path.

Cancellation fixtures must stop and await their owned process in `finally`, even
when an earlier assertion fails. A timer cleared on assertion failure can otherwise
leave the fixture engine alive and block the next qualification run.

Keep compiler parsing, JS configuration, loaders and route rendering in the
selected project's canonical worker. Native generation owns a complete validated
artifact plan, raw-byte stale checks, adjacent staging, publication and cleanup.
Validate every expected destination before writing any; include outputs omitted
by a type-only plan in stale checks. Preserve existing modes and unchanged mtimes.
Individual renames do not make a multi-file transaction: preserve partial-effect
and retained-staging evidence even when root cancellation races an I/O failure.

Canonicalize project identity before comparing output/source paths (macOS temp
aliases and Windows junctions otherwise disagree). Preserve authorized output
aliases while rejecting targets that overwrite inputs or escape the output scope.
Exclude generated files and their temporary siblings from watch fingerprints;
directory mtimes can invalidate a generation merely because it staged outputs.
One active watch worker must be cancelled and awaited before replacement. Recheck
inputs immediately before publication; a polling observation alone is insufficient.

Node's Windows `kill('SIGTERM')` forcibly terminates a process. It cannot qualify
graceful native console cancellation. Distinguish public console input from direct
context-cancellation fixtures, and verify child/job teardown separately. A JSON
`null` also decodes successfully into a Go integer's zero value; decode nullable
wire fields into pointers when zero and absence have different contracts.
Go test executables bypass production `main` functions. If an ownership fixture
relaunches `os.Executable()` for an internal child command, dispatch that command
from `TestMain` too; otherwise a Windows job gate can rerun the tests recursively.

Record signal identity before cancelling the root context when human exit codes
depend on it. Independent signal-notification channels can race on an idle
handler and turn SIGTERM's 143 into SIGINT's 130 even though cleanup succeeds.

Keep typecheck environment expansion in the canonical Node `tsconfig-envs`
helper, including JSONC, compiler file-pattern expansion and disposable cache
writes. Pass its ambient asset root explicitly: full CLI installs keep inert
declarations under `src/`, while curated workers carry them under `dist/`.
Do not silently omit required native/macOS declarations when switching layouts.
Keep native workspace globs simple; compiler configuration is a separate engine
contract. Resolve the installed checker's declared package bin and reject a
nearer broken install or escaping entry; package-manager auto-download/global
PATH fallback is not tool selection.

For human compiler output, inherit OS file handles through the existing process
owner. A Go forwarding goroutine can block on an unread downstream pipe and
prevent cleanup from returning. Keep captured workers bounded and separate from
live terminal streams; print final diagnostics only after group/job cleanup.
Qualify cancellation with both resistant descendants and an unread output pipe.

Formatting keeps discovery, Git ignores, project configuration and transforms in
`fmt-plan.ts` with the selected installed formatter. Native code validates every
returned target, raw source digest and mode before any write, then uses adjacent
staging and explicit partial-publication evidence. A directory input authorizes
that physical directory; a file input authorizes that physical file. Never let a
worker broaden those scopes or publish a partial successful plan after diagnostics.
The human formatter's stdin/stdout helpers are one-shot process readers/writers:
blocked I/O ends at the CLI's signal exit. Do not reuse those helpers in the
persistent host, which needs operation-owned I/O and joined teardown instead.

Lint delegates directly to the selected project's `@octane-xplat/lint` `./bin`
export. Forward raw argv, including `--`, and preserve engine exit status and
live stdout/stderr through the native process owner. Discovery, configuration,
companion TSRX rules and explicit `--fix` mutations belong to that engine; do not
add a second lint parser or apply native formatter publication rules to an engine
that already owns fixes. Native schema/help must respect the argument delimiter.

Build preflight validates every selected installed engine before baked-route or
compiler side effects. Invoke the selected project's Vite/NativeScript executable
with Node; do not use package-manager exec to supply absent/global tools. Keep
TTY detection at OS file boundaries, and bounded interactive reads limited to the
one-shot foreground CLI. Noninteractive selection uses all declared available
kinds in declaration order. A native command entry does not qualify every target;
keep pending integrations visible in its schema/help and track runtime evidence
separately. Quiet discovery probes must propagate root cancellation before
classifying a cancelled probe as a missing toolchain; preserve cleanup failure
evidence before that cancellation decision.

macOS package workers construct into an empty native-owned directory beneath the
release directory. Hold a stable kernel lock through worker cleanup/publication,
validate returned app/DMG paths and critical ordinary files, and keep recoverable
backups for both artifacts. Reserve backup names that cannot equal any valid
worker output name (for example, an executable named `previous`). A failed second
rename must restore both old outputs;
a failed rollback must retain staging and disclose recovery paths. Never delete a
staging name whose directory identity changed or whose worker cleanup is unknown.

Linux packaging reuses `linux/package.ts` with an explicit staging root,
`publish: false` and host asset root. Preserve ordinary reference calls' default
publication behavior. Full CLI assets live under `src/`; curated workers carry
the small GJS host beside emitted modules. Do not silently omit WebKitGTK host
assets or bundle system GJS/GTK libraries into the native executable. Native code
owns the complete app-directory/archive publication pair and launcher modes.
Annotate exported option shapes in transitional `@ts-nocheck` helpers: an optional
binding without a default may disappear from the inferred public call signature.

## Write Nim with explicit data semantics

- Distinguish an absent `JsonNode` reference (`nil`) from a JSON `null` node
  (`JNull`). Optional JS property access and nullish fallback do not translate
  to a nil check alone. Check the node kind before reading an object, array,
  string, or number, and preserve the reference contract's missing/null policy.
- Use `Option[T]` when a valid empty value must remain distinct from absence.
  For example, a parsed parameter can have `some("")`, while a static segment
  has `none(string)`. An empty-string sentinel would merge those results.
- `JsonNode` is a reference type: assignment shares mutable data. Return deep
  copies at snapshot boundaries, including nested build identities and cached
  async results, so caller mutation cannot alter private ownership/state records.
  Before copying a constructed JSON object, omit absent properties or insert
  `newJNull()` explicitly. A nested nil reference is not a JSON null and can
  crash the standard deep-copy path. Exercise errors with optional metadata
  absent; an ambiguity report must not take down a persistent owner.
- Sequence iteration can yield borrowed (`lent`) values. A closure comparator
  cannot safely capture such a loop variable. Use indexed iteration and copy
  the value into a local before creating the closure; preserve the compiler's
  borrow checks instead of disabling them.
- `for key, value in jsonNode` is object iteration: the key is a string.
  For an array with numeric positions, use `for i in 0..<node.len` and
  `let value = node[i]`. Do not assume a two-variable loop means array indices.
- Avoid naming a sequence-returning helper `keys` when `std/json` is imported.
  In a `for` expression, Nim can select the library's `keys(JsonNode)` iterator
  instead of the local procedure. Give semantic helpers distinct names such as
  `jsObjectKeys`; test null and primitive inputs as well as ordinary objects.
- Nim strings store bytes; decode raw input before treating it as UTF-8.
  Iterating `runes` does not validate an arbitrary byte buffer. Use `runes`
  for Unicode scalar values; JavaScript
  string lengths count UTF-16 code units. Choose deliberately when porting length
  limits or offsets; one non-BMP character counts as two JS code units.
- Number parsing and formatting are contracts, not mechanical substitutions.
  A validated integer can still be a `JFloat` node after argument parsing.
  `getInt()` silently returns its default for that storage kind. Accept validated
  numeric kinds, check finite/integer/range constraints, then convert explicitly;
  exercise public options as well as low-level probes supplied with `JInt` inputs.
  JavaScript `Number()` accepts empty/whitespace strings and unsigned base-prefixed
  integers. Port accepted syntax, finite/integer checks, bounds, and diagnostics
  explicitly. Nim floating-point parsing accepts separators such as `1_0` that
  JS `Number()` rejects. JSON serialization also needs deliberate handling of
  negative zero: `JSON.stringify(-0)` emits `0`. Nim
  `formatFloat(x, ffDecimal, 0)` can leave a trailing decimal dot;
  normalize it when the contract requires JS whole-number formatting. Keep
  differential tests for numeric edge cases rather than trusting matching types.
- Use shortest-roundtrip floating-point digits before applying JavaScript's
  decimal/scientific notation thresholds. Printing the exact binary value with
  fixed-point formatting can produce a different integer string. `std/json`
  also stores overflowing integer tokens as raw-number `JString` nodes;
  `getFloat()` on those nodes silently returns its default. Normalize numeric
  decoding at the JSON boundary and test integers beyond the safe-double range.
- JavaScript string coercion is separate from JSON serialization. Arrays coerce
  by joining their elements, with null elements empty; objects normally become
  `[object Object]`. Match the intended conversion before hashing identities or
  composing diagnostics instead of assuming `$jsonNode` has the same meaning.
- Choose JSON equality deliberately. Nim's object/array equality compares
  contents; JavaScript `===` compares their identities. Nim also stores integer
  and floating-point JSON nodes separately, while JS uses one Number type.
  Version binding and metadata validation need tests across those distinctions.
- Successful Nim JSON parsing does not establish strict `JSON.parse` or
  `jsonc-parser` equivalence. Test comments, trailing commas, malformed documents,
  scalar roots, and parse-error behavior for each file format separately.
- `std/json`'s `%` conversion turns non-finite floating-point values into strings
  such as `"inf"` and `"nan"`. When preserving numeric values until a wire-policy
  decision, construct `newJFloat(value)` explicitly; the JSON writer can then
  encode non-finite numbers as `null`. Do not rewrite literal strings with those
  spellings. Keep negative-zero handling at the same serialization boundary.

## Read installed dependency graphs without executing code

`compatibility_check.nim` inspects metadata against the creator's canonical
compatibility manifest. Preserve direct app pins separately from installed
versions: a matching declaration does not establish a matching runtime graph.
Keep the native CLI release suffix as a validated ASCII string, not a machine
integer: it needs identity comparison, and conversion would truncate large valid
identifiers. An exact same-framework `nim.N` CLI declaration selects its exact
installed-version expectation; it does not exempt other framework pins. Upgrade
preflight must validate the completed catalog plan so later apps cannot silently
replace an earlier app's preserved CLI choice.
Count singleton copies by canonical physical package root, using the installed
manifest identity so aliases count correctly. Use `OrderedTable` where Node Map
insertion order contributes to diagnostics, and a visited set to bound cycles.

Keep root dependency/dev/optional declarations separate from root consumer peers;
library peer ranges are app-owned. Traverse transitive dependency, optional and
peer edges, while carrying requiredness independently: an absent optional peer
must not create a missing-required-package warning. Private nested tool versions
are implementation details unless the package is a singleton. Receive Node's
builtin-name inventory as data; metadata in an on-disk package named `fs` must
not create a graph that Node would never resolve. Bound metadata and graph size,
and keep cancellation checks at each graph step. Never import dependency code
merely to discover its version.

## Compile-time data and module boundaries

Use `const metadata = staticRead("metadata.json")` for embedded generated data;
`staticRead` requires compile-time evaluation, rather than an ordinary runtime
argument expression. Generate metadata from the canonical descriptors instead of
maintaining another command-contract copy. Keep generated data out of Git.

An imported module's unconditional `staticRead` inputs are compile dependencies
even when its feature reports unsupported on the destination OS. Include those
small manifests in source snapshots and hash them independently from optional
runtime/model bodies. Compile the snapshot itself to verify its input closure.

Large `staticRead` strings can pass Nim and GCC/Clang while failing MSVC's
generated-C literal limit (`C2026`). Embed bounded compile-time chunks and join
them at runtime when the data exceeds that backend limit. Preserve the exact
bytes and verify the actual target compiler, then remeasure startup.

Nim's pinned Visual C++ configuration uses `vccexe.exe`, a wrapper that prepares
the Visual Studio environment. In an already configured developer shell, select
`cl.exe` for `vcc.exe`, `vcc.cpp.exe` and both linker keys in the task's compiler
arguments. Keep SDK setup process-local; do not edit the shared compiler config.
Forward `INCLUDE`, `LIB` and `LIBPATH` explicitly through Turbo's strict task
environment, and check the effective child environment before compiling. Finding
`cl.exe` on PATH does not establish that the C headers and libraries are visible.

Route planning and rendering share `src/route-generator.ts` between the reference
CLI and the selected project's build worker. The worker returns an artifact plan;
Nim validates its schema, complete expected destination set and unchanged inputs
before publishing. Keep this operation free of output publication and CLI command
imports. Propagate structured warnings on both success and failure. A matching
protocol version alone does not establish valid file destinations or completeness.

Inspect a macOS executable's `LC_BUILD_VERSION` as well as its linked libraries.
The compiler can default the deployment minimum to the current SDK/host even
when every linked library is part of macOS. A successful host build does not
establish support for older systems; pin deployment flags deliberately and
qualify the actual supported OS separately.

Nim source module basenames must be valid Nim identifiers. Use underscores,
not hyphens, in `.nim` filenames; output executable names may contain hyphens.
Use focused modules for parsing, discovery, process/HTTP boundaries and command
behavior so pure logic can be tested without starting project tools or sessions.
Export shared symbols explicitly with `*` and import their owning modules.
`include` shares the caller's scope and can hide dependencies on its locals;
prefer imported modules for reusable code rather than relying on include order.

`std/json.pretty()` accepts an indentation width, not an indentation character.
If matching a tab-indented file contract, convert only the generated line prefixes;
replacing spaces globally would corrupt string values. For UTC timestamps, convert
with `.utc` before formatting a trailing `Z`: formatting a zone marker alone does
not change the instant's timezone.
Nim integer division truncates toward zero. When formatting timestamps before the
Unix epoch, normalize seconds and a nonnegative millisecond remainder explicitly;
ordinary `div`/`mod` can otherwise print an invalid negative fractional component.

## Verify behavior across language boundaries

Compare results at their actual interface boundary. An internal JavaScript object
may contain an `undefined` property that JSON intentionally omits; comparing that
object directly with a transmitted native result produces a false mismatch.
Compare serialized wire results for protocol contracts, and compare artifacts or
raw bytes separately when those are the observable output.

Bound retained logs by encoded bytes as well as record count. Line limits alone
still permit large memory retention across many job captures. Use a deque for
front eviction, keep sequence numbers monotonic, disclose cursor gaps, and copy
records before returning them or invoking observers. Snapshot the callback list
before notification so reentrant registration cannot invalidate iteration.

Use a native rename primitive for publication that requires atomic moves.
Nim's high-level move helpers can fall back to copy-and-delete across filesystems;
the operation name alone does not promise an atomic rename. Keep same-filesystem
staging, explicit rollback and retained recovery files; qualify a real filesystem
failure, not only a mocked return.

A foreground output sink has lifecycle responsibility even if the log store
contains observer exceptions. Catch a sink's write/flush error explicitly and
cancel the owned operation. Silently swallowing a broken pipe can leave a build
running after its consumer disappears; qualify cleanup before fixture teardown.

Keep a Node/TypeScript differential oracle until each migrated behavior is
qualified. Compare structured results, errors, exit codes and stream ownership;
compilation or a successful happy path does not prove semantic parity. For pure
logic, a test-only native program reading NDJSON can exercise a large case corpus
in one process. Do not ship test-only entry points in the production binary.

Contain differential reference processes that invoke installed tools, too.
Successful synchronous Node version probes can leave descendants holding a
Windows working directory open; retries or unlinking fixture packages do not
establish cleanup. Use the test-only Go process probe for the Doctor reference
and assert its exit, capture and cancellation state before reading the report.

Publish an ownership future before starting async work that can notify observers.
Nim async procedures can execute synchronously until their first pending await;
assigning `owner.pending = startWork()` can allow a reentrant cleanup observer to
see no pending work. Install a placeholder future first, then complete/fail it
when the runner finishes. Cleanup must await that ownership future before reporting
released resources. A completed state snapshot alone does not prove cleanup.

Assert that positive fixtures actually reach the intended successful result.
Two implementations returning the same unavailable/default value do not qualify
the successful path that a fixture was meant to exercise.

External-tool JSON needs domain validation after parsing. Check object/array
kinds, availability booleans and nonempty string identities before reporting a
usable target. A JS template can silently turn a missing name into `undefined`;
reproducing that coercion would manufacture readiness. Keep valid real snapshots
in the differential corpus and explicitly test intentional stricter rejection.

For failure-path checks, catch only the operation being tested. Assert rejection
outside that catch so a successful operation cannot catch the test's own failure
and accidentally pass. Keep protocol/exit assertions independent of diagnostics.

Treat dependency semantics as independent of successful compilation. In particular,
NimYAML's JSON construction can overwrite duplicate keys that the reference YAML
reader rejects; validate the event stream when key uniqueness is part of the
input contract. With Nim variant (`case`) objects, inspect the active kind before
accessing branch-specific fields. When rewriting an event's kind, construct a new
variant value instead of changing the tag and then using fields from the old
branch; otherwise runtime field checks can raise `FieldDefect`.

A glob matcher and a filesystem walker have separate behavior:
explicitly choose hidden-entry, symlink, exclusion and literal-directory rules.
Compare path sets when the reference does not promise enumeration order.
Regex-backed globs may consume Unicode scalars while Node's matcher consumes
UTF-16 units. Qualify `?`, character classes and ranges with non-BMP names.
If adapting an engine through a character mapping, apply it to both input and
pattern and preserve ordering as well as uniqueness; an injective mapping alone
can still change a character range's membership.

Normalize comment-bearing JSON without repairing invalid syntax. Strip comments
only outside quoted strings and check that a trailing comma follows a complete
value; blindly deleting `,]` would turn invalid `[,]` into an accepted array.
Keep format-specific validation separate from strict project manifests.

Compiler pins and Nim dependencies are declared under `tools/cli-nim`. Keep
compiler downloads and caches task-local in ignored `research/nim-cli` storage.
Run repository builds/tests through Turbo and reserve `native_builds` before
expensive compilation. Qualify actual native targets; cross-compilation is build
evidence only. Run reports and operational status belong in local reports/Silo,
not in this guidance file.

`nim check` checks Nim semantics without compiling C or producing an executable.
Compiler-VM (`static`) checks can verify pure logic, but neither establishes
native runtime, FFI, process or platform behavior. Keep native execution gates.

## Async and child-process boundaries

C-imported constants can be runtime values in Nim's bindings. For example,
macOS POSIX errno values cannot be used as Nim compile-time `case` labels.
Use runtime comparisons when the binding is not a Nim `const`; do not replace
platform error constants with hardcoded numeric values.

Compile C function-table adapters against the complete pinned public-header
closure. A cached C object can hide missing transitive headers; verify a fresh
compile when changing header preparation. Version the include directory and hash
each header instead of hand-maintaining ABI offsets or trusting one top-level
header checksum. Keep build headers separate from optional runtime downloads.

Preserve synchronous and asynchronous spawn failure boundaries separately. The
Node reference returns a failed child for ENOENT/EACCES and several resource
errors, but throws immediately for errors such as ENOEXEC. Catching every OS
launch error into a successful handle changes the caller's error path.

An async procedure runs synchronously until an unfinished await. A small build
can therefore be ready before its returned future's cleanup callback runs;
track result state and pending ownership separately. Initialize the async
dispatcher before registering callbacks on already-completed futures, and test
both immediate completion and a build that yields to the event loop.

Publish a shared cleanup future before notifying observers or invoking cleanup.
Concurrent/reentrant end calls must await that completion; a terminal state alone
does not prove resources were released. Serialize reentrant notifications and
isolate observer exceptions from ownership cleanup. Dispose subscriptions when
their registry shuts down, and reject new resource bindings during shutdown.

Keep a job runner's completion and cancellation ownership until it settles.
Manual provider completion must not retire an active runner. Bound terminal
history separately from live work, including queued jobs cancelled before launch.
Use typed exceptions to carry structured errors across async boundaries;
`newException` does not initialize custom payload fields, so validate those fields
before accessing them and provide an ordinary execution-failure fallback.

Drain stdout and stderr concurrently when capturing a child. Reading one pipe
to EOF first can block forever when the other pipe fills. Bound retained output,
close unused stdin, and kill/reap the owned child on timeout or capture failure.
Direct-child cleanup does not establish process-tree cancellation.

For forced-escalation tests, install the child's termination resistance before
emitting readiness. A TERM-then-KILL cleanup can validly finish with TERM when
the child has its default handler; two immediate signals do not guarantee KILL
wins. Keep forced-exit and cooperative-exit fixtures distinct.

Treat detached daemon handoff separately from disposable tool children. An
invocation's ordinary process manager must not kill a successfully published
daemon on exit. Failed startup may terminate only the still-owned unpublished
child, never a PID merely read from a stale descriptor. Export read-only PID
accessors and track acquired ownership explicitly: a default-initialized Nim
resource object contains zeroes, which must not mean owned FD 0 or process group 0.

Keep host discovery and lifetime locks outside caches removed by dependency
installs or `clean`. A descriptor check followed by a signal is not an atomic
ownership decision: hold the publication lock across failed-startup checks and
termination, and preserve a child when publication ownership is ambiguous.
Remove only descriptor/socket paths whose device/inode still match the owned
object; replacing a path does not transfer ownership of its replacement.

Open candidate private files with `O_NONBLOCK` before checking `fstat` for a
regular file. Otherwise opening a FIFO can block before validation ever runs.
When importing both `posix` and `nativesockets`, qualify socket domain/type/protocol
constants so overload resolution receives the intended enum types, not ambiguous
POSIX constants.

Represent a successful empty command response separately from failure until the
caller applies its policy. A tool-presence check may reject empty output, while
another query accepts it. Cancellation is a separate error: never turn an aborted
query into a missing-tool diagnosis. Query the executable on the selected PATH
for its actual version; a version embedded by the reference runtime cannot prove
that a standalone executable can launch that tool. Probe the project's selected
package manager rather than requiring an unused one.

Keep asynchronous tool queries separate from synchronous data assembly. Pass
their observed freshness/availability into read services explicitly so composing
a report does not launch a second, unowned synchronous query. Native capability
reports must describe wired providers: importing contract IDs or compiling a
helper does not establish a usable command or runtime workflow.

Pipe chunks may split a UTF-8 sequence. When decorating a passthrough stream,
preserve raw bytes and track line starts separately for stdout and stderr;
decoding each chunk can replace part of a valid character. Keep bounded decoded
log records separate from the full terminal stream so truncating logs does not
silently discard compiler diagnostics.

Socket chunks also split UTF-8 sequences. For bounded RPC, use unbuffered reads,
assemble one byte-bounded frame, then decode/parse it. Do not require EOF to finish
a request/response exchange. Close and drain pending I/O during shutdown. Preserve
OS `DeviceId`/`FileId` types for path ownership checks; remove an owned socket path
only if its identity still matches, since another listener can replace its name.
Nim's `std/asyncnet` Unix-socket API is qualified on macOS and Linux for this
bounded protocol; reuse it before adding a separate socket engine. Keep transport
interoperability separate from authenticated owner and project-worker evidence.
For Windows, use the explicit `local_rpc` platform boundary. Keep SDK OVERLAPPED
records, events and pending buffers in C-owned memory. `CancelIoEx` requests
cancellation; it does not release that memory. Poll terminal completion before
closing handles/freeing buffers, and share one release future across repeated
close calls. Reinitialize an OVERLAPPED record only after its prior I/O completes.
A timed-out Nim future alone cannot establish kernel cleanup.

A completed pipe write can still be buffered. Let ordinary clients consume the
reply and disconnect with a bounded asynchronous drain; blocking
`FlushFileBuffers` lets an unresponsive client freeze the host. Bound rejection
work as well as admitted peers. Check private endpoint owner/DACLs on the same
connected handle before sending credentials; checking, closing and reopening
introduces a replacement race. Generic Node interoperability is separate from
private-owner authentication. Qualify stalled writes and shutdown after observed
reply bytes, in addition to idle reads and repeated handle counts.

Reuse platform spawn options for detached host launch as well as managed children:
explicit stdio inheritance must not leak the launcher's lifetime-lock descriptor.

Keep process exit and pipe closure separate. Descendants can retain a pipe after
the group leader exits, or close their pipes and keep running. Retain ownership
of the isolated process group until cleanup completes; checking only the
leader's exit status can skip required signal escalation. A POSIX wait status
also distinguishes an ordinary exit code of 143 from termination by SIGTERM.
Keep the leader's PID reserved while inherited pipes remain open so delayed
group cleanup cannot target a subsequently reused PID.

Windows child-tree ownership needs a private job handle, not a PID walk. Set
`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, keep that handle non-inheritable, and pass
`PROC_THREAD_ATTRIBUTE_JOB_LIST` during `CreateProcessW`; assigning after creation
leaves a supervisor-death gap, even if the child was suspended. Explicitly list
inherited stdio handles with `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`. Retain the
process/job handles until leader exit, job `ActiveProcesses == 0` and both pipe
EOFs. A successful termination request alone is not completed cleanup.

A persistent Windows owner has a different lifetime from an engine job. Detaching
its console does not escape a kill-on-close SSH job. Query the invoking job's
policy, require explicit permitted breakaway, and assign the new private owner job
at creation. Transfer exactly one inherited job keeper to the owner, verify its
membership/limits and clear inheritance before any project work; remove the
reserved bootstrap environment value too. Retain that keeper until owner exit.
This exception belongs only to the explicit owner handoff: engine jobs retain
non-inheritable handles and cannot break away. Do not suspend this root launch;
parent death before resume would leave a suspended child holding its own keeper.
Release the invoking client's process/job handles after publication without
terminating the transferred owner. Before publication, cancellation must await
both leader exit and zero active job members. Qualify survival across separate
SSH connections and longer-lived descendants on owner exit.

Windows environment blocks include hidden drive-current-directory entries such
as `=C:=C:\project`. Nim 2.2.12's `envPairs` splits at the first equals sign,
yielding an empty key and `C:=C:\project` as the value. Reconstruct the documented
`=C:` key at the inherited-environment boundary, preserve each drive separately,
and use case-insensitive names. Explicit ordinary environment overlays still
reject empty/equals-containing names. Node's environment object can hide these
entries, so qualify normal PowerShell/cmd launches as well as Node test parents.

Keep required OS variables when qualifying an explicit child environment. On the
qualified Windows host, importing Nim's async dispatcher without `SystemRoot`
fails during Winsock initialization before the program's exception handler runs,
with a misleading “not a socket” error. An empty `PATH` still proves runtime
independence; an invalid OS environment does not. Preserve the caller's normal
OS environment for production owners and supply `SystemRoot` explicitly in
minimal native fixtures rather than silently adding variables in the launcher.

Calling `CreateProcessW` directly does not guarantee shell-free execution:
Windows can dispatch `.cmd`/`.bat` files through `cmd.exe`; see
[the MSRC explanation](https://www.microsoft.com/en-us/msrc/blog/2014/04/ms14-019-fixing-a-binary-hijacking-via-cmd-or-bat-file).
Reject their normalized
names explicitly and require a real Windows executable image with `GetBinaryTypeW`
before launch. Test ordinary, case-varied and trailing-dot/space aliases against
an observable script marker; do not infer safety from literal argv alone.
Windows job termination is immediate; do not describe it as cooperative POSIX
SIGTERM or promise a grace period. Keep console callbacks in C with an atomic
flag; perform Nim allocation, logging and cancellation on the event loop.

POSIX spawn extensions differ by host. Keep macOS close-by-default flags and
Linux close-from file actions in separate platform modules; run the close-from
action after explicit stdio duplication. The current GNU adapter requires glibc
2.34 or newer. Test unrelated inheritable descriptors, not just normal pipes.
For Linux group observation, parse `/proc/<pid>/stat` after the last closing
parenthesis: a process name can contain spaces, parentheses and newlines.
Count zombies until the OS reaps them. A native completion assertion should
check that the kernel identity is gone, rather than accepting a zombie as stopped.

Require a valid executable or explicit shebang at the native launch boundary.
Node on Linux can execute no-shebang text through a shell while Node on macOS
rejects it. Keep the native `ENOEXEC` rejection explicit and tested instead of
silently selecting an interpreter to reproduce that platform-specific fallback.

Sending SIGKILL is not confirmation that every group member has exited or been
reaped. On macOS, observe leader exit with `waitid(..., WNOWAIT)` and keep its PID
reserved while checking the group's remaining members through the SDK API. Only
reap the leader and complete cleanup after the group has no other members. Avoid
another group signal after releasing that identity. A small C shim keeps SDK
struct layouts out of Nim; resolve its header from `currentSourcePath().parentDir`
so probes with another main-module directory can compile it too.

Nim 2.2.12 `quit(int)` clamps to -128..127 before calling C `exit`. Use the
`process_exit.exitProcess` helper when forwarding native exit statuses, including
128+signal values. Calling C `exit` still runs registered `atexit` cleanup;
`_exit` skips it. Verify actual parent exit status, not just a returned integer.

For concurrent launches, prefer child-only spawn actions for cwd and explicit
descriptor inheritance. A standard-library helper can briefly change the
parent's cwd internally. Audit pinned POSIX bindings as well: similarly named
constants may alias a fallback with weaker behavior. Keep signal handlers to a
volatile flag update; perform async cancellation and logging on the event loop.

Do not assume `startProcess(env=..., options={poUsePath})` searches the child's
PATH. On macOS the launcher can search the parent's PATH while passing the
supplied environment to the child. For an explicit PATH contract, resolve the
executable against that PATH and the child cwd first, then launch without PATH
search. Test with a named executable that exists only in the overridden PATH.

## Filesystem and byte boundaries

Nim's `parentDir` returns an empty string at an absolute filesystem root.
For ancestor walks, use a helper that returns the root itself there, then stop
when parent equals current. Joining an empty parent with `node_modules` or a
config filename would silently search the process working directory.

`absolutePath` and `normalizedPath` provide lexical paths; they do not establish
symlink containment. Use `expandFilename` for the canonical existing target and
handle its failure. Scope-sensitive reads must check both the requested name
and the canonical target: an allowed alias can point at a private file or outside
the corpus, while an alias to the corpus root must support ordinary safe reads.
Keep lexical keys for references and canonical paths for containment checks.

Keep semantic paths separate from OS byte paths. JSON can preserve an unpaired
UTF-16 unit, while Node filesystem calls encode that unit as a replacement
character. Apply `utf8ForWrite` at the filesystem boundary and retain the
original semantic path in generated JSON. Reject embedded NUL before passing a
path to a C string API; truncation must not make an invalid path resolve to an
existing file.

Temporary-file permissions survive an atomic rename. Nim's `createTempFile`
uses private permissions; that is suitable for caches, but can change ordinary
generated files to `0600`. When matching Node's `open(..., 'wx')`, create the
temporary file exclusively with mode `0666` so the OS applies the caller's umask.
Do not chmod to `0666` afterward or query umask by briefly changing process state.
Handle partial writes, close the descriptor, and clean up only a file you created.

Do not infer directory privacy from `createTempFile`: Nim 2.2.12's
`createTempDir` follows the caller's umask and creates `0755` under `0022`.
For private operation/request directories, use the native `mkdtemp` boundary
with the chosen parent/prefix; it creates `0700` atomically. Linux uses
`std/posix_utils.mkdtemp`. The macOS adapter names `<unistd.h>` because the pinned
stdlib binding names `<stdlib.h>` and fails C compilation with SDK 27.0; see the
[toolchain constraint](../../.agents/docs/toolchain.md#cli-runtime-and-executable-packaging).
Keep a mutable Nim string alive while C changes its suffix. Verify the active
worker directory's permissions, and await process cleanup before removing it.
Windows uses `private_windows.nim` and its SDK adapter for local NTFS storage.
Create private directories/files with an explicit current-user owner and protected
user-only DACL; never infer privacy from POSIX mode bits or silently repair an
existing broad/foreign ACL. Reject reparse ancestors, nonregular files and
hardlinks. Hold ancestor handles without delete sharing during path operations;
a lifetime lock retains them plus its exact locked file until release. Keep
handle-based deletion bound to the recorded volume/file identity. The shared
stamp uses NTFS's 64-bit index; ReFS, UNC/device paths and junction-based cache
roots need separate adapters/qualification.
Preserve `C:\` when extracting a root parent: bare `C:` has different Windows
semantics. Validate/pin the volume before creating missing directories, since a
drive letter can map to a network share. Reserved device aliases include
superscript-digit COM/LPT names and CONIN$/CONOUT$; reject them before opening a
handle, rather than relying only on a later regular-file check.

An inherited private DACL does not establish a newly created file's owner.
Windows uses the creator token's default owner, which can be a group rather than
its user. Precreate worker sidecars natively with explicit ownership and have the
project writer update them in place; revalidate the result. The canonical build
worker uses `writeFileSync`, which preserves an existing file's owner/DACL.
Do not broaden owner acceptance to hide this mismatch, and verify an actual
installed worker separately from the storage primitive.

Allocate operation directories exclusively; ensuring an existing directory is
private does not establish that this operation owns it. Treat name collisions as
retryable allocation failures and preserve their contents. On Windows, precreate
both request and response sidecars with the native owner/DACL, read results through
the bounded private-file adapter, and await the worker job before removing its
directory. An untouched empty response placeholder means no result was written.

Installed executable discovery must account for package-manager shim formats.
Bun 1.4.4 on Windows publishes `vite.exe` plus `vite.bunx`, without a bare `vite`
file. Preserve actual installed-package checks and the process engine's separate
batch-file refusal; recognizing a shim is not permission to invoke an implicit shell.

Windows legacy `FileRenameInfo` replacement can fail while a reader holds the
old target. The NTFS adapter uses `FileRenameInfoEx` with replacement/POSIX flags:
old handles keep their bytes and new opens see the replacement. Qualify both held
readers and concurrent reads, and require active lifetime locks to resist native
publication too. A passing ordinary rename case does not establish these rules.

Hash explicit UTF-8 bytes with a pinned implementation and compare lowercase
hex digests against independent vectors. Do not add a runtime crypto-library
dependency just to calculate local content fingerprints. For filesystem time
contracts expressed in milliseconds, combine whole seconds and nanoseconds
deliberately; dropping fractional milliseconds can silently change cache keys.

When serialized JSON feeds a fingerprint, compare encoded bytes as well as
parsed values. Equivalent escapes such as `\u001B` and `\u001b` have different
hashes. Preserve literal backslash sequences when normalizing actual JSON escapes.

JS object enumeration places canonical array-index keys before other keys,
even when those properties were added later by a spread. Nim's ordered JSON
objects preserve insertion order instead. Match this ordering recursively when
generated bytes must equal `JSON.stringify`, and use UTF-16 code-unit ordering
for JS's default string sort. Locale sorting and byte sorting serve different
contracts. Glob traversal also needs a deliberate order when it feeds ordered
diagnostics rather than a set of filenames.

JavaScript string slicing may split a UTF-16 surrogate pair. A continuation
contract based on JS offsets must preserve that code unit, rather than silently
rounding to a Unicode scalar boundary. Escape lone surrogates in JSON output;
replace them when writing a human UTF-8 stream. Keep this internal representation
separate from decoding malformed UTF-8 bytes received from a file or process.

JS substring queries can also match one UTF-16 unit inside a valid non-BMP
character. A byte search for a lone surrogate's WTF-8 encoding will miss that
match. Keep a UTF-16 comparison path for semantic strings containing those units.

Apply that JSON policy to persisted files as well as stdout. Plain `pretty()`
does not make a WTF-8 string valid UTF-8. JSON escaping preserves lone code units;
encoding a semantic JS string for a hash or byte stream replaces them. Choose
the boundary deliberately instead of using one conversion for both.

Canonicalize equivalent UTF-16 spellings before `std/json` constructs object
keys. A JSON string can mix escaped and raw surrogate units. Repairing keys in
a post-parse walk can lose the last-write order of duplicate properties after
the constructor has already overwritten earlier entries.

Unicode case folding, per-rune lowercasing and full string lowercasing are
different operations. Full mappings can expand a character (`İ` becomes two
code points), and Greek sigma depends on surrounding cased/ignorable characters.
Use the pinned Unicode database and explicit context rules when matching JS;
ASCII lowering or an unconditional rune map silently changes search results.

Port each text loop according to its source operation. One dependency can mix
scalar iteration (`for...of`) and indexed UTF-16 units in the same algorithm.
Replacing every loop with Nim `runes` can change behavior even when the port
looks more Unicode-aware. Qualify the dependency's actual encoding path; settings
present in a model JSON file may be ignored by that implementation.

Locale ordering is also a contract: `localeCompare` is not a byte comparator.
Keep its native adapter at a platform boundary and test the actual engine and
locale used. When passing text through an FFI, use explicit code-unit lengths
where the API supports them; a C string alone truncates embedded NUL characters.
Successful regex compilation likewise does not establish JavaScript regex
semantics. Spell out required whitespace, word and line-boundary rules rather
than assuming similarly named flags and classes behave identically.

At an FFI boundary, preserve the source API's types rather than inferring them
from `JsonNode` storage: `node:sqlite` binds JS Numbers as doubles even when the
value is integral. Copy borrowed C result bytes before stepping/resetting a
statement, and finalize statements before unloading their connection's library.
Query the linked engine's version API when qualifying compatibility; process or
package version metadata may describe a different build.

Keep shared C singleton pointers separate from owned allocations. For example,
ICU's `unorm2_getNFDInstance` returns a borrowed singleton: retain the library,
but do not call a destructor for that instance. A size-only normalization call
returns the required UTF-16 capacity with `U_BUFFER_OVERFLOW_ERROR`; reset the
error before the real call and check its returned length. Use explicit close
operations and reject use after close, including empty-input fast paths.

For large C function tables, compile a small C shim against the pinned public
header instead of maintaining table offsets in Nim. Keep the dynamically loaded
library alive until every session and borrowed output is released. A synchronous
FFI call may borrow Nim input buffers for its duration; do not let the foreign
library retain them beyond their owner. Preserve model Float32 values before
pooling them into Nim `float`/JS Number accumulators.

Matching model bytes and runtime version numbers do not establish cross-engine
inference parity. Native CPU graph optimizations can change quantized outputs
and search order. Keep inference in Nim and include engine/settings in cache
identities. Evaluate useful retrieval quality; exact native/WASM ranking equality
is not required. Normalization and plausible vectors alone are insufficient.
Validate every pinned asset required by the reference, including metadata that
the native computation does not directly consume.

## Go implementation boundaries

Go app-control clients attach by default to an explicitly started foreground
`dev` server. Humans or instructed agents can start it; observations never
implicitly start servers/apps/browsers or terminate human-owned apps. A client
finishing or disconnecting leaves app lifetime unchanged. Do not reintroduce
agent-owned detached session launch/end or a needless detach-management command.
The retained Nim/TypeScript lifecycle guidance describes those older references.

Key discovery by canonical app directory: symlink/junction aliases converge,
separate worktrees stay separate, and ambiguous workspaces require app selection.
Keep current-user-only discovery outside the app, with fresh per-start instance
and token. Authenticate short HTTP requests, verify app and instance, disable
redirects/proxies and reject browser-origin ordinary RPC. Missing/dead/stale
records report disconnected; read lookup must create no folders or engines.
Hold the stable lifetime claim through foreground engine and request cleanup.
Engine readiness and registered app-debug connections are separate observations;
never infer an initialized app from a Vite URL or native host spawn. App-debug
credentials must be scoped separately from the CLI discovery token, and cannot
authorize ordinary RPC or another target. Send app proof in a bounded first frame,
not a URL. Accept browser Origin only for a target's explicitly observed dev
origin; ordinary RPC continues rejecting Origin. Bound unauthenticated sockets,
registries and disconnected observations. Server shutdown must close and join
hijacked WebSockets too: HTTP Server.Close alone does not own them.

Reuse the real app action registry and its validation/execution policy across
transports. The explicit Go plugin selects sockets; retained TypeScript/Nim builds
keep their existing HTTP channel. A missing WebSocket runtime must report degraded
instead of silently falling back. Production builds must not receive the native
bridge definition. Preserve declaration revision on ordered updates, and allow
same-revision availability updates. Replace reconnecting peers by connection
identity so an old reader cannot disconnect its successor. Short CLI clients
create no persistent observer ownership. Heartbeat tests must assert stable
connection time, not merely a final ready state that could hide reconnect loops.
Direct same-host socket evidence does not qualify device relays or browser apps.

Keep action field semantics and policy extraction in the canonical selected-project
worker; do not reinterpret JS regex, defaults, truthiness or UTF-16 lengths in Go.
An omitted result contract is not an unchecked result: returning undeclared
fields fails after effects may already have run. Positive fixtures must declare
those fields, beside deliberate invalid-result controls. Require explicit boolean
policy fields at the worker boundary; JSON null must not become a false/default
external-effect decision.

Use the native job lifecycle through a foreground admission interface, never a
new detached owner. An accepted request outlives its HTTP client. Preserve
provider-confirmed cancellation separately from operation outcome unknown and
native process cleanup unknown. Unknown effects do not grant authority to stop an
app, and must not become a success or be silently retried. A delivery/write error
can be ambiguous. Retain request-key identity after completion/unknown; reject
changed bindings and expired retained results rather than rerunning. Document
startup/retention limits instead of promising durable exactly-once effects.

Recheck connection, revision and declaration after asynchronous Node validation.
Do not deliver work before the app registration acknowledgement is written.
Worker validation deadlines, HTTP response budgets and process cleanup budgets
must fit together. Join background operations and hijacked sockets on foreground
shutdown; unconfirmed worker cleanup blocks replacement work and retains private
operation data. Keep app stack provenance explicit: `runtime-raw` means no Vite
mapping was retained; `vite-current` means at least one frame was resolved against
the current served module map, not necessarily the code revision at failure time.
Keep raw stacks alongside source stacks. Reuse the shared Node/Vite resolver,
never implement a second source-map engine in Go. Native requests may inspect
cached served maps only, not transform caller-selected paths. Only observed
loopback engine origins receive the target-scoped app credential; reject redirects,
proxies, stale startup/target responses and browser origins. Resolution has a
separate bounded budget and cannot replace a confirmed failure, partial effects
or shutdown facts. App-supplied `sourceStack` is not mapping evidence. Unsupported
file/device frames remain raw until their actual runtime adapter is qualified.

Retained engine captures and observed app sessions have separate IDs and owners.
Diagnostics must reuse the capture writer's cache-parent function and bounded
history reader. Lookup must not create missing directories. Only an authenticated
foreground-server response establishes a current owner; a stored PID or session
state cannot establish liveness or cleanup. Offline reads preserve evidence while
marking unfinished captures historical/disconnected. Keep filtered cursor behavior,
rotation errors and incomplete tails visible; never convert malformed evidence to
an empty successful page. Reuse the canonical browser logger in the Go development Vite plugin, with the
same batch validator used by the retained bridge. Preserve console behavior and
omit object values. Bound pending HTTP bodies, deadlines, batch rate and stderr
backpressure; do not let browser logging retain an unbounded output queue. Test
exact stream bytes rather than Node write-chunk boundaries. Browser observations
are scoped to the returned log page and do not prove complete console coverage.
Engine/browser output does not substitute for OS crash-report discovery.

Native report association needs platform, capture window and app identity;
confirmed Apple evidence additionally needs observed PID and launch time. Keep
candidate matches visibly weaker. Distinguish null/missing fields from explicit
empty fields and integral JSON number spellings from integer-decoder syntax;
compare external report fixtures against the actual Node reference. Bound source
reads without following report-file symlinks and preserve complete originals with
content hashes, atomic publication and a bounded native lock. Keep raw-content
limits separate from base64/JSON encoding overhead. Full original reads use the
local native reader, not the smaller HTTP response budget. Discovery failures
must not hide engine logs. Test macOS crashes with the actual host's `abort()`;
`appkit-node-api` naming does not grant Node `process` APIs in JavaScriptCore.
An inner SIGABRT may be reported by the worker as exit 1 plus signal diagnostics;
assert both levels rather than assuming outer shell status 134.

NativeScript sync identity must match the exact SDK line format and the capture's
selected device; ignore prefixed console lookalikes and
truncated/foreign-device lines, never invent a PID/readiness, and reject package
identity changes inside one capture. Android exit history remains package/device
candidate evidence, using the device's current timezone. Keep command argv fixed,
validate selectors, bound shared deadlines and preserve original CRLF/indentation
when hashing records. Never fetch trace paths or tombstones. Propagate unknown
child cleanup and prevent another source command after it; readable log evidence
must remain available. Data-format adapters execute on desktop hosts: name shared
Android code `android_reports.go`, because `*_android.go` is an implicit Go OS
build constraint. Owned emulator qualification is distinct from parser/reference
tests; never claim it passed if the emulator could not boot.

Keep workspace matching simple and native: literal paths, a single `*` within
one path segment, and leading `!` exclusions. Reject advanced patterns with an
actionable configuration error rather than maintaining another glob engine or
launching Node merely to interpret workspace metadata. Do not expand this grammar
for incidental parity with the TypeScript reference. Project compiler/plugin
execution still belongs in explicit Node workers.

Decode dependency objects in declaration order when producing ordered diagnostics.
Installed versions take precedence over provisional lockfile versions. Preserve
the importer path and package owner, including scoped Bun importer keys and pnpm
nullish fallbacks; parsing YAML successfully does not establish that versions or
conflict warnings were retained. Compare serialized output with the reference:
an omitted optional JSON field differs from an explicit null, while a JavaScript
property containing `undefined` disappears during serialization.

Share installed-package discovery between source and documentation services.
Classify `file:` dependencies by their actual directory type before treating an
archive suffix as a tarball; directory names can end in `.tgz`, and absolute
paths must resolve independently of the app root. Documentation identity uses
actual manifests before provisional lockfile data and retains every conflict.
Tailored guidance must describe the current native providers rather than copy
claims from a more complete reference implementation. Identity and guidance
reads do not prepare snapshots, models or mutable documentation caches.

Probe prerequisites on the native process's actual PATH. A standalone executable
cannot inherit the Node reference's assumption that Node is already running. A
declared pnpm project must not require Bun merely because the CLI also supports
Bun. Clear Node injection variables for bounded diagnostic workers and keep
unavailable, timed-out and satisfied observations distinct from build readiness.

Keep source retrieval bounded at every stage: file bytes, corpus traversal,
retained exact hits, index bytes/files/chunks and result length. Keeping full
source strings in every matching hit defeats a bounded output limit; retain only
the best requested excerpts plus hashes and revalidate before serving. Inspect
the opened descriptor's regular-file type and size. Unix source opens use
nonblocking mode so a raced-in FIFO cannot block before that check.

Check source exclusions against both the requested path and canonical target,
and use an `os.Root` handle for the actual bounded read. A harmless alias inside
a corpus can work, while an alias to private data or another workspace must fail.
Recheck file identity, size, mtime and alias target around the read. This does not
make a user-owned checkout an adversarial filesystem sandbox or rule out hardlink
aliases; keep that claim separate from ordinary scope enforcement.

Source continuation offsets count UTF-16 units in the existing JSON contract.
Go rune and byte offsets differ. A page can split a surrogate pair; encode that
unit as a JSON escape rather than replacing it and losing source on continuation.
Treat human excerpts separately. Retrieval rank and Unicode tokenization may
differ while results remain useful; do not port a JS runtime merely for those
incidental ordering differences. Native code intent search uses a bounded local
TF-IDF snapshot; docs model inference remains a separate native ONNX boundary.

Native document reads use an explicit Markdown corpus allow-list, not every `.md`
file under a checkout. Keep guide, recipe, design/implementation-note, readme and
changelog labels distinct, including canonical targets of aliases. Skip directory
cycles, reject external/private targets, and fail explicitly when traversal or
inventory limits are exceeded. Fenced examples must not create headings or reset
release ownership in changelog chunks. Share the bounded opened-file reader and
UTF-16 continuation handling with code retrieval while keeping each corpus policy
separate.

Mutable native caches need a separate namespace and a stable lock-file identity.
Use kernel locks (`flock` on Unix, `LockFileEx` on Windows) that release on process
death instead of trusting PID files. Honor cancellation while waiting and never
rename/delete the lock file during publication. The Go cache root checks Unix
ownership/private modes or a Windows current-user owner and protected user-only
DACL; reject a broad or foreign existing namespace instead of repairing it.
Windows directory ACEs must inherit to files and subdirectories (`OICI`): a
private root alone does not establish private contents. Qualify nested default
file creation as well as explicit sidecars. Create lock identities exclusively
before opening an existing file; simultaneous initial `O_CREATE` opens produced
`ENOENT` on the qualified macOS filesystem. Keep first-use concurrency coverage.
Cross-compiled Go test executables can exercise these OS contracts on a host
without installing a compiler there. Record compilation and actual host execution
separately; a passing primitive suite is not a public workflow qualification.

Release docs snapshots extract allow-listed ordinary Git blobs without a
checkout, so fetched hooks, content filters, submodules and package scripts do
not run. Clear Git config injection and prompt variables, and keep repository
protocols explicit. Pin the actual commit and validate the requested package's
manifest before atomic publication. Cache identity includes repository,
package and version; per-binding files and locks avoid shared-map lost updates.
Verify raw-byte hashes, the complete file inventory and manifest on reuse,
including offline reads. Moved or deleted tags require explicit resolution;
corrupt cache data must not become a verified offline snapshot or latest docs.
On Windows, give Git process-local `core.longpaths=true`: Go can handle a cache
directory while Git rejects its longer object filenames. A `remote-unavailable`
result does not establish a network failure; preserve an initial bound assertion
before mutating a fixture's cache and retain direct Git diagnostics locally.

Native compute sidecars use a versioned request identity. Allocate their private
operation root on the destination cache filesystem before starting the owned
same-executable child. Git children inherit that group/job. Await cleanup before
removing operation data, and retain it when cleanup cannot be confirmed. This
boundary is separate from registering public docs commands or qualifying the
persistent host's index/inference lifecycle.

Prepare optional model/runtime assets only for explicit indexing. Stream bounded
downloads through exact byte/hash checks, extract only named ordinary library and
license members, and publish verified manifests last. Search may verify existing
assets but must not fetch or repair them implicitly. Reuse one native session per
owned compute child; include model/runtime, inference settings and tokenizer
dependencies in vector cache identities. Validate dimension, finiteness, norm and
raw vector checksum on reuse. Completed batches remain reusable after cancellation;
corrupt vectors require explicit preparation. Re-inventory current documents
before retrieval so cached embeddings cannot preserve deleted content. Keep native
and WASM relevance checks useful without requiring identical rankings.
Large fenced examples are valid documentation. Keep complete bounded sections for
lexical retrieval and reads, while limiting model previews independently of corpus
coverage. Report truncated previews and include that policy in cache identity;
one long section must not prevent preparing an otherwise valid real inventory.

On Windows, `filepath.EvalSymlinks` deliberately leaves junctions unresolved in
current Go. Resolve package/scope identity through an opened handle's final path;
otherwise workspace junctions can appear to belong to `node_modules` and lose
their checkout docs. See the [toolchain constraint](../../.agents/docs/toolchain.md#go-windows-junction-identity)
before changing this adapter. Qualify linked-package discovery and external-docs
junction rejection on Windows, including paths containing spaces and Unicode.

Keep project Markdown instructions separate from framework release results and
apply canonical scope checks to both. Explicit comparisons for an uninstalled
package are outside the installed binding even when a synthetic package record
has the same requested version. Preserve `XPLAT_DOCS_REPO` for explicit offline
mirrors/fixtures. Status reports provider readiness without acquiring snapshots.

Bound Markdown chunk production before allocating result maps, including the
total chunk count across pages. Reuse one current inventory for shared checkouts
without retaining every release's full inventory in a multi-package request.
Clone bounded Go substring excerpts so a small hit does not retain a large source
buffer. Human excerpt boundaries may differ; version provenance, scope and UTF-16
page continuation remain meaningful contracts to compare independently.

Use descriptor metadata generated from the TypeScript source for parsing and
schemas. Execution coverage belongs to the Go handler registration, not the
reference descriptor's status. Keep permission checks, selection precedence and
exit groups explicit; a sole discovered app need not create the same persistent
binding or envelope identity as an explicit selection.

For writes scoped to a workspace, prefer `os.Root` directory handles to a
canonical-path check followed by an ordinary path write. Root confinement is not
an ownership/privacy guarantee and does not exclude Unix bind mounts or device
files. Private host/request storage still needs its explicit mode or Windows
owner/DACL adapter. Do not reuse cache-metadata publication for source files
without preserving source modes and stale-input checks.

Go context cancellation alone does not own a descendant tree. Retain the native
process-group/Windows-job manager, and on Windows assign the gate before project
code can run. Keep operation results separate from diagnostics and await cleanup
before removing their private directory. The `probe` entry is compile-time
separate from the public CLI; keep its protocol out of the published surface.

Do not call `Cmd.Wait` before Unix group cleanup: reaping releases the leader's
PID/group reservation. Linux observes exit with `Waitid`/`WNOWAIT`; Darwin uses
the typed x/sys process record and SIGCHLD notification to observe zombie state.
Keep the leader unreaped through group signals and disappearance checks for all
other members, then call `Cmd.Wait` once to collect exit and streams. Windows
retains a job handle and can reap the leader before checking that job's members.
These adapters keep core builds free of C dependencies. Process groups cover
ordinary inherited descendants, not an adversarial daemonization sandbox.
If cleanup cannot be confirmed, preserve private worker data and fail the job;
do not erase its directory or label the outcome a successful cancellation.
Preserve typed error causes through CLI envelopes too: a root cancellation must
not overwrite an unconfirmed-cleanup failure or its retained-data diagnostics.
Distinguish operation deadlines from generic execution failures even when the
outer CLI context remains live.


Keep platform scaffolding policy in the installed creator, shared with the
TypeScript reference. A small Node worker returns a read-only, versioned plan;
Go validates workspace identity, raw-byte observations and bounded base64 output,
then publishes with directory-root handles under workspace/app leases. Preserve
new template modes and existing config modes. A valid-plan positive control is
necessary beside malformed-plan tests: a broken synthetic worker can otherwise
make every rejection appear to pass.

Do not describe per-file atomic publication as a whole-workspace transaction.
Cancellation or installation failure can leave completed files and incomplete
new directories. Preserve user-owned target directories and disclose manual
inspection before retrying rather than deleting or overwriting them as recovery.

At the Node/Go Windows boundary, normalize directory modes explicitly: libuv
reports ordinary directory permissions as `0666`/`0444`, while Go synthesizes
execute bits (`0777`/`0555`). Compare the equivalent representation without
skipping input-mode checks. Neither value describes Windows ACL privacy; keep
owner/DACL validation separate. Include actual Windows platform-addition tests,
since web-only additions may never observe an existing parent directory.


For `updates init`, share the canonical hook string at build time rather than
maintaining a second generated template in Go. Delegate Node conditional-export
resolution to the selected project worker without importing the optional runtime.
Reject a nearer broken package instead of resolving from farther/global installs.
Keep simple hook/ignore publication native, preserve raw user bytes and modes,
and validate both outputs before writing. Hook initialization is not evidence of
NativeScript preparation, app boot, or delivered OTA updates.


Keep font parsing/conversion and CSS registration policy in the canonical Node
engine. Both frontends use its read-only plan; Go validates explicit app/source
identity, bounded base64 artifacts and raw-byte before-images before publishing.
Keep converter and Fontsource staging beneath the private request lifetime, and
await group/job cleanup before removing it. WOFF2 is an optional project codec,
not an executable payload. Replace existing font binaries only when the before-image manifest registers
them; validate this ownership independently of the proposed new manifest. Refresh
all referring token names and managed CSS together. Preserve conflicting
unregistered files and unchanged custom CSS. Reject malformed saved registration JSON; resetting it silently discards user state. Fontsource
installation has separate dependency side effects before publication, which must
remain visible on failure. Package specs passed to a Windows shell need a closed
valid package-name grammar. Do not resolve Fontsource from a global installation
or bypass a nearer broken package.

Development target discovery stays native and never executes project configs.
Query SDK device inventories through owned processes with bounded output/deadlines;
unavailable SDKs yield no devices, but cancellation and uncertain process cleanup
must remain errors. Preserve simctl runtime-group order before the stable booted
sort; Go map iteration changes equal-priority device order. A single `dev ios`
selects one uniquely booted match; `--targets ios` includes every detected device.
Do not collapse platform buckets and device selections into one build selector.

Go retained session history uses its own versioned private namespace outside the
app and dependency caches. Reject in-project cache aliases before creating any
folders; resolving only the lexical path misses macOS /var aliases. Keep app and
owner identities in every metadata record. Live-owner generations, not stored
PIDs, distinguish active sessions from historical evidence. End times and cleanup
confirmation are published together only after owned resource release.

Accept ordinary forward-slash app selectors on Windows as well as native relative
paths; compare normalized path separators without broadening app-name matches.
Windows removed log segments can briefly fail reads with access denied while
pending deletion. Retry those reads within a small bound; persistent permission
errors still fail, and writer/metadata errors must never become empty successful
pages. Keep concurrent rotation and persistent-denial controls in qualification.

Keep log pagination compatible with the canonical Node contract: no cursor reads
the newest matching tail; a cursor reads forward; filtered pages still advance
past the newest observed record when exhausted. Re-read the previous segment
around rotation and disclose gaps or incomplete tails. Never resume appending
after a failed write. Create new segments exclusively and verify their owned file
identity/size before reopening; an ordinary pre-existing file may be a hardlink
to a user original. Prune only validated cleanup-confirmed Go records, retain
unfinished evidence, and allow known-session finalization despite an unrelated
corrupt retention entry. Record any retention failure without hiding readable logs.

Foreground project services use a versioned private startup sidecar, separate from
human output and the operation-admission receipt. Bound startup, then allow the
owned service lifetime until exit/cancellation; always await group/job cleanup.
A final observer read catches evidence published just before an engine exits.
Reject malformed/wrong-owner records; never derive signal authority from a PID
in descriptive launch evidence. Keep native host spawn and mobile tool spawn
separate from actual app initialization. Preserve nonzero engine exits even if
an admission frame was written successfully.

Keep compiler profiles inside a fresh native-owned app directory: the canonical
config validator confines paths to the app, and generated configs resolve project
modules from that ancestry. Keep runtime assets in the separate private worker
resource root outside dependency caches. Native owns both lifetimes and removes
profiles after confirmed process cleanup; retain their paths on uncertain cleanup.
Do not weaken the config path boundary merely to put profiles in a global cache.

Workshop inspection uses the selected project's `@octane-xplat/workshop/node`
through the small CLI worker, with no old command-parser fallback. Keep discovery
static: executing workshop configuration is intentional; executing story modules
is not. Preserve JSON discovery diagnostics as data with a successful exit, while
human discovery diagnostics fail after printing the inventory. Keep configuration
logs on stderr when stdout carries JSON. Prerequisite reports describe availability,
not platform qualification. Workshop initialization shares the read-only `planWorkshopInit` policy with the
TypeScript frontend. Go validates the fixed destination set, raw bytes, modes and
manifest preservation under an output lease before per-file atomic publication.
Keep skipped files in input observations too. Existing templates and custom scripts
remain user-owned. Service lifecycle support is separate; initialization and
inspection support must not mark the whole group complete.
Stage project engine fixtures beside the curated CLI. A symlink into the source
workspace can resolve that workspace’s full old CLI through real paths and hide a
missing export or dependency in the native package.

## Native HTTP and C interop

Separate build headers from runtime libraries. A host can have `libcurl.so.4`
without curl development headers. Pin public headers in task-local dependencies
and compile the typed shim against them; do not install system packages or claim
that the resulting executable bundles the runtime. Record the library actually
loaded and the ELF's glibc/C++ symbol requirements. `ldd` alone misses libraries
loaded lazily, and compiling on one distribution does not qualify older hosts.

Windows can reuse the typed curl shim with a pinned static HTTP/HTTPS-only curl
and zlib, while Schannel supplies OS TLS and trust. Keep the static CRT consistent
with Nim's MSVC objects. Record exact source/tool/link identities and include the
licenses. A static curl security fix needs a new executable; do not describe this
as an OS-serviced curl runtime. Configure existing MSVC/CMake/Ninja tools only in
the build process and forward SDK environment variables through Turbo explicitly.
Normalize CMake library paths to forward slashes before its pkg-config generator
runs; otherwise an absolute Windows library path can become a malformed `-lC:...`.
Validate the generated protocol and link closure rather than guessing SDK libs.
Use short task-cache roots on Windows: deeply nested CMake try-compile object
paths can exceed its path budget even when the final build succeeds.

Proxy engines can use forward requests or CONNECT tunnels even for plaintext
HTTP. Support both in qualification fixtures and assert each client's actual
proxy traversal. Compare response/cancellation contracts without forcing the
engines to use an identical handshake. Control both uppercase and lowercase
ambient proxy variables in subprocess tests.

Call C variadic functions with their real ABI. Casting a variadic function to a
fixed-argument proc pointer is unsafe on macOS arm64. A small typed C shim using
the SDK header can marshal `long`, size types and callbacks correctly. C callback
pointer types must match too: Nim `cstring` becomes `char*`, which is a distinct
callback parameter type from `const char*` for the C compiler.

For per-source C/C++ flags, use `.compile("source.cpp", "-std=c++20 ...")`.
The tuple form of `compile` uses its second value as an output-name formatter,
not compiler flags. Nim recognizes C++ sources; inspect its link command before
adding a duplicate C++ runtime library flag. MSVC needs `/std:c++20` and
`/Zc:__cplusplus` for Ada's language-version checks, `/EHsc` for its C++ exception
boundary, and `/MT` for the chosen static CRT; Unix compiler flags are not portable.

Foreign callbacks should copy data and record state. Complete futures and call
user sinks after returning from the C operation and draining its messages. User
code can close every handle; detach queued chunks before invoking it and check
whether the owner is still live before using a retained handle.

For OS callbacks on foreign threads, a bounded C-owned queue keeps those threads
out of Nim's managed runtime. Drain and allocate Nim values on the event loop.
Stop/invalidate the foreign event source and drain its callback queue before
freeing the context. If later Nim initialization raises after opening a foreign
handle, close that handle explicitly; an unreachable Nim wrapper does not free it.

File events may be coalesced, dropped or delayed. Tie a generation to observed
input state and recheck that state before publishing; an event alone does not
prove freshness. Exclude generated files from both notifications and input
fingerprints so publication does not create a rebuild loop. Keep an active build
owned until cancellation and cleanup finish before launching its replacement.

Closing a library's handles does not prove its background threads have exited.
For system libcurl, global cleanup can leave resolver threads running. Keep its
single lazy library mapping for the process lifetime while closing per-client
resources normally; do not unload code still reachable by foreign threads.

HTTP headers and text bodies have different encodings. Fetch headers use
ByteString/Latin-1 semantics; UTF-8 encoding a header value changes its bytes.
Response text uses replacement-mode UTF-8 decoding and removes an initial BOM.
Keep header readiness separate from body completion so a status probe can finish
without waiting for a slow body. Preserve the reference's catch boundaries:
catching only body/JSON failures differs from catching the entire fetch.
Schedule phase-specific test cancellation from an observed headers-ready event.
A short timer started before the request can hit different phases in Node and
Nim under host load, producing different valid envelopes rather than proving a
transport mismatch.

RFC 3986 and WHATWG URL normalization differ. Use the pinned native Ada engine
for Node-compatible URL behavior, rather than patching the transport parser.
A Node reference version can embed an older Ada engine. Preserve exact comparison
for ordinary cases and retain any narrowly named, version-bound divergence with
independent pinned WPT expectations; never turn a corpus into a broad mismatch
allowance. Ada 3.4.2 rejects seven punycode hosts accepted by Ada 4.0.0 and its WPT
fixtures. That is a reference-version difference, not transport evidence or a
reason to replace correct native normalization.
Ada getter slices have explicit lengths and may not end at NUL; mutation can
invalidate them. Copy borrowed slices after the final mutation, and release
separately owned getter results with their matching function.

Foreground Go development keeps terminal forwarding separate from owned process
pipes and retained history. A blocked or broken terminal must not delay group/Job
cleanup; bound terminal queue/line memory and disclose omissions. Preserve long
ordinary automation lines independently of the shorter retained-record limit.
On POSIX, handle stdout SIGPIPE through cancellation before returning 141, and
forward an explicit owner SIGINT to the owned group before escalation. Neither
pipe tests nor forced Windows termination qualify console Ctrl-C.
Main `dev` waits for initial route publication before launching engines, keeps
later invalid edits recoverable, and stops auxiliary typegen when all targets end.
Launch sidecars bind the expected application and worker generation; final reads
must preserve the last update without requiring removed bundle files to exist.
