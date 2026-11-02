### Install build plugins separately from the CLI

`@octane-xplat/build` provides the existing Vite presets through a separate
project dependency. Apps preparing for the native CLI can move their plugin
imports while keeping the same preset and options:

```ts
import { xplatNative } from '@octane-xplat/build/vite'
```

Existing TypeScript CLI plugin imports remain available during the parallel
migration. See [project build plugins](https://octane-xplat.goddardai.org/package-build)
and [Vite's guide](https://vite.dev/guide/) for setup.
