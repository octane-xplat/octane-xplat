import { expect, it } from 'vitest'
import { createAppKitGridNavigation } from './grid-navigation.macos'

function fixture() {
	let notify: (event: any) => void = () => {}
	const suppressed = new Set<any>()
	const removed: unknown[] = []
	const presses: any[] = []
	let registrations = 0
	let columns: number | undefined = 2
	let tabMode = false
	let recalc = 0
	let acceptsFocus = true
	const window: any = { firstResponder: null, recalculateKeyViewLoop: () => recalc++, makeFirstResponder(view: any) {
		if (!acceptsFocus) return false
		this.firstResponder = view; return true
	} }
	const root: any = { window, userInterfaceLayoutDirection: 0 }
	const row = (id: string, y: number) => {
		const view: any = { window, superview: root, hidden: false, frame: { origin: { y } }, bounds: {}, scrollRectToVisible() {}, isAccessibilityEnabled: () => true }
		return { key: id, view }
	}
	let rows = [row('a', 0), row('b', 0), row('c', 20), row('d', 20)]
	const native = { NSNotificationCenter: { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_name: string, _object: unknown, _queue: unknown, handler: typeof notify) {
			notify = handler; registrations++; return 'observer'
		},
		removeObserver: (token: unknown) => removed.push(token),
	} } }
	const bridge = { keyboardEventsSupported: true, suppressTabStop(view: any) {
		suppressed.add(view); return () => suppressed.delete(view)
	} }
	const navigation = createAppKitGridNavigation({
		root: () => root, rows: () => rows, columns: () => columns, tabMode: () => tabMode,
		press: (row, event, toggleOnly) => presses.push([row.key, event.shiftKey, toggleOnly]),
	}, () => native, () => bridge)
	const send = (key: string, extra = {}) => {
		let prevented = false, stopped = false
		navigation.onKeyDown({
			key, code: '', eventName: 'keyDown', object: root, currentTarget: root, target: window.firstResponder,
			altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, isComposing: false,
			get defaultPrevented() { return prevented }, preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true }, ...extra,
		})
		return { prevented, stopped }
	}
	return { navigation, root, window, rows, suppressed, removed, presses, native, bridge, send,
		update: () => notify({ object: window }), registrations: () => registrations, recalc: () => recalc,
		setRows: (next: typeof rows) => { rows = next }, setColumns: (value?: number) => { columns = value },
		setTabMode: (value: boolean) => { tabMode = value }, rejectFocus: () => { acceptsFocus = false },
	}
}

it('keeps one Tab stop, moves across rows and consumes only successful navigation', () => {
	const env = fixture()
	const off = env.navigation.start()
	expect(env.suppressed.size).toBe(3)
	expect(env.suppressed.has(env.rows[0].view)).toBe(false)
	expect(env.window.firstResponder).toBeNull() // Binding never autofocuses.
	let scrolls = 0
	env.rows[2].view.scrollRectToVisible = () => scrolls++
	env.window.firstResponder = env.rows[0].view
	expect(env.send('Tab').prevented).toBe(false)
	expect(env.send('ArrowDown')).toEqual({ prevented: true, stopped: true })
	expect(scrolls).toBe(1)
	expect(env.window.firstResponder).toBe(env.rows[2].view)
	expect(env.suppressed.has(env.rows[2].view)).toBe(false)
	env.send('End')
	expect(env.window.firstResponder).toBe(env.rows[3].view)
	env.send('Home')
	expect(env.window.firstResponder).toBe(env.rows[0].view)
	env.rejectFocus()
	expect(env.send('ArrowRight')).toEqual({ prevented: false, stopped: false })
	off()
	expect(env.suppressed.size).toBe(0)
	expect(env.removed).toEqual(['observer'])
	env.navigation.dispose()
	expect(env.removed).toEqual(['observer'])
})

it('skips disabled slots without collapsing measured columns and respects RTL', () => {
	const env = fixture()
	env.setColumns(undefined)
	env.rows[1].view.isAccessibilityEnabled = () => false
	env.navigation.start()
	env.window.firstResponder = env.rows[0].view
	env.send('ArrowDown')
	expect(env.window.firstResponder).toBe(env.rows[2].view)
	env.window.firstResponder = env.rows[0].view
	env.send('ArrowRight')
	expect(env.window.firstResponder).toBe(env.rows[2].view)
	env.root.userInterfaceLayoutDirection = 1
	env.window.firstResponder = env.rows[0].view
	env.send('ArrowRight')
	expect(env.window.firstResponder).toBe(env.rows[3].view)
	env.navigation.dispose()
})

it('preserves descendant editing, composition, shortcuts and already prevented events', () => {
	const env = fixture()
	env.navigation.start()
	const editor = { window: env.window, superview: env.rows[0].view }
	env.window.firstResponder = editor
	expect(env.send('ArrowRight').prevented).toBe(false)
	expect(env.send('Enter').prevented).toBe(false)
	env.window.firstResponder = env.rows[0].view
	for (const extra of [{ isComposing: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }]) {
		expect(env.send('ArrowDown', extra).stopped).toBe(false)
		expect(env.window.firstResponder).toBe(env.rows[0].view)
	}
	expect(env.presses).toEqual([])
	env.navigation.dispose()
})

it('distinguishes Enter action and Space selection and preserves Shift range information', () => {
	const env = fixture()
	env.navigation.start()
	env.window.firstResponder = env.rows[0].view
	expect(env.send('Enter').prevented).toBe(true)
	expect(env.send(' ', { shiftKey: true }).prevented).toBe(true)
	expect(env.presses).toEqual([['a', false, false], ['a', true, true]])
	env.navigation.dispose()
})

it('repairs after pointer focus, row removal/disable and live tab-mode changes', () => {
	const env = fixture()
	env.navigation.start()
	expect(env.navigation.focusRow('c')).toBe(true)
	expect(env.suppressed.has(env.rows[2].view)).toBe(false)
	env.rows[2].view.hidden = true
	env.update()
	expect(env.suppressed.has(env.rows[0].view)).toBe(false)
	const removed = env.rows[1].view
	env.setRows(env.rows.filter((row) => row.view !== removed))
	env.update()
	expect(env.suppressed.has(removed)).toBe(false)
	env.setTabMode(true)
	env.update()
	expect(env.suppressed.size).toBe(0)
	env.window.firstResponder = env.rows[0].view
	expect(env.send('ArrowDown').prevented).toBe(false)
	expect(env.send('Enter').prevented).toBe(true)
	env.setTabMode(false)
	env.update()
	expect(env.suppressed.size).toBe(2)
	expect(env.registrations()).toBe(1)
	env.navigation.dispose()
})

it('handles delayed window attachment and field-editor focus without a DOM query', () => {
	const env = fixture()
	env.root.window = null
	env.navigation.start()
	expect(env.suppressed.size).toBe(0)
	env.root.window = env.window
	const field: any = { window: env.window, superview: env.rows[2].view }
	const editor = { window: env.window, delegate: field, superview: null }
	field.currentEditor = () => editor
	env.window.firstResponder = editor
	env.update()
	expect(env.suppressed.has(env.rows[2].view)).toBe(false)
	expect(env.send('ArrowDown', { target: field }).prevented).toBe(false)
	env.navigation.dispose()
})

it('reports absent/failed observation and releases partially acquired Tab exclusions', () => {
	const env = fixture()
	env.bridge.keyboardEventsSupported = false
	expect(env.navigation.available()).toBe(false)
	env.navigation.start()
	expect(env.registrations()).toBe(0)
	env.bridge.keyboardEventsSupported = true
	let count = 0
	const suppress = env.bridge.suppressTabStop
	env.bridge.suppressTabStop = (view: any) => {
		if (++count === 2) throw new Error('unavailable')
		return suppress(view)
	}
	env.navigation.start()
	expect(env.navigation.available()).toBe(false)
	expect(env.suppressed.size).toBe(0)
	expect(env.removed).toEqual(['observer'])
})

it('leaves focus outside an all-disabled grid and releases every exclusion on teardown', () => {
	const env = fixture()
	for (const row of env.rows) row.view.isAccessibilityEnabled = () => false
	const outside = { window: env.window }
	env.window.firstResponder = outside
	env.navigation.start()
	expect(env.suppressed.size).toBe(4)
	env.update()
	expect(env.window.firstResponder).toBe(outside)
	expect(env.navigation.focusRow('a')).toBe(false)
	expect(env.send('Home').prevented).toBe(false)
	env.navigation.dispose()
	expect(env.suppressed.size).toBe(0)
})
