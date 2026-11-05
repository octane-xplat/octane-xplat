### Keep Vite imports with the experimental native CLI

The Nim CLI tarball retains its small Vite plugins and bounded Node worker.
The executable remains native, and projects opt into the compiler engines as
needed. Native-only installs do not download those optional engine packages.
Large macOS host assets remain separate.

```ts
import { xplatCss } from '@octane-xplat/cli/vite'

const plugin = xplatCss('web')
```

Native workers and typecheck declarations resolve from the project's compatible
CLI package; no separate build package is required. See [native CLI setup](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable)
for engine prerequisites and current limits.
