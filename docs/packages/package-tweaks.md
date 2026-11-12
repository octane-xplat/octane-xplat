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
opens your app automatically, and shows separate Tweaks and Styles tabs
next to the built-in tabs:

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

Edits apply live to every mounted instance. Click **Save tweaks to source**
to write the new values back to the source literals; **Revert tweaks**
drops unsaved value edits and returns to the literals in your files.
These actions leave pending changes in Styles untouched.

## Edit styles

Open the **Styles** tab to edit inline `style={{…}}` objects and Bamboo
`css()` calls found by the same plugin. For example, add this component to
an app with `tweaks()` configured, then open its screen:

```tsrx
import { Text, View } from '@octane-xplat/ui'

export function StyledCard() @{
  <View style={{ padding: 16, borderRadius: 8 }}>
    <Text>Try changing the padding in Styles.</Text>
  </View>
}
```

Change `padding` in Styles to preview the result in the running web app.
**Pick element** narrows the list to the element you click; **Filter
properties** searches its properties. Dynamic expressions remain read-only.

**Save styles to source** writes style edits to your files; **Revert styles**
discards unsaved style edits. Neither action changes pending Tweaks values.
Each tab's unsaved count and Save include its own edits to components that
are no longer on screen. Property and element filters do not narrow Save.

## Limits

- Tweaks are live only under `xplat dev`. Apps started with `ns run`
  (`dev:ios`/`dev:android`) or production builds carry the plain literal.
- The native devtools app runs on macOS only and builds itself with the
  macOS host packages. Add them once:
  `bun add -D @octane-xplat/macos-build @octane-xplat/macos-appkit @nativescript/macos-node-api`.
  The browser `/devtools/app/` panel has neither editor tab.
- Style drafts preview on web only; Save still writes the source edit for
  inline styles on any target.
- Save rewrites your source files — commit or check the diff before
  saving edits you are unsure about.

[API reference](https://octane-xplat.goddardai.org/api-tweaks)
