# Goal counter

> Reach a five-step goal and see each change immediately.

## Try it

Choose **Complete one step** five times. The count reaches 5 and says “goal reached!”.
Choose **Undo one step** to return to 4. **Reset goal** restores 0.

Choose **Try in browser** below to load the web preview. Use Tab to move through controls
and Enter or Space to activate buttons. **Close preview** returns focus to the launch button.
**Open standalone** gives the demo its own page with a **Back to docs** link.
If loading fails, use **Retry** or open standalone; these instructions remain readable.

State belongs to this demo instance. Reset changes only this demo. Closing or reloading
starts fresh. All content is bundled; after loading, interactions work without a network.
This does not mean the docs or demo can be first-loaded offline.

## View source

[Shared demo source](../../packages/demos/src/GoalCounter.tsrx) ·
[Browser host](../../apps/docs/src/demo.web.tsrx)

## Run locally

This example lives in the Octane Xplat repository. First install Git, Node.js and Bun
using the [toolchain guide](../start/toolchain.md). In a terminal, download and enter the repository:

```sh
git clone --recurse-submodules https://github.com/octane-xplat/octane-xplat.git
cd octane-xplat
bun install
```

To run the browser example:

```sh
bun run --filter @xplat/docs dev
```

Open `http://localhost:5300/demo.html?demo=goal-counter`. You should see **Goal counter**'s task
and controls. Stop the server with Ctrl+C when finished.

For a native example, install the platform's tools from the [toolchain guide](../start/toolchain.md#run-on-ios-and-android).
On macOS, iOS requires Xcode and an available simulator. Android requires the Android SDK
and an emulator or connected device. From the repository root, choose one:

```sh
bun run --filter @xplat/mobile demos:ios
```

```sh
bun run --filter @xplat/mobile demos:android
```

In the **Docs demos** native menu, select **Goal counter** and repeat the task above.
This uses the shared source in a native runtime; the browser preview does not verify native behavior.

## Platform evidence

The browser demo was checked in Chromium, Firefox and WebKit, including keyboard use,
reset, offline interaction after loading, and narrow standalone pages at 200% text size.
The shared demo's native interactions passed tests on an iOS 27 simulator; the isolated
iOS demo app also built successfully. Native tests dispatch control handlers and do not
prove OS touch hit-testing or screen-reader speech.

Android has the shared source and a run command, but runtime behavior has not been
verified in this delivery. No desktop runtime or Linux GTK behavior is promised.
The demo fits its container; it does not fix the docs shell's existing narrow-screen width issue.
