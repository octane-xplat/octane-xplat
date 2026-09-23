/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
import { memo } from 'octane';

// Cell machinery is driver-owned since @nativescript-community/octane 0.2.1
// (upstream #7, closes our issue #1): `renderItem` on <listview> makes
// itemTemplate vend a ContentView per recycled cell, each with its own
// universal root; itemLoading binds items[index] and skips unchanged rows;
// a changed renderItem re-binds live cells; discard unmounts the roots.
function ListInner(props: {
  className?: any;
  style?: any;
  id?: string;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	<listview
		id={props.id}
		className={props.className}
		style={props.style}
		items={props.items}
		renderItem={props.renderItem}
	/>
}

/**
 * The listview subtree is memoized on `items`: the universal driver
 * re-applies props on every render (no value diffing), and each write can
 * trigger view-level side effects — measured: every unrelated parent
 * re-render refired itemLoading for all visible cells. Memoized on the
 * items reference, the subtree only re-renders when the data actually
 * changes. Constraint: `renderItem` should be identity-stable (a
 * useCallback-style ref) — a fresh closure each render is deliberately
 * not part of the compare. (`ListInner` must precede this — compiled
 * components are consts, not hoisted functions.)
 */
const MemoListView = memo(ListInner, (a, b) => a.items === b.items);

/**
 * Recycling List: ListView + one Octane sub-root per recycled cell (driver
 * internals). `items` is a plain array, ItemsSource, or ObservableArray —
 * the driver binds `items[index]` into the recycled cell's root and skips
 * rebinds whose row, item, and renderer are unchanged.
 * Cell identity = the recycled host view, not the item — keys must travel
 * inside the rendered cell, matching RN's recycling mental model.
 */
export function List(props: {
  className?: any;
  style?: any;
  id?: string;
  items: any[];
  renderItem: (item: any) => any;
  renderEmpty?: () => any;
}) @{
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
		/>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
