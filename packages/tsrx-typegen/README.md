# tsrx-typegen

Generate declaration files for packages that export `.tsrx` modules. The
command uses the consuming package's TypeScript and tsrx compiler, then maps
source-extension imports in the emitted declarations to JavaScript module
specifiers.

```sh
pnpm exec tsrx-typegen --target octane
```

Install `tsrx-typegen` as a development tool alongside `typescript` and
`@tsrx/typescript-plugin`. Each target in `tsrx-typegen.json` names its
renderer, project config, declaration output directory, and public subpaths.
The project config selects source variants and enables `declaration`,
`emitDeclarationOnly`, and `noEmit: false`. The target's `renderer` is checked
against `compilerOptions.jsxImportSource` when TypeScript sets it; the project
config continues to select the actual tsrx compiler and platform.

```sh
pnpm exec tsrx-typegen --target octane
pnpm exec tsrx-typegen --project tsconfig.types.json --check
pnpm exec tsrx-typegen --pack-check
```

Generation writes only TypeScript declaration files under the config's `outDir` and records
which files it owns in `.tsrx-typegen-manifest.json`. Check mode emits to a
temporary directory and compares the result with those owned files. It reports
missing or stale output, unresolved `.tsrx` references, and code export paths
without declaration targets. It refuses to overwrite an unmanaged declaration
and removes stale files only when the manifest says it owns them. Same-name
sources such as `Button.ts` and `Button.tsrx` need separate target configs or an
explicit declaration override. Case-only source renames replace the prior
manifest-owned declaration, including on case-insensitive filesystems; manual
declarations remain protected.

```sh
pnpm exec tsrx-typegen --target octane --check
```

Treat the output directory, including its ownership manifest, as generated
build artifacts: ignore it in Git, formatting, and linting. Keep handwritten
declarations and override sources outside that directory. Include the output
directory in the package's `files` list so ignored declarations still ship in
the tarball. Generate before local consumer typechecks, and regenerate in
`prepack` before validating the package. Workspaces that resolve generated
types directly also need generation during setup and refreshes during
development; this repository's workflow is documented in
[Develop against generated declarations](../../docs/notes/toolchain-notes.md#develop-against-generated-declarations).

`--project` selects the target whose project path matches. Use `--target` to
select a named target directly. A target can look like this:

```json
{
	"targets": {
		"octane": {
			"renderer": "octane",
			"project": "tsconfig.types.json",
			"outDir": "types/generated",
			"entrypoints": {
				".": {
					"source": "src/index.ts",
					"runtime": "./dist/index.js",
					"types": "./types/generated/index.d.ts"
				}
			}
		}
	}
}
```

Keep exceptional signatures in handwritten declaration sources outside the
generated directory, then map their generated output path explicitly:

```json
{
	"overrides": {
		"Button.d.ts": "types/overrides/Button.d.ts"
	}
}
```

The override source is copied to the generated output and tracked by the
manifest; check mode detects edits to either the source mapping or generated
copy. Override declarations must use publishable module specifiers and may not
reference `.tsrx` files.

```sh
pnpm exec tsrx-typegen --target octane --check
```

Relative imports between generated declarations receive runtime extensions
from the source map, including extensionless imports. This supports NodeNext
consumers as well as bundler resolution without requiring `allowArbitraryExtensions`.

```ts
// Plain TypeScript consumer of the package whose exports are configured above.
import { Button } from 'my-component-library'

// Button is a component exported by your library's src/index.ts.
export { Button }
```

Use separate target records and project configs when public signatures differ.
Each config must select the same source variants as its runtime build.
`runtime` records the published runtime path or condition map, while `types`
records the declaration path. The CLI does not edit `package.json`; export maps
remain package-owned. The default source-extension mapping is `.tsrx`, `.tsx`,
and `.ts` to `.js`, with `.mts` to `.mjs` and `.cts` to `.cjs`. Packages with
another runtime layout can override these mappings in `sourceExtensions` at
the target or root level.

```json
{
	"sourceExtensions": { ".tsrx": ".js", ".mts": ".mjs", ".cts": ".cjs" }
}
```

## Publish checks

Use `--pack-check` before publishing. It checks every configured target unless
`--target` narrows the selection, packs a temporary tarball with lifecycle
scripts disabled, and verifies that package and `publishConfig` export paths
exist in the tarball. It also compares runtime and declaration value exports
and checks that relative declaration references resolve inside the package and
bare package imports are declared dependencies or peers. The command needs
`pnpm` and the system `tar` utility. It checks package structure; keep a plain
TypeScript consumer test for the module-resolution modes and public prop
contracts your package supports.

```sh
pnpm exec tsrx-typegen --pack-check
pnpm exec tsrx-typegen --pack-check --target octane
```

A target with `"emit": false` exists only to drive packed-package
verification. Packages whose declarations are handwritten or produced by
another tool declare one so `--pack-check` skips generation and freshness
checks for it and only validates the packed package. Such targets cannot be
selected for generation; a plain `--target` run against them fails. Every code
export path still needs a `types` condition — pointing at a `.d.ts` file or,
for source-published packages, the `.ts` source itself.

```json
{
	"targets": {
		"manual": {
			"emit": false,
			"renderer": "octane",
			"project": "tsconfig.types.json",
			"outDir": "types/generated",
			"entrypoints": {
				".": {
					"source": "src/index.ts",
					"runtime": "./dist/index.js",
					"types": "./types/index.d.ts"
				}
			}
		}
	}
}
```

Run the same gate from `prepack` so `pnpm pack` and publication share it:

```json
{
	"scripts": {
		"typegen": "tsrx-typegen --target octane",
		"build": "vite build && pnpm typegen",
		"prepack": "pnpm build && tsrx-typegen --pack-check"
	}
}
```

When run from a package root that has `tsrx-typegen.json`, `xplat doctor`
delegates to `tsrx-typegen --pack-check` and returns a failing exit status if
that declaration gate fails.

```sh
pnpm exec xplat doctor
```

The first supported backend is the classic `tsrx-tsc` path with TypeScript
5.9.x. TypeScript 7 content-mapper output needs upstream declaration naming and
specifier support before it can replace this backend. Generation rejects
compiler errors; editor-only partial transforms are not used.

This tool preserves TypeScript's declaration inference. Keep exported helpers,
generic signatures, overloads, and compound members explicit in source when
inference does not preserve the intended package contract. Always check the
packed package with a plain TypeScript consumer; generated declarations may
still express a different contract even when their paths and exports are
valid. Use explicit overrides for exceptional signatures and keep those
overrides outside the generated output directory.

```ts
// Source of your component package; use an explicit return type for helpers.
export function formatCount(count: number): string {
	return `${count} packed`
}
```
