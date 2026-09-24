/** @jsxImportSource @nativescript-community/octane */
import { memo } from 'octane';
import { Frame, GridLayout, Page, TabView, TabViewItem } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { registerStack } from './stacks.native';
import { cx } from './cx';
import type { TabSpec, TabsProps } from './props';

export type { TabSpec } from './props';

// TabViewItem content is a plain native view — the driver can't parent
// reconciled children into <tabviewitem>, so each pane is a GridLayout
// hosting its own universal root (same shape as List cells). GridLayout,
// not ContentView: the host must be multi-child — a pane render producing
// more than one root view would keep only the last under `.content`
// assignment. Grid children all fill the cell, so single-child panes are
// unaffected.
type TabPaneProps = { render: () => any };
function TabPane(props: TabPaneProps) @{
	<>{props.render()}</>
}

const paneRoots = new WeakMap<GridLayout, any>();
const tabsByView = new WeakMap<GridLayout, () => any>();
const itemsCache = new WeakMap<readonly TabSpec[], TabViewItem[]>();

function itemsFor(tabs: readonly TabSpec[]): TabViewItem[] {
	let items = itemsCache.get(tabs);
	if (items !== undefined) return items;
	items = tabs.map((t) => {
		const item = new TabViewItem();
		item.title = t.title;
		if (t.stack) {
			// Parallel-stack pane: the item's view IS a Frame whose default
			// page hosts the pane's own Octane root. Pushes land inside the
			// tab; the tab bar stays visible.
			// Navigate on `loaded`, not eagerly: a navigate issued before the
			// frame enters the window hierarchy leaves _executingContext
			// stuck (iOS's delegate never sees didShow) and every later push
			// queues forever.
			const frame = new Frame();
			frame.once('loaded', () => {
				frame.navigate({
					create: () => {
						const page = new Page();
						page.actionBarHidden = true;
						// Page is a ContentView — single-child. Root on a
						// GridLayout child for the same multi-child guarantee.
						const pane = new GridLayout();
						page.content = pane;
						createNativeScriptRoot(pane).render(
							TabPane as unknown as UniversalComponent, { render: t.render });

						return page;
					},
				});
			});

			registerStack(t.stack, frame);
			item.view = frame;
			return item;
		}

		const cv = new GridLayout();
		tabsByView.set(cv, t.render);
		item.view = cv;
		return item;
	});

	itemsCache.set(tabs, items);
	return items;
}

// Panes mount lazily: a pane view that isn't loaded yet would render into
// nothing — mount on the tabview's loaded event, all at once.
function mountPanes(e: any) {
	const tv = e.object as TabView;
	for (const item of tv.items as TabViewItem[]) {
		const cv = item.view as GridLayout;
		if (!(cv instanceof GridLayout) || paneRoots.has(cv)) continue;
		const render = tabsByView.get(cv);
		if (!render) continue;
		const root = createNativeScriptRoot(cv);
		paneRoots.set(cv, root);
		root.render(TabPane as unknown as UniversalComponent, { render });
	}

	console.log('[probe] tabs mounted panes=' + (tv.items as TabViewItem[]).length);
}

function TabsInner(props: {
	className?: any;
	style?: any;
	id?: string;
	tabs: readonly TabSpec[];
	selectedIndex?: number;
	onSelectedIndexChanged?: (index: number) => void;
}) @{
	<tabview
		id={props.id}
		className={cx(props.className)}
		style={props.style}
		items={itemsFor(props.tabs)}
		selectedIndex={props.selectedIndex}
		onSelectedIndexChanged={(e: any) => props.onSelectedIndexChanged?.(e.value)}
		onLoaded={mountPanes}
	/>
}

// Memoized on the tabs array — TabView.item writes rebuild the native
// structure, and the driver re-applies props every render.
const MemoTabs = memo(TabsInner, (a, b) => a.tabs === b.tabs && a.selectedIndex === b.selectedIndex);

/** Platform tab shell. `tabs` is identity-stable (module const preferred). */
export function Tabs(props: TabsProps) @{
	<MemoTabs
		id={props.id}
		className={props.className}
		style={props.style}
		tabs={props.tabs}
		selectedIndex={props.selectedIndex}
		onSelectedIndexChanged={props.onSelectedIndexChanged}
	/>
}
