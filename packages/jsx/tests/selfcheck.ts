/**
 * Package self-check — exercises the shared contract surface through the same
 * module specifiers consumers use, so `pnpm typecheck` catches declaration
 * drift that skipLibCheck would otherwise mask. The packed-consumer fixture
 * (tests/packed-consumer.mjs) proves resolution from a real tarball.
 *
 * The `native`-conditioned View binding is asserted in selfcheck.mobile.ts —
 * shared-file rules keep `@nativescript/*` imports out of this file.
 */
import type {
	Attributes,
	HostElement,
	JSX,
	NativeElements,
	Ref,
} from '../src/jsx-runtime.js';

import type { HostElement as MacHostElement, JSX as MacJSX } from '../src/macos.js';
import type { NativeElements as IntrinsicsElements } from '../src/intrinsics.js';

// --- Intrinsic membership is identical across conditioned entries ----------

type Tags<M> = keyof M extends infer K ? (K extends string ? K : never) : never;
type Expect<T extends true> = T;
type SameMembers<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export type SharedTags = Tags<JSX.IntrinsicElements>;
type _MembershipParity = Expect<
	SameMembers<SharedTags, Tags<MacJSX.IntrinsicElements>>
>;

const coreTag: SharedTags = 'flexboxlayout';
const textNode: SharedTags = '#text';
const extensionTag: SharedTags = 'svgview';
const extensionTag2: SharedTags = 'googlesigninbutton';
void coreTag;
void textNode;
void extensionTag;
void extensionTag2;

// --- Default HostElement is opaque -----------------------------------------

// Non-unknown (assignable to object) and non-forgeable (nothing but the
// driver produces one).
declare const shared: HostElement;
const asObject: object = shared;
// @ts-expect-error opaque members are not readable
const noMember = shared.ios;
// @ts-expect-error cannot forge the opaque host element
const forged: HostElement = {};
void asObject;
void noMember;
void forged;

// --- macOS binds the AppKit host surface ------------------------------------

declare const macView: MacHostElement;
macView.addSubview(macView);
const macAsObject: object = macView;
void macAsObject;

// --- Ref lifecycle: callback-with-cleanup, object refs, arrays --------------

const refCallback: Ref<HostElement> = (instance) => {
	void instance;
	return () => {};
};

const refObject: Ref<HostElement> = { current: null };
const refArray: Ref<HostElement> = [refCallback, refObject, [refObject]];
const refNull: Ref<HostElement> = null;
void refArray;
void refNull;

// --- Augmentation surface ---------------------------------------------------

type Augmented = IntrinsicsElements<HostElement>['label'];
const labelProps: Augmented = { text: 'ok', className: 'x' };
void labelProps;

declare module '../src/intrinsics.js' {
	interface NativeElements<TElement> {
		fixturewidget: Attributes<TElement, { marker?: number }>;
	}
}

const augmented: Tags<NativeElements<HostElement>> = 'fixturewidget';
void augmented;

// ContentView uses common props across conditions; only refs bind host types.
const sharedContent: NativeElements<HostElement>['contentview'] = {
	id: 'single', style: { width: 200, height: 80 }, ref: refArray,
};

const macContent: MacJSX.IntrinsicElements['contentview'] = {
	id: 'single', ref: (view) => { void view; return () => {}; },
};

void sharedContent;
void macContent;

// DockLayout retains the shared primitive contract across target conditions.
const dockProps: JSX.IntrinsicElements['docklayout'] = { stretchLastChild: false };
const dockChildProps: JSX.IntrinsicElements['label'] = { dock: 'right' };
void dockProps;
void dockChildProps;
// @ts-expect-error stretchLastChild accepts only boolean
const badDockProps: JSX.IntrinsicElements['docklayout'] = { stretchLastChild: 'false' };
// @ts-expect-error attached dock edges are closed
const badDockChildProps: JSX.IntrinsicElements['label'] = { dock: 'center' };
void badDockProps;
void badDockChildProps;

const wrapProps: JSX.IntrinsicElements['wraplayout'] = { orientation: 'horizontal', itemWidth: 0, itemHeight: 30 };
const macWrapProps: MacJSX.IntrinsicElements['wraplayout'] = { orientation: 'vertical', itemWidth: 30, itemHeight: 0 };
void wrapProps;
void macWrapProps;
// @ts-expect-error WrapLayout size is numeric
const badWrapSize: JSX.IntrinsicElements['wraplayout'] = { itemWidth: '30' };
// @ts-expect-error WrapLayout direction is closed
const badWrapOrientation: JSX.IntrinsicElements['wraplayout'] = { orientation: 'diagonal' };
void badWrapSize;
void badWrapOrientation;

// Viewless macOS hosts expose logical identity, never an NSView facade.
const macProxy: MacJSX.IntrinsicElements['proxyviewcontainer'] = {
	row: 1,
	dock: 'right',
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
