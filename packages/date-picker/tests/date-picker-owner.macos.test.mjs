import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDatePickerOwner } from '../src/date-picker-owner.macos.ts'

// Source model only. No JSX/compiler, AppKit, native date entry, layout or AX.
function fixture(initial = {}) {
	let props = initial, available = true, fail = false, echo = false
	const attachments = [], selections = [], statuses = []
	const owner = createDatePickerOwner({
		props: () => props, now: () => 1000, status: (status) => statuses.push(status),
		attach: () => available ? (view, options, callback) => {
			if (fail) {throw Error('private native details')}
			const entry = { view, options, callback, detached: 0, updates: [] }
			attachments.push(entry)
			callback(9999) // A programmatic attach echo must not be a selection.
			return {
				update(next) { entry.options = next; entry.updates.push(next); if (echo) {callback(next.selectionMillis + 1)} },
				detach() { entry.detached++; callback(8888) },
			}
		} : undefined,
	})
	props = { onSelectionChange: (date) => selections.push(date.getTime()), ...initial }
	owner.bind({})
	return { owner, attachments, selections, statuses,
		props: () => props, set: (patch) => { props = { ...props, ...patch } },
		available: (value) => { available = value }, fail: (value) => { fail = value }, echo: (value) => { echo = value },
	}
}
test('uncontrolled selection survives mode/style/view changes, ignoring later defaults and stale callbacks', () => {
	const f = fixture({ defaultSelection: new Date(2000) }), first = f.attachments[0]
	assert.equal(first.options.selectionMillis, 2000); first.callback(3000)
	f.set({ defaultSelection: new Date(9000), components: 'time', pickerStyle: 'graphical' }); f.owner.update()
	assert.equal(first.detached, 1); assert.equal(f.attachments[1].options.selectionMillis, 3000)
	first.callback(4000); assert.deepEqual(f.selections, [3000])
	f.owner.bind({}); assert.equal(f.attachments[1].detached, 1); assert.equal(f.attachments[2].options.selectionMillis, 3000)
	f.owner.dispose(); assert.equal(f.attachments[2].detached, 1)
})
test('controlled values restore rejected changes and publish only the latest callback', () => {
	const f = fixture({ selection: new Date(0) }), entry = f.attachments[0], latest = []
	f.set({ onSelectionChange: (date) => latest.push(date.getTime()) }); f.owner.update()
	entry.callback(2000); assert.deepEqual(latest, [2000]); assert.deepEqual(f.selections, [])
	assert.equal(entry.options.selectionMillis, 0)
	f.set({ onSelectionChange: (date) => { f.set({ selection: date }); latest.push(date.getTime()) } })
	entry.callback(4000); assert.equal(entry.options.selectionMillis, 4000)
	entry.callback(4000); assert.deepEqual(latest, [2000, 4000])
	f.set({ selection: undefined, defaultSelection: new Date(9000) }); f.owner.update()
	assert.equal(entry.options.selectionMillis, 4000); f.owner.dispose()
})
test('defaults and uncontrolled bounds clamp internally without emitting, and removing bounds clears them', () => {
	const f = fixture({ defaultSelection: new Date(0), minimumDate: new Date(1000), maximumDate: new Date(2000) })
	assert.equal(f.attachments[0].options.selectionMillis, 1000); assert.deepEqual(f.selections, [])
	f.attachments[0].callback(1500); f.set({ minimumDate: new Date(3000), maximumDate: new Date(4000) }); f.owner.update()
	assert.equal(f.attachments[0].options.selectionMillis, 3000); assert.deepEqual(f.selections, [1500])
	f.set({ minimumDate: undefined, maximumDate: undefined, accessibilityLabel: 'Departure' }); f.owner.update()
	assert.equal(f.attachments[0].options.minimumMillis, undefined); assert.equal(f.attachments[0].options.maximumMillis, undefined)
	assert.equal(f.attachments[0].options.accessibilityLabel, 'Departure'); f.owner.dispose()
})
test('disabled and invalid/out-of-range native values cannot emit, even before a scheduled update', () => {
	const f = fixture({ minimumDate: new Date(0), maximumDate: new Date(4000) }), entry = f.attachments[0]
	f.set({ disabled: true }); entry.callback(2000); assert.deepEqual(f.selections, []); assert.equal(entry.options.enabled, false)
	f.set({ disabled: false }); f.owner.update()
	for (const value of [NaN, Infinity, 1e30, -1, 4001]) {entry.callback(value)}
	assert.deepEqual(f.selections, []); entry.callback(2000); assert.deepEqual(f.selections, [2000]); f.owner.dispose()
})
test('invalid controlled values/bounds show invalid status and recover without source data in errors', () => {
	for (const patch of [{ selection: new Date(NaN) }, { minimumDate: new Date(NaN) }, { minimumDate: new Date(2000), maximumDate: new Date(1000) }, { selection: new Date(5000), maximumDate: new Date(4000) }]) {
		const f = fixture(patch); assert.equal(f.owner.getStatus(), 'invalid'); assert.equal(f.attachments.length, 0)
		f.set({ selection: new Date(1000), minimumDate: undefined, maximumDate: undefined }); f.owner.update()
		assert.equal(f.owner.getStatus(), 'ready'); assert.equal(f.attachments.length, 1); f.owner.dispose()
	}
})
test('programmatic echoes/reentry are suppressed, consumer throws still restore the current value', () => {
	const f = fixture({ selection: new Date(1000) }), entry = f.attachments[0]
	f.echo(true); f.owner.update(); assert.deepEqual(f.selections, [])
	f.set({ onSelectionChange: () => { f.owner.update(); throw Error('consumer failed') } })
	assert.throws(() => entry.callback(2000), /consumer failed/); assert.equal(entry.options.selectionMillis, 1000)
	f.set({ onSelectionChange: (date) => f.selections.push(date.getTime()) }); entry.callback(3000)
	assert.deepEqual(f.selections, [3000]); f.owner.dispose()
})
test('missing/throwing bridge reports unavailable and retries; teardown is idempotent and drops late actions', () => {
	const f = fixture(), entry = f.attachments[0]
	f.available(false); f.owner.bind({}); assert.equal(f.owner.getStatus(), 'unavailable')
	f.available(true); f.fail(true); f.owner.update(); assert.equal(f.owner.getStatus(), 'unavailable')
	f.fail(false); f.owner.update(); assert.equal(f.owner.getStatus(), 'ready')
	const last = f.attachments.at(-1); f.owner.dispose(); f.owner.dispose(); last.callback(3000); entry.callback(4000)
	f.owner.bind({}); f.owner.update(); assert.equal(last.detached, 1); assert.deepEqual(f.selections, [])
})
