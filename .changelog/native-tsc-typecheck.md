### Typecheck runs native TypeScript with `--runExternalCode`

`xplat typecheck` and every package typecheck script now invoke the project's
TypeScript 7.1 compiler directly as `tsc --runExternalCode` instead of the
`tsrx-tsc` wrapper from `@tsrx/typescript-plugin`.

**Breaking change:** TypeScript 5/6 projects are no longer supported by
`xplat typecheck`; the compiler must be the native 7.1 line the `octane-xplat`
umbrella supplies. Projects no longer need `@tsrx/typescript-plugin` — remove
it from your dependencies. Keep `@tsrx/content-mapper` declared in configs
that contain `.tsrx` sources; the compiler flag only unlocks external mapper
code.

```json
{
  "contentMappers": [{ "package": "@tsrx/content-mapper", "extensions": [".tsrx"] }]
}
```

```sh
bun remove @tsrx/typescript-plugin
bun run xplat typecheck
# Equivalent direct invocation:
bun run tsc --runExternalCode --noEmit
```
