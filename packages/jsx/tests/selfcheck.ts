/**
 * Package self-check — exercises the shared contract surface through the same
 * module specifiers consumers use, so `pnpm typecheck` catches declaration
 * drift that skipLibCheck would otherwise mask. The packed-consumer fixture
 * (tests/packed-consumer.mjs) proves resolution from a real tarball.
 *
 * The `native`-conditioned View binding is asserted in selfcheck.mobile.ts —
 * shared-file rules keep `@nativescript/*` imports out of this file.
 */
import type { Attributes, ClassValue, HostElement, JSX, NativeElements, Ref } from '../src/jsx-runtime.js'

import type { HostElement as MacHostElement, JSX as MacJSX } from '../src/macos.js'
import type { NativeElements as IntrinsicsElements } from '../src/intrinsics.js'

// --- Intrinsic membership is identical across conditioned entries ----------

type Tags<M> = keyof M extends infer K ? (K extends string ? K : never) : never
type Expect<T extends true> = T
type SameMembers<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

export type SharedTags = Tags<JSX.IntrinsicElements>
type _MembershipParity = Expect<SameMembers<SharedTags, Tags<MacJSX.IntrinsicElements>>>

const coreTag: SharedTags = 'masonview'
const textNode: SharedTags = '#text'
const extensionTag: SharedTags = 'svgview'
const extensionTag2: SharedTags = 'googlesigninbutton'
void coreTag
void textNode
void extensionTag
void extensionTag2

// --- Default HostElement is opaque -----------------------------------------

// Non-unknown (assignable to object) and non-forgeable (nothing but the
// driver produces one).
declare const shared: HostElement
const asObject: object = shared
// @ts-expect-error opaque members are not readable
const noMember = shared.ios
// @ts-expect-error cannot forge the opaque host element
const forged: HostElement = {}
void asObject
void noMember
void forged

// --- macOS binds the AppKit host surface ------------------------------------

declare const macView: MacHostElement
macView.addSubview(macView)
const macAsObject: object = macView
void macAsObject

// --- Ref lifecycle: callback-with-cleanup, object refs, arrays --------------

const refCallback: Ref<HostElement> = (instance) => {
	void instance
	return () => {}
}

const refObject: Ref<HostElement> = { current: null }
const refArray: Ref<HostElement> = [refCallback, refObject, [refObject]]
const refNull: Ref<HostElement> = null
void refArray
void refNull

// --- Augmentation surface ---------------------------------------------------

type Augmented = IntrinsicsElements<HostElement>['label']
const labelProps: Augmented = { text: 'ok', className: 'x' }
void labelProps

declare module '../src/intrinsics.js' {
	interface NativeElements<TElement> {
		fixturewidget: Attributes<TElement, { marker?: number }>
	}
}

const augmented: Tags<NativeElements<HostElement>> = 'fixturewidget'
void augmented

// ContentView uses common props across conditions; only refs bind host types.
const sharedContent: NativeElements<HostElement>['contentview'] = {
	id: 'single',
	style: { width: 200, height: 80 },
	ref: refArray,
}

const macContent: MacJSX.IntrinsicElements['contentview'] = {
	id: 'single',
	ref: (view) => {
		void view
		return () => {}
	},
}

void sharedContent
void macContent

// The mason intrinsic carries zero layout props — every layout semantic is
// CSS through `style`/`className`, matching web. Component-level sugar lives
// on component props and compiles to these style keys before render.
const masonProps: JSX.IntrinsicElements['masonview'] = {
	style: {
		display: 'grid',
		gridTemplateColumns: '1fr 2fr',
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
}
void masonProps
// @ts-expect-error no layout props on the intrinsic — style only
const badMasonProps: JSX.IntrinsicElements['masonview'] = { flexDirection: 'row' }
// @ts-expect-error attached placement sugar is not an intrinsic prop
const badDockChildProps: JSX.IntrinsicElements['label'] = { dock: 'right' }
void badMasonProps
void badDockChildProps

const macMasonProps: MacJSX.IntrinsicElements['masonview'] = {
	style: { display: 'flex', flexDirection: 'column', gap: 8 },
}

void macMasonProps
// @ts-expect-error WrapLayout size is numeric
const badWrapSize: JSX.IntrinsicElements['wraplayout'] = { itemWidth: '30' }
// @ts-expect-error WrapLayout direction is closed
const badWrapOrientation: JSX.IntrinsicElements['wraplayout'] = { orientation: 'diagonal' }
void badWrapSize
void badWrapOrientation

// Viewless macOS hosts expose logical identity, never an NSView facade.
const macProxy: MacJSX.IntrinsicElements['proxyviewcontainer'] = {
	ref: [
		(element) => {
			if (element) {
				const id: number = element.id
				const noView: null = element.view
				void id
				void noView
				// @ts-expect-error logical elements have no NSView methods
				element.addSubview(element)
			}

			return () => {}
		},
		{ current: null },
	],
}

void macProxy

const sharedRoot: NativeElements<HostElement>['rootlayout'] = {
	id: 'root',
	style: { padding: 8 },
	ref: (element) => {
		void element
		return () => {}
	},
}

const macRoot: MacJSX.IntrinsicElements['rootlayout'] = {
	ref: (element) => {
		void element
		return () => {}
	},
}

void sharedRoot
void macRoot
// @ts-expect-error RootLayout shares common props, with no track configuration
const invalidRoot: NativeElements<HostElement>['rootlayout'] = { rows: '20' }
void invalidRoot

const searchBar: MacJSX.IntrinsicElements['searchbar'] = {
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
const invalidSearchBar: MacJSX.IntrinsicElements['searchbar'] = { text: 123 }
void invalidSearchBar

const formatted: MacJSX.IntrinsicElements['formattedstring'] = {
	fontFamily: 'system-ui',
	fontSize: 18,
	color: '#ff0000',
	backgroundColor: '#ffffff',
	ref: (element) => {
		if (element) {
			const view: null = element.view
			void view
		}

		return () => {}
	},
}

void formatted
// @ts-expect-error FormattedString fontSize is numeric
const invalidFormatted: MacJSX.IntrinsicElements['formattedstring'] = { fontSize: '18' }
void invalidFormatted

const htmlView: MacJSX.IntrinsicElements['htmlview'] = {
	html: '<b>Hello</b>',
	style: { fontSize: 18 },
	ref: (view) => {
		if (view) {
			view.removeFromSuperview()
		}

		return () => {}
	},
}

void htmlView
// @ts-expect-error HTML content is a string
const invalidHtml: MacJSX.IntrinsicElements['htmlview'] = { html: 123 }
// @ts-expect-error no AppKit-specific content prop
const invalidHtmlText: MacJSX.IntrinsicElements['htmlview'] = { text: 'Hello' }
void invalidHtml
void invalidHtmlText

const activityIndicator: MacJSX.IntrinsicElements['activityindicator'] = {
	busy: true,
	ref: (view) => {
		if (view) {
			view.removeFromSuperview()
		}

		return () => {}
	},
}

void activityIndicator
// @ts-expect-error busy is boolean
const invalidActivityBusy: MacJSX.IntrinsicElements['activityindicator'] = { busy: 'true' }
// @ts-expect-error AppKit spinner styles do not widen the shared contract
const invalidActivityStyle: MacJSX.IntrinsicElements['activityindicator'] = { controlSize: 0 }
void invalidActivityBusy
void invalidActivityStyle

const datePicker: MacJSX.IntrinsicElements['datepicker'] = {
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
const invalidDatePicker: MacJSX.IntrinsicElements['datepicker'] = { date: 123 }
void invalidDatePicker
// @ts-expect-error AppKit-only picker style is outside the shared contract
const invalidDateStyle: MacJSX.IntrinsicElements['datepicker'] = { datePickerStyle: 0 }
void invalidDateStyle

const listPicker: MacJSX.IntrinsicElements['listpicker'] = {
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
const invalidListIndex: MacJSX.IntrinsicElements['listpicker'] = { selectedIndex: '1' }
void invalidListIndex
// @ts-expect-error AppKit-specific picker mode is outside the shared contract
const invalidListMode: MacJSX.IntrinsicElements['listpicker'] = { pullsDown: true }
void invalidListMode

const progress: MacJSX.IntrinsicElements['progress'] = {
	value: 12.5,
	maxValue: 100,
	ref: (view) => {
		void view
		return () => {}
	},
}

// @ts-expect-error Progress value must be numeric
const invalidProgress: MacJSX.IntrinsicElements['progress'] = { value: '12' }
// @ts-expect-error AppKit-specific modes do not enter the shared contract
const invalidProgressMode: MacJSX.IntrinsicElements['progress'] = { indeterminate: true }
void progress
void invalidProgress
void invalidProgressMode

const segmentedBar: MacJSX.IntrinsicElements['segmentedbar'] = {
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
const badSegmentIndex: MacJSX.IntrinsicElements['segmentedbar'] = { selectedIndex: '1' }
// @ts-expect-error Items use host objects, never primitive labels
const badSegmentItems: MacJSX.IntrinsicElements['segmentedbar'] = { items: ['First'] }
// @ts-expect-error AppKit props do not enter the shared API
const badSegmentMode: MacJSX.IntrinsicElements['segmentedbar'] = { trackingMode: 0 }
void segmentedBar
void badSegmentIndex
void badSegmentItems
void badSegmentMode

const segmentItem: MacJSX.IntrinsicElements['segmentedbaritem'] = {
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
const badItemTitle: MacJSX.IntrinsicElements['segmentedbaritem'] = { title: 1 }
// @ts-expect-error Per-item enabled is not in the canonical shared contract
const badItemEnabled: MacJSX.IntrinsicElements['segmentedbaritem'] = { enabled: false }
void segmentItem
void badItemTitle
void badItemEnabled

const timePicker: MacJSX.IntrinsicElements['timepicker'] = {
	time: '10:30:59',
	hour: 10,
	minute: 30,
	minHour: 9,
	minMinute: 15,
	maxHour: 17,
	maxMinute: 45,
	onTimeChange: (event) => {
		const value: Date = event.value
		void value
	},
}

void timePicker
// @ts-expect-error time is Date or string
const invalidTimePicker: MacJSX.IntrinsicElements['timepicker'] = { time: 123 }
void invalidTimePicker
// @ts-expect-error AppKit-only host configuration is outside the shared API
const invalidTimeStyle: MacJSX.IntrinsicElements['timepicker'] = { datePickerStyle: 0 }
void invalidTimeStyle

const listTemplates: JSX.IntrinsicElements['listview'] = {
	items: [{ name: 'Ada' }],
	itemTemplate: '<Label text="{{ name }}"/>',
	itemTemplates: [{ key: 'default', createView: () => ({}) }],
	onItemLoading: (event) => {
		const index: number = event.index
		void index
		void event.view
		// @ts-expect-error ItemLoading is observation-only
		event.view = {}
	},
}

void listTemplates
const tabs: MacJSX.IntrinsicElements['tabview'] = {
	selectedIndex: 1,
	onSelectedIndexChange: (event) => {
		const value: number = event.value
		void value
	},
	onSelectedIndexChanged: (event) => {
		const next: number | undefined = event.newIndex
		void next
	},
}

const tabItem: MacJSX.IntrinsicElements['tabviewitem'] = {
	title: 'Home',
	iconSource: 'res://Home',
	ref: (item) => {
		if (item) {
			const absent: null = item.view
			tabs.items = [item]
			void absent
		}

		return () => {}
	},
}

// @ts-expect-error macOS items are logical handles, not prop bags or native views
const badTabs: MacJSX.IntrinsicElements['tabview'] = { items: [{ title: 'Home' }] }
// @ts-expect-error Content roots are host-owned
const badTabContent: MacJSX.IntrinsicElements['tabviewitem'] = { view: {} }
void tabs
void tabItem
void badTabs
void badTabContent

// Class composition follows upstream, including numeric conditions.
import type { ClassValue as OctaneClassValue } from 'octane/jsx-runtime'
type _ClassValueParity = Expect<SameMembers<ClassValue, OctaneClassValue>>
declare const count: number
const composedClasses: ClassValue = ['card', count && 'active', [42, 0, NaN]] as const
const numericClasses: JSX.IntrinsicElements['masonview'] = { className: composedClasses }
void numericClasses
