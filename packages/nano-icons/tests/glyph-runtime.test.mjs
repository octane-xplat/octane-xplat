import { loadSource } from '../../../scripts/load-source.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const { createCharCache, createLayerColorResolver, normalizeGlyphMap, resolveGlyphEntry } =
	await loadSource(new URL('../src/glyphmap.ts', import.meta.url))

const { configuredFontFamily, createNanoIconSetImpl, resolveNanoIcon } = await loadSource(
	new URL('../src/set.ts', import.meta.url),
)

const { registerNanoIconFont } = await loadSource(new URL('../src/font.web.ts', import.meta.url))

const glyphMap = {
	m: { f: 'demo-a1b2c3d4', u: 1024, z: 1020, s: 0xe900, w: true, h: 'deadbeef' },
	i: {
		solid: [1024, [[0xe900, 'currentColor']]],
		duo: [
			640,
			[
				[0xe901, '#dbeafe'],
				[0xe902, '#1d4ed8'],
			],
		],
		mixed: [
			512,
			[
				[0xe903, '#333333'],
				[0xe904, 'currentColor'],
			],
		],
	},
}

test('resolveGlyphEntry returns [advance, layers] and falls back to ?', () => {
	assert.deepEqual(resolveGlyphEntry(glyphMap, 'solid'), [1024, [[0xe900, 'currentColor']]])
	assert.deepEqual(resolveGlyphEntry(glyphMap, 'missing'), [1024, [[63, 'black']]])
})

test('createCharCache memoizes codepoint to string', () => {
	const cache = createCharCache()
	assert.equal(cache(0xe900), String.fromCodePoint(0xe900))
	assert.equal(cache(63), '?')
	assert.equal(cache(0xe900), String.fromCodePoint(0xe900))
	assert.notEqual(cache(0xe901), cache(0xe900))
})

const duoLayers = glyphMap.i.duo[1]
const mixedLayers = glyphMap.i.mixed[1]

test('tintMode "all" applies the palette by layer position with last-color spill', () => {
	const one = createLayerColorResolver('#123456', 'all', duoLayers)
	assert.equal(one(0, '#dbeafe'), '#123456')
	assert.equal(one(1, '#1d4ed8'), '#123456')

	const pair = createLayerColorResolver(['red', 'blue'], 'all', duoLayers)
	assert.equal(pair(0, '#dbeafe'), 'red')
	assert.equal(pair(1, '#1d4ed8'), 'blue')

	const spill = createLayerColorResolver(['red'], 'all', duoLayers)
	assert.equal(spill(1, '#1d4ed8'), 'red')
})

test('tintMode "currentColor" only tints currentColor source layers', () => {
	const resolve = createLayerColorResolver('#abcdef', 'currentColor', mixedLayers)
	assert.equal(resolve(0, '#333333'), '#333333')
	assert.equal(resolve(1, 'currentColor'), '#abcdef')

	// No color → source colors stand.
	const bare = createLayerColorResolver(undefined, 'currentColor', duoLayers)
	assert.equal(bare(0, '#dbeafe'), '#dbeafe')
	assert.equal(bare(1, '#1d4ed8'), '#1d4ed8')
})

test('tintMode "currentColor" assigns palette entries to currentColor positions', () => {
	const resolve = createLayerColorResolver(['pink', 'green'], 'currentColor', [
		[0xe900, '#123'],
		[0xe901, 'currentColor'],
		[0xe902, 'currentColor'],
	])

	assert.equal(resolve(1, 'currentColor'), 'pink')
	assert.equal(resolve(2, 'currentColor'), 'green')
})

test('normalizeGlyphMap validates metadata and accepts generated literals', () => {
	assert.equal(normalizeGlyphMap(glyphMap), glyphMap)
	assert.throws(() => normalizeGlyphMap(null), TypeError)
	assert.throws(() => normalizeGlyphMap({ m: { f: 1 }, i: {} }), TypeError)
})

test('configuredFontFamily strips the content-hash suffix', () => {
	assert.equal(configuredFontFamily('demo-a1b2c3d4'), 'demo')
	assert.equal(configuredFontFamily('demo'), 'demo')
	assert.equal(configuredFontFamily('demo-nothex'), 'demo-nothex')
})

test('createNanoIconSetImpl registers the set and drives unbound resolution', async () => {
	const seen = []
	const set = createNanoIconSetImpl(
		glyphMap,
		{ font: { fileName: 'demo.ttf' } },
		{
			registerFont: (family, source) => {
				seen.push([family, source?.fileName])
				return Promise.resolve('ready')
			},
			icon: (props) => ['icon', props],
		},
	)

	assert.equal(set.family, 'demo-a1b2c3d4')
	assert.equal(set.name, 'demo')
	assert.deepEqual(set.iconNames.sort(), ['duo', 'mixed', 'solid'])
	assert.equal(await set.ready, 'ready')
	assert.deepEqual(seen, [['demo-a1b2c3d4', 'demo.ttf']])

	// Unbound name resolution finds any registered set containing the name.
	const hit = resolveNanoIcon('duo')
	assert.ok(hit)
	assert.equal(hit.set, set)
	assert.deepEqual(hit.entry[1].length, 2)
	assert.equal(resolveNanoIcon('nope'), undefined)

	// An explicit set wins and constrains the namespace.
	assert.equal(resolveNanoIcon('solid', set)?.set, set)
	assert.equal(
		resolveNanoIcon('solid', { family: 'other', glyphMap: { ...glyphMap, i: {} } }),
		undefined,
	)

	// The bound component is the lane's NanoIcon (the factory supplies it).
	assert.equal(set.Icon({ name: 'duo' })[0], 'icon')
})

test('registerNanoIconFont (web) reports unavailable without a document', async () => {
	assert.equal(await registerNanoIconFont('demo-a1b2c3d4'), 'unavailable')
	assert.equal('document' in globalThis, false)
})
