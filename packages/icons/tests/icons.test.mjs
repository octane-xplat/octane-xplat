import { loadSource } from '../../../scripts/load-source.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
const { addCollection, addIcon, addIcons, resolveIcon, registry } = await loadSource(
	new URL('../src/registry.ts', import.meta.url),
)

const { iconToSvg } = await loadSource(new URL('../src/svg.ts', import.meta.url))

const body = '<path d="M0 0h32v16H0z" fill="currentColor"/>'

test('bundled resolution handles multiple sets, collection defaults, aliases, cycles and missing names', () => {
	addCollection({
		prefix: 'test',
		width: 32,
		height: 16,
		icons: { wide: { body } },
		aliases: {
			turned: { parent: 'wide', rotate: 1 },
			flipped: { parent: 'turned', hFlip: true },
			cycle: { parent: 'cycle' },
			dangling: { parent: 'absent' },
		},
	})

	addCollection({ prefix: 'other', icons: { wide: { body: '<circle r="2"/>' } } })
	assert.equal(resolveIcon('test:wide').width, 32)
	assert.equal(resolveIcon('test:flipped').rotate, 1)
	assert.equal(resolveIcon('test:flipped').hFlip, true)
	assert.notEqual(resolveIcon('test:wide').body, resolveIcon('other:wide').body)
	for (const name of [
		'wide',
		'test:nope',
		'test:cycle',
		'test:dangling',
		'unknown:wide',
		'test:wide:extra',
		'test:__proto__',
		'test:constructor',
	]) {
		assert.equal(resolveIcon(name), undefined, name)
	}

	const svg = iconToSvg(resolveIcon('test:turned'))
	assert.equal(svg.viewBox, '0 0 16 32')
	assert.equal(svg.width, 12)
	assert.equal(svg.height, 24)
	assert.match(svg.body, /rotate\(90/)
})

test('collection replacement invalidates misses and cached icons and notifies subscribed readers', () => {
	assert.equal(resolveIcon('late:new'), undefined)
	let notifications = 0
	const unsubscribe = registry.subscribe(() => notifications++)
	const before = registry.getSnapshot()
	addCollection({ prefix: 'late', icons: { new: { body } } })
	assert.equal(resolveIcon('late:new').body, body)
	addCollection({ prefix: 'late', icons: { replacement: { body } } })
	assert.equal(resolveIcon('late:new'), undefined)
	assert.equal(registry.getSnapshot(), before + 2)
	assert.equal(notifications, 2)
	unsubscribe()
	addCollection({ prefix: 'late', icons: {} })
	assert.equal(notifications, 2)
	assert.throws(() => addCollection({ prefix: '', icons: {} }), TypeError)
	assert.throws(() => addCollection({ icons: {} }), TypeError)
	assert.throws(() => addCollection({ prefix: 'bad', icons: [] }), TypeError)
})

test('addIcon/addIcons register single icons that shadow collections, invalidate misses, and notify', () => {
	assert.equal(resolveIcon('single:arrow'), undefined)
	let notifications = 0
	const unsubscribe = registry.subscribe(() => notifications++)

	addIcon('single:arrow', { body: '<path d="M0 0h8"/>' })
	assert.equal(resolveIcon('single:arrow').body, '<path d="M0 0h8"/>')
	assert.equal(notifications, 1)

	// A single-icon registration shadows collection data for the same name.
	addCollection({ prefix: 'single', icons: { arrow: { body: '<circle r="1"/>' } } })
	assert.equal(resolveIcon('single:arrow').body, '<path d="M0 0h8"/>')

	// Collection misses stay cached only until the next registration bump.
	assert.equal(resolveIcon('bulk:plus'), undefined)
	addIcons({
		'bulk:plus': { body: '<path d="M1 1h2"/>' },
		'bulk:minus': { body: '<path d="M3 3h2"/>' },
	})
	assert.equal(resolveIcon('bulk:plus').body, '<path d="M1 1h2"/>')
	assert.equal(resolveIcon('bulk:minus').body, '<path d="M3 3h2"/>')
	unsubscribe()

	assert.throws(() => addIcon('arrow', { body }), TypeError)
	assert.throws(() => addIcon('single:Body', { body }), TypeError)
	assert.throws(() => addIcon('single:noicon', {}), TypeError)
	assert.throws(() => addIcon('single:noicon2', null), TypeError)
	assert.throws(() => addIcons({ 'bulk:nope' : null }), TypeError)
	assert.throws(() => addIcons({ broken: { body } }), TypeError)
	assert.throws(() => addIcons(null), TypeError)
})

test('SVG conversion preserves bodies and multicolor fills, escapes tint, and rewrites definition references', () => {
	const icon = {
		width: 20,
		height: 10,
		body: '<defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h20v10z"/><path fill="currentColor" stroke="blue" d="M1 1h1"/>',
	}

	const first = iconToSvg(icon, { color: '#123456', size: 30 })
	const second = iconToSvg(icon, { color: '#123456', size: 30 })
	assert.equal(first.width, 60)
	assert.equal(first.height, 30)
	assert.match(first.markup, /^<svg .*viewBox="0 0 20 10"/)
	assert.match(first.body, /fill="#123456" stroke="blue"/)
	assert.match(first.body, /stop-color="red"/)
	const id = first.body.match(/id="([^"]+)"/)[1]
	assert.ok(first.body.includes(`url(#${id})`))
	assert.notEqual(first.body, second.body)
	assert.equal(icon.body.includes('id="paint"'), true)
	assert.match(
		iconToSvg({ body }, { color: '"><bad>&' }).markup,
		/color="&quot;&gt;&lt;bad&gt;&amp;"/,
	)

	for (const size of [0, -1, NaN, Infinity]) {
		assert.throws(() => iconToSvg({ body }, { size }), RangeError)
	}
})
