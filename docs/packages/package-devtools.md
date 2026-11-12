# `@octane-xplat/devtools`

> Shared devtools hub, client, and macOS host for Octane Xplat apps

The devtools platform connects your running app to a separate devtools
window. `xplat dev` hosts the hub: the app and the Vite dev server each
register with it, and devtools panels exchange messages with either side
over named channels.

```sh
bun run xplat dev web     # app + dev-server backends in one session
bun run xplat devtools    # native devtools window, in a second terminal
```

`xplat devtools` discovers running `xplat dev` servers, opens your own
project automatically when it can, and shows a picker when several are
running. Built-in tabs cover sessions, actions, and logs; packages can
add their own tabs — [tweaks](package-tweaks.md) ships the first one.

On macOS the devtools window is native and can float above other windows
(the Keep on top toggle in its header). The native host needs the macOS
development packages — `xplat devtools` prints the exact install command
when one is missing. A browser build of the panel shell is also served at
`/devtools/app/` on the dev server; it shows the built-in tabs only, not
panel plugins.

## Add a panel plugin

A package contributes a devtools tab by pointing its manifest at a module
that default-exports a panel definition:

```json
{
  "octaneXplat": { "devtoolsPanel": "./devtools" }
}
```

The value names one of the package's own export subpaths. Define the panel
with `defineDevtoolsPanel`, which validates the id and returns the plugin:

```ts
import { defineDevtoolsPanel } from '@octane-xplat/devtools/panel'

export default defineDevtoolsPanel({
  id: 'tweaks', // /^[a-z][a-z0-9-]{0,31}$/, unique across plugins
  title: 'Tweaks', // tab label
  Panel: MyPanel,
})
```

The panel component receives the shared `DevtoolsConnection` and the
connection `state` (`'connecting' | 'live' | 'closed'`) as props. It sends
to app-side backends with `connection.sendToBackend(channel, targetId,
message)` and filters incoming frames through `connection.subscribe` —
see `@octane-xplat/tweaks/devtools` for a complete panel.

Discovered panels are collected from the project's `dependencies` and
`devDependencies` — and from `octane-xplat`'s own dependencies when the
project uses the umbrella package — into the `xplat devtools` window as
tabs after the built-ins. Entries that cannot be resolved or point outside
their package are skipped with a warning.

[API reference](https://octane-xplat.goddardai.org/api-devtools)
