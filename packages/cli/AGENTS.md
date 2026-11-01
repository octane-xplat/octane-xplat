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
- Nim strings are UTF-8 bytes. Use `runes` for Unicode scalar values; JavaScript
  string lengths count UTF-16 code units. Choose deliberately when porting length
  limits or offsets; one non-BMP character counts as two JS code units.
- Number parsing and formatting are contracts, not mechanical substitutions.
  JavaScript `Number()` accepts empty/whitespace strings and unsigned base-prefixed
  integers. Port accepted syntax, finite/integer checks, bounds, and diagnostics
  explicitly. Nim floating-point parsing accepts separators such as `1_0` that
  JS `Number()` rejects. JSON serialization also needs deliberate handling of
  negative zero: `JSON.stringify(-0)` emits `0`. Nim `formatFloat(x, ffDecimal, 0)` can leave a trailing decimal dot;
  normalize it when the contract requires JS whole-number formatting. Keep
  differential tests for numeric edge cases rather than trusting matching types.
- Successful Nim JSON parsing does not establish strict `JSON.parse` or
  `jsonc-parser` equivalence. Test comments, trailing commas, malformed documents,
  scalar roots, and parse-error behavior for each file format separately.

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

Compiler pins and Nim dependencies are declared under `tools/cli-nim`. Keep
compiler downloads and caches task-local in ignored `research/nim-cli` storage.
Run repository builds/tests through Turbo and reserve `native_builds` before
expensive compilation. Qualify actual native targets; cross-compilation is build
evidence only. Run reports and operational status belong in local reports/Silo,
not in this guidance file.
