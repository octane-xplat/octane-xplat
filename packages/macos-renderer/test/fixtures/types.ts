import type { JSX as SharedJSX } from '@octane-xplat/jsx/jsx-runtime'
import { createMacOSRoot, registerFontFamily } from '@octane-xplat/macos-renderer'
import type { MacOSRootOptions } from '@octane-xplat/macos-renderer'
import type { XplatMacOSOptions } from '@octane-xplat/cli/macos/vite'
import type { JSX } from '@octane-xplat/macos-renderer/intrinsics'
import type { jsx } from '@octane-xplat/macos-renderer/jsx-runtime'
import type { jsxs } from '@octane-xplat/macos-renderer/jsx-dev-runtime'

declare const host: Parameters<typeof createMacOSRoot>[0]
declare const descriptor: Parameters<typeof registerFontFamily>[1][number]['descriptor']
const options: MacOSRootOptions = { fontFamily: 'system-ui' }
createMacOSRoot(host, options).unmount()
registerFontFamily('Test', [{ weight: 400, descriptor }])
const preset: XplatMacOSOptions = { root: '.', packaged: true }
const label: JSX.IntrinsicElements['label'] = {
	id: 'label',
	text: 'Hello',
	style: { fontSize: 20 },
}

void preset
void label
void (null as unknown as typeof jsx)
void (null as unknown as typeof jsxs)
// @ts-expect-error family names must be strings
createMacOSRoot(host, { fontFamily: 7 })
// @ts-expect-error face weights must be numbers
registerFontFamily('Test', [{ weight: 'bold', descriptor }])

const dock: SharedJSX.IntrinsicElements['docklayout'] = { stretchLastChild: false }
const dockChild: SharedJSX.IntrinsicElements['label'] = { dock: 'bottom' }
void dock
void dockChild
// @ts-expect-error primitive prop accepts boolean only
const invalidDock: SharedJSX.IntrinsicElements['docklayout'] = { stretchLastChild: 'false' }
// @ts-expect-error attached edge vocabulary is closed
const invalidDockChild: SharedJSX.IntrinsicElements['label'] = { dock: 'center' }
void invalidDock
void invalidDockChild

const rootLayout: SharedJSX.IntrinsicElements['rootlayout'] = {
	style: { width: 200, height: 80, padding: 10 },
	ref: (view) => {
		void view
		return () => {}
	},
}

void rootLayout
// @ts-expect-error RootLayout has no invented popup JSX props
const invalidRoot: SharedJSX.IntrinsicElements['rootlayout'] = { open: true }
void invalidRoot

const searchBar: SharedJSX.IntrinsicElements['searchbar'] = {
	text: 'query',
	hint: 'Find',
	onTextChange: (event) => {
		const value: string = event.value
		void value
		void event.object
	},
	onSubmit: (event) => {
		void event.eventName
		void event.object
	},
	ref: (view) => {
		void view
		return () => {}
	},
}

void searchBar
// @ts-expect-error SearchBar text must stay a string
const invalidSearchBar: SharedJSX.IntrinsicElements['searchbar'] = { text: 123 }
void invalidSearchBar
