---
release: tsrx-typegen
---

### Generate declarations alongside native TypeScript

`tsrx-typegen` now owns its classic TypeScript compiler and checker adapter, so the project can use native TypeScript 7.1 for typechecking.

**Breaking change:** the emitter no longer uses the project's TypeScript or checker-adapter version. The project still supplies the TSRX target compiler.

```sh
bun add -D tsrx-typegen
bun run tsrx-typegen --target octane
```

See the [declaration generation guide](https://octane-xplat.goddardai.org/packages/package-tsrx-typegen).
