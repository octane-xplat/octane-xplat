# `@octane-xplat/tweaks`

> Live-tweakable values for Octane Xplat apps

`useTweak` marks a literal — a color, a number, a label — as editable while
the app runs under `xplat dev`. The
[devtools app](package-devtools.md) shows every tweak in its Tweaks tab,
where you change values and see the result immediately; pressing Save writes
the new literal back into your source file.

```tsrx
import { Text } from '@octane-xplat/ui'
import { useTweak } from 'octane-xplat/tweaks'

export function Greeting() @{
  const title = useTweak('Welcome')
  <Text>{title}</Text>
}
```

With the dev server running, change `Welcome` to `Hello` in the Tweaks tab
and the screen updates in place. The change lives only in the running app
until you press Save — nothing touches your files before that.

## Set up tweaks

New apps created with `bunx create-octane-xplat` already include tweaks:
the generated `vite.config.ts` loads the plugin before the Octane plugins.

```ts
import { defineConfig, octane, css, boundary, tweaks } from 'octane-xplat/vite'

export default defineConfig({
  plugins: [tweaks(), css('web'), ...octane(), boundary('web')],
})
```

For an existing app, add `tweaks()` in the same position — first in the
plugins array, so it instruments `useTweak` calls before the Octane
compiler transforms them. On native targets pass it through the native
config's `extra.plugins` (the template does this for you).

The plugin strips itself out of production builds: a `xplat build` bundle
contains the plain literal, no tweaks code or metadata.

## Edit a running app

Start development the usual way — tweaks need the shared dev server:

```sh
bun run xplat dev web
```

Open devtools in a second terminal. It finds running `xplat dev` servers,
opens your app automatically, and shows the Tweaks tab next to the
built-in tabs:

```sh
bun run xplat devtools
```

Each `useTweak` call becomes a row named after its literal. Numbers and
colors get matching inputs; strings and booleans get text fields and
toggles. Give a tweak an explicit name, a group, or a custom input when
the default does not fit:

```tsrx
import { View } from '@octane-xplat/ui'
import { useTweak } from 'octane-xplat/tweaks'

export function Card() @{
  const radius = useTweak(8, {
    name: 'card.radius',
    group: 'card',
    input: { type: 'number', min: 0, max: 40, step: 1 },
  })
  <View style={{ borderRadius: radius }} />
}
```

Edits apply live to every mounted instance. Click **Save changes to
source** to write the new values back to the source literals; **Revert
all** drops unsaved edits and returns to the literals in your files.

The Tweaks tab can also draft style changes: it lists inline `style={{…}}`
objects and bamboo `css()` sites the plugin found in your source, lets you edit
them live in the running web app, and writes them back on Save alongside
the tweak values. **Pick element** narrows the style list to the site you
click in the web app.

## Limits

- Tweaks are live only under `xplat dev`. Apps started with `ns run`
  (`dev:ios`/`dev:android`) or production builds carry the plain literal.
- The native devtools app runs on macOS only and builds itself with the
  macOS host packages. Add them once:
  `bun add -D @octane-xplat/macos-build @octane-xplat/macos-appkit @nativescript/macos-node-api`.
  The browser `/devtools/app/` panel has no Tweaks tab.
- Style drafts preview on web only; Save still writes the source edit for
  inline styles on any target.
- Save rewrites your source files — commit or check the diff before
  saving edits you are unsure about.

[API reference](https://octane-xplat.goddardai.org/api-tweaks)
