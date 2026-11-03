# CLI implementation guidance

The Nim rewrite lives in `nim/`. Keep the TypeScript implementation as the
behavioral reference during migration. Native commands must not fall back to
executing the old CLI. Project-installed JavaScript build engines remain a
separate execution boundary. Keep the executable native, without embedded
Node/Bun or an old-CLI fallback. Small operation workers and Vite exports may
live in this package; language boundaries do not require npm package boundaries.
Keep heavy engine dependencies opt-in and large platform host assets separate.

Project-installed plugins live in `@octane-xplat/build`. That package compiles
the Vite plugin closure from the TypeScript reference at build time; its published
code has no CLI runtime dependency. Those current package locations are not a
requirement for future worker/plugin placement. For native commands, invoke the
app's installed compiler/build tools with explicit argv, cwd and environment, and keep command/session orchestration in Nim.

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
from the selected project's `@octane-xplat/build/worker` or platform-specific
`@octane-xplat/macos-build/worker`. Keep parser/compiler
AST details and JS execution there; pass stable validated metadata to Nim.
Nim owns explicit argv/cwd/environment, response bounds, timeout, cancellation
and process-group cleanup. Sidecar JSON separates results from library diagnostics
on stderr. Do not resolve a missing project dependency from global module paths.
Keep catalog, discovery, permissions, source/document reads, HTTP control and
process ownership native. Inference stays in Nim; useful retrieval quality takes
precedence over incidental equality with WASM search ranking.

Development-action input/output validation uses the selected project's
`@octane-xplat/build/worker` (`action-validate`). Reuse the existing JS field
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
stdout belongs on stderr when stdout carries formatted stdin text. Prefer one canonical implementation; keep validated artifact plans,
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
