/** @jsxImportSource @nativescript-community/octane */
import { memo } from 'octane';
import { Frame, GridLayout, Page, TabView, TabViewItem } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { registerStack } from '../stacks.native';
import { cx } from '../cx';
import { getIcon } from '../icons';
import { Icon } from '../Icon.native.tsrx';
import { Pressable } from '../Pressable.native.tsrx';
import { Text } from '../Text.native.tsrx';
import { layoutsForRoute, screenFor, useRoute } from '../route.native';
import { RouteHost } from '../RouteHost.native';
import type { TabSpec, TabsProps } from '../props';

export type { TabSpec } from '../props';

type TabPaneProps = { render: () => any };
function TabPane(props: TabPaneProps) @{
	<>{props.render()}</>
}

const paneRoots = new WeakMap<GridLayout, any>();
const tabsByView = new WeakMap<GridLayout, () => any>();
const itemsCache = new WeakMap<readonly TabSpec[], TabViewItem[]>();
const iconWarned = new Set<string>();

function applyIcon(item: TabViewItem, name: string): void {
	const glyph = getIcon(name);
	if (!glyph) {
		warnIconOnce(name, `tab icon '${name}' isn't registered — call registerIcons() at boot.`);
		return;
	}

	if (glyph.src) {
		item.iconSource = glyph.src;
	} else if (glyph.font) {
		item.iconSource = 'font://' + glyph.font.glyph;
		item.iconFontFamily = glyph.font.family;
	} else if (glyph.text) {
		item.iconSource = 'font://' + glyph.text;
	} else {
		warnIconOnce(
			name,
			`tab icon '${name}' has no src/font/text representation — the platform tab bar can't render svg/markup glyphs.`,
		);
	}
}

function warnIconOnce(name: string, msg: string): void {
	if (iconWarned.has(name)) return;
	iconWarned.add(name);
	console.warn('[octane-xplat] ' + msg);
}

function itemsFor(tabs: readonly TabSpec[]): TabViewItem[] {
	let items = itemsCache.get(tabs);
	if (items !== undefined) return items;
	items = tabs.map((t) => {
		const item = new TabViewItem();
		item.title = t.title;
		if (t.icon) applyIcon(item, t.icon);
		if (t.stack) {
			const frame = new Frame();
			frame.once('loaded', () => {
				frame.navigate({
					create: () => {
						const page = new Page();
						page.actionBarHidden = true;
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
}

function NavInner(props: {
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
const MemoNav = memo(NavInner, (a, b) => a.tabs === b.tabs && a.selectedIndex === b.selectedIndex);

/** BottomNavigationView — the platform tab bar (Android bottom navigation
 *  via NativeScript TabView). Caveat (upstream NativeScript#11444): a Frame
 *  inside TabViewItem does not commit currentPage/backStack reliably on
 *  Android, so `stack` panes may not take pushes — the shared `Tabs` (the
 *  self-drawn root export) keeps per-stack history in the route store and
 *  is the reliable path there. `tabs` is identity-stable. */
export function BottomNavigationView(props: TabsProps) @{
	<MemoNav
		id={props.id}
		className={props.className}
		style={props.style}
		tabs={props.tabs}
		selectedIndex={props.selectedIndex}
		onSelectedIndexChanged={props.onSelectedIndexChanged}
	/>
}
