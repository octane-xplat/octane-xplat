### The TSRX content mapper ships with the toolchain

Apps no longer declare `@tsrx/content-mapper`. The mapper is now a dependency
of `@octane-xplat/cli`, and both `@octane-xplat/cli` and the `octane-xplat`
umbrella declare TypeScript's `typescript.contentMapper` manifest, so the
compiler finds it through packages your project already installs.

**Breaking change:** the tsconfig `contentMappers` entry now names the
toolchain package instead of `@tsrx/content-mapper`. Apps use the umbrella;
libraries that depend on `@octane-xplat/cli` directly name it:

```json
{ "contentMappers": [{ "package": "octane-xplat", "extensions": [".tsrx"] }] }
```

```json
{ "contentMappers": [{ "package": "@octane-xplat/cli", "extensions": [".tsrx"] }] }
```

Then remove the standalone dependency:

```sh
bun remove @tsrx/content-mapper
```
