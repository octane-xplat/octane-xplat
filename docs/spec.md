# What you can build with Xplat

> Build a TypeScript app for web, iOS, Android, macOS, Windows, and Linux;
> choose targets with the current support boundaries in mind.

## Decide whether it fits

Consider Xplat when your app is a real product that must live on web and
mobile, and you expect to tailor parts of the experience for each OS. What
you share is concrete product behavior — data, actions, workflows, ordinary
screen layout. What you keep separate is deliberate: an OS control, a
capability with a different permission flow, a layout that only makes sense
on one form factor.

These guides assume a specific division of labor: your agent writes the
code, and you decide what "correct" means and check that it happened — by
running the app on the targets you ship, not by reviewing its code. That
suits serious projects: the framework owns the cross-platform plumbing, but
no tool can verify your product for you.

Start with one flow your app actually needs. A field app might need a form
with a photo attachment; a trip app might need a packing list. These are
slices of real apps, not bundled demos. The [first-run
guide](toolchain.md#create-and-run) uses a checklist to prove the
build-and-check loop before you point it at your own flows.

If your release requires verified support on all six targets, the current
project is not ready for that requirement. Desktop support is experimental,
and shared APIs do not establish that every implementation works. Use the
table below to decide whether the available targets cover your first release.

## Choose your targets

| Target  | What this checkout provides                                                       | What to plan for                                                                                                                    |
| ------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Web     | Starter and DOM renderer                                                          | Node.js, pnpm, and a browser; device APIs vary by browser.                                                                          |
| iOS     | Starter using NativeScript views and APIs                                         | A Mac, Xcode, NativeScript setup, and signing for device/distribution builds.                                                       |
| Android | Starter using NativeScript views and APIs                                         | Android SDK, a compatible JDK, and an emulator or device.                                                                           |
| macOS   | Experimental AppKit harness and CLI packaging                                     | Apple Silicon, macOS 13.5+, a separate app configuration, and a limited component/style/service surface; not in the starter.        |
| Windows | Experimental WinUI 3 scaffold and CLI target; bundle generation verified on macOS | Windows 10 1809+, .NET 10 SDK, Developer Mode, and pinned preview dependencies. Runtime behavior is unverified; not in the starter. |
| Linux   | Experimental WebKitGTK webview host and CLI packaging; exercised on Ubuntu 24.04  | A Linux host with WebKitGTK, separate package settings, and a DOM-rendered surface; not in the starter.                             |

The framework is `0.x`; APIs are still changing. [Known limits](known-limits.md)
records capability differences and verification status. The
[macOS notes](../apps/macos/README.md) describe the measured desktop boundary;
the [Windows setup](../apps/windows/README.md) describes the experimental
scaffold and the checks still needed on a Windows host; the
[Linux packaging guide](linux-package.md) covers the WebKitGTK host and its
verification flow.

## Get a result, then improve it

[Create and run the starter](toolchain.md#create-and-run), give your agent a
small user-visible task, and check the result yourself. Keep the dev server
running while the agent edits; add a native development session once its
prerequisites are ready. Require the agent to report which checks ran and
which targets it actually exercised — a clean typecheck and a browser build
say nothing about a device.

## Add capabilities that serve the app

Use [device services](platform-services.md) to save preferences, share content,
pick images, or follow incoming links. Add [media packages](media-services.md)
for playback or richer haptics, or a
[camera preview](primitives.md#when-a-screen-needs-more). Check each feature's
platform support and show a useful response when permission is denied or a capability
is absent.

## Share the product, tailor the experience

Shared screens use components such as `Text`, `Pressable`, and `ScrollableArea`.
Keep common behavior together, then use [platform variants](module-resolution.md)
for an OS control or a different screen layout. A shared import can resolve
to an iOS implementation without putting iOS branches throughout your app.
[Styling](styling.md) and [platform widgets](primitives.md) explain the choices.
Shared code does not imply identical capability or visual support on every target.

Use the [showcase evidence](demos.md#product-showcase) to separate the
five-target app goal from recorded live-edit checks, documented capability
responses, and platform-specific implementation examples. For your own app,
verify a shared flow, then a shared edit, then a device capability and any
OS-specific control you depend on.

## The tools underneath

[Octane](https://github.com/octanejs/octane) keeps the React-style model of
components, props, and state, and compiles UI for the selected renderer.
[NativeScript](https://docs.nativescript.org/guide/metadata) exposes native iOS
and Android APIs directly to TypeScript without requiring you to write a
bridge. Xplat supplies shared components, services, and file conventions that
your agent can follow. Native APIs still have OS requirements and permissions.

Read [how an app fits together](architecture.md) when you need to separate
screens from platform code. The [framework notes](framework-notes.md) preserve
compiler details and implementation decisions.
