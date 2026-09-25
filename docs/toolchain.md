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
pass for both target configurations before you publish an app. *Every command
on this page is exercised regularly in the harness, including `ns` builds on
an iOS simulator and a physical Android device.*

Native plugin declarations belong to the app. If its source imports
`@octane-xplat/ui`, declare the UI plugins used by the native entry in that
app's `package.json`; platform service imports have the same rule. Run
`pnpm xplat doctor` from the app root to get warning-only checks for missing
direct declarations. The starter includes the common UI plugins; platform
service plugins remain opt-in to the services an app imports.

## When a target is unavailable

You can build and test shared logic without a connected device. Device builds
still need the platform SDK and signing setup, and iOS release builds require
macOS. Treat those tools as release prerequisites, not as requirements for
writing a shared screen.

For the two bundler pipelines, version pins, package publishing, native
plumbing, and compiler-specific details, see the [toolchain notes](toolchain-notes.md).
