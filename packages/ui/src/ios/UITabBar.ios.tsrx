/** @jsxImportSource @nativescript-community/octane */
import { memo, useState } from 'octane'
import { Frame, GridLayout, Page, TabView, TabViewItem } from '@nativescript/core'
import { createPortal } from '../native-portal'
import { RouteOutlet } from '../RouteOutlet'
import { registerStack } from '../stacks'
import { cx } from '@octane-xplat/lib'
import { getIcon } from '../icons'
import type { PlatformTabSpec, UITabBarProps } from '../props'
import { applyEscapeProps } from '../escape-props'

// TabViewItem content is a plain native view — the driver can't parent
// reconciled children into <tabviewitem>, so each pane is a GridLayout portal
// target. GridLayout, not ContentView: it accepts every root child from a
// pane render rather than keeping only the last under `.content`.
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

// Registered glyph → UITabBarItem image. `src` passes to iconSource
// verbatim (sys:// = SF Symbol, res://, font://, file path); `font` and
// `text` glyphs draw through font://. svg/markup can't become a UIImage
// synchronously — warn once, render title-only.
function applyIcon(item: TabViewItem, name: string): void {
	if (name.startsWith('sys://') || name.startsWith('res://')) {
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
		// font:// with no iconFontFamily draws through the default font.
		item.iconSource = 'font://' + glyph.text
	} else {
		warnIconOnce(
			name,
			`tab icon '${name}' has no src/font/text representation — UITabBarItem can't render svg/markup glyphs.`,
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
		if (t.icon != null) {
			applyIcon(item, t.icon)
		}

		const pane = new GridLayout()
		panesByItem.set(item, pane)
		if (t.stack) {
			// Parallel-stack pane: the item's view IS a Frame whose default
			// page hosts the pane portal. Pushes land inside the tab; the tab
			// bar stays visible.
			// Navigate on `loaded`, not eagerly: a navigate issued before the
			// frame enters the window hierarchy leaves _executingContext
			// stuck (iOS's delegate never sees didShow) and every later push
			// queues forever.
			const frame = new Frame()
			frame.once('loaded', () => {
				frame.navigate({
					create: () => {
						const page = new Page()
						page.actionBarHidden = true
						// Page is a ContentView — single-child. Root on a
						// GridLayout child so every portaled pane child is retained.
						page.content = pane
						return page
					},
				})
			})

			registerStack(t.stack, frame)
			item.view = frame
			return item
		}

		item.view = pane
		return item
	})

	itemsCache.set(tabs, items)
	return items
}

function TabBarInner(props: {
	className?: any
	style?: any
	id?: string
	tabs: readonly PlatformTabSpec[]
	selectedIndex?: number
	onSelectedIndexChanged?: (index: number) => void
	ios?: Record<string, any>
	modifiers?: UITabBarProps['modifiers']
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
const MemoTabBar = memo(
	TabBarInner,
	(a, b) => a.tabs === b.tabs && a.selectedIndex === b.selectedIndex && a.modifiers === b.modifiers,
)

/** UITabBar — the platform tab bar (UIKit UITabBarController-backed TabView).
 *  Real per-pane Frames: each `stack` tab keeps a native navigation stack
 *  inside its pane. The self-drawn shared `Tabs` lives in the root export.
 *  `tabs` is identity-stable (module const preferred). */
export function UITabBar(props: UITabBarProps) @{
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

	<MemoTabBar
		id={props.id}
		className={props.className}
		style={props.style}
		tabs={props.tabs}
		selectedIndex={selectedIndex}
		ios={props.ios}
		onSelectedIndexChanged={(i: number) => {
			props.onSelectionChange?.(props.tabs[i]?.key ?? String(i))
			props.onSelectedIndexChanged?.(i)
		}}
		modifiers={props.modifiers}
	/>
}
