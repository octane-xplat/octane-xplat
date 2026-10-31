import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createContextMenuOwner } from '../src/context-menu-owner.macos.ts'

// Pure attachment model; no compiler, AppKit tracking, OS input or accessibility.
const items = () => [{ id: 'rename', title: 'Rename' }, { id: 'blocked', title: 'Unavailable', disabled: true }]
function fixture(initial = {}) {
	let props = { trigger: () => null, items: items(), ...initial }, available = true, fail = false, nullHandle = false
	const entries = [], selected = [], statuses = []
	props = { onItemSelected: (id) => selected.push(id), ...props }
	const owner = createContextMenuOwner({
		props: () => props, status: (status) => statuses.push(status),
		attach: () => available ? (view, options, callback) => {
			if (fail) {throw Error('private native details')}
			if (nullHandle) {return null}
			const entry = { view, items: options.items, callback, detached: 0 }; entries.push(entry)
			callback('rename') // Construction is not a user selection.
			return () => { entry.detached++; callback('rename') }
		} : undefined,
	})
	owner.bind({})
	return { owner, entries, selected, statuses, props: () => props, set: (patch) => { props = { ...props, ...patch } },
		available: (value) => { available = value }, fail: (value) => { fail = value }, nullHandle: (value) => { nullHandle = value },
	}
}
test('callback changes and semantically equal item arrays preserve the mounted native menu', () => {
	const f = fixture(), latest = []
	f.set({ items: items(), onItemSelected: (id) => latest.push(id) }); f.owner.update()
	assert.equal(f.entries.length, 1); f.entries[0].callback('rename')
	assert.deepEqual(latest, ['rename']); assert.deepEqual(f.selected, []); f.owner.dispose()
})
test('primitive snapshots detect in-place changes, close old content and block newly disabled selections', () => {
	const f = fixture(), first = f.entries[0]
	f.props().items[0].title = 'Rename file'; f.owner.update()
	assert.equal(first.detached, 1); assert.equal(first.items[0].title, 'Rename'); assert.equal(f.entries[1].items[0].title, 'Rename file')
	first.callback('rename'); assert.deepEqual(f.selected, [])
	f.props().items[0].disabled = true; f.entries[1].callback('rename')
	assert.equal(f.entries[1].detached, 1); f.entries[2].callback('rename'); assert.deepEqual(f.selected, []); f.owner.dispose()
})
test('record scope changes retire an open menu before reaching a new handler, with reentry suppression', () => {
	const f = fixture({ id: 'record-a' }), first = f.entries[0]
	f.set({ id: 'record-b', onItemSelected: (id) => { f.selected.push('b:' + id); f.entries.at(-1).callback(id) } })
	first.callback('rename'); assert.deepEqual(f.selected, []); assert.equal(first.detached, 1)
	f.entries[1].callback('rename'); assert.deepEqual(f.selected, ['b:rename'])
	f.entries[1].callback('rename'); assert.deepEqual(f.selected, ['b:rename', 'b:rename']); f.owner.dispose()
})
test('empty content detaches, duplicate/invalid data is rejected, repair works and an empty string ID is valid', () => {
	const f = fixture({ items: [] }); assert.equal(f.owner.getStatus(), 'empty'); assert.equal(f.entries.length, 0)
	f.set({ items: [{ id: 'same', title: 'One' }, { id: 'same', title: 'Two' }] }); f.owner.update(); assert.equal(f.owner.getStatus(), 'invalid')
	f.set({ items: [{ id: 'bad', title: 4 }] }); f.owner.update(); assert.equal(f.owner.getStatus(), 'invalid')
	f.set({ items: [{ id: '', title: 'Empty identifier' }] }); f.owner.update(); f.entries[0].callback(''); assert.deepEqual(f.selected, [''])
	f.set({ items: undefined }); f.owner.update(); assert.equal(f.entries[0].detached, 1); assert.equal(f.owner.getStatus(), 'empty'); f.owner.dispose()
})
test('removed, unknown and undefined IDs cannot reach current consumers', () => {
	const f = fixture(), first = f.entries[0]
	first.callback(undefined); first.callback('missing'); first.callback('blocked'); assert.deepEqual(f.selected, [])
	f.set({ items: [{ id: 'share', title: 'Share' }] }); first.callback('rename')
	assert.equal(first.detached, 1); assert.deepEqual(f.selected, [])
	f.entries[1].callback('share'); assert.deepEqual(f.selected, ['share']); f.owner.dispose()
})
test('view replacement/disposal retires callbacks before cleanup and teardown is idempotent', () => {
	const f = fixture(), first = f.entries[0]
	f.owner.bind({}); assert.equal(first.detached, 1); first.callback('rename'); assert.deepEqual(f.selected, [])
	const last = f.entries[1]; f.owner.bind(null); assert.equal(last.detached, 1); last.callback('rename')
	f.owner.dispose(); f.owner.dispose(); f.owner.bind({}); f.owner.update(); assert.deepEqual(f.selected, []); assert.equal(f.entries.length, 2)
})
test('unavailable/null/throwing bridges recover, and consumer errors release the selection guard', () => {
	const f = fixture(); f.available(false); f.owner.bind({}); assert.equal(f.owner.getStatus(), 'unavailable')
	f.available(true); f.nullHandle(true); f.owner.update(); assert.equal(f.owner.getStatus(), 'unavailable')
	f.nullHandle(false); f.fail(true); f.owner.update(); assert.equal(f.owner.getStatus(), 'unavailable')
	f.fail(false); f.owner.update(); assert.equal(f.owner.getStatus(), 'ready')
	const entry = f.entries.at(-1); f.set({ onItemSelected: () => { throw Error('consumer failed') } })
	assert.throws(() => entry.callback('rename'), /consumer failed/)
	f.set({ onItemSelected: (id) => f.selected.push(id) }); entry.callback('rename'); assert.deepEqual(f.selected, ['rename']); f.owner.dispose()
})
test('a reentrant view replacement during attach cleans only the obsolete returned handle', () => {
	const entries = [], selected = [], replacement = {}; let first = true
	const owner = createContextMenuOwner({ props: () => ({ items: items(), trigger: () => null, onItemSelected: (id) => selected.push(id) }),
		attach: () => (view, options, callback) => {
			const entry = { view, callback, detached: 0 }; entries.push(entry)
			if (first) { first = false; owner.bind(replacement) }
			return () => { entry.detached++; callback('rename') }
		},
	})
	owner.bind({}); assert.equal(entries[0].detached, 1); assert.equal(entries[1].detached, 0)
	entries[0].callback('rename'); entries[1].callback('rename'); assert.deepEqual(selected, ['rename']); owner.dispose()
})
