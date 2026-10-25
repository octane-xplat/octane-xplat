### Declare Bamboo's build targets for custom Vite builders

Cloudflare SPA builds can leave a configured SSR target unused. Declare the
targets your builder runs to avoid Bamboo's incorrect incomplete-run warning
while keeping CSS pruning enabled. Include real SSR targets when present.

```ts
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

const plugins = xplatBamboo({
  buildEnvironments: ['api', 'client'],
})
```

See [build participation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/bamboo#custom-builders-with-unused-environments).
