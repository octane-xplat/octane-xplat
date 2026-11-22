# `@octane-xplat/devtools`

> Shared DevTools hub, client, and browser and macOS hosts for Octane Xplat apps

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
add their own tabs — [tweaks](package-tweaks.md) supplies the Tweaks and Styles editors.

On macOS the devtools window is native and can float above other windows
(the Keep on top toggle in its header). The native host needs the macOS
development packages — `xplat devtools` prints the exact install command
when one is missing. A browser build of the panel shell is also served at
`/devtools/app/` on the dev server and shows the built-in tabs.

To load the selected project's tabs in your browser, start its development
session and run this from the app directory in a second terminal. The app needs
its Vite toolchain installed. Open the loopback URL printed by the command.

```sh
bun run xplat devtools --web
```

Run the command again after editing a panel. Each build has its own URL and
stays available until the development session ends.

## Slow down motion in a running app

Open **Sessions**, choose the gear beside your app, and set **Motion speed** to **Slow (0.25×)**. A 300 ms transition takes about 1.2 seconds, and delays tied to the animation slow down with it. Choose **Normal (1×)** to restore full speed.

From the app directory, use the CLI to read or change the rate while `xplat dev` is running. If more than one app is connected, use `xplat session list --json` to find the `appInstanceId` and pass it as `--instance`. The set command returns the effective rate after the app confirms it.

```sh
xplat motion set-rate --rate 0.5 --json
xplat motion get-rate --json
xplat motion set-rate --rate 1 --json
```

To start each new development instance at half speed, add the following to your app's `package.json`. Restart `xplat dev` after changing this setting.

```json
{
  "xplat": {
    "dev": {
      "motionRate": 0.5
    }
  }
}
```

App code can set the rate during `xplat dev`. All three controls update the same clock. Rates can be any number greater than `0` and at most `1`.

```ts
import { getMotionRate, setMotionRate } from '@octane-xplat/platform/motion/dev'

if (import.meta.env.DEV && !import.meta.env.SSR) {
  setMotionRate(0.5)
  console.log(getMotionRate())
}
```

Use a motion timer when app code needs to wait for visual work and the
animation has no completion callback. This example schedules a cancellable
300 ms delay in motion time.

```ts
import { scheduleMotionTimer } from '@octane-xplat/platform/motion-clock'

const cancel = scheduleMotionTimer(() => console.log('Visual delay elapsed'), 300)
// Call cancel() if the visual work is replaced or disposed before the delay.
```

Motion playback, UI scalar animations, and RollingText use motion time. The
control appears after the app loads a participating animation module or imports
the development API. Already-running host-delegated tweens finish at their
original speed. New Motion tweens use the shared clock at slow rates. Ordinary
timers, standalone CSS animations, OS navigation animations, and reduced-motion
settings keep their usual behavior. Windows uses the experimental WinUI host.
Linux is outside this feature's scope.

## Host a backend from another development tool

A tool that already starts the app can spawn
`xplat devtools --project <app-directory> --host-backend <entry.mjs>`
with a private pipe connected to stdin. Octane starts a discoverable loopback
hub for the selected app and runs the entry with Node from the app directory.
The entry receives `XPLAT_DEV_BACKEND` and can use `connectDevBackend` from
`@octane-xplat/devtools/backend`. Keep the grant in the backend process.

The parent tool keeps the pipe open while the session is active. Closing the
pipe stops the backend and retires the discovery record. A backend exit ends
the hub too. An ordinary `xplat devtools` invocation can open the session on
macOS. The parent tool remains responsible for starting the app and Vite.
Only one hub can own discovery for the same app directory at a time.

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

A package can contribute several tabs by listing export subpaths in display
order. Each module default-exports its own `defineDevtoolsPanel` result:

```json
{
  "octaneXplat": {
    "devtoolsPanel": ["./devtools", "./devtools/styles"]
  }
}
```

Discovered panels are collected from the project's `dependencies` and
`devDependencies` and from `octane-xplat`'s own dependencies when the
project uses the umbrella package. Both launch commands display these as
tabs after the built-ins. Entries that cannot be resolved or point outside
their package are skipped with a warning.

[API reference](https://octane-xplat.goddardai.org/api-devtools)
