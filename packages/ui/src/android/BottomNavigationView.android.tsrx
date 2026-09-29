/** @jsxImportSource @nativescript-community/octane */
import { memo } from 'octane';
import { Frame, GridLayout, Page, TabView, TabViewItem } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { registerStack } from '../stacks';
import { cx } from '../cx';
import { getIcon } from '../icons';
import { Icon } from '../Icon.tsrx';
import { Pressable } from '../Pressable.tsrx';
import { Text } from '../Text.tsrx';
import { layoutsForRoute, screenFor, useRoute } from '../route';
import { RouteHost, screenParamsFor } from '../route-host.mobile';
import type { PlatformTabSpec, PlatformTabsProps, PlatformWidgetProps } from '../props';
import { applyEscapeProps } from '../escape-props';

export type { PlatformTabSpec as TabSpec } from '../props';

// Android named stacks never navigate a Frame (upstream #11444 makes
// TabViewItem frames unsafe) — pushes live in the route store instead, and a
// stack pane renders the current route here, same shape as the self-drawn
// Tabs. The bottom bar's OS chrome stays platform-authentic; only the pane
// content swaps.
type TabPaneProps = { render: () => any; stack?: string };
function TabPane(props: TabPaneProps) @{
	const route = useRoute(props.stack ?? '');
	const Screen = route ? screenFor(route.name) : undefined;

	@if (route && Screen) {
		<RouteHost
			screen={Screen}
			layouts={layoutsForRoute(route.name)}
			params={screenParamsFor(route)}
		/>
	} @else {
		<>{props.render()}</>
	}
}

const paneRoots = new WeakMap<GridLayout, any>();
const tabsByView = new WeakMap<GridLayout, () => any>();
const itemsCache = new WeakMap<readonly PlatformTabSpec[], TabViewItem[]>();
const iconWarned = new Set<string>();

function applyIcon(item: TabViewItem, name: string): void {
	if (name.startsWith('res://')) {
		item.iconSource = name;
		return;
	}
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

function itemsFor(tabs: readonly PlatformTabSpec[]): TabViewItem[] {
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
							TabPane as unknown as UniversalComponent, { render: t.render, stack: t.stack });

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
	tabs: readonly PlatformTabSpec[];
	selectedIndex?: number;
	onSelectedIndexChanged?: (index: number) => void;
	modifiers?: PlatformWidgetProps<PlatformTabsProps>['modifiers'];
}) @{
	<tabview
		ref={(v: any) => applyEscapeProps(v, props)}
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
const MemoNav = memo(NavInner, (a, b) => a.tabs === b.tabs && a.selectedIndex === b.selectedIndex && a.modifiers === b.modifiers);

/** BottomNavigationView — the platform tab bar (Android bottom navigation
 *  via NativeScript TabView). Each `stack` pane hosts a Frame for the tab's
 *  chrome, but pushes stay in the route store and render through RouteHost —
 *  TabViewItem-hosted Frames lose navigation bookkeeping upstream
 *  (NativeScript#11444; the #11446 fix ships in the xplat core patch).
 *  `tabs` is identity-stable. */
export function BottomNavigationView(props: PlatformWidgetProps<PlatformTabsProps>) @{
	<MemoNav
		id={props.id}
		className={props.className}
		style={props.style}
		tabs={props.tabs}
		selectedIndex={props.selectedIndex}
		onSelectedIndexChanged={props.onSelectedIndexChanged}
		modifiers={props.modifiers}
	/>
}
