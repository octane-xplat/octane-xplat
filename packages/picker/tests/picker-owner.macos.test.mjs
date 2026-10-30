import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPickerOwner } from '../src/picker-owner.macos.ts'

const choices = () => [{ id: 'a', title: 'Same' }, { id: '', title: 'Same' }, { id: 'blocked', title: '', disabled: true }]
// Source ownership model only; no hook transform, AppKit, input, layout or AX.
function fixture(initial = {}) {
	let props = { label: 'Bag', options: choices(), ...initial }, available = true, fail = false, echo = false, updateFail = false
	const entries = [], selections = [], statuses = []
	props.onSelectionChange ??= (id) => selections.push(id)
	const owner = createPickerOwner({ props: () => props, status: (next) => statuses.push(next), attach: () => available ? (view, plan, callback) => {
		if (fail) {throw Error('private native details')}
		const entry = { view, plan, callback, detached: 0, updates: [] }
		entries.push(entry); callback('') // Construction is not selection.
		return { update(next) { if (updateFail) {throw Error('private update details');} entry.plan = next; entry.updates.push(next); if (echo) {callback('')} }, detach() { entry.detached++; callback('') } }
	} : undefined })
	owner.bind({})
	return { owner, entries, selections, statuses, set: (patch) => { props = { ...props, ...patch } }, props: () => props,
		available: (next) => { available = next }, fail: (next) => { fail = next }, echo: (next) => { echo = next }, updateFail: (next) => { updateFail = next } }
}

test('uncontrolled IDs survive reorder, repeated/empty labels, later defaults and view replacement', () => {
	const f = fixture(), first = f.entries[0]; assert.equal(first.plan.selection, 'a')
	first.callback(''); assert.deepEqual(f.selections, ['']); assert.equal(first.plan.selection, '')
	f.set({ options: [...choices()].reverse(), defaultSelection: 'a' }); f.owner.update()
	assert.equal(f.entries.length, 1); assert.equal(first.plan.selection, '')
	f.owner.bind({}); assert.equal(first.detached, 1); assert.equal(f.entries[1].plan.selection, '')
	first.callback('a'); assert.deepEqual(f.selections, ['']); f.owner.dispose()
})
test('async empty choices retain the seed; removal falls back silently to first enabled ID', () => {
	const f = fixture({ options: [], defaultSelection: '' }); assert.equal(f.owner.getStatus(), 'empty')
	f.set({ options: choices() }); f.owner.update(); assert.equal(f.entries[0].plan.selection, '')
	f.set({ options: [{ id: 'blocked', title: 'Unavailable', disabled: true }, { id: 'new', title: 'New' }] }); f.owner.update()
	assert.equal(f.entries[0].plan.selection, 'new'); assert.deepEqual(f.selections, [])
	f.set({ options: [] }); f.owner.update(); f.set({ options: [{ id: 'new', title: 'Renamed' }] }); f.owner.update()
	assert.equal(f.entries[0].plan.selection, 'new'); f.owner.dispose()
	const other = fixture({ defaultSelection: 'missing' }); assert.equal(other.entries[0].plan.selection, 'a'); other.owner.dispose()
})
test('controlled rejection restores current value, callback-only changes remain current, release retains selection', () => {
	const f = fixture({ selection: 'a' }), entry = f.entries[0]
	f.set({ onSelectionChange: (id) => f.selections.push('B:' + id) }); f.owner.update(); entry.callback('')
	assert.deepEqual(f.selections, ['B:']); assert.equal(entry.plan.selection, 'a')
	f.set({ onSelectionChange: (id) => { f.selections.push(id); f.set({ selection: id }) } }); f.owner.update(); entry.callback('')
	assert.equal(entry.plan.selection, ''); f.set({ selection: undefined, defaultSelection: 'a' }); f.owner.update()
	assert.equal(entry.plan.selection, ''); assert.equal(f.entries.length, 1); f.owner.dispose()
})
test('invalid choices and missing controlled ID detach safely and recover from repaired data', () => {
	for (const patch of [{ options: [{ id: 'a', title: 'One' }, { id: 'a', title: 'Two' }] }, { options: [{ id: 2, title: 'Two' }] }, { options: [{ id: 'a', title: null }] }, { selection: 'missing' }]) {
		const f = fixture(); f.set(patch); f.owner.update(); assert.equal(f.owner.getStatus(), 'invalid'); assert.equal(f.entries[0].detached, 1)
		f.set({ options: choices(), selection: 'a' }); f.owner.update(); assert.equal(f.owner.getStatus(), 'ready'); assert.deepEqual(f.selections, []); f.owner.dispose()
	}
})
test('disabled current values display but disabled/unknown/duplicate and pending stale choices cannot emit', () => {
	const f = fixture({ selection: 'blocked' }), entry = f.entries[0]; assert.equal(entry.plan.selection, 'blocked')
	entry.callback('blocked'); entry.callback('unknown'); assert.deepEqual(f.selections, [])
	f.set({ selection: 'a', disabled: true }); f.owner.update(); entry.callback(''); assert.deepEqual(f.selections, [])
	f.set({ disabled: false }); f.owner.update(); entry.callback('a'); assert.deepEqual(f.selections, [])
	f.props().options[1].title = 'Changed before native commit'; entry.callback('')
	assert.deepEqual(f.selections, []); assert.equal(entry.plan.options[1].title, 'Changed before native commit')
	entry.callback(''); assert.deepEqual(f.selections, ['']); f.owner.dispose()
})
test('record changes reseed; view changes retain; teardown invalidates captured native callbacks first', () => {
	const f = fixture({ id: 'record-A', defaultSelection: '' }), first = f.entries[0]
	f.set({ id: 'record-B', defaultSelection: 'a' }); first.callback('a'); const second = f.entries[1]
	assert.equal(first.detached, 1); assert.equal(second.plan.selection, 'a'); assert.deepEqual(f.selections, [])
	f.owner.bind({}); assert.equal(f.entries[2].plan.selection, 'a'); second.callback('')
	f.owner.dispose(); f.owner.dispose(); f.entries[2].callback(''); f.owner.bind({}); f.owner.update()
	assert.deepEqual(f.entries.map((entry) => entry.detached), [1, 1, 1]); assert.deepEqual(f.selections, [])
})
test('programmatic echoes/reentry are suppressed; consumer failure still restores controlled selection', () => {
	const f = fixture({ selection: 'a' }), entry = f.entries[0]; f.echo(true); f.owner.update(); assert.deepEqual(f.selections, [])
	f.set({ onSelectionChange: () => { entry.callback(''); f.owner.update(); throw Error('consumer failed') } })
	assert.throws(() => entry.callback(''), /consumer failed/); assert.equal(entry.plan.selection, 'a'); assert.deepEqual(f.selections, [])
	f.set({ onSelectionChange: (id) => f.selections.push(id) }); entry.callback(''); assert.deepEqual(f.selections, ['']); f.owner.dispose()
})
test('missing/throwing/failed native attachments report unavailable and retry; current label clears override', () => {
	const f = fixture({ accessibilityLabel: 'Override' }), first = f.entries[0]
	f.set({ accessibilityLabel: undefined, label: 'New bag' }); f.owner.update(); assert.equal(first.plan.accessibilityLabel, 'New bag')
	f.updateFail(true); f.owner.update(); assert.equal(first.detached, 1); assert.equal(f.owner.getStatus(), 'unavailable')
	f.updateFail(false); f.available(false); f.owner.update(); assert.equal(f.owner.getStatus(), 'unavailable')
	f.available(true); f.fail(true); f.owner.update(); assert.equal(f.owner.getStatus(), 'unavailable')
	f.fail(false); f.owner.update(); assert.equal(f.owner.getStatus(), 'ready'); assert.deepEqual(f.selections, []); f.owner.dispose()
})
