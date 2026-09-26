# macOS experiment

This app-local spike uses `@nativescript/macos-node-api` to open an AppKit
window and an Octane universal host driver to mount one native text view.
Vite rebuilds the component on edits; the running Node process imports the new
component and re-renders the existing root. This uses Vite's bundle watcher,
not NativeScript's `/ns-hmr` transport.

The stable `@nativescript/macos-node-api@0.4.0` loader points at an architecture
path missing from that published artifact, so this spike pins the matching
`0.4.4-next` preview.

Run `pnpm --filter @xplat/macos dev` to launch it, or
`pnpm --filter @xplat/macos build` to compile the component bundle. This is an
experiment only; it does not add a macOS target to `@octane-xplat/cli`.
