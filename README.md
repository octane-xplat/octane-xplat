# octane-xplat

Build a TypeScript app for **web, iOS, Android, macOS, and Windows** with
shared screens and room for each platform to feel right. Describe the app to
your coding agent, get a working screen, then improve it one task at a time.

**Start on web, iOS, and Android with the starter today.** macOS has an
experimental AppKit host; Windows is a target direction, with no runnable
xplat setup in this checkout. These targets do not yet have equal support.
See the [target guide](docs/spec.md#choose-your-targets) before planning a release.

## Get a working app

With Node.js and pnpm installed:

```sh
pnpm create octane-xplat my-app
```

The creator installs dependencies and starts the web dev server. Open the
local URL it prints, then open `my-app` in your coding agent. A first task:

> Read AGENTS.md and the xplat skill. Turn the starter into a trip packing
> checklist: add an item, mark it packed, remove it, and show how many remain.
> Keep the screen shared between web, iOS, and Android. Use in-memory state
> for this first version. Run lint, typecheck, and the web build, and tell me
> which checks passed and which targets you actually ran.

Try the result, then ask for the next change: “Group items by bag and keep
packed items visible.” The starter includes `.agents/skills/xplat/` to give
your agent the project conventions. [Run and iterate](docs/toolchain.md)
covers native prerequisites, live updates, and checks.

## Add useful device features

Save a checklist, attach a photo, share a trip, or open a screen from a link.
[Device services](docs/platform-services.md) and
[media packages](docs/media-services.md) expose those capabilities to shared
code. Availability, permissions, and responses differ by platform: photo
capture uses the OS camera on iOS/Android, while the web flow may offer a
file picker. Handle unavailable features explicitly.

## Make it feel right on each platform

Share product behavior and the basic screen layout. Use a platform-specific
file when a phone needs an OS control or a desktop needs a different layout.
[Platform variants](docs/module-resolution.md) keep those choices behind a
shared import; [platform widgets](docs/primitives.md) provide opt-in OS controls.

The [showcase plan](docs/demos.md#product-showcase) uses four examples: one
coherent app across all five targets; a shared edit reflected in running
targets; a useful capability with its platform-specific response labeled;
and a focused platform-specific implementation. It is a plan, not a claim
that a five-target demo already ships.

## Why Octane and NativeScript

[Octane](https://github.com/octanejs/octane) keeps a familiar React-style
component model and compiles the UI. You and your agent work with components,
props, and state while xplat supplies shared UI components.

[NativeScript](https://docs.nativescript.org/guide/metadata) exposes native
iOS and Android APIs directly to TypeScript, without requiring you to author
a bridge. Its development update loop helps you inspect edits in a running
app. Its [official agent skills](https://github.com/NativeScript/skills) can
help with native work; they are optional and separate from the starter's
xplat skill. Follow the [setup and version guidance](docs/toolchain.md#agent-context-and-versions)
for this project.

## Docs

**[octane-xplat.goddardai.org](https://octane-xplat.goddardai.org)** —
start with [what you can build](docs/spec.md), then
[run your app](docs/toolchain.md), [add capabilities](docs/platform-services.md),
and [tailor the experience](docs/module-resolution.md).

For agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the
docs; [llms-full.txt](https://octane-xplat.goddardai.org/llms-full.txt) includes
every guide. Packages include `@octane-xplat/ui`, `@octane-xplat/platform`,
`@octane-xplat/cli`, and `create-octane-xplat`.

Working on the framework itself? Start with [AGENTS.md](AGENTS.md) and the
[design notes](docs/README.md#notes).
