/** @jsxImportSource @nativescript-community/octane */
// Universal hooks import from 'octane' — the compiler retargets them to the
// nativescript runtime, and the dev server serves them via HTTP-ESM.
// NOTE: '@nativescript-community/octane' is reserved for its OWN exports
// (createNativeScriptRoot below): on-device, dev-mode vendor require() drops
// its `export *` re-exports of the universal runtime — 'octane' is the only
// working specifier for hooks in this channel.
import { useRef } from 'octane';
import { ContentView, ObservableArray } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';

// Universal roots render components, not elements — the element-returning
// `renderItem` is wrapped in a compiler-defined component so each recycled
// cell gets a real universal root.
function Cell(props: { item: any; renderItem: (item: any) => any }) @{
	{props.renderItem(props.item)}
}

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
	const cells = useRef(new WeakMap<ContentView, any>());
	const dataRef = useRef<ObservableArray<any> | null>(null);
	if (dataRef.current === null) dataRef.current = new ObservableArray(props.items);
	const data = dataRef.current;
	data.splice(0, data.length, ...props.items);

	<listview
		className={props.className}
		style={props.style}
		items={data}
		itemTemplates={[{
			key: 'cell',
			createView: () => new ContentView(),
		}]}
		itemTemplateSelector={() => 'cell'}
		onItemLoading={(e: any) => {
			const host = e.view as ContentView;
			let root = cells.current.get(host);
			if (root === undefined) {
				root = createNativeScriptRoot(host);
				cells.current.set(host, root);
			}
			root.render(Cell, {
				item: e.item ?? props.items[e.index],
				renderItem: props.renderItem,
			});
		}}
	/>
}
