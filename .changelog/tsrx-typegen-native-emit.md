---
release: tsrx-typegen
hype: 60
---

### `tsrx-typegen` emits with native TypeScript 7.1

Declaration generation now runs TypeScript 7.1's `tsc --runExternalCode`
(`--noCheck`, `emitDeclarationOnly`) through the content mapper your tsconfig
declares, instead of a classic-TypeScript transpile. `Component.tsrx` emits
`Component.d.ts`, and `.tsrx` imports point at the published `.js` files.
`@tsrx/typescript-plugin` is no longer needed.

**Breaking change:** the project must declare a `.tsrx` content mapper that
resolves as a package from its tsconfig. Apps name `octane-xplat`; libraries
name `@octane-xplat/cli`:

```json
{ "contentMappers": [{ "package": "@octane-xplat/cli", "extensions": [".tsrx"] }] }
```

Entrypoint `source` paths in `tsrx-typegen.json` must point at the unsuffixed
contract. A platform variant such as `src/index.macos.ts` fails when
`src/index.ts` exists:

```json
{ "entrypoints": { ".": { "source": "src/index.ts" } } }
```

Wildcard entrypoints emit declarations for every matching unsuffixed module
and platform-only file, never for platform variants. The project's own
`isolatedDeclarations` setting now applies instead of being forced on.
