# Octane Xplat

> Build apps for the web, iOS, and Android from ==one project==.

Octane Xplat gives you the pieces to build an app: screens, buttons, text
fields, navigation, and access to device features such as the camera. You can
share most of your code between a browser and a phone, and customize parts
for each when you need to.

You can write the code yourself, work with a coding agent, or mix the two.
If you're new to programming, start with a small app you can open in your
browser. You don't need to know React or set up a phone simulator to take
that first step.

## Start here

1. ==[Create your first app](toolchain.md#create-and-run)==. Set up the tools,
   create a project, and open the starter in your browser.
2. [Try your first change](toolchain.md#build-and-check-your-first-flow).
   Turn the starter into a packing checklist: add an item, mark it packed,
   and remove it.

If you're still deciding whether Xplat fits your idea, read
[what you can build](spec.md). The starter includes web, iOS, and Android.
Desktop support for macOS, Windows, and Linux is experimental and needs
additional setup; [choose your targets](spec.md#choose-your-targets) explains
the current limits. A **target** is a platform where you want your app to run.

## Grow your app one feature at a time

Pick the guide for what you want to do next. You don't need to read them all
before you start.

| I want to…                                         | Read this                                              |
| -------------------------------------------------- | ------------------------------------------------------ |
| Put text, buttons, and lists on a screen           | [Building screens](primitives.md)                      |
| Change colors, spacing, and fonts                  | [Styling screens](styling.md)                          |
| Let someone type into a form                       | [Enter and submit text](text-entry.md)                 |
| Move between screens                               | [Moving between screens](navigation.md)                |
| Add a sidebar or navigation bar                    | [Navigation layouts](navigation-ui.md)                 |
| Load information from a server                     | [Fetching data](data.md)                               |
| Save a setting, attach a photo, or share a link    | [Using device features](platform-services.md)          |
| Play audio or add vibration feedback               | [Audio and haptics](media-services.md)                 |
| Offer the app in another language                  | [Localizing an app](localization.md)                   |
| Make one part behave differently on iOS or Android | [Sharing files across platforms](module-resolution.md) |
| Check that a change works                          | [Checking an Xplat app](testing.md)                    |

A **component** is a reusable piece of a screen, such as a button or text
field. The [component index](components.md) lists the available pieces and
the options you can give them. [How an app fits together](architecture.md)
explains how screens, components, and device features connect.

Xplat is still at version `0.x`, so APIs can change between releases. An
**API** is the set of names and options your code uses to work with a tool.
Check [known limits](known-limits.md) when adding a feature you depend on,
and try it on each platform you plan to release for.

## Working with a coding agent

The starter includes instructions for your agent in
`.agents/skills/xplat/SKILL.md`. Ask it to read that file before changing the
app. The [first-app guide](toolchain.md#build-and-check-your-first-flow)
includes a prompt you can use and a few actions to try afterward.

Describe what you want someone using the app to be able to do. For example:
“Let me add packing items and mark them packed. Show how many are left.”
You can check that result by using the app, even while you're learning how
the code works.

For agents that need more context, [llms.txt](https://octane-xplat.goddardai.org/llms.txt)
lists the docs and [llms-full.txt](https://octane-xplat.goddardai.org/llms-full.txt)
contains their text. [Agent context and versions](toolchain.md#agent-context-and-versions)
explains the starter's instructions and optional NativeScript skills.

## Going deeper

Xplat uses [Octane](https://github.com/octanejs/octane) to build the screen UI
and [NativeScript](https://docs.nativescript.org/) to connect to native iOS
and Android views and device features. The guides above introduce these tools
where you need them.

For experimental desktop apps, see [Windows setup](windows-setup.md),
[Linux packaging](linux-package.md), or the macOS guides for
[WebView apps](macos-webview.md) and [native code](macos-native.md).
A WebView displays web content inside a desktop app.

## Notes

The notes are for people extending or debugging the framework. You can leave
them until you need that detail. They include past experiments, which may not
reflect current support.

Start with [status](status.md) for work in progress. The design record includes
[decisions](decisions.md), [open questions](open-questions.md), and
[demo evidence](demos.md). Detailed notes cover the
[framework](framework-notes.md), [architecture](architecture-notes.md),
[components](primitive-notes.md), [styling](styling-notes.md),
[navigation](navigation-notes.md), [device features](platform-notes.md),
[build tools](toolchain-notes.md), [file selection](module-resolution-notes.md),
[animation](animation-notes.md), [testing](testing-notes.md),
[CSS support](css-support-notes.md), [SQLite databases](sqlite-notes.md),
[smooth corners](smooth-corners.md), [charts](charts.md),
[Windows](windows-notes.md), and [SVG images on macOS](icon-svg-notes.md).
