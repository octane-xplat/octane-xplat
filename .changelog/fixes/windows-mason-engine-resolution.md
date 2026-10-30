### Build Windows preview bundles with isolated dependencies

The native Vite preset now resolves MasonKit and its style module through the
app's declared Windows engine. Previously, pnpm's isolated linker could leave
the renderer unable to find `@octane-xplat/nativescript-masonkit/style` during
bundling. Existing native configurations receive the correction:

```ts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

Windows remains an experimental repository harness, with no documented
downstream setup. See [Windows support status](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md)
and the [native Vite preset](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#native-vite-preset).
