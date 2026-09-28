/** @jsxImportSource @nativescript-community/octane */
import { memo, useCallback, useEffect, useRef } from 'octane';
import {
	NATIVESCRIPT_RENDERER_ID,
	createNativeScriptRoot,
	defineUniversalComponent,
	registerElement,
} from '@nativescript-community/octane';

import type { Attributes } from '@nativescript-community/octane/intrinsics';
import type { UniversalRoot } from '@nativescript-community/octane';
import { Pager as NSPager } from '@nativescript-community/ui-pager';
import { GridLayout } from '@nativescript/core';
import type { PagerProps } from './props';
import { cx } from './cx.mobile';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props.mobile';
import { layoutChildProps } from './layout-child';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		pager: Attributes<typeof NSPager>;
	}
}

// @nativescript-community/ui-pager — ViewPager2 on Android, a paging
// UICollectionView on iOS. It is a required peer: this leaf sits in the
// shared native barrel, so every native app must declare the plugin for
// the /ns/m dev bridge to resolve it under the app root.
registerElement('pager', NSPager);

/** One recycled page: the host view the plugin's adapter asks for plus the
 *  Octane root mounted into it. Mirrors the driver's ListView cell seam —
 *  ui-pager fires the same `itemLoading`/`itemDisposing` pair. */
interface PagerCell {
	host: any;
	root: UniversalRoot;
	pager: any;
	renderItem: any;
	item: any;
	index: number;
}

const cellsByHost = new WeakMap<object, PagerCell>();
const cellsByPager = new WeakMap<object, Set<PagerCell>>();

/** Every page root renders this one component, so rebinds are diffs of the
 *  cell's tree rather than remounts. The renderItem output wraps in a
 *  gridlayout — page content must stay single-root. */
const PagerCell = defineUniversalComponent(NATIVESCRIPT_RENDERER_ID, (props: any) =>
	props.renderItem(props.item, props.index),
);

function cellFor(host: any): PagerCell {
	let cell = cellsByHost.get(host);
	if (!cell) {
		cell = { host, root: createNativeScriptRoot(host), pager: null, renderItem: null, item: undefined, index: -1 };
		cellsByHost.set(host, cell);
	}

	return cell;
}

/** `createView` runs inside the plugin's adapter — no pager instance in
 *  scope, so the cell is only linked to its pager at `itemLoading` (where
 *  `args.object` is the owner). */
function createPageHost() {
	const host = new GridLayout();
	cellFor(host);
	return host;
}

const PAGER_TEMPLATES = [{ key: 'xplat-page', createView: createPageHost }];
// The built-in 'default' template stays first in the plugin's internal
// list, so the selector must name our key — a 'default' entry would match
// the built-in (an XML string parse, which yields nothing here).
const selectPageTemplate = () => 'xplat-page';

function releasePagerCells(pager: any) {
	const cells = cellsByPager.get(pager);
	if (!cells) return;
	for (const cell of cells) {
		cellsByHost.delete(cell.host);
		cell.root.unmount();
	}

	cellsByPager.delete(pager);
}

function PagerInner(props: PagerProps) @{
	const host = useRef<any>(null);
	// selectedIndex writes the leaf makes itself — the plugin raises
	// 'selectedIndexChange' for script writes exactly as for swipes, and
	// the driver's auto-mute only covers JSX prop writes, not ours.
	const suppressEcho = useRef(false);
	const pageSeeded = useRef(false);

	// Stable ref identity — an inline closure re-fires ref(null)/ref(v) per
	// render, which would bounce host.current around the effects below.
	const bindHost = useCallback((v: any) => {
		host.current = v;
	}, []);

	const bindCell = (args: any) => {
		const cell = cellFor(args.view);
		cell.pager = args.object;
		let owned = cellsByPager.get(cell.pager);
		if (!owned) {
			owned = new Set();
			cellsByPager.set(cell.pager, owned);
		}

		owned.add(cell);
		const item = args.bindingContext ?? props.items?.[args.index];
		if (cell.renderItem === props.renderItem && cell.index === args.index && Object.is(cell.item, item)) {
			return;
		}

		cell.renderItem = props.renderItem;
		cell.item = item;
		cell.index = args.index;
		cell.root.render(PagerCell, {
			renderItem: (it: any, i: number) => <gridlayout>{props.renderItem(it, i)}</gridlayout>,
			item,
			index: args.index,
		});
	};

	const disposeCell = (args: any) => {
		const cell = args.view && cellsByHost.get(args.view);
		if (cell) {
			cellsByHost.delete(args.view);
			if (cell.pager) cellsByPager.get(cell.pager)?.delete(cell);
			cell.root.unmount();
		}
	};

	// One-time wiring (mount): the template set + selector are imperative —
	// as JSX props they would be re-applied on every render. The cleanup
	// captures the pager so cell roots release after the ref detaches.
	useEffect(() => {
		const pager = host.current;
		if (!pager) return;
		pager.itemTemplates = PAGER_TEMPLATES;
		pager.itemTemplateSelector = selectPageTemplate;
		return () => releasePagerCells(pager);
	}, []);

	// Items and the index are imperative writes, not JSX props: `items` must
	// land before `selectedIndex` (the plugin coerces the index against the
	// page count — a write ahead of items clamps to -1), and a re-assert
	// after an items change repairs the plugin's own re-coercion.
	useEffect(() => {
		const pager = host.current;
		if (!pager) return;
		applyEscapeProps(pager, props);
		if (pager.items !== props.items) pager.items = props.items;
		const target = props.page ?? (pageSeeded.current ? undefined : props.defaultPage);
		if (target !== undefined && pager.selectedIndex !== target) {
			suppressEcho.current = true;
			try {
				pager.selectedIndex = target;
			} finally {
				suppressEcho.current = false;
			}
		}

		pageSeeded.current = true;
	});

	<pager
		ref={bindHost}
		id={props.id}
		{...layoutChildProps(props)}
		className={cx('vx-pager', props.className)}
		style={props.style}
		onItemLoading={bindCell}
		onItemDisposing={disposeCell}
		onSelectedIndexChange={(args: any) => {
			if (!suppressEcho.current) props.onPageChange?.(args.value);
		}}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessible={props.accessible}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	/>
}

// The pager subtree is memoized on `items` and configuration: the universal
// driver re-applies props on every render (no value diffing) and a stray
// `items` write would refresh the whole adapter. Constraint matches
// UITableView: `renderItem` should be identity-stable — a fresh closure per
// render is deliberately not part of the compare. (`PagerInner` must precede
// this — compiled components are consts, not hoisted functions.)
const MemoPager = memo(PagerInner, (a, b) =>
	a.items === b.items &&
	a.className === b.className &&
	a.style === b.style &&
	a.id === b.id &&
	a.page === b.page &&
	a.onPageChange === b.onPageChange &&
	a.ios === b.ios &&
	a.android === b.android
);

/** Pager — paged horizontal swiping via @nativescript-community/ui-pager
 *  (ViewPager2 / paging UICollectionView), chrome-reset: one full-size cell
 *  per item, no indicator. Pages recycle through `itemTemplates` +
 *  `itemLoading`, each slot hosting its own Octane root — the same cell
 *  machinery the driver builds for `listview`, hand-wired here. */
export function Pager(props: PagerProps) @{
	@if (props.items.length > 0) {
		<MemoPager
			id={props.id}
			className={props.className}
			style={props.style}
			items={props.items}
			renderItem={props.renderItem}
			page={props.page}
			defaultPage={props.defaultPage}
			onPageChange={props.onPageChange}
			ios={props.ios}
			android={props.android}
			{...layoutChildProps(props)}
		/>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
