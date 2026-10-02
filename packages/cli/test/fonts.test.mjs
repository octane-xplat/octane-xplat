import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { deflateSync } from 'node:zlib'
import {
	addFontInputs,
	parseFontBuffer,
	readFontInfo,
	woff2ToSfnt,
	woffToSfnt,
} from '../src/fonts.mjs'

const GEIST = new URL('../../app/src/assets/fonts/Geist-Variable.ttf', import.meta.url).pathname
// Real @fontsource-variable/inter latin wght face (OFL-1.1) — exercises the
// woff2 decoder path that synthetic fixtures can't reach.
const INTER_WOFF2 = new URL('./fixtures/inter-latin-wght-normal.woff2', import.meta.url).pathname

function makeApp() {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-fonts-'))
	writeFileSync(join(dir, 'package.json'), '{}')
	mkdirSync(join(dir, 'src'))
	writeFileSync(
		join(dir, 'src/main.web.tsrx'),
		`import { createRoot } from 'octane';\nimport './style.css';\n`,
	)

	writeFileSync(
		join(dir, 'src/style.css'),
		`:root,\n.ns-root {\n\t--color-text: #0a0a0a;\n}\n\nbody {\n\tfont-family: system-ui, sans-serif;\n}\n`,
	)

	return dir
}

// Drop the variable-font tables so the result parses as a static face.
function makeStatic(ttf) {
	const numTables = ttf.readUInt16BE(4)
	const drop = new Set(['fvar', 'gvar', 'HVAR', 'MVAR', 'STAT', 'avar'])
	const tables = []
	for (let i = 0; i < numTables; i++) {
		const rec = 12 + i * 16
		const tag = ttf.toString('latin1', rec, rec + 4)
		if (!drop.has(tag)) {
			tables.push({
				tag,
				data: ttf.subarray(
					ttf.readUInt32BE(rec + 8),
					ttf.readUInt32BE(rec + 8) + ttf.readUInt32BE(rec + 12),
				),
			})
		}
	}

	const n = tables.length
	const maxPow2 = 2 ** Math.floor(Math.log2(n))
	const out = Buffer.alloc(
		12 + n * 16 + tables.reduce((s, t) => s + Math.ceil(t.data.length / 4) * 4, 0),
	)

	ttf.copy(out, 0, 0, 4)
	out.writeUInt16BE(n, 4)
	out.writeUInt16BE(maxPow2 * 16, 6)
	out.writeUInt16BE(Math.log2(maxPow2), 8)
	out.writeUInt16BE(n * 16 - maxPow2 * 16, 10)
	let cursor = 12 + n * 16
	tables.forEach((t, i) => {
		const rec = 12 + i * 16
		out.write(t.tag, rec, 'latin1')
		out.writeUInt32BE(cursor, rec + 8)
		out.writeUInt32BE(t.data.length, rec + 12)
		Buffer.from(t.data).copy(out, cursor)
		cursor += Math.ceil(t.data.length / 4) * 4
	})

	return out
}

// Minimal WOFF wrapper — deflate every sfnt table so woffToSfnt has real work.
function ttfToWoff(ttf) {
	const flavor = ttf.readUInt32BE(0)
	const numTables = ttf.readUInt16BE(4)
	const entries = []
	for (let i = 0; i < numTables; i++) {
		const rec = 12 + i * 16
		const data = ttf.subarray(
			ttf.readUInt32BE(rec + 8),
			ttf.readUInt32BE(rec + 8) + ttf.readUInt32BE(rec + 12),
		)

		const packed = deflateSync(Buffer.from(data))
		entries.push({
			tag: ttf.toString('latin1', rec, rec + 4),
			checkSum: ttf.readUInt32BE(rec + 4),
			// WOFF stores the raw table when compression doesn't shrink it.
			packed: packed.length < data.length ? packed : Buffer.from(data),
			data,
		})
	}

	let cursor = 44 + numTables * 20
	const out = Buffer.alloc(
		cursor + entries.reduce((s, e) => s + Math.ceil(e.packed.length / 4) * 4, 0),
	)

	out.write('wOFF', 0, 'latin1')
	out.writeUInt32BE(flavor, 4)
	out.writeUInt32BE(out.length, 8)
	out.writeUInt16BE(1, 10)
	out.writeUInt16BE(numTables, 12)
	out.writeUInt32BE(0, 40)
	entries.forEach((e, i) => {
		const rec = 44 + i * 20
		out.write(e.tag, rec, 'latin1')
		out.writeUInt32BE(cursor, rec + 4)
		out.writeUInt32BE(e.packed.length, rec + 8)
		out.writeUInt32BE(e.data.length, rec + 12)
		out.writeUInt32BE(e.checkSum, rec + 16)
		e.packed.copy(out, cursor)
		cursor += Math.ceil(e.packed.length / 4) * 4
	})

	return out
}

function makeFontsourcePackage(appDir, spec, files, cssFamily, { variable = false } = {}) {
	const pkgDir = join(appDir, 'node_modules', spec)
	mkdirSync(join(pkgDir, 'files'), { recursive: true })
	writeFileSync(
		join(pkgDir, 'package.json'),
		JSON.stringify({ name: spec, exports: { './*.css': './*.css' } }),
	)

	const source = variable ? readFileSync(GEIST) : makeStatic(readFileSync(GEIST))
	for (const f of files) {
		writeFileSync(join(pkgDir, 'files', f), ttfToWoff(source))
	}

	// Stand-in for the package's per-weight css so the family name is read.
	const css = `@font-face {\n\tfont-family: '${cssFamily}';\n\tsrc: url(./files/x.woff2) format('woff2');\n}\n`
	for (const f of files) {
		const stem = f.replace(/\.(woff2?|ttf)$/, '')
		const weight = stem.match(/-(\d+)-normal$/)?.[1]
		writeFileSync(join(pkgDir, `${weight ? `latin-${weight}` : 'wght'}.css`), css)
	}
}

describe('readFontInfo', () => {
	it('reads family, PostScript name, and wght range from a variable font', () => {
		const info = readFontInfo(GEIST)
		assert.equal(info.family, 'Geist')
		assert.equal(info.postscript, 'Geist-Regular')
		assert.deepEqual(info.wght, { min: 100, max: 900 })
		assert.equal(info.weightClass, 400)
	})

	it('does not mutate the parsed buffer', () => {
		const buf = readFileSync(GEIST)
		const pristine = Buffer.from(buf)
		parseFontBuffer(buf)
		assert.ok(buf.equals(pristine))
	})
})

describe('woffToSfnt', () => {
	it('round-trips a woff back to a parseable sfnt', () => {
		const woff = ttfToWoff(readFileSync(GEIST))
		const info = parseFontBuffer(woffToSfnt(woff))
		assert.equal(info.family, 'Geist')
		assert.deepEqual(info.wght, { min: 100, max: 900 })
	})
})

describe('woff2ToSfnt', () => {
	it('converts a real variable woff2 with names and wght axis intact', async () => {
		const info = parseFontBuffer(await woff2ToSfnt(readFileSync(INTER_WOFF2)))
		assert.equal(info.family, 'Inter')
		assert.equal(info.postscript, 'Inter-Regular')
		assert.deepEqual(info.wght, { min: 100, max: 900 })
	})
})

describe('addFontInputs', () => {
	it('copies the file and wires web + native registration', async () => {
		const dir = makeApp()
		try {
			const report = await addFontInputs(dir, [GEIST], {})
			assert.equal(report.error, undefined)

			assert.ok(existsSync(join(dir, 'src/fonts/Geist-Variable.ttf')))

			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.match(fontsCss, /font-family: 'Geist'/)
			assert.match(fontsCss, /src: url\('\.\/fonts\/Geist-Variable\.ttf'\)/)
			assert.match(fontsCss, /font-weight: 100 900/)
			assert.match(fontsCss, /font-display: swap/)

			const entry = readFileSync(join(dir, 'src/main.web.tsrx'), 'utf8')
			assert.match(entry, /import '\.\/fonts\.css';/)

			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(
				style,
				/--font-sans: 'Geist', 'Geist-Regular', 'Geist-Variable', system-ui, sans-serif/,
			)

			assert.match(
				style,
				/\.ns-root \{\n\tfont-family: 'Geist', 'Geist-Regular', 'Geist-Variable', sans-serif/,
			)

			assert.match(style, /body \{\n\tfont-family: var\(--font-sans, system-ui, sans-serif\)/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('is idempotent on rerun', async () => {
		const dir = makeApp()
		try {
			await addFontInputs(dir, [GEIST], {})
			const report = await addFontInputs(dir, [GEIST], {})
			assert.equal(report.error, undefined)

			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.equal(fontsCss.match(/^@font-face/gm).length, 1)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.equal(style.match(/xplat-fonts:sans:start/g).length, 1)
			assert.match(style, /'Geist-Variable'/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('merges a second add into the existing token block', async () => {
		const dir = makeApp()
		try {
			const alt = join(dir, 'GeistAlt.ttf')
			copyFileSync(GEIST, alt)
			await addFontInputs(dir, [GEIST], {})
			await addFontInputs(dir, [alt], {})
			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.equal(fontsCss.match(/^@font-face/gm).length, 2)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.equal(style.match(/xplat-fonts:sans:start/g).length, 1)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('--token mono wires --font-mono without touching body', async () => {
		const dir = makeApp()
		try {
			const report = await addFontInputs(dir, [GEIST], { token: 'mono' })
			assert.equal(report.error, undefined)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(style, /--font-mono: 'Geist'/)
			assert.ok(!/body \{\n\tfont-family: var\(--font-mono/.test(style))
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('--token none skips style.css', async () => {
		const dir = makeApp()
		try {
			const report = await addFontInputs(dir, [GEIST], { token: 'none' })
			assert.equal(report.error, undefined)
			assert.ok(!readFileSync(join(dir, 'src/style.css'), 'utf8').includes('xplat-fonts'))
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('rejects unconvertible formats', async () => {
		const dir = makeApp()
		try {
			const eot = join(dir, 'fake.eot')
			writeFileSync(eot, 'LP')
			const report = await addFontInputs(dir, [eot], {})
			assert.match(report.error, /ttf, \.otf, \.woff, or \.woff2/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('converts a .woff file to ttf', async () => {
		const dir = makeApp()
		try {
			const woff = join(dir, 'geist.woff')
			writeFileSync(woff, ttfToWoff(readFileSync(GEIST)))
			const report = await addFontInputs(dir, [woff], {})
			assert.equal(report.error, undefined)
			assert.ok(existsSync(join(dir, 'src/fonts/geist.ttf')))
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('converts a .woff2 file to ttf and registers usable names', async () => {
		const dir = makeApp()
		try {
			const woff2 = join(dir, 'inter.woff2')
			copyFileSync(INTER_WOFF2, woff2)
			const report = await addFontInputs(dir, [woff2], {})
			assert.equal(report.error, undefined)

			const staged = join(dir, 'src/fonts/inter.ttf')
			assert.ok(existsSync(staged))
			const info = parseFontBuffer(readFileSync(staged))
			assert.equal(info.family, 'Inter')
			assert.equal(info.postscript, 'Inter-Regular')
			assert.deepEqual(info.wght, { min: 100, max: 900 })
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('fails without a package.json', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'xplat-fonts-empty-'))
		try {
			const report = await addFontInputs(dir, [GEIST], {})
			assert.match(report.error, /no package\.json/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('registers a static Fontsource package: files, imports, and weight rules', async () => {
		const dir = makeApp()
		try {
			makeFontsourcePackage(
				dir,
				'@fontsource/testfont',
				['testfont-latin-400-normal.woff', 'testfont-latin-700-normal.woff'],
				'Testfont',
			)

			const report = await addFontInputs(dir, ['@fontsource/testfont'], {})
			assert.equal(report.error, undefined)

			assert.ok(existsSync(join(dir, 'src/fonts/Geist-Regular.ttf')))

			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.match(fontsCss, /@import '@fontsource\/testfont\/latin-400\.css';/)
			assert.match(fontsCss, /@import '@fontsource\/testfont\/latin-700\.css';/)
			assert.ok(!/^@font-face/m.test(fontsCss))

			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(style, /--font-sans: 'Testfont'/)
			// Both files carry Geist internals → one staged file name; the manifest
			// still records both weight entries for Android's per-weight rules.
			assert.match(style, /\.font-bold \{\n\tfont-family: 'Testfont', 'Geist', 'Geist-Regular'/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('registers a variable Fontsource package via the wght face', async () => {
		const dir = makeApp()
		try {
			makeFontsourcePackage(
				dir,
				'@fontsource-variable/testvar',
				['testvar-latin-wght-normal.woff', 'testvar-latin-opsz-normal.woff'],
				'Testvar Variable',
				{ variable: true },
			)

			const report = await addFontInputs(dir, ['@fontsource-variable/testvar'], {})
			assert.equal(report.error, undefined)

			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.match(fontsCss, /@import '@fontsource-variable\/testvar\/wght\.css';/)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(style, /--font-sans: 'Testvar Variable', 'Geist', 'Geist-Regular'/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('rejects non-Fontsource package specs', async () => {
		const dir = makeApp()
		try {
			const report = await addFontInputs(dir, ['@scope/nota-font'], {})
			assert.match(report.error, /no such file|unsupported package/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})
})
