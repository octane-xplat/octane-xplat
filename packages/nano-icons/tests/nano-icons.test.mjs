import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addCollection, resolveIcon } from '../../icons/dist/web/registry.js'
import { iconToSvg } from '../../icons/dist/web/svg.js'
import { prepareNanoIcon } from '../dist/web/prepare.js'
import { materializeNanoIcon as materializeWeb } from '../dist/web/materialize.web.js'
import { materializeNanoIcon as materializeNative } from '../dist/native/materialize.js'
import { materializeNanoIcon as materializeMacos } from '../dist/macos/materialize.js'

const body = '<path d="M0 0h32v16H0z" fill="currentColor"/>'

test('equal inputs share one prepared object; option changes prepare anew', () => {
	const icon = { width: 32, height: 16, body }
	const first = prepareNanoIcon(icon, { size: 24 })
	assert.equal(prepareNanoIcon(icon, { size: 24 }), first)
	assert.equal(prepareNanoIcon(icon), first) // default size is 24
	assert.notEqual(prepareNanoIcon(icon, { size: 32 }), first)
	assert.notEqual(prepareNanoIcon(icon, { size: 24, hFlip: true }), first)
	assert.notEqual(prepareNanoIcon({ width: 32, height: 16, body }, { size: 24 }), first)
	assert.deepEqual({ ...prepareNanoIcon(icon, { size: 24 }) }, {
		body,
		viewBox: '0 0 32 16',
		width: 48,
		height: 24,
	})

	assert.ok(Object.isFrozen(first))
	for (const size of [0, -1, NaN, Infinity]) {
		assert.throws(() => prepareNanoIcon(icon, { size }), RangeError)
	}
})

test('variant retention per icon is bounded', () => {
	const icon = { body }
	const first = prepareNanoIcon(icon, { size: 1 })
	for (let size = 2; size <= 40; size++) {
		prepareNanoIcon(icon, { size })
	}

	// 40 variants exceed the per-icon cap; the oldest entry was evicted.
	assert.notEqual(prepareNanoIcon(icon, { size: 1 }), first)
})

test('collection replacement releases prepared entries through resolution identity', () => {
	addCollection({ prefix: 'nano-test', icons: { mark: { body } } })
	const icon = resolveIcon('nano-test:mark')
	const first = prepareNanoIcon(icon)
	addCollection({ prefix: 'nano-test', icons: { mark: { body: '<circle r="4"/>' } } })
	const replaced = resolveIcon('nano-test:mark')
	assert.notEqual(replaced, icon)
	assert.notEqual(prepareNanoIcon(replaced), first)
	assert.equal(prepareNanoIcon(replaced).body, '<circle r="4"/>')
})

const gradient = {
	width: 20,
	height: 10,
	body: '<defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h20v10z"/><path fill="currentColor" stroke="blue" d="M1 1h1"/>',
}

// Normalizes rewritten ids so prepared+materialized markup can be compared
// against icons' iconToSvg output.
function normalizeIds(svg) {
	return svg
		.replace(/id="[^"]+"/g, 'id="ID"')
		.replace(/url\(#[^)]+\)/g, 'url(#ID)')
		.replace(/#[-a-zA-Z0-9_.:]+/g, '#ID')
}

test('web materialization keeps fresh definition IDs per instance', () => {
	const prepared = prepareNanoIcon(gradient, { size: 30 })
	const first = materializeWeb(prepared, { color: '#123456' })
	const second = materializeWeb(prepared, { color: '#123456' })
	assert.notEqual(first.body, second.body)
	const id = first.body.match(/id="([^"]+)"/)[1]
	assert.ok(first.body.includes(`url(#${id})`))
	assert.match(first.body, /fill="#123456" stroke="blue"/)
	assert.match(first.body, /stop-color="red"/)
	assert.equal(first.width, 60)
	assert.equal(first.height, 30)

	// Equal conversion parity with @octane-xplat/icons' iconToSvg.
	const reference = iconToSvg(gradient, { color: '#123456', size: 30 })
	assert.equal(normalizeIds(first.markup), normalizeIds(reference.markup))
	assert.equal(normalizeIds(first.body), normalizeIds(reference.body))
})

test('native materialization returns byte-identical markup for equal inputs', () => {
	const prepared = prepareNanoIcon(gradient, { size: 30 })
	const first = materializeNative(prepared, { color: '#123456' })
	const second = materializeNative(prepared, { color: '#123456' })
	assert.equal(first.markup, second.markup)
	assert.ok(first.body.includes('id="paint"'))
	assert.ok(first.body.includes('url(#paint)'))
	assert.match(first.body, /fill="#123456" stroke="blue"/)
	assert.equal(normalizeIds(first.markup), normalizeIds(iconToSvg(gradient, { color: '#123456', size: 30 }).markup))

	// Tint changes materialize only — the prepared body is untouched.
	assert.equal(prepared.body.includes('currentColor'), true)
	assert.equal(materializeNative(prepared).body.includes('currentColor'), true)
	assert.match(materializeNative(prepared, { color: '"><bad>&' }).markup, /color="&quot;&gt;&lt;bad&gt;&amp;"/)
})

test('preparation and materialization lanes import and run without a DOM (SSR/import safety)', async () => {
	// The DOM-free modules are where module-scope browser work could creep in;
	// they must evaluate and operate in plain Node. Component modules resolve
	// renderer packages through bundler conditions and are exercised by the
	// packed-consumer typecheck instead.
	const prepared = prepareNanoIcon({ body }, { size: 24 })
	assert.equal(materializeMacos(prepared, { color: '#fff' }).markup.includes('#fff'), true)
	const domGlobals = ['document', 'window']
	for (const name of domGlobals) {
		assert.equal(name in globalThis, false, `${name} leaked into globalThis`)
	}
})
