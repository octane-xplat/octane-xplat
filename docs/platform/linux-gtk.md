# Package a Linux GTK4/GJS app

> Package your screens as an experimental Linux app that draws real GTK4
> widgets — no WebView.

This is an advanced setup guide for an existing Octane app.
Start with [the browser app](../start/toolchain.md#create-and-run) first.
The **GTK runtime** is the second value of `xplat.targets.linux.runtime`:
where `"webkitgtk"` shows your web UI inside a system WebView, `"gtk"`
renders the same components with native GTK4 widgets through the GJS
JavaScript engine.

The runtime is experimental and early. Install the experimental renderer package alongside the CLI. A counter and retained route panes have run in a real GJS/GTK session
with programmatic event dispatch. Packaging remains build evidence; OS input,
visual parity and the complete shared UI are not qualified by those checks. For the qualified webview
target, see [Package a Linux WebKitGTK app](linux-package.md).

## Install the renderer

Run these commands in your app directory after the first stable automated GTK release
has published. Keep Xplat packages on the same release; the one-time `0.0.1`
registry stub has no supported API.

```sh
bun add @octane-xplat/linux-gtk @octane-xplat/ui octane
bun add -D @octane-xplat/cli @octanejs/vite-plugin vite
```

The npm package includes JavaScript and declarations. GJS and GTK4 come from
your Linux distribution. The default `Gtk.Box` layout needs no native build;
it approximates flex layout and does not implement grid, reverse directions,
or full alignment. For optional Mason layout, see the
[renderer setup](../../packages/linux-gtk-renderer/README.md#optional-native-layout).

## Configure the app

Add the Linux target to `package.json` with the `gtk` runtime:

```json
{
	"version": "1.0.0",
	"scripts": { "build": "xplat build --targets linux" },
	"xplat": {
		"targets": {
			"linux": {
				"runtime": "gtk",
				"package": {
					"applicationId": "com.example.MyApp",
					"productName": "My App",
					"executableName": "my-app",
					"viteConfig": "vite.gtk.config.ts"
				}
			}
		}
	}
}
```

`applicationId`, `productName`, `executableName`, and `version` follow the
same rules as the WebKitGTK target; see [its configuration
reference](linux-package.md#configure-the-app). `viteConfig` defaults to
`vite.gtk.config.ts`. `host.scheme` is not needed — the GTK host has no
incoming-link handling yet.

Create `vite.gtk.config.ts` using the CLI's GTK preset:

```ts
import { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'

export default async (env: { mode: string }) => xplatLinuxGtk(env)
```

The preset registers the `gtk` renderer, resolves `.gtk` files before
shared ones, keeps `gi://` imports external (the system GTK libraries
provide them at load time), and emits one ESM file, because `gjs -m`
executes a single file — code splitting would produce an unloadable
import. GTK screens use the shared JSX contract; put platform-specific
variants in `.gtk.tsrx`/`.gtk.tsx` files.

`@octane-xplat/ui` resolves a curated `gtk` export condition. It includes
`Text`, `Pressable`, the `View`/`Stack` family, `Grid`/`GridSpan`, `Center`,
`Section`, `Layout` regions, `Absolute`, `Spacer`, `Badge`, `Divider`,
`ColorSwatch`, and the shared size context. For example, place a label and
status badge in a horizontal row:

```tsx
import { Stack, Text, Badge } from '@octane-xplat/ui'

export function BuildStatus() {
  return (
    <Stack direction="horizontal" gap={2}>
      <Text>Linux build</Text>
      <Badge label="Ready" />
    </Stack>
  )
}
```

Layout needs the repository-only [XplatMason binding](https://github.com/octane-xplat/octane-xplat/tree/main/packages/linux-gtk-renderer/native/xplatmason);
the Gtk.Box fallback cannot provide Grid or full flex layout. Maintained GJS checks cover
mounting, direction/spacing updates, size inheritance, gesture callbacks and
cleanup. This subset does not qualify the complete UI, accessibility or visual
parity. Other root UI imports remain unavailable until their GTK implementation
is qualified. The primitive fixture has passed 42 assertions with the real
Mason engine on Ubuntu 24.04 / GTK 4.14.5; a separate X11 pointer check exercises
real clicks and drags. These checks do not qualify Wayland, assistive technology
or visual parity.

The binding consumes a prebuilt MasonCore archive. The published Mason fork
currently has no desktop archive producer, so a fresh packaged consumer setup
is still unqualified. The repository's [build record](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/linux-gtk-ui-parity.md#mason-test-artifact-prerequisite)
describes the pinned, locally prepared artifact used by these tests.

The entry point mounts the app through the renderer's host helper. Import
your stylesheets from the same module — the preset compiles and injects
them into the bundle:

```ts
// src/main.ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { App } from './App.gtk'

export function main(): number {
	return runGtkApp(
		{ applicationId: 'com.example.MyApp', title: 'My App' },
		({ root }) => {
			root.render(App, {})
		},
	)
}

main()
```

Class, id, and element selectors work through the same NativeScript engine
the AppKit renderer uses. State selectors such as `:hover`, `:active`, and
`:focus` follow the widget's GTK state, media queries re-check when the
window resizes, and `@keyframes` animations play. The renderer's
[Apply stylesheets](../../packages/linux-gtk-renderer/README.md#apply-stylesheets)
section lists the supported properties and limits. GTK's theme still
styles native widget chrome underneath your CSS.

```css
/* src/app.css */
.save:hover {
  background-color: #2563eb;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.toast {
  animation: fade-in 200ms ease-out forwards;
}
```

## Add retained route panes

Use an explicit programmatic catalog and pane host for native GTK routing.
The pane keeps each screen's widgets and local state while it is in history.
This example opens an item without creating a NativeScript Frame or changing a
browser URL. Put it in `src/App.gtk.tsx`; the host entry shown above mounts `App`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	createPaneRouterHost,
	createRouter,
	defineRoute,
	defineRoutes,
	RouterPane,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing'

const detail = defineRoute({
	path: '/probe/:id',
	transition: 'none',
	loader: ({ params }) => ({ id: params.id }),
})

function Detail(props: RouteScreenProps<typeof detail>) {
	const [count, setCount] = useState(0)

	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<label text={`${props.data.id}:${count}`} />
			<button text={`Increment ${props.data.id}`} onTap={() => setCount(count + 1)} />
		</masonview>
	)
}

const host = createPaneRouterHost()
const navigation = createRouter({ host: host.host, catalog: defineRoutes([detail.screen(Detail)]) })
host.attach(navigation)

export function App() {
	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<button
				text="Open coat"
				onTap={() => {
					void navigation.push({ to: '/probe/:id', params: { id: 'coat' } })
				}}
			/>
			<RouterPane host={host} router={navigation} />
		</masonview>
	)
}

export { navigation }
```

This experimental subset has explicit limits: pane modals are rejected,
transitions report skipped, and OS Back and window-close integration belong to
the enclosing host. Generated GTK startup, incoming links, physical input and
native Mason geometry need separate qualification. The maintained check passed
13 assertions in GJS 1.82.3 / GTK 4.18.6 using Gtk.Box emulation; it does not
establish the optional Mason typelib's layout behavior. See
[native GTK routing checks](../../.agents/docs/navigation-checks.md#native-gtk-retained-panes).

## Check the runtime

On Ubuntu 24.04, install GJS and the GTK4 introspection data:

```sh
sudo apt install gjs gir1.2-gtk-4.0
bun run xplat doctor
```

`xplat doctor` validates the target configuration and, on a Linux host,
checks that GJS can load GTK 4.10 or later. A successful build on macOS
does not prove the Linux runtime works — treat every artifact below as
unverified until it runs on a real Linux desktop.

## Develop and build

`xplat dev linux` runs the app's own `dev` script, so point it at whatever
loop you maintain — for example, a Vite build followed by `gjs -m`:

```json
{ "scripts": { "dev": "vite build -c vite.gtk.config.ts && gjs -m dist/app.js" } }
```

Build the distributable app with the CLI:

```sh
bun run xplat build --targets linux
```

For the example above, output is:

```text
dist/linux/my-app/                 relocatable app directory
  app.js                          single-file ESM bundle (gi:// imports stay external)
  app.json                        app identity
  my-app                          executable launcher (gjs -m)
  README.txt                      runtime requirements
dist/linux/my-app-1.0.0.tar.gz     distribution archive
```

GJS produces no compiled binary, so the bundle plus launcher is the honest
minimum: transfer the archive to a Linux machine, extract it, and run the
launcher:

```sh
tar -xzf my-app-1.0.0.tar.gz
./my-app/my-app
```

The launcher checks that `gjs` is installed and execs the bundled app, so
it works from any directory without a source checkout, Node, or pnpm.

## What this target does not have yet

- No desktop entry, per-user installer, or URI scheme handling — those are
  features of the WebKitGTK host, and they land with runtime qualification.
- No device services (clipboard, secure storage, notifications, files) —
  the GTK host mounts widgets only.
- Broad pointer/keyboard coverage, Wayland, assistive technology, visual parity
  and the complete shared UI remain unqualified. Primitive checks establish
  only the named Mason allocations and X11 pointer behavior; counter and
  retained-pane checks establish their named widget/event/history behaviors. See the [renderer status
  note](../../.agents/docs/notes/linux-gtk-renderer.md) for the evidence boundary.
