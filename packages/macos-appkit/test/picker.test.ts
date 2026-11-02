import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\n}', start) + 2)
}
const choices = () => [{ id: 'a', title: 'Same' }, { id: '', title: 'Same' }, { id: 'blocked', title: '', disabled: true }]

// Actual renderer allocation/bridge against fake native objects, not AppKit/ABI.
function fixture(failure: { constraint?: number; item?: number; add?: boolean } = {}) {
	const handlers = new Map<number, any>(), selected: string[] = [], labels: string[] = [], constraints: any[] = [], errors: string[] = []
	let additions = 0, cancelled = 0, writes = 0, echo = false, intercept = (_id: string) => {}
	const menu: any = { items: [], autoenablesItems: true, cancelTracking() { cancelled++; if (echo) {handlers.get(1)?.()} }, addItem(item: any) { additions++; if (failure.item === additions) {throw Error('private item detail');} this.items.push(item) } }
	const picker: any = {
		menu, enabled: true, superview: null, indexOfSelectedItem: -1,
		get isEnabled() { return this.enabled },
		get selectedItem() { return menu.items[this.indexOfSelectedItem] },
		removeAllItems() { menu.items = []; this.indexOfSelectedItem = -1; if (echo) {handlers.get(1)?.()} },
		selectItemAtIndex(index: number) { writes++; this.indexOfSelectedItem = index; if (echo) {handlers.get(1)?.()} },
		invalidateIntrinsicContentSize() {},
		get accessibilityLabel() { return labels.at(-1) ?? '' },
		set accessibilityLabel(label: string) { labels.push(label) },
		removeFromSuperview() { this.superview = null },
	}
	const view: any = { window: {}, addSubview(child: any) { child.superview = view; handlers.get(1)?.(); if (failure.add) {throw Error('private add detail')} } }
	for (const edge of ['leadingAnchor', 'trailingAnchor', 'topAnchor', 'bottomAnchor']) {
		view[edge] = {}
		picker[edge] = { constraintEqualToAnchor() {
			const index = constraints.length; let active = false
			const constraint = { get active() { return active }, set active(next: boolean) { if (next && failure.constraint === index) {throw Error('private constraint detail');} active = next } }
			constraints.push(constraint); return constraint
		} }
	}
	const api = runSlice(['makePopUpControl', 'attachPicker'].map(fn).join('\n') + '\n({attachPicker})', {
		NSPopUpButton: { alloc: () => ({ initWithFramePullsDown: () => picker }) },
		NSMenuItem: { alloc: () => ({ initWithTitleActionKeyEquivalent: (title: string) => ({ title, enabled: true, get isEnabled() { return this.enabled } }) }) },
		buttonActionTarget: {}, nextActionId: 1, actionHandlers: handlers,
		console: { error: (message: string) => errors.push(message) },
	})
	return { picker, view, handlers, selected, labels, constraints, menu, errors,
		attach: (options: any = choices(), selection: any = 'a') => api.attachPicker(view, { options, selection, enabled: true, accessibilityLabel: 'Bag' }, (id: string) => { selected.push(id); intercept(id) }),
		plan: (patch: any = {}) => ({ options: choices(), selection: 'a', enabled: true, accessibilityLabel: 'Bag', ...patch }),
		choose(index: number) { picker.indexOfSelectedItem = index; handlers.get(1)?.() },
		echo: (next: boolean) => { echo = next }, intercept: (callback: (id: string) => void) => { intercept = callback }, additions: () => additions, cancelled: () => cancelled, writes: () => writes }
}

test('explicit native items preserve duplicate/empty titles, stable IDs and disabled rows', () => {
	const f = fixture(), handle = f.attach()!
	assert.equal(f.picker.action, 'controlChanged:'); assert.equal(f.picker.autoenablesItems, false); assert.equal(f.menu.autoenablesItems, false)
	assert.deepEqual(f.menu.items.map((item: any) => item.title), ['Same', 'Same', '']); assert.equal(f.menu.items[2].enabled, false)
	f.choose(1); f.choose(2); f.choose(-1); f.choose(99); assert.deepEqual(f.selected, [''])
	assert.ok(f.constraints.every((c) => c.active)); handle.detach()
})
test('equal choices/callback-only update keeps the native menu; selection/label reset skips redundant writes', () => {
	const f = fixture(), handle = f.attach()!, items = [...f.menu.items], writes = f.writes(), cancels = f.cancelled()
	handle.update(f.plan()); assert.equal(f.writes(), writes); assert.equal(f.cancelled(), cancels); assert.deepEqual(f.menu.items, items)
	f.echo(true); handle.update(f.plan({ selection: '', accessibilityLabel: '' })); assert.deepEqual(f.selected, [])
	assert.deepEqual(f.labels, ['Bag', '']); assert.equal(f.picker.indexOfSelectedItem, 1)
	handle.update(f.plan({ options: [], selection: undefined })); assert.equal(f.picker.enabled, false); assert.equal(f.picker.indexOfSelectedItem, -1); handle.detach()
})
test('choice replacement cancels tracking before mutation, suppresses echoes and retires old action epochs', () => {
	const f = fixture(), handle = f.attach()!, old = f.handlers.get(1), cancels = f.cancelled()
	f.echo(true); handle.update(f.plan({ options: choices().reverse(), selection: '' })); f.picker.indexOfSelectedItem = 2; old()
	assert.deepEqual(f.selected, []); assert.ok(f.cancelled() > cancels); assert.equal(f.additions(), 6)
	f.choose(2); assert.deepEqual(f.selected, ['a']); handle.detach()
})
test('native action guards attached owner, BOOL property/method, item state and actual menu-item identity', () => {
	const f = fixture(), handle = f.attach()!, action = f.handlers.get(1)
	f.view.window = null; f.choose(1); f.view.window = {}; f.picker.superview = {}; f.choose(1); f.picker.superview = f.view
	Object.defineProperty(f.picker, 'isEnabled', { configurable: true, value: () => 0 }); f.choose(1)
	Object.defineProperty(f.picker, 'isEnabled', { configurable: true, value: true }); f.menu.items[1].enabled = false; f.choose(1)
	f.menu.items[1].enabled = true; const owned = f.menu.items[1]; f.menu.items[1] = { title: 'Foreign', enabled: true }; f.choose(1)
	assert.deepEqual(f.selected, []); f.menu.items[1] = owned; f.choose(1); assert.deepEqual(f.selected, [''])
	handle.update(f.plan({ enabled: false })); action(); f.choose(1); assert.deepEqual(f.selected, ['']); handle.detach()
	const other = fixture(), current = other.attach()!
	other.intercept(() => { other.choose(1); throw Error('private consumer detail') }); other.choose(1)
	assert.deepEqual(other.selected, ['']); assert.deepEqual(other.errors, ['[macos-leaf] picker change failed']); current.detach()
})
test('detach cancels tracking, clears native actions/items/constraints and blocks captured callbacks', () => {
	const f = fixture(), handle = f.attach()!, action = f.handlers.get(1); f.echo(true)
	handle.detach(); handle.detach(); f.picker.indexOfSelectedItem = 1; action(); handle.update(f.plan())
	assert.equal(f.handlers.size, 0); assert.equal(f.picker.target, null); assert.equal(f.picker.action, null)
	assert.equal(f.picker.superview, null); assert.ok(f.constraints.every((c) => !c.active)); assert.deepEqual(f.menu.items, []); assert.deepEqual(f.selected, [])
})
test('partial item/constraint/attachment failure releases all owned resources without error details', () => {
	for (const failure of [{ item: 2 }, { constraint: 1 }, { add: true }]) {
		const f = fixture(failure); assert.equal(f.attach(), null)
		assert.equal(f.handlers.size, 0); assert.equal(f.picker.superview, null); assert.ok(f.constraints.every((c) => !c.active)); assert.deepEqual(f.menu.items, [])
		assert.deepEqual(f.errors, [])
	}
})
test('invalid updates retire the native control; invalid initial choices never leak an action entry', () => {
	for (const options of [[{ id: 'a', title: 'A' }, { id: 'a', title: 'Again' }], [{ id: 3, title: 'Three' }], [{ id: 'a', title: null }]]) {
		const f = fixture(); assert.equal(f.attach(options), null); assert.equal(f.handlers.size, 0)
	}
	const f = fixture(), handle = f.attach()!, action = f.handlers.get(1)
	assert.throws(() => handle.update(f.plan({ selection: 'missing' })), /Invalid picker selection/)
	action(); assert.equal(f.handlers.size, 0); assert.equal(f.picker.superview, null); assert.deepEqual(f.selected, [])
})
