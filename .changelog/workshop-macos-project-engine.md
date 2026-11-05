### Install the macOS workshop engine in the app

The macOS component workshop now uses the project-installed macOS development
engine directly, keeping its host assets separate from the native CLI download.

**Breaking change:** macOS workshop projects must install the matching macOS build
package before launching. Web workshop projects do not need this optional peer.

```sh
bun add -D @octane-xplat/macos-build
bun run xplat workshop dev --target macos
```

See [the macOS workshop](https://octane-xplat.goddardai.org/component-workshop#macos-target)
and [the project engine](https://octane-xplat.goddardai.org/package-macos-build#call-the-development-engine-from-node).
