---
release: lockstep
---

### Load route code when it is needed

Generated file routes now load their screen modules during navigation. Use
`router.preload` to warm a destination's code earlier; guards and loaders still
run during navigation. Layouts, Markdown and explicitly imported programmatic
routes remain eager. Whether this creates separate files depends on the platform's bundler.

```ts
import { router } from '@octane-xplat/ui/routing'

const destination = { to: '/products/:id', params: { id: 'hat' } } as const
await router.preload(destination)
await router.push(destination)
```

**Breaking change:** generated route modules no longer run their top-level code
at startup. Move required startup work into your application entry, and regenerate
route files with the updated CLI. Manifest inspection leaves unloaded callback
information unknown instead of importing a route to inspect it.

[Route preloading guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/navigation.md#warm-a-screen-before-opening-it)
