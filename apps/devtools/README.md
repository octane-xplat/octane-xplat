# Develop the DevTools UI

After installing the repository dependencies, start the browser preview from
the repository root and open the loopback URL Vite prints.

```sh
bun run turbo run dev:web --filter=@octane-xplat/devtools-desktop
```

Once Turbo has prepared the workspace, `bun run dev:web` from `apps/devtools`
starts Vite directly.

The preview starts with two simulated app sessions. Open **Actions** and run
**Refresh catalog**, then turn on **Fail actions** and run it again to see the
error state. **Logs** streams a sample entry each second. **Tweaks** and
**Styles** start with unsaved edits. Their Save and Revert controls change the
fixture in memory. **Reset scenario** restores the starting state.

Use **Simulated connection** to switch between connected, empty, connecting,
and disconnected states. The preview uses the shared
[panel source](../../packages/devtools/src/panel/App.tsrx) and loads the
contributed tabs from this app's dependencies. Vite hot-updates the panel
when you edit its components or styles.

For AppKit or a real app connection, run the macOS DevTools app and start the
target app's `xplat dev` session in a separate terminal.

```sh
cd apps/devtools
bun run dev
```
