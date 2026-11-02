# CLI implementation guidance

The Nim rewrite lives in `nim/`. Keep the TypeScript implementation as the
behavioral reference during migration. Native commands must not fall back to
executing the old CLI. Project-installed JavaScript build engines remain a
separate boundary. The Nim npm package contains no JS implementation payload,
JS exports, or runtime dependency tree; the small installer runs only at install.

Project-installed plugins live in `@octane-xplat/build`. That package compiles
the Vite plugin closure from the TypeScript reference at build time; its published
code has no CLI runtime dependency. Preserve this boundary when wiring native
commands: invoke the app's installed compiler/build tools with explicit argv,
cwd and environment, and keep command/session orchestration in Nim.

Project operations that already need JavaScript use small, versioned workers
from the selected project's `@octane-xplat/build/worker`. Keep parser/compiler
AST details and JS execution there; pass stable validated metadata to Nim.
Nim owns explicit argv/cwd/environment, response bounds, timeout, cancellation
and process-group cleanup. Sidecar JSON separates results from library diagnostics
on stderr. Do not resolve a missing project dependency from global module paths.
Keep catalog, discovery, permissions, source/document reads, HTTP control and
process ownership native. Inference stays in Nim; useful retrieval quality takes
precedence over incidental equality with WASM search ranking.

## Write Nim with explicit data semantics

- Distinguish an absent `JsonNode` reference (`nil`) from a JSON `null` node
  (`JNull`). Optional JS property access and nullish fallback do not translate
  to a nil check alone. Check the node kind before reading an object, array,
  string, or number, and preserve the reference contract's missing/null policy.
- Use `Option[T]` when a valid empty value must remain distinct from absence.
  For example, a parsed parameter can have `some("")`, while a static segment
  has `none(string)`. An empty-string sentinel would merge those results.
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

Code-generation literals can be shared with the reference at build time while
Nim supplies every dynamic value. Bind an ordered slot list to a reviewed
expression fingerprint: a slot count alone cannot detect reordered logic.
Reject changed shapes rather than evaluating reference expressions at runtime.
Load embedded lookup data lazily when unused features must not slow startup.

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

## Verify behavior across language boundaries

Keep a Node/TypeScript differential oracle until each migrated behavior is
qualified. Compare structured results, errors, exit codes and stream ownership;
compilation or a successful happy path does not prove semantic parity. For pure
logic, a test-only native program reading NDJSON can exercise a large case corpus
in one process. Do not ship test-only entry points in the production binary.

Assert that positive fixtures actually reach the intended successful result.
Two implementations returning the same unavailable/default value do not qualify
the successful path that a fixture was meant to exercise.

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

Preserve synchronous and asynchronous spawn failure boundaries separately. The
Node reference returns a failed child for ENOENT/EACCES and several resource
errors, but throws immediately for errors such as ENOEXEC. Catching every OS
launch error into a successful handle changes the caller's error path.

An async procedure runs synchronously until an unfinished await. A small build
can therefore be ready before its returned future's cleanup callback runs;
track result state and pending ownership separately. Initialize the async
dispatcher before registering callbacks on already-completed futures, and test
both immediate completion and a build that yields to the event loop.

Drain stdout and stderr concurrently when capturing a child. Reading one pipe
to EOF first can block forever when the other pipe fills. Bound retained output,
close unused stdin, and kill/reap the owned child on timeout or capture failure.
Direct-child cleanup does not establish process-tree cancellation.

Represent a successful empty command response separately from failure until the
caller applies its policy. A tool-presence check may reject empty output, while
another query accepts it. Cancellation is a separate error: never turn an aborted
query into a missing-tool diagnosis. Query the executable on the selected PATH
for its actual version; a version embedded by the reference runtime cannot prove
that a standalone executable can launch that tool. Probe the project's selected
package manager rather than requiring an unused one.

Pipe chunks may split a UTF-8 sequence. When decorating a passthrough stream,
preserve raw bytes and track line starts separately for stdout and stderr;
decoding each chunk can replace part of a valid character. Keep bounded decoded
log records separate from the full terminal stream so truncating logs does not
silently discard compiler diagnostics.

Keep process exit and pipe closure separate. Descendants can retain a pipe after
the group leader exits, or close their pipes and keep running. Retain ownership
of the isolated process group until cleanup completes; checking only the
leader's exit status can skip required signal escalation. A POSIX wait status
also distinguishes an ordinary exit code of 143 from termination by SIGTERM.
Keep the leader's PID reserved while inherited pipes remain open so delayed
group cleanup cannot target a subsequently reused PID.

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

Call C variadic functions with their real ABI. Casting a variadic function to a
fixed-argument proc pointer is unsafe on macOS arm64. A small typed C shim using
the SDK header can marshal `long`, size types and callbacks correctly. C callback
pointer types must match too: Nim `cstring` becomes `char*`, which is a distinct
callback parameter type from `const char*` for the C compiler.

For per-source C/C++ flags, use `.compile("source.cpp", "-std=c++20 ...")`.
The tuple form of `compile` uses its second value as an output-name formatter,
not compiler flags. Nim recognizes C++ sources; inspect its link command before
adding a duplicate C++ runtime library flag.

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
Ada getter slices have explicit lengths and may not end at NUL; mutation can
invalidate them. Copy borrowed slices after the final mutation, and release
separately owned getter results with their matching function.
