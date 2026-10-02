# What you can build with Xplat

> Share your app's screens and behavior between the web and phones, with
> room to customize each platform.

## Decide whether it fits

Xplat is useful when you want an app to run in a browser and on iOS or
Android without writing three separate apps. For example, a packing-list app
can use the same code to add items, mark them packed, and show what's left
on all three platforms.

Some parts need different code: opening a phone's camera, asking for
permission, or using an iOS-specific control. Xplat provides shared
components and device services for common needs, plus a way to keep those
platform differences in separate files.

You can build by writing code or by describing changes to a coding agent.
Either way, start with one small feature you can try yourself. The
[first-app guide](toolchain.md#create-and-run) walks through a packing
checklist in the browser before adding phone setup.

If you need a finished app on all six platforms today, Xplat does not yet
cover that requirement. Web, iOS, and Android are the starter's supported
platforms. Desktop support is experimental, and some components and device
features are incomplete there.

## Choose your targets

A **target** is a platform where your app will run. Start with the browser;
you can add phone targets after the first screen works.

| Target  | What you get                                                                                                | Extra setup                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Web     | The starter runs in a browser. Device features vary by browser.                                             | Node.js, pnpm, and a browser; see [create and run](toolchain.md#create-and-run).                                               |
| iOS     | The starter uses native iOS views and device features through NativeScript.                                 | A Mac, Xcode, and [NativeScript setup](toolchain.md#run-on-ios-and-android). Real-device and release builds also need signing. |
| Android | The starter uses native Android views and device features through NativeScript.                             | Android development tools, JDK 21, and an emulator or device; see [phone setup](toolchain.md#run-on-ios-and-android).          |
| macOS   | Experimental native AppKit app or system WebView app; separate from the starter.                            | Apple Silicon, macOS 13.5+, and separate app configuration. See [macOS setup](../apps/macos/README.md).                        |
| Windows | Experimental WinUI 3 app; separate from the starter. UI support is incomplete.                              | A Windows host and preview dependencies; see [Windows setup](windows-setup.md) and [current limits](windows-notes.md).         |
| Linux   | Experimental app displaying web content in WebKitGTK; exercised on Ubuntu 24.04. Separate from the starter. | A Linux host with WebKitGTK and separate package settings; see [Linux packaging](linux-package.md).                            |

An **emulator** or **simulator** lets you run a phone app on your computer.
**Signing** identifies who made an app and is required for installing or
releasing it in some environments. The phone setup guides cover the tools;
you don't need them for your first browser app.

Xplat is at version `0.x`, so names and options can change between releases.
[Known limits](known-limits.md) records feature differences and which ones
have been checked in running apps.

## Get a result, then improve it

[Create and run the starter](toolchain.md#create-and-run), make a small
change, and try it in the browser. Keep the development command running:
it watches your files so you can see edits as you save them.

For a packing list, try adding two items, marking one packed, and removing
both. Once that works, add one feature, such as remembering the list after
a reload. If you're working with an agent, ask it to explain what it
changed and which checks it ran. The [checking guide](testing.md) explains
what those checks tell you.

## Add capabilities that serve the app

Use [device features](platform-services.md) to save settings, share a link,
or attach a photo. Add [audio or haptics](media-services.md) for sound and
vibration feedback, or a [camera preview](primitives.md#camera-preview) for
live camera content.

Check the feature's platform support before adding it. Decide what the app
should show if someone declines permission or their device can't provide
it: a packing list should still be usable without a photo attachment.

## Share the product, tailor the experience

A shared screen can use `Text` for words, `Pressable` for a tappable action,
and `ScrollableArea` for content that needs to scroll. These are
**components**: reusable pieces you combine to make a screen.

When a screen needs a different layout or control on one platform, use
[platform files](module-resolution.md). You keep one name in the rest of
the app, and the build selects the file for that platform. See
[building screens](primitives.md) and [styling](styling.md) for examples.
Sharing code still requires trying the result on each platform you use.

The [showcase record](demos.md#product-showcase) lists the framework's demo
checks. It is useful background when evaluating support; your own app
needs checks for the features it uses.

## The tools underneath

[Octane](https://github.com/octanejs/octane) turns your screen components into
UI that can respond to changing data. [NativeScript](https://docs.nativescript.org/)
lets TypeScript code use native iOS and Android views and device features.
TypeScript is the language you or your agent writes the app in.
Xplat supplies the shared components, device services, and project setup.

Read [how an app fits together](architecture.md) when you want to understand
where the pieces live. The [framework notes](framework-notes.md) explain
the compiler and other internals for framework contributors.
