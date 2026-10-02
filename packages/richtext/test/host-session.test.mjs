import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEditorSession } from '../src/host-session.macos.ts'

test('queues commands until boot; readiness exposes snapshot before callbacks', () => {
	const sent = [],
		events = []
	const native = {
		dispose() {
			events.push('dispose')
		},
	}
	let props = {
		onReady() {
			events.push(session.handle.getHTML())
		},
	}
	const session = createEditorSession(
		(packet) => sent.push(JSON.parse(packet)),
		native,
		() => props,
	)
	session.update({ value: '<p>seed</p>' })
	session.handle.apply('bold')
	assert.equal(sent.length, 0)
	session.receive(JSON.stringify({ event: 'boot' }))
	assert.deepEqual(
		sent.map((p) => p.method),
		['props', 'apply'],
	)
	session.receive(JSON.stringify({ event: 'ready', html: '<p>seed</p>', json: { type: 'doc' } }))
	assert.deepEqual(events, ['<p>seed</p>'])
	assert.equal(session.handle.getJSON().type, 'doc')
	props = {
		onChange(html) {
			events.push(html)
		},
		onJSONChange(doc) {
			events.push(doc.root)
		},
	}
	session.receive(
		JSON.stringify({
			event: 'change',
			html: '<p>edit</p>',
			json: { root: 'lexical' },
			selection: { start: 1, end: 2, active: ['bold'] },
			focused: true,
		}),
	)
	assert.equal(session.handle.getHTML(), '<p>edit</p>')
	assert.equal(session.handle.isActive('bold'), true)
	assert.equal(session.handle.isFocused(), true)
	assert.deepEqual(events.slice(1), ['<p>edit</p>', 'lexical'])
	session.dispose()
	session.handle.setHTML('ignored')
	session.receive(JSON.stringify({ event: 'change', html: 'ignored' }))
	assert.equal(sent.length, 2)
	assert.equal(session.handle.getHTML(), '<p>edit</p>')
})
