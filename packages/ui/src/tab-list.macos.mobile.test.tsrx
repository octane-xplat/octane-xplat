/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TabList, Tab } from './TabList.macos.tsrx'
import { createAppKitChoiceFocus } from './choice-focus.macos'
import { revealAppKitTab } from './tab-reveal.macos'

function geometry(start: number, width = 40, current = 0) {
	const calls: unknown[] = []
	const document = { frame: { size: { width: 500, height: 200 } }, flipped: true }
	const clip = { bounds: { origin: { x: current, y: 30 }, size: { width: 100, height: 60 } },
		scrollToPoint: (point: any) => { calls.push(point); clip.bounds.origin = point } }
	const scroll = { contentView: clip, documentView: document, reflectScrolledClipView: () => {} }
	const tab = { bounds: {}, isDescendantOf: (view: unknown) => view === document,
		convertRectToView: (_: unknown, view: unknown) => { expect(view).toBe(document); return { origin: { x: start }, size: { width } } } }
	return { scroll: scroll as any, tab: tab as any, clip, calls }
}

it('reveals native selected-tab bounds horizontally and preserves vertical position', () => {
	const f = geometry(160)
	expect(revealAppKitTab(f.scroll, f.tab)).toBe(true)
	expect(f.calls).toEqual([{ x: 100, y: 30 }])
	expect(revealAppKitTab(f.scroll, f.tab)).toBe(false)
	const back = geometry(20, 40, 100)
	revealAppKitTab(back.scroll, back.tab)
	expect(back.calls).toEqual([{ x: 20, y: 30 }])
})

it('handles oversized, out-of-range, invalid and unrelated tab geometry', () => {
	const oversized = geometry(150, 200)
	revealAppKitTab(oversized.scroll, oversized.tab)
	expect(oversized.calls).toEqual([{ x: 150, y: 30 }])
	expect(revealAppKitTab(oversized.scroll, oversized.tab)).toBe(false)
	const end = geometry(490)
	revealAppKitTab(end.scroll, end.tab)
	expect(end.calls).toEqual([{ x: 400, y: 30 }])
	const invalid = geometry(NaN)
	expect(revealAppKitTab(invalid.scroll, invalid.tab)).toBe(false)
	const detached = geometry(160)
	detached.tab.isDescendantOf = () => false
	expect(revealAppKitTab(detached.scroll, detached.tab)).toBe(false)
	expect(revealAppKitTab(null, undefined)).toBe(false)
})

it('names visible/hidden/disabled tabs and gives the tablist native grouping', () => {
	function Fixture(props: any) {
		return <TabList id="sections" value={props.value} onChange={props.onChange} role="tablist" layout="fill">
			<Tab id="overview" value="overview" label="Overview" />
			<Tab id="details" value="details" label="Details" isLabelHidden />
			<Tab id="disabled" value="disabled" label="Unavailable" isDisabled />
		</TabList>
	}
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const changes: string[] = []
	const render = (value: string) => { root.render(Fixture, { value, onChange: (next: string) => changes.push(next) }); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	try {
		render('overview')
		const byID = (id: string) => all().find((node) => node.props?.id === id)
		expect(byID('sections').props.accessibilityRole).toBe('tablist')
		expect(byID('sections').props.accessibilityLabel).toBe('Tabs')
		expect(byID('overview').props.accessibilityLabel).toBe('Overview')
		expect(byID('details').props.accessibilityLabel).toBe('Details')
		expect(byID('disabled').props.accessibilityRole).toBe('tab')
		expect(byID('disabled').props.accessibilityState.disabled).toBe(true)
		expect(byID('disabled').props.onTap).toBeUndefined()
		byID('details').props.onTap(); flushUniversalSync(() => {})
		expect(changes).toEqual(['details'])
		expect(byID('overview').props.accessibilityState.selected).toBe(true)
		render('details')
		expect(byID('details').props.accessibilityState.selected).toBe(true)
	} finally { root.unmount() }
})


function focusFixture(automatic = false) {
	const excluded = new Set<object>(), revealed: object[] = [], requests: string[] = []
	const window: any = { firstResponder: null, makeFirstResponder(view: any) { this.firstResponder = view; return true }, recalculateKeyViewLoop() {} }
	const children: any[] = []
	const root: any = { window, subviews: { get count() { return children.length }, objectAtIndex: (index: number) => children[index] } }
	const item = (key: string) => ({ key, window, superview: root, hidden: false, enabled: true, accessibilityIsEnabled() { return this.enabled } })
	const a = item('a'), b = item('b'), c = item('c')
	children.push(a, b, c)
	let selected: string | undefined = 'b'
	let pattern: 'tabs' | 'nav' = 'tabs', direction: 'ltr' | 'rtl' = 'ltr', keyboardSupported: boolean | undefined
	const bridge = () => ({ keyboardEventsSupported: keyboardSupported, suppressTabStop: (view: object) => { excluded.add(view); return () => excluded.delete(view) } })
	const navigation = createAppKitChoiceFocus({ root: () => root, views: new Map([['c', c], ['a', a], ['b', b]]) as any,
		selected: () => selected, orientation: () => pattern === 'tabs' ? 'horizontal' : 'both', direction: () => direction, reveal: (view) => { revealed.push(view) }, onNavigate: automatic ? (key) => requests.push(key) : undefined }, bridge)
	const key = (name: string, extras = {}) => {
		const event: any = { key: name, defaultPrevented: false, isComposing: false, altKey: false, ctrlKey: false, metaKey: false,
			preventDefault() { this.defaultPrevented = true }, ...extras }
		navigation.keyDown(event)
		return event
	}
	return { navigation, excluded, revealed, requests, window, children, a, b, c, key,
		capability: (value: boolean) => { keyboardSupported = value }, select: (value: string | undefined) => { selected = value }, rtl: () => { direction = 'rtl' }, nav: () => { pattern = 'nav' } }
}

it('uses one registered-tab stop, native child order and manual arrow selection', () => {
	const f = focusFixture()
	f.navigation.synchronize()
	expect(f.excluded).toEqual(new Set([f.a, f.c]))
	f.window.firstResponder = f.b
	expect(f.key('ArrowRight').defaultPrevented).toBe(true)
	expect(f.window.firstResponder).toBe(f.c)
	expect(f.excluded).toEqual(new Set([f.a, f.b]))
	expect(f.revealed).toEqual([f.c])
	// Focus changed without requesting selection; selection still owns b.
	f.window.firstResponder = null
	f.navigation.synchronize()
	expect(f.excluded).toEqual(new Set([f.a, f.c]))
	f.window.firstResponder = f.b
	f.children.splice(0, 3, f.c, f.b, f.a)
	f.key('ArrowRight')
	expect(f.window.firstResponder).toBe(f.a)
	f.navigation.dispose()
	expect(f.excluded.size).toBe(0)
})

it('skips disabled/hidden tabs, supports RTL and preserves vertical/modifier/IME keys', () => {
	const f = focusFixture()
	f.window.firstResponder = f.b
	f.c.enabled = false
	f.key('ArrowRight')
	expect(f.window.firstResponder).toBe(f.a)
	f.rtl(); f.key('ArrowRight')
	expect(f.window.firstResponder).toBe(f.b)
	f.key('Home'); expect(f.window.firstResponder).toBe(f.a)
	f.key('End'); expect(f.window.firstResponder).toBe(f.b)
	expect(f.key('ArrowDown').defaultPrevented).toBe(false)
	expect(f.key('ArrowLeft', { metaKey: true }).defaultPrevented).toBe(false)
	expect(f.key('ArrowLeft', { isComposing: true }).defaultPrevented).toBe(false)
	f.nav(); expect(f.key('ArrowDown').defaultPrevented).toBe(true)
	expect(f.window.firstResponder).toBe(f.a)
	f.a.hidden = true
	f.window.firstResponder = null
	f.select('a'); f.navigation.synchronize()
	expect(f.excluded.size).toBe(0) // b is the only usable tab.
	f.navigation.dispose()
})


it('does not consume a key when native focus rejects the target or focus is outside the strip', () => {
	const f = focusFixture()
	f.window.firstResponder = f.b
	f.window.makeFirstResponder = () => false
	expect(f.key('ArrowRight').defaultPrevented).toBe(false)
	expect(f.revealed).toEqual([])
	f.window.firstResponder = { window: f.window }
	expect(f.key('Home').defaultPrevented).toBe(false)
	f.navigation.dispose()
})


it('automatic choices request selection once only after successful native focus', () => {
	const f = focusFixture(true)
	f.window.firstResponder = f.b
	f.key('ArrowRight')
	expect(f.requests).toEqual(['c'])
	f.nav(); f.key('ArrowDown')
	expect(f.requests).toEqual(['c', 'a'])
	f.window.makeFirstResponder = () => false
	expect(f.key('Home').defaultPrevented).toBe(false)
	expect(f.requests).toEqual(['c', 'a'])
	f.navigation.dispose()
})

it('leaves keys on interactive trailing descendants to that control', () => {
	const f = focusFixture(true)
	f.window.firstResponder = { window: f.window, superview: f.b }
	expect(f.key('ArrowLeft').defaultPrevented).toBe(false)
	expect(f.requests).toEqual([])
	f.navigation.dispose()
})


it('uses the first enabled choice when a radio-like group has no selection', () => {
	const f = focusFixture(true)
	f.select(undefined)
	f.navigation.synchronize()
	expect(f.excluded).toEqual(new Set([f.b, f.c]))
	f.a.enabled = false
	f.navigation.synchronize()
	expect(f.excluded).toEqual(new Set([f.c]))
	f.navigation.dispose()
})


it('manual choice focus reuses native ordering and never requests automatic selection', () => {
	const f = focusFixture(true)
	expect(f.navigation.orderedKeys()).toEqual(['a', 'b', 'c'])
	expect(f.navigation.focus('c')).toBe(true)
	expect(f.window.firstResponder).toBe(f.c)
	expect(f.requests).toEqual([])
	f.c.enabled = false
	expect(f.navigation.focus('c')).toBe(false)
	f.select(undefined)
	expect(f.navigation.focus(undefined, 'last')).toBe(true)
	expect(f.window.firstResponder).toBe(f.b)
	const previous = f.revealed.length
	f.window.makeFirstResponder = () => false
	expect(f.navigation.focus('a')).toBe(false)
	expect(f.revealed).toHaveLength(previous)
	f.navigation.dispose()
	expect(f.excluded.size).toBe(0)
})


it('restores ordinary option Tab stops when the host explicitly lacks key dispatch', () => {
	const f = focusFixture()
	f.navigation.synchronize(); expect(f.excluded.size).toBe(2)
	f.capability(false); f.navigation.synchronize(); expect(f.excluded.size).toBe(0)
	f.capability(true); f.navigation.synchronize(); expect(f.excluded.size).toBe(2)
	f.navigation.dispose(); expect(f.excluded.size).toBe(0)
})
