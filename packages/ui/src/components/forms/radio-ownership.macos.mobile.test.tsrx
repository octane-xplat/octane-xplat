/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { RadioGroup } from './RadioGroup.macos.tsrx'
import { RadioListItem } from './RadioListItem.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
afterEach(() => vi.unstubAllGlobals())
function mount(extra: any = {}, inherited = false) {
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true })
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const window: any = { firstResponder: null, makeFirstResponder: vi.fn((view: any) => { window.firstResponder = view; return true }) }
	const base = { defaultValue: 'a', childValue: 'b', label: 'Plan', options: [{ value: 'a', label: 'Alpha' }], onValueChange: vi.fn(), ...extra }
	function Control(props: any) { return <RadioGroup {...props}><RadioListItem value={props.childValue} label="Child" isDisabled={props.childDisabled} /></RadioGroup> }
	function Fixture(props: any) { return inherited ? <FormField label="Plan" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}><Control {...props} isDisabled={undefined} isReadOnly={undefined} /></FormField> : <Control {...props} /> }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const rows = () => all().filter((node) => node.props?.accessibilityRole === 'radio'), group = () => all().find((node) => node.props?.accessibilityRole === 'radiogroup')
	const flush = () => { flushUniversalSync(() => {}); for (const node of all()) { node.window = window; const children = node.children ?? []; node.subviews = { count: children.length, objectAtIndex: (index: number) => children[index] }; node.isAccessibilityEnabled = () => !node.props?.accessibilityState?.disabled; node.scrollRectToVisible = vi.fn() } }
	const render = (props: any) => { flushUniversalSync(() => root.render(Fixture, props)); flush() }
	const key = (handler: any, key: string) => { const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, stopPropagation: vi.fn() }; handler(event); flush(); return event }
	render(base); window.firstResponder = rows()[0]
	return { root, base, render, flush, rows, group, window, key }
}
it('rapid uncontrolled selection uses current local value and rejects callback reentry', () => {
	const f = mount(), alpha = f.rows()[0].props.onTap, beta = f.rows()[1].props.onTap, notify = vi.fn(() => alpha())
	try {
		f.render({ ...f.base, onValueChange: notify }); beta(); beta(); f.flush()
		expect(notify).toHaveBeenCalledExactlyOnceWith('b'); expect(f.base.onValueChange).not.toHaveBeenCalled(); expect(f.rows()[1].props.accessibilityState.checked).toBe(true)
	} finally { f.root.unmount() }
})
it('controlled requests wait for feedback and current selected values suppress duplicates', () => {
	const f = mount({ value: 'a' }), beta = f.rows()[1].props.onTap, notify = vi.fn()
	try {
		f.render({ ...f.base, onValueChange: notify }); beta(); beta(); f.flush(); expect(notify).toHaveBeenCalledTimes(2); expect(f.rows()[0].props.accessibilityState.checked).toBe(true)
		f.render({ ...f.base, value: 'b', onValueChange: notify }); beta(); expect(notify).toHaveBeenCalledTimes(2); expect(f.rows()[1].props.accessibilityState.checked).toBe(true)
	} finally { f.root.unmount() }
})
it('held item and keyboard callbacks honor current inherited disabled/read-only state', () => {
	const f = mount({}, true), beta = f.rows()[1].props.onTap, key = f.group().props.onKeyDown
	try {
		for (const state of [{ isDisabled: true }, { isReadOnly: true }]) { f.render({ ...f.base, ...state }); beta(); expect(f.key(key, 'ArrowDown').defaultPrevented).toBe(false) }
		expect(f.base.onValueChange).not.toHaveBeenCalled(); expect(f.window.makeFirstResponder).not.toHaveBeenCalled()
		f.render(f.base); beta(); expect(f.base.onValueChange).toHaveBeenCalledExactlyOnceWith('b')
	} finally { f.root.unmount() }
})
it('current row disabling and detach retire held actions for both options and child parts', () => {
	const f = mount(), alpha = f.rows()[0].props.onTap, beta = f.rows()[1].props.onTap
	try {
		f.render({ ...f.base, childDisabled: true, options: [{ value: 'a', label: 'Alpha', isDisabled: true }] }); alpha(); beta(); expect(f.base.onValueChange).not.toHaveBeenCalled()
		f.render({ ...f.base, options: [], childValue: 'c' }); alpha(); expect(f.base.onValueChange).not.toHaveBeenCalled()
		f.root.unmount(); beta(); expect(f.base.onValueChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('a retained child action resolves its current value and updated registration', () => {
	const f = mount(), child = f.rows()[1], activate = child.props.onTap
	try {
		f.render({ ...f.base, childValue: 'c' }); expect(f.rows()[1]).toBe(child); activate(); f.flush(); expect(f.base.onValueChange).toHaveBeenCalledExactlyOnceWith('c'); expect(child.props.accessibilityState.checked).toBe(true)
	} finally { f.root.unmount() }
})
it('keyboard selection uses the current callback and native owner, then held keys retire after teardown', () => {
	const f = mount(), key = f.group().props.onKeyDown, notify = vi.fn()
	try {
		f.render({ ...f.base, onValueChange: notify }); expect(f.key(key, 'ArrowDown').defaultPrevented).toBe(true); expect(notify).toHaveBeenCalledExactlyOnceWith('b'); expect(f.window.firstResponder).toBe(f.rows()[1])
		f.root.unmount(); const count = f.window.makeFirstResponder.mock.calls.length; expect(f.key(key, 'ArrowUp').defaultPrevented).toBe(false); expect(f.window.makeFirstResponder).toHaveBeenCalledTimes(count)
	} finally { f.root.unmount() }
})
it('consumer focus choices and teardown remain authoritative after an accepted selection', () => {
	for (const unmount of [false, true]) {
		const f = mount(), key = f.group().props.onKeyDown, other = {}, notify = vi.fn(() => { f.window.firstResponder = other; if (unmount) f.root.unmount() })
		try {
			f.render({ ...f.base, onValueChange: notify }); f.key(key, 'ArrowDown'); expect(notify).toHaveBeenCalledExactlyOnceWith('b'); expect(f.window.firstResponder).toBe(other)
		} finally { f.root.unmount() }
	}
})
it('consumer failure releases the selection claim for a subsequent current action', () => {
	const f = mount(), alpha = f.rows()[0].props.onTap, beta = f.rows()[1].props.onTap, notify = vi.fn()
	try {
		f.render({ ...f.base, onValueChange: () => { throw Error('consumer failure') } }); expect(() => beta()).toThrow('consumer failure')
		f.render({ ...f.base, onValueChange: notify }); alpha(); expect(notify).toHaveBeenCalledExactlyOnceWith('a')
	} finally { f.root.unmount() }
})
