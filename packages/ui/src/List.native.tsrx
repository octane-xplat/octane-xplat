/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
// NOTE: '@nativescript-community/octane' is reserved for its OWN exports
// (createNativeScriptRoot below): on-device, dev-mode vendor require() drops
// its `export *` re-exports of the universal runtime — 'octane' is the only
// working specifier for hooks in this channel.
import { memo } from 'octane';
import { ContentView, ListView, ObservableArray } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';

// Universal roots render components, not elements — the element-returning
// `renderItem` is wrapped in a compiler-defined component so each recycled
// cell gets a real universal root.
function Cell(props: { item: any; renderItem: (item: any) => any }) @{
	{props.renderItem(props.item)}
}

// Stable identity — an inline array literal would change every render and
// make the driver refresh the whole ListView (measured: every parent
// re-render refired itemLoading for all cells).
const TEMPLATES = [{ key: 'cell', createView: () => new ContentView() }];
const templateSelector = () => 'cell';

// Module scope, keyed by the recycled host — deliberately not hooks:
// itemLoading waves can run stale render closures, and universal useRef
// resolves through draft-vs-committed records, so ref-held values returned
// stale reads across waves (measured). Hosts are unique per list instance,
// so module scope is multi-instance safe.
const cellRoots = new WeakMap<ContentView, any>();
const boundItems = new WeakMap<ContentView, any>();

// Stable identity — a fresh onItemLoading closure every render is a prop
// write, and prop writes refresh the ListView (measured: every unrelated
// parent render refired itemLoading for all visible cells).
function handleItemLoading(e: any) {
	const host = e.view as ContentView;
	let root = cellRoots.get(host);
	if (root === undefined) {
		root = createNativeScriptRoot(host);
		cellRoots.set(host, root);
	}
	const lv = e.object as ListView;
	// The driver's managed adapter is authoritative — e.item lags the splice
	// on iOS (measured: the post-splice wave still reported old items).
	const items = lv.items as ObservableArray<any>;
	const item = items?.getItem?.(e.index) ?? e.item;
	if (boundItems.get(host) === item) return;
	boundItems.set(host, item);
	// `renderItem` is written onto the view as a plain prop (the driver
	// passes unknown names through) — always the committed value, no
	// draft-commit lag.
	const renderItem = (lv as any).renderItem;
	if (renderItem) root.render(Cell, { item, renderItem });
}

function ListInner(props: {
  className?: any;
  style?: any;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	<listview
		className={props.className}
		style={props.style}
		items={props.items}
		renderItem={props.renderItem}
		itemTemplates={TEMPLATES}
		itemTemplateSelector={templateSelector}
		onItemLoading={handleItemLoading}
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
 * Recycling List: ListView + one Octane sub-root per recycled cell.
 * - `items` is a plain array — the driver adapts it to an ObservableArray,
 *   splices on identity change, and schedules refresh() itself.
 * - `itemLoading` rebinds the recycled ContentView's root with new props.
 * - Cell identity = the recycled host view, not the item — keys must travel
 *   inside the rendered cell, matching RN's recycling mental model.
 */
export function List(props: {
  className?: any;
  style?: any;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	<MemoListView
		items={props.items}
		className={props.className}
		style={props.style}
		renderItem={props.renderItem}
	/>
}
