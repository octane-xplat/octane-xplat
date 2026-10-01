# Ship everywhere with Octane Xplat

> Build a TypeScript app for web, iOS, Android, macOS, Windows, and Linux
> with your coding agent.

Xplat is for real apps: ==one TypeScript codebase== that ships the same product
behavior on web and mobile, with OS-specific controls where the platform
experience deserves them. Your agent writes the code; your job is to describe
behavior precisely and verify what it reports. These guides are written for
that split — they spend as much effort on what to check as on what to build.

==[Prove the loop first](toolchain.md#create-and-run)==: run the starter and walk
one small bounded task through edit → checks → verified result before you
commit real features to it. No device SDK is needed for that browser pass.

The starter runs on web, iOS, and Android — the supported shipping targets.
macOS and Windows are experimental. The Windows native project compiles on a
Windows host, but the app bundle currently fails before launch. Linux has an
experimental WebKitGTK webview host exercised on Ubuntu 24.04. See the
[Windows setup guide](windows-setup.md) for host prerequisites and current
limits, and [choose your targets](spec.md#choose-your-targets) for support
boundaries before committing to a release.

## Start here

1. [What you can build](spec.md) — shared app behavior and target support.
2. [Get a working app and iterate](toolchain.md) — the real setup command,
   a calibration task, prerequisites, live updates, and checks.
3. [Add device features](platform-services.md) — save, share, pick photos,
   handle permissions, or use a typed [desktop WebView host](macos-webview.md).
4. [Add media](media-services.md) — audio and haptics, with links to camera
   preview and video setup.
5. [Tailor each platform](module-resolution.md) — share the product while
   choosing platform-specific implementations.
6. [Build screens](primitives.md), [style them](styling.md),
   [connect routes](navigation.md), [enter text](text-entry.md),
   [fetch data](data.md), and [localize the UI](localization.md) as the app
   grows.
   The [component index](components.md) lists everything `@octane-xplat/ui`
   exports.
7. [Verify before you ship](testing.md) — an agent's "done" is a claim;
   [known limits](known-limits.md) records which claims are proven.

For Linux system WebView builds, installation, and verification, see
[package a Linux app](linux-package.md).

For leaf-owned Swift, ObjC, C, or Zig APIs on the AppKit target, see
[native macOS leaves](macos-native.md).

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
[testing](testing-notes.md), [CSS support](css-support-notes.md),
[SQLite persistence](sqlite-notes.md), the experimental [Windows
target](windows-notes.md), and [Windows setup](windows-setup.md).
