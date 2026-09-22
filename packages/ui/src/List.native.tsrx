/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
// NOTE: '@nativescript-community/octane' is reserved for its OWN exports
// (createNativeScriptRoot below): on-device, dev-mode vendor require() drops
// its `export *` re-exports of the universal runtime — 'octane' is the only
// working specifier for hooks in this channel.
import { memo, useRef } from 'octane';
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

// Module scope, keyed by host view / data source — deliberately not hooks:
// itemLoading waves can run stale render closures, and universal useRef
// resolves through draft-vs-committed records, so ref-held values returned
// stale reads across waves (measured). Hosts and the ObservableArray are
// unique per list instance, so module scope is multi-instance safe.
const cellRoots = new WeakMap<ContentView, any>();
const boundItems = new WeakMap<ContentView, any>();
const listProps = new WeakMap<ObservableArray<any>, {
	items: any[];
	renderItem: (item: any) => any;
}>();
const lvByData = new WeakMap<ObservableArray<any>, ListView>();

// Stable identity — a fresh onItemLoading closure every render is a prop
// write, and prop writes refresh the ListView (measured: every unrelated
// parent render refired itemLoading for all visible cells).
function handleItemLoading(e: any) {
	const host = e.view as ContentView;
	let root = cellRoots.get(host);
	const freshHost = root === undefined;
	if (freshHost) {
		root = createNativeScriptRoot(host);
		cellRoots.set(host, root);
	}
	// e.item lags the ObservableArray splice on iOS (measured: the post-splice
	// wave still reported old items) — the app data is authoritative.
	const lv = e.object as ListView;
	lvByData.set(lv.items as ObservableArray<any>, lv);
	const cur = listProps.get(lv.items as ObservableArray<any>);
	const item = cur ? cur.items[e.index] ?? e.item : e.item;
	if (boundItems.get(host) === item) return;
	boundItems.set(host, item);
	root.render(Cell, { item, renderItem: cur && cur.renderItem });
}

function ListInner(props: {
  className?: any;
  style?: any;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	const dataRef = useRef<ObservableArray<any> | null>(null);
	const prevRef = useRef<any[]>(props.items);
	if (dataRef.current === null) dataRef.current = new ObservableArray(props.items);
	const data = dataRef.current;
	// Plain module-map write — immediately visible to itemLoading waves,
	// including the synchronous splice wave (no draft-commit lag).
	listProps.set(data, props);
	if (prevRef.current !== props.items) {
		prevRef.current = props.items;
		data.splice(0, data.length, ...props.items);
		// The splice's itemLoading wave is queued before this render commits,
		// so it still sees the old props and skips. A post-commit refresh
		// guarantees a wave with fresh data even when no render follows.
		const lv = lvByData.get(data);
		if (lv) setTimeout(() => lv.refresh(), 0);
	}

	<listview
		className={props.className}
		style={props.style}
		items={data}
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
 * - `items` identity change → replace the ObservableArray contents in place so
 *   ListView diffs natively.
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
