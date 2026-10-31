import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

// Actual renderer branch with native stand-ins. No tracking loop, responder
// propagation, pointer/key/AX delivery or native class registration is exercised.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const slice = source.slice(source.indexOf('const contextMenuAttachments'), source.indexOf('const DATE_PICKER_STYLES'))
function fixture(failure: { init?: boolean; add?: number } = {}) {
	const menus: any[] = [], items: any[] = [], logs: any[] = [], held = new Map<number, () => void>()
	const actions = new Map<number, () => void>()
	const set = actions.set.bind(actions)
	actions.set = (id, fn) => { held.set(id, fn); return set(id, fn) }
	const context = runSlice(slice + '\n({ attachContextMenu })', {
		NSMenu: Object.assign(function NSMenu() {}, { alloc: () => ({ init() {
			if (failure.init) {throw Error('private construction details')}
			const menu: any = { items: [], cancelled: 0,
				addItem(item: any) { if (failure.add === this.items.length) {throw Error('private item details');} this.items.push(item) },
				cancelTracking() { this.cancelled++; this.onCancel?.() },
			}; menus.push(menu); return menu
		} }) }),
		NSMenuItem: Object.assign(function NSMenuItem() {}, {
			separatorItem: () => ({ separator: true }),
			alloc: () => ({ initWithTitleActionKeyEquivalent(title: string, action: string) {
				const item: any = { title, action, isEnabled() { return this.enabled } }; items.push(item); return item
			} }),
		}),
		menuActionTarget: {}, nextActionId: 1, actionHandlers: actions,
		console: { error: (...args: any[]) => logs.push(args) },
	})
	return { attach: context.attachContextMenu, menus, items, actions, held, logs }
}
const root = (menu: any = null) => ({ menu, window: {} as object | null })

test('attaches only at the wrapper, preserves descendant menus and restores the prior slot', () => {
	const f = fixture(), previous = {}, editing = {}, child = root(editing), view = root(previous), selected: string[] = []
	Object.defineProperty(view, 'subviews', { get() { throw Error('Do not overwrite descendant menu slots') } })
	const detach = f.attach(view, { items: [{ id: 'rename', title: 'Rename', divider: true }] }, (id: string) => selected.push(id))
	assert.equal(view.menu, f.menus[0]); assert.equal(child.menu, editing)
	const lateChild = root(); assert.equal(lateChild.menu, null) // Responder behavior is native qualification, not simulated here.
	assert.equal(f.menus[0].autoenablesItems, false); assert.equal(f.menus[0].items.length, 2); assert.equal(f.menus[0].items[0].separator, true)
	f.held.get(f.items[0].tag)!(); assert.deepEqual(selected, ['rename'])
	detach(); detach(); assert.equal(view.menu, previous); assert.equal(child.menu, editing); assert.equal(f.actions.size, 0)
	assert.equal(f.menus[0].cancelled, 1); assert.equal(f.items[0].target, null); f.held.get(f.items[0].tag)!(); assert.deepEqual(selected, ['rename'])
})

test('disabled/native-disabled, unattached-window and superseded menu actions do not dispatch', () => {
	const f = fixture(), view = root(), selected: string[] = []
	const detach = f.attach(view, { items: [{ id: 'enabled', title: 'Enabled' }, { id: 'disabled', title: 'Disabled', disabled: true }] }, (id: string) => selected.push(id))
	const enabled = f.items[0], disabled = f.items[1], select = f.held.get(enabled.tag)!
	disabled.enabled = true; f.held.get(disabled.tag)!(); assert.deepEqual(selected, [])
	enabled.enabled = false; select(); assert.deepEqual(selected, [])
	enabled.enabled = true; view.window = null; select(); assert.deepEqual(selected, [])
	view.window = {}; const menu = view.menu; view.menu = {}; select(); assert.deepEqual(selected, [])
	view.menu = menu; select(); assert.deepEqual(selected, ['enabled']); detach()
})

test('overlapping same-view attachments restore active predecessors but skip retired ones', () => {
	for (const retireOlderFirst of [true, false]) {
		const f = fixture(), previous = {}, view = root(previous), selected: string[] = []
		const a = f.attach(view, { items: [{ id: 'a', title: 'A' }] }, (id: string) => selected.push(id)), actionA = f.held.get(f.items[0].tag)!
		const b = f.attach(view, { items: [{ id: 'b', title: 'B' }] }, (id: string) => selected.push(id))
		actionA(); assert.deepEqual(selected, [])
		if (retireOlderFirst) { a(); assert.equal(view.menu, f.menus[1]); b(); actionA(); assert.deepEqual(selected, []) }
		else { b(); assert.equal(view.menu, f.menus[0]); actionA(); assert.deepEqual(selected, ['a']); a() }
		assert.equal(view.menu, previous); assert.equal(f.actions.size, 0)
	}
})

test('nested wrappers and foreign replacements retain their own menu slots during cleanup', () => {
	const f = fixture(), parent = root(), childPrior = {}, child = root(childPrior)
	const outer = f.attach(parent, { items: [{ id: 'outer', title: 'Outer' }] }, () => {})
	const inner = f.attach(child, { items: [{ id: 'inner', title: 'Inner' }] }, () => {})
	outer(); assert.equal(child.menu, f.menus[1]); assert.equal(parent.menu, null)
	const foreign = {}; child.menu = foreign; inner(); assert.equal(child.menu, foreign); assert.equal(f.actions.size, 0)
})

test('partial construction/item failures remove registered actions without changing prior menus', () => {
	for (const failure of [{ init: true }, { add: 1 }]) {
		const f = fixture(failure), previous = {}, view = root(previous)
		assert.equal(f.attach(view, { items: [{ id: 'one', title: 'One' }, { id: 'two', title: 'Two' }] }, () => assert.fail('retired action')), null)
		assert.equal(view.menu, previous); assert.equal(f.actions.size, 0)
		for (const action of f.held.values()) {action()}
		if (f.menus.length) { assert.equal(f.menus[0].cancelled, 1); assert.ok(f.items.every((item) => item.target === null)) }
	}
})

test('selection reentry is suppressed, consumer errors are generic, and cancel callbacks are retired first', () => {
	const f = fixture(), view = root(); let count = 0, select!: () => void
	const detach = f.attach(view, { items: [{ id: 'rename', title: 'Rename' }] }, () => { count++; select(); if (count === 1) {throw Error('private consumer details')} })
	select = f.held.get(f.items[0].tag)!; select(); select(); assert.equal(count, 2)
	assert.deepEqual(f.logs, [['[macos-leaf] context-menu selection failed']])
	f.menus[0].onCancel = select; detach(); assert.equal(count, 2); assert.equal(f.actions.size, 0)
})

test('a slot setter failing after assignment is rolled back and all held actions become inert', () => {
	const f = fixture(), previous = {}; let menu = previous, fail = true
	const view = { window: {}, get menu() { return menu }, set menu(next) { menu = next; if (fail) { fail = false; throw Error('private slot details') } } }
	assert.equal(f.attach(view, { items: [{ id: 'rename', title: 'Rename' }] }, () => assert.fail('failed attachment')), null)
	assert.equal(view.menu, previous); assert.equal(f.actions.size, 0); assert.equal(f.menus[0].cancelled, 1)
	for (const action of f.held.values()) {action()}
})
