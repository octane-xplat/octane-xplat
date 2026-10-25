<h1>
  <img src="apps/docs/src/assets/logo-mark.svg" alt="" width="32" height="34" align="middle">
  &nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/wordmark-dark.svg">
    <img src="apps/docs/src/assets/wordmark.svg" alt="Octane Xplat" width="222" height="30" align="middle">
  </picture>
</h1>

Build the app you imagine for **web, iOS, and Android** from one TypeScript
codebase. Share your screens and logic, then use each platform's capabilities
whenever your app calls for them.

Octane Xplat brings together [Octane](https://github.com/octanejs/octane)'s
compiled UI, [NativeScript](https://docs.nativescript.org/)'s native platform
access, and a growing ecosystem of officially supported packages.

## Make every improvement go further

Share screens, state, validation, and data access across platforms. Build a
feature in shared code and every target using it benefits. Fix a bug in one
place and keep your apps moving together.

**Shared code makes your AI agent's work go further, too.** There is less code
to read, generate, and keep in sync. More sharing can mean less context and
token usage, fewer inconsistent implementations, and less repeated review.
You and your agent can spend more attention on what makes your app worth using.

## Use the platform

Your iOS and Android apps render native views. NativeScript lets you use
OS-specific controls and device APIs directly from TypeScript, without writing
a bridge. Keep the integration in a
[platform-specific file](docs/platform/module-resolution.md) and share the rest
of your app. [How native access works](https://docs.nativescript.org/guide/metadata).

**Hot module replacement (HMR) works for TypeScript native integrations, too.**
Edit the code calling native APIs and see updates in the running app. That
keeps native experimentation fast. Compiled native code and configuration
changes can still require a rebuild.
[Development update loop](docs/start/toolchain.md#see-a-shared-edit-in-running-targets).

## Build with batteries included

Start with shared UI, navigation, styling, and a configured project. The CLI
brings development, builds, linting, formatting, typechecking, testing setup,
and diagnostics into one workflow. Included agent instructions and the Xplat
skill give your coding agent the conventions to work with.

Add officially supported packages as your app grows:

- **Polished interfaces:** [icons](packages/icons/README.md),
  [motion](packages/motion/README.md), sheets, and menus.
- **Device capabilities:** [camera](packages/camera/README.md),
  [audio](packages/audio/README.md), [video](packages/video/README.md), haptics,
  and location.
- **App foundations:** [authentication and secure storage](docs/platform/platform-services.md),
  [SQLite](packages/sqlite/README.md), and notifications.

The packages follow shared conventions and compatible releases, so more of
your effort stays focused on your app.

## Start building

With [Node.js and pnpm installed](docs/start/toolchain.md#create-and-run):

```sh
pnpm create octane-xplat my-app
```

The creator installs dependencies and starts the web development server.
Open the local URL it prints, then build with your editor, your coding agent,
or both. [Run on iOS and Android](docs/start/toolchain.md#run-on-ios-and-android)
when you're ready.

**Currently in alpha.** Web, iOS, and Android are included in the starter;
macOS, Windows, and Linux hosts are experimental. APIs can change.
[Platform support and limits](docs/start/spec.md#choose-your-targets).

[Documentation](https://octane-xplat.goddardai.org) ·
[Agent docs](https://octane-xplat.goddardai.org/llms.txt) ·
[Release notes](CHANGELOG.md) · [Bug fixes](FIXLOG.md) ·
[Contributing](CONTRIBUTING.md)
