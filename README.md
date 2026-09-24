# octane-xplat

One [Octane](https://github.com/octanejs/octane) codebase, three targets:
**web** (DOM renderer) and **iOS/Android** (NativeScript via
[`@nativescript-community/octane`](https://github.com/nativescript-community/octane)).

## Get started

```sh
pnpm create octane-xplat my-app
```

That scaffolds an app, installs dependencies, and starts the web dev
server. From there:

```sh
pnpm dev            # web
pnpm dev:ios        # iOS simulator
pnpm dev:android    # Android emulator
```

Platform divergence happens at file boundaries — `Foo.web.tsrx`,
`Foo.ios.tsrx` — resolved by Vite, never inside shared logic.

## Docs

**[octane-xplat.goddardai.org](https://octane-xplat.goddardai.org)** —
guides for primitives, styling, navigation, overlays, and platform
services, plus the design notes behind the framework.

Packages: [`@octane-xplat/ui`](https://www.npmjs.com/package/@octane-xplat/ui)
(the framework) and `create-octane-xplat` / `@octane-xplat/cli` on npm.

## Working on the framework itself?

This repo is the framework source + harness. Start with
[AGENTS.md](AGENTS.md) and [docs/README.md](docs/README.md).
