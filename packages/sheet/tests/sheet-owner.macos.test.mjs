import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSheetOwner } from '../src/sheet-owner.macos.ts'

// Session/portal model only; no hooks, compiler, AppKit, input, layout or AX.
function fixture(initial = {}) {
	let props = { open: true, ...initial }, available = true, fail = false, accept = true
	const entries = [], dismissed = []
	props.onDismissed ??= () => dismissed.push('A')
	const owner = createSheetOwner({ props: () => props, changed() {}, prepare: () => available ? (view, callbacks) => {
		if (fail) {throw Error('private native detail')}
		const entry = { view, callbacks, target: {}, presented: false, presents: 0, closes: 0 }
		entry.present = () => { entry.presents++; entry.presented = accept; return accept }
		entry.close = () => { entry.closes++; callbacks.onDismissed() }
		entries.push(entry); callbacks.onDismissed() // Construction is not dismissal.
		return entry
	} : undefined })
	owner.bind({})
	return { owner, entries, dismissed, set: (patch) => { props = { ...props, ...patch } },
		available: (next) => { available = next }, fail: (next) => { fail = next }, accept: (next) => { accept = next } }
}

test('waits for portal commit; live callbacks/content changes retain the native session', () => {
	const f = fixture(), entry = f.entries[0]
	assert.equal(entry.presents, 0); f.owner.commit({}); assert.equal(entry.presents, 0)
	f.owner.commit(entry.target); f.owner.commit(entry.target); assert.equal(entry.presents, 1)
	f.set({ content: () => 'new content', onDismissed: () => f.dismissed.push('B') }); f.owner.update()
	assert.equal(f.entries.length, 1); entry.callbacks.onDismissed(); entry.callbacks.onDismissed()
	assert.deepEqual(f.dismissed, ['B']); assert.equal(f.owner.getTarget(), null)
	f.owner.update(); assert.equal(f.entries.length, 1) // Controlled owner must reset open.
	f.set({ open: false }); f.owner.update(); f.set({ open: true }); f.owner.update()
	assert.equal(f.entries.length, 2); f.owner.dispose()
})
test('controlled close notifies once with the current callback, before/after native echo', () => {
	const f = fixture(), first = f.entries[0]; f.owner.commit(first.target)
	f.set({ open: false, onDismissed: () => { f.dismissed.push('B'); f.owner.update() } }); f.owner.update(); f.owner.update()
	assert.deepEqual(f.dismissed, ['B']); assert.equal(first.closes, 1)
	first.callbacks.onDismissed(); assert.deepEqual(f.dismissed, ['B']); f.owner.dispose()
})
test('closing a prepared or window-waiting session is silent', () => {
	const f = fixture(); f.set({ open: false }); f.owner.update(); assert.deepEqual(f.dismissed, [])
	f.set({ open: true }); f.owner.update(); const waiting = f.entries[1]
	waiting.present = () => true // Accepted request, no native window yet.
	f.owner.commit(waiting.target); f.set({ open: false }); f.owner.update()
	assert.equal(waiting.closes, 1); assert.deepEqual(f.dismissed, []); f.owner.dispose()
})
test('id/view replacement and unmount silence stale completions and clean each session once', () => {
	const f = fixture({ id: 'A' }), first = f.entries[0]; f.owner.commit(first.target)
	f.set({ id: 'B' }); f.owner.update(); const second = f.entries[1]; f.owner.commit(second.target)
	f.owner.bind({}); const third = f.entries[2]; f.owner.commit(third.target)
	first.callbacks.onDismissed(); first.callbacks.onUnavailable(); second.callbacks.onDismissed()
	assert.equal(f.owner.getTarget(), third.target); assert.deepEqual(f.dismissed, [])
	f.owner.dispose(); f.owner.dispose(); third.callbacks.onDismissed(); f.owner.bind({}); f.owner.update()
	assert.deepEqual(f.entries.map((e) => e.closes), [1, 1, 1]); assert.deepEqual(f.dismissed, [])
})
test('unavailable/throwing preparation and presentation can retry after close/reopen', () => {
	for (const mode of ['missing', 'prepare', 'present']) {
		const f = fixture({ open: false })
		if (mode === 'missing') {f.available(false)}
		if (mode === 'prepare') {f.fail(true)}
		if (mode === 'present') {f.accept(false)}
		f.set({ open: true }); f.owner.update(); f.owner.commit(f.owner.getTarget())
		assert.equal(f.owner.getStatus(), 'unavailable'); assert.deepEqual(f.dismissed, [])
		f.available(true); f.fail(false); f.accept(true); f.set({ open: false }); f.owner.update()
		f.set({ open: true }); f.owner.update(); assert.equal(f.owner.getStatus(), 'ready'); f.owner.dispose()
	}
})
test('asynchronous native failure drops only the current portal, never reports dismissal', () => {
	const f = fixture(), entry = f.entries[0]; f.owner.commit(entry.target)
	entry.callbacks.onUnavailable(); entry.callbacks.onDismissed()
	assert.equal(f.owner.getStatus(), 'unavailable'); assert.equal(f.owner.getTarget(), null)
	assert.deepEqual(f.dismissed, []); assert.equal(entry.closes, 1); f.owner.dispose()
})
test('consumer failure cannot keep an ended native session or repeat dismissal', () => {
	const f = fixture({ onDismissed: () => { throw Error('consumer failed') } }), entry = f.entries[0]
	f.owner.commit(entry.target); assert.throws(() => entry.callbacks.onDismissed(), /consumer failed/)
	assert.equal(f.owner.getTarget(), null); entry.callbacks.onDismissed(); f.owner.dispose()
})
