/** @jsxImportSource @nativescript-community/octane */
import { memo, useState } from 'octane'
import { GridLayout, TabViewItem } from '@nativescript/core'
import { createPortal } from '../native-portal'
import { cx } from '@octane-xplat/lib'
import { getIcon } from '../icons'
import { Icon } from '../Icon.tsrx'
import { Pressable } from '../Pressable.tsrx'
import { Text } from '../Text.tsrx'
import { RouteOutlet } from '../RouteOutlet'
import type { BottomNavigationViewProps, PlatformTabSpec } from '../props'
import { applyEscapeProps } from '../escape-props'

// The OS tab bar retains a canonical route outlet in each named pane.
type TabPaneProps = { render: () => any; stack?: string }
function TabPane(props: TabPaneProps) @{
	@if (props.stack) {
		<RouteOutlet stack={props.stack}>{props.render()}</RouteOutlet>
	}
	@else {
		<>{props.render()}</>
	}
}

const panesByItem = new WeakMap<TabViewItem, GridLayout>()
const itemsCache = new WeakMap<readonly PlatformTabSpec[], TabViewItem[]>()
const iconWarned = new Set<string>()

function applyIcon(item: TabViewItem, name: string): void {
	if (name.startsWith('res://')) {
		item.iconSource = name
		return
	}

	const glyph = getIcon(name)
	if (!glyph) {
		warnIconOnce(name, `tab icon '${name}' isn't registered — call registerIcons() at boot.`)
		return
	}

	if (glyph.src) {
		item.iconSource = glyph.src
	} else if (glyph.font) {
		item.iconSource = 'font://' + glyph.font.glyph
		item.iconFontFamily = glyph.font.family
	} else if (glyph.text) {
		item.iconSource = 'font://' + glyph.text
	} else {
		warnIconOnce(
			name,
			`tab icon '${name}' has no src/font/text representation — the platform tab bar can't render svg/markup glyphs.`,
		)
	}
}

function warnIconOnce(name: string, msg: string): void {
	if (iconWarned.has(name)) {
		return
	}

	iconWarned.add(name)
	console.warn('[octane-xplat] ' + msg)
}

function itemsFor(tabs: readonly PlatformTabSpec[]): TabViewItem[] {
	let items = itemsCache.get(tabs)
	if (items !== undefined) {
		return items
	}

	items = tabs.map((t) => {
		const item = new TabViewItem()
		item.title = t.title
		if (t.icon) {
			applyIcon(item, t.icon)
		}

		const pane = new GridLayout()
		panesByItem.set(item, pane)

		item.view = pane
		return item
	})

	itemsCache.set(tabs, items)
	return items
}

function NavInner(props: {
	className?: any
	style?: any
	id?: string
	tabs: readonly PlatformTabSpec[]
	selectedIndex?: number
	onSelectedIndexChanged?: (index: number) => void
	modifiers?: BottomNavigationViewProps['modifiers']
}) @{
	const [loaded, setLoaded] = useState(false)
	const items = itemsFor(props.tabs)

	<>
		<tabview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx(props.className)}
			style={props.style}
			items={items}
			selectedIndex={props.selectedIndex}
			onSelectedIndexChanged={(e: any) => props.onSelectedIndexChanged?.(e.value)}
			onLoaded={() => setLoaded(true)}
		/>
		{loaded
			? items.map((item, index) => {
					const target = panesByItem.get(item)
					return target
						? createPortal(
								<TabPane render={props.tabs[index].render} stack={props.tabs[index].stack} />,
								target,
							)
						: null
				})
			: null}
	</>
}

// Memoized on the tabs array — TabView.item writes rebuild the native
// structure, and the driver re-applies props every render.
const MemoNav = memo(
	NavInner,
	(a, b) => a.tabs === b.tabs && a.selectedIndex === b.selectedIndex && a.modifiers === b.modifiers,
)

/** BottomNavigationView — the platform tab bar (Android bottom navigation
 *  via NativeScript TabView). Each `stack` pane hosts a Frame for the tab's
 *  chrome; canonical route outlets retain the pane history —
 *  TabViewItem-hosted Frames lose navigation bookkeeping upstream
 *  (NativeScript#11444; the #11446 fix ships in the xplat core patch).
 *  `tabs` is identity-stable. */
export function BottomNavigationView(props: BottomNavigationViewProps) @{
	const indexForKey = (key?: string) =>
		key == null ? -1 : props.tabs.findIndex((t, i) => (t.key ?? String(i)) === key)

	const keyIndex = indexForKey(props.selectedKey)
	// selectedKey wins, matching the shared Tabs; an unmatched key selects
	// nothing rather than silently reverting to the index.
	const selectedIndex =
		props.selectedKey != null
			? keyIndex >= 0
				? keyIndex
				: undefined
			: (props.selectedIndex ??
				(indexForKey(props.defaultSelectedKey) >= 0
					? indexForKey(props.defaultSelectedKey)
					: undefined))

	<MemoNav
		id={props.id}
		className={props.className}
		style={props.style}
		tabs={props.tabs}
		selectedIndex={selectedIndex}
		onSelectedIndexChanged={(i: number) => {
			props.onSelectionChange?.(props.tabs[i]?.key ?? String(i))
			props.onSelectedIndexChanged?.(i)
		}}
		modifiers={props.modifiers}
	/>
}
