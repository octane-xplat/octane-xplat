# CLI implementation guidance

The Nim rewrite lives in `nim/`. Keep the TypeScript implementation as the
behavioral reference during migration. Native commands must not fall back to
executing the old CLI. Project-installed JavaScript build engines remain a
separate boundary. The Nim npm package contains no JS implementation payload,
JS exports, or runtime dependency tree; the small installer runs only at install.

## Write Nim with explicit data semantics

- Distinguish an absent `JsonNode` reference (`nil`) from a JSON `null` node
  (`JNull`). Optional JS property access and nullish fallback do not translate
  to a nil check alone. Check the node kind before reading an object, array,
  string, or number, and preserve the reference contract's missing/null policy.
- `for key, value in jsonNode` is object iteration: the key is a string.
  For an array with numeric positions, use `for i in 0..<node.len` and
  `let value = node[i]`. Do not assume a two-variable loop means array indices.
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

An async procedure runs synchronously until an unfinished await. A small build
can therefore be ready before its returned future's cleanup callback runs;
track result state and pending ownership separately. Initialize the async
dispatcher before registering callbacks on already-completed futures, and test
both immediate completion and a build that yields to the event loop.

Drain stdout and stderr concurrently when capturing a child. Reading one pipe
to EOF first can block forever when the other pipe fills. Bound retained output,
close unused stdin, and kill/reap the owned child on timeout or capture failure.
Direct-child cleanup does not establish process-tree cancellation.

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

Hash explicit UTF-8 bytes with a pinned implementation and compare lowercase
hex digests against independent vectors. Do not add a runtime crypto-library
dependency just to calculate local content fingerprints. For filesystem time
contracts expressed in milliseconds, combine whole seconds and nanoseconds
deliberately; dropping fractional milliseconds can silently change cache keys.

JavaScript string slicing may split a UTF-16 surrogate pair. A continuation
contract based on JS offsets must preserve that code unit, rather than silently
rounding to a Unicode scalar boundary. Escape lone surrogates in JSON output;
replace them when writing a human UTF-8 stream. Keep this internal representation
separate from decoding malformed UTF-8 bytes received from a file or process.

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

Locale ordering is also a contract: `localeCompare` is not a byte comparator.
Keep its native adapter at a platform boundary and test the actual engine and
locale used. When passing text through an FFI, use explicit code-unit lengths
where the API supports them; a C string alone truncates embedded NUL characters.
Successful regex compilation likewise does not establish JavaScript regex
semantics. Spell out required whitespace, word and line-boundary rules rather
than assuming similarly named flags and classes behave identically.
