# @octane-xplat/platform

> Save the user's work, share content, attach photos, and handle device
> permissions through shared TypeScript services.
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

Ask your agent for the user outcome and the fallback: “Attach a photo to a
trip item and explain when capture is unavailable.” Services cover storage,
permissions, deep links, and more. Services that need a NativeScript
plugin ship as `@octane-xplat/*` leaf packages (share, files, media,
biometrics, geolocation, notifications, secure-storage, haptics). Most documented
implementations cover web and iOS/Android; experimental desktop support varies
by service. Shared names do not imply identical availability or responses.
The full capability map lives in the docs:

- [Using device features](https://octane-xplat.goddardai.org/platform-services) — guide
- [Platform-service notes](https://octane-xplat.goddardai.org/notes/platform-notes) — per-capability impl map

For agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs; `llms-full.txt` inlines every guide.

Rules for consumers:

- Import from the package (`'@octane-xplat/platform'` or a submodule like
  `'@octane-xplat/platform/storage'`) — never a leaf impl file.
- Check optional capabilities' `supported` flag and permission/result states;
  operations can still fail and need error handling.
- This package provides services. Screen components and OS widgets live in [`@octane-xplat/ui`](https://octane-xplat.goddardai.org/primitives).
