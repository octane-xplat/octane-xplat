### Check TSRX with TypeScript 7.1

The toolchain now uses TypeScript 7.1 beta and the TSRX content mapper. Use an
explicit `.tsrx` extension without a platform name; the build still selects the
platform implementation. Each platform family needs an unsuffixed module for
its shared type contract.

```ts
import { Card } from './Card.tsrx'
```

**Breaking change:** update extensionless TSRX imports and add the TSRX mapper
entry to your TypeScript config. Declare `@tsrx/content-mapper` as a development
dependency, including when compiler commands come from `octane-xplat`.

```sh
bun add -D @tsrx/content-mapper
```

Existing native apps also need the classic API used by NativeScript's build
helpers. New native starters already declare it.

```sh
bun add -D typescript-classic@npm:typescript@5.9.3
```

`tsrx-tsc` enables the native compiler's external-code flag. See [sharing files across platforms](https://octane-xplat.goddardai.org/platform/module-resolution)
and the [upstream support limits](https://github.com/tsrx-org/tsrx/issues/136).
