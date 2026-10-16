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

const datePicker: SharedJSX.IntrinsicElements['datepicker'] = {
	date: new Date(2026, 4, 10, 19),
	minDate: '2026-05-01',
	maxDate: new Date(2026, 4, 31),
	year: 2026,
	month: 5,
	day: 10,
	onDateChange: (event) => {
		const date: Date = event.value
		const old: Date | undefined = event.oldValue
		void date
		void old
		void event.object
	},
	ref: (view) => {
		void view
		return () => {}
	},
}

void datePicker
// @ts-expect-error DatePicker does not accept numeric dates
const invalidDatePicker: SharedJSX.IntrinsicElements['datepicker'] = { date: 123 }
void invalidDatePicker
// @ts-expect-error AppKit-only picker style is outside the shared contract
const invalidDateStyle: SharedJSX.IntrinsicElements['datepicker'] = { datePickerStyle: 0 }
void invalidDateStyle

const listPicker: SharedJSX.IntrinsicElements['listpicker'] = {
	items: ['First', null, 42],
	selectedIndex: 1,
	onSelectedIndexChange: (event) => {
		const index: number = event.value
		void index
		void event.object
	},
	ref: (view) => {
		void view
		return () => {}
	},
}

void listPicker
// @ts-expect-error ListPicker index must be numeric
const invalidListIndex: SharedJSX.IntrinsicElements['listpicker'] = { selectedIndex: '1' }
void invalidListIndex
// @ts-expect-error AppKit-specific picker mode is outside the shared contract
const invalidListMode: SharedJSX.IntrinsicElements['listpicker'] = { pullsDown: true }
void invalidListMode

const progress: SharedJSX.IntrinsicElements['progress'] = {
	value: 12.5,
	maxValue: 100,
	ref: (view) => {
		void view
		return () => {}
	},
}

// @ts-expect-error Progress value must be numeric
const invalidProgress: SharedJSX.IntrinsicElements['progress'] = { value: '12' }
// @ts-expect-error AppKit-specific modes do not enter the shared contract
const invalidProgressMode: SharedJSX.IntrinsicElements['progress'] = { indeterminate: true }
void progress
void invalidProgress
void invalidProgressMode

const segmentedBar: SharedJSX.IntrinsicElements['segmentedbar'] = {
	items: [{ title: 'First' }, { title: 'Second' }],
	selectedIndex: 1,
	style: { selectedBackgroundColor: '#ff0000' },
	onSelectedIndexChange: (event) => {
		const value: number = event.value
		const old: number | undefined = event.oldIndex
		void value
		void old
		void event.object
	},
	ref: [
		(view) => {
			void view
			return () => {}
		},
	],
}

// @ts-expect-error Index must be numeric
const badSegmentIndex: SharedJSX.IntrinsicElements['segmentedbar'] = { selectedIndex: '1' }
// @ts-expect-error Items use host objects, never primitive labels
const badSegmentItems: SharedJSX.IntrinsicElements['segmentedbar'] = { items: ['First'] }
// @ts-expect-error AppKit props do not enter the shared API
const badSegmentMode: SharedJSX.IntrinsicElements['segmentedbar'] = { trackingMode: 0 }
void segmentedBar
void badSegmentIndex
void badSegmentItems
void badSegmentMode

const segmentItem: SharedJSX.IntrinsicElements['segmentedbaritem'] = {
	title: 'Day',
	ref: (element) => {
		if (element) {
			const absent: null = element.view
			void absent
		}

		return () => {}
	},
}

// @ts-expect-error Title is a string
const badItemTitle: SharedJSX.IntrinsicElements['segmentedbaritem'] = { title: 1 }
// @ts-expect-error Per-item enabled is not in the canonical shared contract
const badItemEnabled: SharedJSX.IntrinsicElements['segmentedbaritem'] = { enabled: false }
void segmentItem
void badItemTitle
void badItemEnabled
