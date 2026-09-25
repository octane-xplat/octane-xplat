# @octane-xplat/platform

> Headless platform capabilities for Octane xplat — one shared API surface,
> resolved per target (`*.web` under web conditions, `*.native`/`.ios`/
> `.android` under native).
>
> Status: `0.x` — the API surface is still moving.

```sh
pnpm add @octane-xplat/platform octane
```

`octane` is a required peer; the `@nativescript/*` peers are optional and
only needed for native targets.

```ts
import { storage, permissions } from '@octane-xplat/platform'

storage.setString('has-seen-welcome', 'true')
const seen = storage.getString('has-seen-welcome')

const result = await permissions.ensure('camera')
```

Services cover storage, permissions, share, haptics, media picking, deep
links, and more. The full capability map lives in the docs:

- [Using device features](https://octane-xplat.goddardai.org/platform-services) — guide
- [Platform-service notes](https://octane-xplat.goddardai.org/notes/platform-notes) — per-capability impl map

Rules for consumers:

- Import from the package (`'@octane-xplat/platform'` or a submodule like
  `'@octane-xplat/platform/storage'`) — never a leaf impl file.
- Optional capabilities return `{ supported: boolean }` rather than throwing.
- This package is headless only. UI-shaped plugins (drawer, menu) are leaf
  primitives in [`@octane-xplat/ui`](https://octane-xplat.goddardai.org/primitives).
