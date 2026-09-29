# xplat

> Build a TypeScript app for web, iOS, Android, macOS, and Windows with your
> coding agent.

Start with the app you want: a trip planner, a field checklist, a media library,
or another product with shared screens and useful device features. Describe
one working flow to your agent, try it, and keep improving it.

The starter runs on web, iOS, and Android. macOS is experimental; the Windows
scaffold builds a bundle but has not yet been run on Windows. [Choose your targets](spec.md#choose-your-targets)
for the current boundaries before committing to a release.

## Start here

1. [What you can build](spec.md) — shared app behavior and target support.
2. [Get a working app and iterate](toolchain.md) — the real setup command,
   a first agent task, prerequisites, live updates, and checks.
3. [Add device features](platform-services.md) — save, share, pick photos,
   and handle permissions or unavailable features.
4. [Add media](media-services.md) — audio and haptics, with links to camera
   preview and video setup.
5. [Tailor each platform](module-resolution.md) — share the product while
   choosing platform-specific implementations.
6. [Build screens](primitives.md), [style them](styling.md),
   [connect routes](navigation.md), and [fetch data](data.md) as the app grows.
7. [Check the result](testing.md) and consult [known limits](known-limits.md)
   before promising a capability.

[Octane](https://github.com/octanejs/octane) supplies familiar React-style
components and compiles the UI. [NativeScript](https://docs.nativescript.org/guide/metadata)
lets TypeScript call native iOS and Android APIs without you authoring a
bridge. The [architecture guide](architecture.md) explains how shared
screens and platform implementations fit together when you need that detail.

## Context for your agent

The starter includes an `xplat` skill under `.agents/skills/xplat/`.
Ask your agent to read it before changing the app.
[llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes these docs;
[llms-full.txt](https://octane-xplat.goddardai.org/llms-full.txt) includes every
guide. [Agent context and versions](toolchain.md#agent-context-and-versions)
explains when NativeScript's optional official skills are useful.

## Notes

The guides above help you build an app. The notes preserve implementation
details and evidence for extending or debugging the framework; their historical
experiments are not promises of current support.

Start with [status](status.md) for the framework work in progress. The design
record includes [decisions](decisions.md), [open questions](open-questions.md),
and the [showcase plan and demo evidence](demos.md). Deep references are grouped
by [framework](framework-notes.md), [architecture](architecture-notes.md),
[primitives](primitive-notes.md), [styling](styling-notes.md),
[navigation](navigation-notes.md), [platform](platform-notes.md), and
[toolchain](toolchain-notes.md). Focused notes cover [module
resolution](module-resolution-notes.md), [animation](animation-notes.md),
[testing](testing-notes.md), [CSS support](css-support-notes.md), and the
experimental [Windows target](windows-notes.md).
