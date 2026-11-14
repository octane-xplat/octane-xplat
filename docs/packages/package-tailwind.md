# Tailwind utilities

> Compile Tailwind classes with the Octane Xplat stylesheet pipeline.

The first public release is still pending. The package remains private while
native host qualification is completed. The instructions below describe the
release candidate, which can be installed from a maintainer-provided tarball.
The npm bootstrap placeholder has no supported API.

## Configure the compiler

Install the candidate as a development dependency in the app, alongside its
existing build tools. Use the same Xplat version as the app. The compiler runs
during development and builds; it adds no Tailwind runtime to UI or the CLI.

```sh
bun add -D ./octane-xplat-tailwind-0.20.0.tgz
```

Add the compiler after the app's existing Xplat preset. Web apps need the
platform CSS plugin; mobile and desktop presets already include it. Keep the
app's renderer and other plugins. Do not add a second Tailwind Vite or PostCSS
compiler.

```ts
// In the existing web Vite configuration's plugins list.
import { css } from '@octane-xplat/build/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

const stylingPlugins = [css('web'), tailwind()]
```

```ts
// In the existing mobile Vite configuration.
import { native } from '@octane-xplat/build/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

export default async ({ mode }: { mode: string }) => {
  const config = await native(mode)
  return { ...config, plugins: [...(config.plugins ?? []), tailwind()] }
}
```

Import the compiler entry from one global CSS file. Use the UI entry when
classes should read UI color and radius variables. UI structure is still
required; chrome supplies the default palette. Import sheets as JavaScript
modules so the platform build processes each one.

```ts
// src/main.ts — keep the app's existing mount code below these imports.
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'
```

```css
/* src/app.css */
@import '@octane-xplat/tailwind/ui.css';

.packing-card { border-width: 1px; border-color: #64748b; }
```

Classes are discovered in source files, including TSRX. Put complete class
names in the source instead of constructing fragments such as `bg-${color}`.
This example uses 16px padding, an 8px gap, and UI's runtime primary color.
On mobile, shared CSS pixels become device-independent layout units (DIP).

```tsx
import { View, Text } from '@octane-xplat/ui'

export function PackingCard() {
  return (
    <View className="packing-card flex flex-col gap-2 p-4 bg-primary rounded-lg">
      <Text className="text-sm">Ready to pack</Text>
    </View>
  )
}
```

Do not import UI's curated utility sheet with this compiler. Curated helpers
have different text sizes and corner treatments; they are a separate workflow.
See [required structure and optional chrome](../app/styling.md#required-structure-and-optional-chrome).
The compiler reports a conflicting curated import, including separate CSS modules.

## Use app themes

The UI entry keeps color and radius values in the app's theme. Define light and
dark color values as a pair, then select the mode on the owning `Theme`.
An explicitly light nested theme keeps its own palette when the outer mode
changes. This composition is qualified in the browser candidate; native root
and modal boundaries remain separate release gates.

```tsx
// src/ThemedPackingCard.tsx
import { defineTheme, Theme, View, Text } from '@octane-xplat/ui'

const packing = defineTheme({
  name: 'packing',
  tokens: { '--color-primary': ['#123456', '#654321'], '--radius-lg': '12px' },
})
const note = defineTheme({
  name: 'packing-note',
  tokens: { '--color-primary': ['#abcdef', '#fedcba'] },
})

export function ThemedPackingCard(props: { mode: 'light' | 'dark' }) {
  return (
    <Theme theme={packing} mode={props.mode}>
      <View className="bg-primary rounded-lg p-4">
        <Text>Packing list</Text>
        <Theme theme={note} mode="light">
          <View className="bg-primary p-2"><Text>Keep this note light</Text></View>
        </Theme>
      </View>
    </Theme>
  )
}
```

## Native generated CSS boundary

Native adaptation is a release candidate, not a promise that every Tailwind
class works on every renderer. The build checks generated declarations and
fails on unsupported output instead of dropping rules. Ordinary app CSS keeps
its declarations and ordering; the platform's existing limits still apply.

| Candidate output | Boundary |
| --- | --- |
| Flex/grid, explicit absolute edges, spacing and dimensions | Explicit px/DIP lengths, percentages and supported grid tracks; no intrinsic `min-content`, `max-content` or `fit-content` sizes. |
| Text size and line height | Shared text tokens use absolute lengths. Unitless or percentage line heights fail rather than becoming native lengths. |
| Colors and radii | UI references stay live. Use supported native colors and lengths in runtime variables; a build cannot inspect values supplied later. |
| Layers | Preserved across generated CSS and other app/framework sheets. Native importance and reversed important-layer priority remain unqualified. |
| Variants | Only the adapter's accepted simple selectors and media syntax. A successful build does not qualify resize, appearance or state-event delivery. |

Generated `!important`, property registrations, unsupported at-rules/selectors,
modern colors such as `oklch()`, relative/container units, mixed percentage/length
calculations, and properties or values outside the adapter's contract fail.
This includes common classes such as `font-bold`, `border`, transforms, hover
variants and default colored palettes when they require those features. Keep
browser-only candidates in browser leaves; do not suppress a native diagnostic.

```text
Screen.tsx          shared fallback
Screen.web.tsx      replaces that fallback on web
Screen.mobile.tsx   replaces it on iOS and Android
Screen.ios.tsx      replaces the mobile leaf on iOS
```

Source selection uses the official scanner's file inventory and Xplat's platform
preferences, not module-graph tree shaking. Different source extensions remain
independent. Explicit inline candidates are shared by every target compiling
the stylesheet and receive that target's validation.

```css
/* In a global stylesheet when candidates are not present in app source. */
@import '@octane-xplat/tailwind';
@source inline("flex gap-2 w-[200px]");
```

Preferred-leaf creation/deletion restores the correct fallback during development.
Removing a rejected native class also clears the compiler error; the next build
uses a fresh source snapshot. CSS Modules cannot contain the compiler entry.
Production CSS maps are unavailable in the current Vite extraction path;
development maps are a separate capability.

## Linux hosts

Linux's webview uses browser CSS and Linux source leaves. Preserve its existing
browser CSS preset and module conditions. GTK is a separate native renderer:
it uses the `gtk` CSS target and native generated-output diagnostics. Browser
computed styles do not qualify either a real Linux webview or GTK session.

```ts
// Styling portion of the existing Linux webview Vite configuration.
import { css } from '@octane-xplat/build/vite'
import { tailwind } from '@octane-xplat/tailwind/vite'

const config = {
  plugins: [css('web'), tailwind()],
  resolve: { conditions: ['linux', 'web'] },
}
```

Windows and an unspecified `native` CSS target fail explicitly. visionOS,
full GTK and Linux webview apps, native UI Theme/modal/media lifecycles, and
SSR/hydration of actual UI components still require separate qualification.
Keep these limits when evaluating the candidate; installed CSS compilation,
browser layout and native object/style measurements establish different things.
