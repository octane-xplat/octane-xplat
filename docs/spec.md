# What you can build with xplat

> Build a TypeScript app for web, iOS, Android, macOS, and Windows; choose
> targets with the current support boundaries in mind.

## Start with a working flow

A trip planner can share its itinerary, packing list, and saved places. A
field app can share its forms and records, then add photos where capture is
available. You and your coding agent can build one flow first, inspect it in
a running app, and add the next feature without rewriting the whole product
for each platform. These are app ideas, not bundled demos.

## Choose your targets

| Target | What this checkout provides | What to plan for |
| --- | --- | --- |
| Web | Starter and DOM renderer | Node.js, pnpm, and a browser; device APIs vary by browser. |
| iOS | Starter using NativeScript views and APIs | A Mac, Xcode, NativeScript setup, and signing for device/distribution builds. |
| Android | Starter using NativeScript views and APIs | Android SDK, a compatible JDK, and an emulator or device. |
| macOS | Experimental AppKit harness and CLI packaging | Apple Silicon, macOS 13.5+, a separate app configuration, and a limited component/style/service surface; not in the starter. |
| Windows | Experimental WinUI 3 scaffold and CLI target; bundle generation verified on macOS | Windows 10 1809+, .NET 10 SDK, Developer Mode, and pinned preview dependencies. Runtime behavior is unverified; not in the starter. |

The framework is `0.x`; APIs are still changing. [Known limits](known-limits.md)
records capability differences and verification status. The
[macOS notes](../apps/macos/README.md) describe the measured desktop boundary;
the [Windows setup](../apps/windows/README.md) describes the experimental
scaffold and the checks still needed on a Windows host. Linux also has a separate
[experimental webview target](toolchain.md#experimental-linux-target-webkitgtk-webview).

## Get a result, then improve it

[Create and run the starter](toolchain.md#create-and-run), give your agent a
small user-visible task, and check the result yourself. Keep the dev server
running while the agent edits; add a native development session once its
prerequisites are ready. Ask the agent to report checks and actual targets
run, so a successful browser build is not mistaken for a device test.

## Add capabilities that serve the app

Use [device services](platform-services.md) to save preferences, share content,
pick images, or follow incoming links. Add [media packages](media-services.md)
for playback or richer haptics, or a
[camera preview](primitives.md#when-a-screen-needs-more). Check each feature's
platform support and show a useful response when permission is denied or a capability
is absent.

## Share the product, tailor the experience

Shared screens use components such as `Text`, `Pressable`, and `ScrollView`.
Keep common behavior together, then use [platform variants](module-resolution.md)
for an OS control or a different screen layout. A shared import can resolve
to an iOS implementation without putting iOS branches throughout your app.
[Styling](styling.md) and [platform widgets](primitives.md) explain the choices.
Shared code does not imply identical capability or visual support on every target.

The [showcase plan](demos.md#product-showcase) follows four roles: a coherent
app on all five targets, a shared edit in running targets, a useful capability
with labeled platform responses, and a focused platform implementation.
The five-target presentation remains a goal, not a verified demo.

## The tools underneath

[Octane](https://github.com/octanejs/octane) keeps the React-style model of
components, props, and state, and compiles UI for the selected renderer.
[NativeScript](https://docs.nativescript.org/guide/metadata) exposes native iOS
and Android APIs directly to TypeScript without requiring you to write a
bridge. xplat supplies shared components, services, and file conventions that
your agent can follow. Native APIs still have OS requirements and permissions.

Read [how an app fits together](architecture.md) when you need to separate
screens from platform code. The [framework notes](framework-notes.md) preserve
compiler details and implementation decisions.
