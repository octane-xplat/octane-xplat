# Xplat Tailwind integration development

This private workspace is the implementation of the Xplat-owned integration.
It uses the official Tailwind v4 compiler and reads the renderer target from
Xplat's platform CSS preset. It is not ready to publish: native adaptation,
consumer qualification and release setup remain
required by the [styling constraints](../../.agents/docs/notes/styling-notes.md#original-shared-pipeline).

The private `ui.css` entry registers UI's color and radius token names with the
compiler. Values remain in UI's runtime styles, so generated utilities follow
theme scopes and mode changes. The app must supply those values through UI
chrome, a `Theme`, or its own CSS. This entry replaces the plain Tailwind import:

```css
/* app.css — processed by xplatTailwind() */
@import '@octane-xplat/tailwind/ui.css';
```

The bridge is generated from UI's default token names and chrome declarations.
After changing that inventory, regenerate it with:

```sh
cd packages/tailwind
bun run sync:ui-theme
```

The native adapter is a candidate for host qualification. It checks generated
utilities, preserves normal cascade layers through the owning build preset,
and reports unsupported output instead of stripping it. Ordinary app CSS is
not filtered by a Tailwind property allowlist. The shared theme uses pixel-based
spacing, text sizes, radii and breakpoints on every target; native output converts
those lengths to DIP. This does not qualify the hosts' rendering behavior.

Generated dimensions are checked with the existing value parser. The unit check
recognizes unitless numbers, `px`, `dip` and `%`; `fr` is limited to grid tracks
and custom-property definitions. Other units fail explicitly, including `pt` and
container units such as `cqw`. These candidates pass the unit boundary:

```css
@import '@octane-xplat/tailwind';
@source inline("grid grid-cols-[1fr_2fr] w-[50%]");
```

This unit check does not validate every property's value grammar or values hidden
behind runtime variables. Those contracts still require separate qualification.

Compilation is configured during Vite's `config` hook after platform CSS setup.
Changing PostCSS in `configResolved` misses the per-environment configuration.
The compiler preserves its AST for source maps and leaves minification to Vite;
it calls the public `@tailwindcss/node` compiler and `@tailwindcss/oxide` scanner
for each source snapshot. This avoids retaining rejected native utilities after
their class names are removed. The AST bridge is adapted from Tailwind's MIT
implementation; see `THIRD_PARTY_NOTICES`. Import the entry from a global CSS
stylesheet; CSS Module entries are rejected.

The official scanner discovers source files; Xplat selects platform leaves from
that inventory before the scanner extracts class names. A `.web.tsx` sibling
replaces the default `.tsx` on web; iOS uses `.ios`, then `.mobile`, then the
default. Other hosts follow Xplat's platform-file rules. Different source
extensions remain independent. Explicit `@source inline()` candidates apply
to every target using that stylesheet and still pass native validation.

```text
Screen.tsx          # default classes
Screen.web.tsx      # replaces Screen.tsx on web
Screen.mobile.tsx   # replaces Screen.tsx on iOS/Android
Screen.ios.tsx      # replaces Screen.mobile.tsx on iOS
```

Preferred-file additions and deletions invalidate the stylesheet in development,
including restoration of fallback classes. This selection does not tree-shake
the module graph or evaluate dynamic class strings.

The Linux webview uses browser CSS and selects Linux source leaves from the
project's module conditions. GTK uses the separate `gtk` target and the native
adapter. Keep the Linux webview's existing browser CSS preset and conditions:

```ts
// Existing Linux webview configuration
import { xplatCss } from '@octane-xplat/build/vite'
import { xplatTailwind } from '@octane-xplat/tailwind/vite'

const config = {
  plugins: [xplatCss('web'), xplatTailwind()],
  resolve: { conditions: ['linux', 'web'] },
}
```

Vite's production CSS extraction does not emit a CSS source-map asset; do not
claim production CSS maps from compiler or development-map evidence.

Check an isolated tarball installation through the package's Turbo task. This
exercises CSS compilation and declaration resolution outside the workspace;
it does not establish native runtime or rendering support:

```sh
bun run turbo run test:packed --filter=@octane-xplat/tailwind
```

For Chromium computed-style and layout checks using that installed CSS, follow
the separate [browser qualification workflow](../../tools/tailwind-qualification/README.md).
It remains opt-in and establishes no native runtime or painting behavior.
