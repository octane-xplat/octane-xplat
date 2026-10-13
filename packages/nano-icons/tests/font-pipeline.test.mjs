import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Font } from 'fonteditor-core'

import { buildNanoIconFont, iconifyCollectionToSvgs } from '../dist/build/index.js'

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"'

const ICONS = {
	heart: `<svg viewBox="0 0 24 24" ${SVG_NS}><path fill="currentColor" d="M12 21C7 16.5 2 12.6 2 8.5 2 5.5 4.5 3 7.5 3c1.8 0 3.4 1 4.5 2.5C13.1 4 14.7 3 16.5 3 19.5 3 22 5.5 22 8.5c0 4.1-5 8-10 12.5z"/></svg>`,
	duo: `<svg viewBox="0 0 24 24" ${SVG_NS}><circle cx="12" cy="12" r="10" fill="#dbeafe"/><path fill="#1d4ed8" d="M8 12l3 3 5-6-1.4-1.4-3.6 3.6-1.6-1.6z"/></svg>`,
	stroked: `<svg viewBox="0 0 24 24" ${SVG_NS}><path fill="none" stroke="currentColor" stroke-width="2" d="M4 4h16v16H4z"/></svg>`,
	hole: `<svg viewBox="0 0 24 24" ${SVG_NS}><path fill="currentColor" fill-rule="evenodd" d="M12 22a10 10 0 100-20 10 10 0 000 20zm0-4a6 6 0 100-12 6 6 0 000 12z"/></svg>`,
	transform: `<svg viewBox="0 0 24 24" ${SVG_NS}><g transform="rotate(90 12 12)"><rect x="8" y="4" width="8" height="16" fill="currentColor"/></g></svg>`,
	'no-fill': `<svg viewBox="0 0 24 24" ${SVG_NS}><rect width="24" height="24" fill="#0000ff"/></svg>`,
	blank: `<svg viewBox="0 0 24 24" ${SVG_NS}></svg>`,
	masked: `<svg viewBox="0 0 24 24" ${SVG_NS}><mask id="m"><rect width="24" height="24" fill="white"/></mask><rect width="24" height="24" mask="url(#m)" fill="currentColor"/></svg>`,
}

function fixtureDir(files = ICONS) {
	const dir = mkdtempSync(join(tmpdir(), 'nano-icons-src-'))
	for (const [name, svg] of Object.entries(files)) {
		writeFileSync(join(dir, `${name}.svg`), svg)
	}

	return dir
}

function outDir() {
	return mkdtempSync(join(tmpdir(), 'nano-icons-out-'))
}

const results = {}

async function buildFixture(opts = {}) {
	results.fixture ??= await buildNanoIconFont({
		inputDir: fixtureDir(),
		outputDir: outDir(),
		fontFamily: 'Probe',
		web: true,
		...opts,
	})

	return results.fixture
}

test('build compiles SVGs to a valid TTF with sequential codepoints', async () => {
	const result = await buildFixture()
	assert.match(result.family, /^Probe-[0-9a-f]{8}$/, 'family carries the content hash')

	const files = readdirSync(result.ttfPath.replace(/[^/]+$/, ''))
	const ttfFile = files.find((f) => f.endsWith('.ttf'))
	assert.ok(ttfFile, 'TTF emitted')
	assert.equal(ttfFile, `${result.family}.ttf`, 'hashed family filename')

	// fonteditor-core parses it: family carries the content hash, metrics are fixed.
	const font = Font.create(readFileSync(result.ttfPath), { type: 'ttf' })
	const data = font.get()
	assert.equal(data.name.fontFamily, result.family)
	assert.equal(data.head.unitsPerEm, 1024)
	assert.equal(data.hhea.ascent, 1024)
	assert.equal(data.hhea.descent, 0)
	assert.equal(Boolean(data['OS/2'].fsSelection & 128), true, 'USE_TYPO_METRICS')

	// Every emitted layer has a cmap entry starting at 0xe900; non-square
	// icons carry their own advance width.
	const glyphs = Object.keys(data.cmap).map(Number)
	assert.deepEqual(glyphs, [0xe900, 0xe901, 0xe902, 0xe903, 0xe904, 0xe905, 0xe906])
})

test('glyph map carries layer stacks, metadata and deterministic content', async () => {
	const result = await buildFixture()
	const map = JSON.parse(readFileSync(result.glyphmapPath, 'utf8'))

	assert.equal(map.m.f, result.family)
	assert.equal(map.m.u, 1024)
	assert.equal(map.m.z, 1020)
	assert.equal(map.m.s, 0xe900)
	assert.equal(map.m.w, true)
	assert.match(map.m.h, /^[0-9a-f]{64}$/)

	// Multicolor icon → ordered layer stack; single fill → one layer.
	assert.equal(map.i.duo[1].length, 2)
	assert.deepEqual(
		map.i.duo[1].map(([, color]) => color),
		['#dbeafe', '#1d4ed8'],
	)

	assert.equal(map.i.solid?.length, undefined, 'only fixture names appear')
	assert.equal(map.i.heart[1].length, 1)
	assert.equal(map.i.heart[1][0][1], 'currentColor')

	// Blank SVG is skipped; masked SVG is dropped with a reason.
	assert.equal(map.i.blank, undefined)
	assert.equal(map.i.masked, undefined)
	assert.deepEqual(result.skipped.map((s) => s.file).sort(), ['blank.svg', 'masked.svg'])

	// Codepoints are assigned per layer, sequentially from m.s.
	const cps = ['duo', 'heart', 'hole', 'no-fill', 'stroked', 'transform'].flatMap((n) =>
		(map.i[n]?.[1] ?? []).map(([cp]) => cp),
	)

	assert.deepEqual(cps, [0xe900, 0xe901, 0xe902, 0xe903, 0xe904, 0xe905, 0xe906])
})

test('web output emits a WOFF2 companion and module', async () => {
	const result = await buildFixture()
	const woff2 = readFileSync(result.woff2Path)
	assert.equal(woff2.subarray(0, 4).toString('latin1'), 'wOF2')

	const mod = readFileSync(result.modulePath, 'utf8')
	assert.match(mod, /export const ProbeIcons: NanoIconSet<ProbeIconName>/)
	assert.match(mod, /\| 'duo'/)
	assert.match(mod, /fileName: 'Probe-[0-9a-f]{8}\.ttf'/)
})

test('pipeline is deterministic and incremental', async () => {
	const src = fixtureDir()
	const first = await buildNanoIconFont({
		inputDir: src,
		outputDir: outDir(),
		fontFamily: 'Probe',
	})

	const second = await buildNanoIconFont({
		inputDir: src,
		outputDir: first.ttfPath.replace(/[^/]+$/, ''),
		fontFamily: 'Probe',
	})

	assert.equal(second.unchanged, true)
	assert.equal(second.family, first.family)

	// Same bytes for the font artifact.
	assert.deepEqual(readFileSync(first.ttfPath), readFileSync(second.ttfPath))

	// A different icon set produces a different hashed family.
	const srcB = fixtureDir({ only: ICONS.heart })
	const third = await buildNanoIconFont({
		inputDir: srcB,
		outputDir: outDir(),
		fontFamily: 'Probe',
	})

	assert.notEqual(third.family, first.family)
	assert.match(third.family, /^Probe-[0-9a-f]{8}$/)
})

test('unsupported paint servers are rejected with the file named', async () => {
	const src = fixtureDir({
		gradient: `<svg viewBox="0 0 24 24" ${SVG_NS}><defs><linearGradient id="g"><stop stop-color="red"/></linearGradient></defs><rect width="24" height="24" fill="url(#g)"/></svg>`,
	})

	await assert.rejects(
		buildNanoIconFont({ inputDir: src, outputDir: outDir(), fontFamily: 'Probe' }),
		/gradient\.svg/,
	)
})

test('iconifyCollectionToSvgs maps collection icons to SVG documents', () => {
	const svgs = iconifyCollectionToSvgs({
		prefix: 'mdi',
		icons: { check: { body: '<path d="M0 0h10v10z"/>' } },
	})

	assert.deepEqual(
		svgs.map((s) => s.name),
		['mdi:check'],
	)

	assert.match(svgs[0].svg, /<svg xmlns="[^"]+" viewBox="0 0 16 16"><path/)
})
