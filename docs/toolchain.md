# Running an xplat app

> Use the starter commands for everyday work; choose a target only when you
> need to inspect that target's behavior.

## Create and run

```sh
pnpm create octane-xplat my-app
cd my-app
pnpm dev
```

The starter opens the web development server. Native targets are available
when their local toolchains are installed:

```sh
pnpm dev:ios
pnpm dev:android
```

## Build and check

```sh
pnpm build
pnpm build:ios
pnpm build:android
pnpm typecheck
```

The web build checks the browser bundle. The iOS and Android builds catch
problems in the native bundle and platform configuration. A typecheck should
pass for both target configurations before you publish an app.

## When a target is unavailable

You can build and test shared logic without a connected device. Device builds
still need the platform SDK and signing setup, and iOS release builds require
macOS. Treat those tools as release prerequisites, not as requirements for
writing a shared screen.

For the two bundler pipelines, version pins, package publishing, native
plumbing, and compiler-specific details, see the [toolchain notes](toolchain-notes.md).
