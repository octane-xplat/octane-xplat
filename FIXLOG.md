# Fixlog

Selected bug fixes, newest release first. Features and breaking changes appear
in the [changelog](CHANGELOG.md).

Earlier fixes remain in the original [combined changelog](CHANGELOG.md) and
[tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

## [Octane Xplat 0.18.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.18.0) - 2026-10-28

### Declare Bamboo's build targets for custom Vite builders

Cloudflare SPA builds can leave a configured SSR target unused. Declare the
targets your builder runs to avoid Bamboo's incorrect incomplete-run warning
while keeping CSS pruning enabled. Include real SSR targets when present.

```ts
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

const plugins = xplatBamboo({
  buildEnvironments: ['api', 'client'],
})
```

See [build participation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/bamboo#custom-builders-with-unused-environments).

### Button matches the Astryx default

Fixed `Button` differences from Astryx's default button:

- A loading button no longer fades out as if it were disabled.
- Long labels now end in an ellipsis instead of overflowing the button.
- The loading spinner is now Astryx's small 14px ring, on web and native.
- On native, a loading button keeps its label in place underneath the spinner instead of being replaced by it, so its size and accessible name don't change. While busy it announces `accessibilityValue: "Loading"`.

### Loading buttons now report busy and keep their accessible name

A `Button` that is `isLoading` or has an in-flight `clickAction` on web now
exposes `aria-busy="true"`, stays disabled (unless `isInterruptible`), keeps
its label rendered — hidden beneath the spinner so width and accessible name
survive — and announces "Loading" through a visually hidden
`role="status"` live region.

```tsx
<Button label="Save" clickAction={save} />
// while pending: aria-busy="true", aria-disabled, live region reads "Loading"
```

Previously the loading swap replaced the content entirely, collapsing the
button's width and dropping its accessible name. See
[Button](https://octane-xplat.dev/app/components/).

### No more `title="undefined"` on untooled buttons

`web` escape props carrying `null` or `undefined` now remove the reflected
attribute instead of stringifying the value. A `Button` without `tooltip` no
longer exposes `title="undefined"`, which had leaked into its accessible
name on web.

```tsx
<Button label="Save" /> // renders without a title attribute
```

See [`web` escape props](https://octane-xplat.dev/app/styling/).

### Buttons paint the Astryx hover and pressed overlays on web

`Button` — and every component built on it, like `ToggleButton` and
`DropdownMenu` triggers — now answers pointer hover with the
`--color-overlay-hover` wash and a press with `--color-overlay-pressed`,
layered over the variant's own fill like upstream's interaction overlay.
Previously web buttons showed no hover or pressed feedback at all.
Disabled and aria-disabled buttons stay inert.

### Card matches Astryx's default padding and corner radius

`Card` now takes the theme's card padding — upstream's
`--astryx-card-padding` (12px in Neutral, 18px in Matcha and Y2K, 16px
elsewhere) with the 1px border inset — and rounds with the container radius
(`--radius-container`, overridable per theme via `--_card-radius`). Previously
cards rendered with no padding on the root and a fixed 8–10px radius; header,
body, and footer slots carried their own 12px padding.

```css
/* A named theme can retune card geometry by redeclaring the override vars: */
'--astryx-card-padding': '18px',
'--_card-radius': '42px',
```

Cards that relied on the old unpadded root may need an explicit
`padding` prop; `padding={n}` still overrides the theme default entirely.

### Hide inactive chat scroll buttons on web

`ChatLayoutScrollButton` now removes its button when `isVisible` is false,
so hidden controls cannot receive clicks or keyboard focus. This matches the
native component's behavior.

```tsx
import { ChatLayoutScrollButton } from '@octane-xplat/ui/chat'

<ChatLayoutScrollButton isVisible={false} onPress={() => {}} />
```

[Chat components](https://octane-xplat.goddardai.org/app/components#chat)

### Typecheck Vite configs with separate PostCSS patches

Importing the CLI's Vite helpers no longer pulls their PostCSS implementation
into your app's typecheck. This fixes excessive comparison stack errors when
Vite and the CLI resolve different compatible PostCSS 8 patches. Your existing
PostCSS options and plugins continue to work.

```ts
import { defineConfig } from 'vite'
import { xplatCss } from '@octane-xplat/cli/vite'

export default defineConfig({
  plugins: [xplatCss('web')],
  css: { postcss: { map: { inline: false }, plugins: [] } },
})
```

[Platform CSS documentation](https://octane-xplat.goddardai.org/styling#style-one-platform)

### Stop sending development actions to expired app instances

Apps leave the live action registry after 15 seconds without a heartbeat.
New actions cannot target an expired instance, and outstanding jobs report
`disconnected_runtime` instead of waiting for the action timeout. Check app
state before retrying an action whose outcome is unknown.

```sh
pnpm exec xplat actions list --json
```

[Development actions](https://octane-xplat.goddardai.org/testing/development-actions)

### Select development devices and boot iOS simulators reliably

`xplat dev` accepts `--device` to select an exact device, optionally alongside
`ios` or `android`. iOS development and owned session launches boot simulators
through `simctl`, including when the selected Xcode has no Simulator.app.

```sh
pnpm exec xplat dev ios --device DEVICE_UDID
```

Replace `DEVICE_UDID` with an identifier from `pnpm exec xplat targets --json`.
See the [development setup guide](https://octane-xplat.goddardai.org/start/toolchain).

### Keep the dictation stop button usable

`ChatDictationButton` now composes the shared icon-only Button at its requested
size. Starting dictation no longer collapses the web stop target when the
microphone icon disappears. Browser capability and OS speech support remain
separate requirements.

```tsx
import { ChatDictationButton, useChatDictation } from '@octane-xplat/ui/chat'

function DictationButton() {
	const dictation = useChatDictation()
	return <ChatDictationButton dictation={dictation} size="md" />
}
```

[Chat components and platform limits](https://octane-xplat.goddardai.org/app/components#chat)

### Labelled FormField no longer crashes on re-render

Fixed a web crash when a labelled `FormField` re-rendered, for example when the value of the input inside it changed.

### Headings render the Astryx type scale

`Heading` now applies the theme's `--text-heading-*` tokens — size, weight,
and line-height for levels 1–6 — on web, iOS/Android, and macOS. Previously
web fell back to browser defaults (32px bold h1, 24px bold h2) with no
line-height, and body text had no Astryx leading.

### Native dev boot in hoisted pnpm workspaces

Apps inside a `nodeLinker: hoisted` pnpm workspace (where the app's own
`node_modules` is empty and packages install at the workspace root) crashed
on iOS/Android dev boot with `TypeError: __octaneUniversalPlan is not a
function`. The dev server could not read the package's `package.json` at
`<app>/node_modules`, so a vendored package's deep `dist/` specifier never
folded back to its bare package id and the device vendor registry missed
it. The patch now resolves installed package metadata through Node's
ancestor `node_modules` chain, matching pnpm hoisted, npm, and Yarn classic
workspace layouts — no app changes needed.

```yaml
# pnpm-workspace.yaml at the workspace root
packages:
  - 'apps/*'
nodeLinker: hoisted
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).

### Text fields get the Astryx hover and focus rings on web

`TextInput` and `TextArea` shells now match upstream's input chrome:
hover draws a 2px inset ring at 30% of the border color, and focusing
the field swaps the border to `--color-accent` with an inset
`--color-accent-muted` ring — including the status variants, which keep
their status border and answer hover with their own inset shadows. The
ring moves from the inner text leaf's 1px outline to the field's
bordered box, so the focus indicator frames the whole control. Bare
`TextInput` leaves outside a bordered shell (for example inside menus)
keep their thin focus outline.

### Keep layered screens responsive when text collapses

On iOS, measuring or requesting layout in a layered `Screen` containing
collapsed `Text` no longer causes a repeating layout loop. Timers continue
running as the text changes between collapsed, hidden, and visible states.

Rebuild the native app after upgrading to load the corrected engine.

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)

### Badge accepts plain text children on macOS

`<Badge>3</Badge>` no longer crashes on macOS with "cannot contain text-only
children" — the string renders inside a text label like it does on the web.
On iOS and Android, raw string children now render too; they were previously
dropped silently.

### Collapsible string triggers and `axis="both"` scroll views work on macOS

`Collapsible` no longer crashes on AppKit when its `trigger` is a plain
string — text triggers are wrapped in a text element instead of landing as
a raw text node inside a view container. `ScrollableArea` with
`axis="both"` no longer throws an orientation validation error; both scroll
axes are enabled as documented.

```tsx
<Collapsible trigger="Profile">…</Collapsible>
<ScrollableArea axis="both">…</ScrollableArea>
```

### Render the macOS command palette in its owning window

An open CommandPalette on macOS now mounts its content through its sheet target and retains its declaring component's context. BottomSheet also honors an explicit style width when opening its surface.

[Command palette](https://octane-xplat.goddardai.org/app/primitives)

### Keep macOS component layouts aligned with web

On macOS, Item rows now place leading content, the label and description, and trailing content in order across the row.

Button and Pressable now start without a border; authored border styles still apply.

Open drawers keep their content height, and Absolute overlays share the same top-left origin on macOS.

Checkboxes, radio indicators, Meter frames, and slider layers now follow their shared sizes and alignment on macOS.

Inactive Tabs panes collapse while their content stays mounted for later selection.

[Shared components](https://octane-xplat.goddardai.org/app/primitives)

### Wrap long text on macOS

Long labels now grow to fit their available width instead of keeping a
single-line height. An explicit height still controls the frame.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function Caption() {
	return <label text="A longer caption that can occupy several lines" style={{ width: 160 }} />
}
```

[AppKit label documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer)

### Packaged macOS apps lay out Mason content

Packaged macOS apps previously rendered `masonview` content empty: the Mason
layout engine library was not part of the published
`@octane-xplat/macos-renderer` package and never reached the app bundle.
The package now ships the engine prebuilt and `xplat build` copies it into
`Contents/Frameworks`, so packaged apps lay out without any extra setup.

[macOS native packages documentation](https://octane-xplat.goddardai.org/macos-native)

### Section stacks children vertically on macOS

On macOS, `Section` laid out its children in a row instead of stacking them
vertically like every other platform. It now defaults to a column layout;
pass `flexDirection: 'row'` in `style` to lay children out horizontally.

### Align macOS text entry with shared field metrics

TextInput and TextArea on macOS now use the shared content insets, placeholder colors, and line heights. TextArea includes padding when sizing rows and growing to its content. Styling a control's background or border preserves its native bezel and background settings.

[Text entry](https://octane-xplat.goddardai.org/app/primitives)

### setThemePreference drives the app appearance on macOS

On macOS, `setThemePreference('light' | 'dark')` now pins the application
appearance (`NSApp.appearance`), so CSS root classes, `prefers-color-scheme`
media queries, and native controls follow the preference instead of only the
OS setting. `setThemePreference('system')` clears the override and follows the
system again.

### Keep bracketed text separate from Markdown links

A closed bracket marker before a link no longer becomes part of the link's
label. This also keeps source citations independent of nearby links.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

<Markdown text={'[note] Read the [guide](https://example.com/guide).'} />
```

[Markdown guide](https://octane-xplat.goddardai.org/app/content-display#markdown-documents)

### Keep image previews in their frame

Web `AspectRatio` now reserves its requested shape even when an image has a
different intrinsic size. Thumbnail preview and remove actions also work
independently with pointer and keyboard input. Dragging a zoomed Lightbox image
keeps the image zoomed after release.

```tsx
import { AspectRatio, Image } from '@octane-xplat/ui'

export function PhotoPreview() {
  return <AspectRatio ratio={16 / 9}><Image src="/photo.png" alt="Coastline" /></AspectRatio>
}
```

[Media components](https://octane-xplat.goddardai.org/app/components#content)

### Native CheckboxInput draws the Astryx check icon

On iOS and Android, a checked `CheckboxInput` now draws Astryx's check icon — the same mark web already rendered — instead of a ✓ text glyph. The check is a 14px drawn icon (12px at `size="sm"`), matching the 24px box on every platform.

### Start native dev sessions from a clean cache

The first development launch after clearing the dev-server cache could stop
before the app appeared. A native plugin failed with
`Class extends value undefined`, or the first screen stayed blank with
`<svgview> is not a registered element`. Plugin files now load in dependency
order, and each package runs only once, so the first launch boots like later
ones. Verified on an Android emulator.

[Run on iOS and Android](https://octane-xplat.dev/start/toolchain/#run-on-ios-and-android)

### Navigate when the root Frame is registered after the first render

On iOS and Android, an app that rendered its routes before registering the
root `Frame` could not navigate. Every push failed with
`Native Frame did not become ready`. The router now picks up the Frame when it
is registered, or at the next navigation, whichever comes first.

```ts
import { Application, Frame, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { registerStack } from '@octane-xplat/ui/routing'
import { App } from './App'

Application.run({
	create: () => {
		const frame = new Frame()
		const page = new Page()
		renderNativeScriptApp(page, App)
		frame.navigate({ create: () => page })
		registerStack('root', frame)
		return frame
	},
})
```

[Move between screens](https://octane-xplat.dev/app/navigation/)

### Native dev vendor bundle honors Vite resolve.alias

Native dev sessions (`xplat dev` on iOS/Android) could boot with stub
modules when a `resolve.alias` entry redirected a package that is not
installed — for example a renderer alias that maps full MasonKit imports to
Mason core. The vendored dependency bundle ignored the app's aliases and
bundled throw-on-evaluate stubs, so importing the package failed at startup.
The dev server now replays Vite `resolve.alias` inside its dependency and
vendor bundle passes: aliases for absent packages resolve to real files
while installed packages keep their default resolution. No app changes are
required beyond the aliases you already declare.

```ts
// vite.config.native.mts
export default {
	resolve: {
		alias: [{ find: '@octane-xplat/nativescript-masonkit', replacement: '/abs/path/to/mason-core/index.ios.js' }],
	},
}
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).

### Fill native screen layers around intrinsic content

On iOS and Android, a nested `Screen` now fills the space assigned by its
parent instead of shrinking to its content's natural height. Its native shell
can also shrink with its parent without a fixed native height.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'

export function PlayerLayer() {
	return <Grid rows="*" columns="*" style={{ width: 300, height: 500 }}>
		<View row={0} col={0}><Text>Library</Text></View>
		<View row={0} col={0}>
			<Screen><Text>Player</Text></Screen>
		</View>
	</Grid>
}
```

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)

### Keep image grids within their available width

On iOS and Android, percentage-sized images now fit their share of a grid
instead of making its columns grow to the image's natural width. This also
works when an image sits inside a flex-growing tile.

```tsx
import { Grid, Image } from '@octane-xplat/ui'

export function ThumbnailPair({ src }: { src: string }) {
	return <Grid columns="*,*" style={{ width: 402 }}>
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
	</Grid>
}
```

Rebuild the native app after upgrading to load the corrected engine.

[Image sizing](https://octane-xplat.goddardai.org/primitives#fit-and-position-an-image)

### Route-change focus ring and stray toast-layer box removed

On web, navigating to a page moves focus to its heading for screen readers —
that scripted focus no longer paints a browser focus outline on the heading.
Keyboard focus rings on interactive elements are unchanged.

The empty toast layer no longer leaves a full-width strip at the top of the
page: its top-layer viewport now sits inside zero-footprint
`display: contents` wrappers and anchors to the configured edge, matching the
Astryx markup. Toast announcements flow through the shared document-level
live regions instead of per-viewport nodes.

### Build iOS apps with shared font support

iOS apps can use Mason core and `@nativescript/font-manager` together without
duplicate FontManager module errors. The app now links one native font library.
Upgrading also aligns an explicitly declared FontManager plugin with the
supported version. Rebuild the native app to receive the correction:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm build:ios
```

[Upgrade framework packages](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)

### Show text-area field labels and status

Fixed `TextArea` differences from Astryx's default text area:

- A standalone `TextArea` now renders its `label`, `description`, `status`, and required/optional markers as visible field chrome on web and native, like `TextInput` already does — previously the field rendered the textarea alone.
- The textarea now sits inside Astryx's bordered box on web (8px radius, emphasized border), with the status icon pinned inside its top end.
- Text metrics now match Astryx: 14px/20px type, 4px block padding (8px at `size="lg"`), so a 3-row field measures 68px instead of 51px.
- The web field keeps Astryx's manual vertical resize handle; `autoGrow` still suppresses it since it owns the height.

[Input components](https://octane-xplat.goddardai.org/components#inputs)

### TextInput label focuses its input on web

Clicking a `TextInput` label on web now focuses the input.

### TextInput startIcon renders on native and spaces like Astryx

`TextInput`'s `startIcon` now renders on iOS and Android — it was silently
dropped before — and a registered icon name resolves to an `Icon` on web
instead of printing as text. On web, the icon sits 8px inside the field with
an 8px gap to the text, matching Astryx's input wrapper; the same 8px now
separates the field from its clear and status affordances.

```tsx
<TextInput label="Search" isLabelHidden placeholder="Search…" startIcon={<Icon name="xplat-search" size={16} />} />
```

### ToggleButtonGroup renders and matches Astryx's pill layout

`ToggleButtonGroup` produced an empty render — every platform variant
accessed `Context.Provider`, which Octane's `createContext` removed (the
context itself is the provider). The group now renders its
`ToggleButton` children on web, native, and macOS.

The web look now follows Astryx: the group is a row of separated ghost
pills on a `--spacing-1` gap rather than the segmented `ButtonGroup` strip,
the pressed fill is `--color-overlay-pressed`, and the pressed label goes
semibold with a hidden twin reserving the wider width so toggling doesn't
shift the row. Group members no longer run `pressedChangeAction` — inside
a group, selection belongs to `value`/`onChange`.

```tsx
<ToggleButtonGroup label="Filter" value={tab} onChange={setTab}>
	<ToggleButton value="all" label="All" size="lg" />
	<ToggleButton value="themes" label="Themes" size="lg" />
</ToggleButtonGroup>
```

See [the ToggleButton block templates](https://github.com/facebook/astryx/tree/main/packages/cli/assets/templates/blocks/components/ToggleButtonGroup) for the upstream contract.

### Web apps get the Astryx font smoothing

The shared web normalization now applies
`-webkit-font-smoothing: antialiased` and
`-moz-osx-font-smoothing: grayscale` to the document body, matching
upstream's `reset.css`. Text renders slightly lighter — the same weight
the Astryx themes are designed around — instead of the DOM's heavier
subpixel default.
