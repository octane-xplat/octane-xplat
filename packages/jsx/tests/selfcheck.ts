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
