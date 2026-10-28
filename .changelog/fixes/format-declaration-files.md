### Format TypeScript declaration files

`xplat fmt` now accepts ambient exports such as `export const value: string`
in `.d.ts`, `.d.mts`, and `.d.cts` files instead of failing with “Missing
initializer in const declaration”.

```sh
pnpm exec xplat fmt
```

[Code checks](https://octane-xplat.goddardai.org/testing/testing)
