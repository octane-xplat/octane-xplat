/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
import { memo } from 'octane';
import { isAndroid, isIOS, ScrollView } from '@nativescript/core';
import type { ListProps } from "./props";
import { cx } from "./cx";

function rejectNestedScrollView(event: any) {
	let parent = event.object?.parent;
	while (parent) {
		if (parent instanceof ScrollView) {
			throw new Error('[List] cannot be nested inside native ScrollView. Use ScrollBox so the ListView owns scrolling.');
		}

		parent = parent.parent;
	}
}

// Cell machinery is driver-owned since @nativescript-community/octane 0.2.1
// (upstream #7, closes our issue #1): `renderItem` on <listview> makes
// itemTemplate vend a ContentView per recycled cell, each with its own
// universal root; itemLoading binds items[index] and skips unchanged rows;
// a changed renderItem re-binds live cells; discard unmounts the roots.
// The cell ContentView is single-child — a renderItem returning multiple
// roots would silently drop siblings — so output wraps in a gridlayout.
function ListInner(props: {
  className?: any;
  style?: any;
  id?: string;
  items: any[];
  renderItem: (item: any, index: number) => any;
  estimatedItemHeight?: number;
  onEndReached?: () => void;
  ios?: Record<string, any>;
  android?: Record<string, any>;
}) @{
	const platformProps = Object.assign(
		{},
		isIOS ? props.ios : {},
		isAndroid ? props.android : {},
	);

	<listview
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		items={props.items}
		iosEstimatedRowHeight={isIOS ? props.estimatedItemHeight : undefined}
		onLoadMoreItems={props.onEndReached}
		onLoaded={rejectNestedScrollView}
		renderItem={(item: any, index: number) => <gridlayout>{props.renderItem(item, index)}</gridlayout>}
		{...platformProps}
	/>
}

/**
 * The listview subtree is memoized on `items` and list configuration: the universal driver
 * re-applies props on every render (no value diffing), and each write can
 * trigger view-level side effects — measured: every unrelated parent
 * re-render refired itemLoading for all visible cells. Memoized on the
 * items reference and list configuration, unrelated parent re-renders skip
 * this subtree. Constraint: `renderItem` should be identity-stable (a
 * useCallback-style ref) — a fresh closure each render is deliberately
 * not part of the compare. (`ListInner` must precede this — compiled
 * components are consts, not hoisted functions.)
 */
const MemoListView = memo(ListInner, (a, b) =>
	a.items === b.items &&
	a.className === b.className &&
	a.style === b.style &&
	a.id === b.id &&
	a.estimatedItemHeight === b.estimatedItemHeight &&
	a.onEndReached === b.onEndReached &&
	a.ios === b.ios &&
	a.android === b.android
);

/**
 * Recycling List: ListView + one Octane sub-root per recycled cell (driver
 * internals). `items` is a plain array, ItemsSource, or ObservableArray —
 * the driver binds `items[index]` into the recycled cell's root and skips
 * rebinds whose row, item, and renderer are unchanged.
 * Cell identity = the recycled host view, not the item — keys must travel
 * inside the rendered cell, matching RN's recycling mental model.
 */
export function List(props: ListProps) @{
	// ListView has no empty state — swap to the empty view. Remount on
	// repopulate loses scroll position; acceptable for v1 (RN parity: its
	// ListEmptyComponent also renders instead of the list).
	@if (props.items.length > 0) {
		<MemoListView
			id={props.id}
			items={props.items}
			className={props.className}
			style={props.style}
			renderItem={props.renderItem}
			estimatedItemHeight={props.estimatedItemHeight}
			onEndReached={props.onEndReached}
			ios={props.ios}
			android={props.android}
		/>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
