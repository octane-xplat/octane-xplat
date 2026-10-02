import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
	mkdirSync,
	copyFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { addFont, readFontInfo } from '../src/fonts.mjs'

const GEIST = new URL('../../app/src/assets/fonts/Geist-Variable.ttf', import.meta.url).pathname

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

describe('readFontInfo', () => {
	it('reads family, PostScript name, and wght range from a variable font', () => {
		const info = readFontInfo(GEIST)
		assert.equal(info.family, 'Geist')
		assert.equal(info.postscript, 'Geist-Regular')
		assert.deepEqual(info.wght, { min: 100, max: 900 })
		assert.equal(info.weightClass, 400)
	})
})

describe('addFont', () => {
	it('copies the file and wires web + native registration', () => {
		const dir = makeApp()
		try {
			const report = addFont(dir, [GEIST], {})
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

	it('is idempotent on rerun', () => {
		const dir = makeApp()
		try {
			addFont(dir, [GEIST], {})
			const report = addFont(dir, [GEIST], {})
			assert.equal(report.error, undefined)
			assert.deepEqual(report.faces, [])
			assert.ok(report.warnings.some((w) => w.includes('already registered')))

			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.equal(fontsCss.match(/^@font-face/gm).length, 1)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.equal(style.match(/xplat-fonts:sans:start/g).length, 1)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('merges a second add into the existing token block', () => {
		const dir = makeApp()
		try {
			const alt = join(dir, 'GeistAlt.ttf')
			copyFileSync(GEIST, alt)
			addFont(dir, [GEIST], {})
			addFont(dir, [alt], {})
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(style, /'GeistVariable'|'Geist-Variable', 'GeistAlt'/)
			assert.match(style, /'GeistAlt'/)
			const fontsCss = readFileSync(join(dir, 'src/fonts.css'), 'utf8')
			assert.equal(fontsCss.match(/^@font-face/gm).length, 2)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('--token mono wires --font-mono without touching body', () => {
		const dir = makeApp()
		try {
			const report = addFont(dir, [GEIST], { token: 'mono' })
			assert.equal(report.error, undefined)
			const style = readFileSync(join(dir, 'src/style.css'), 'utf8')
			assert.match(style, /--font-mono: 'Geist'/)
			assert.ok(!/body \{\n\tfont-family: var\(--font-mono/.test(style))
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('--token none skips style.css', () => {
		const dir = makeApp()
		try {
			const report = addFont(dir, [GEIST], { token: 'none' })
			assert.equal(report.error, undefined)
			assert.ok(!readFileSync(join(dir, 'src/style.css'), 'utf8').includes('xplat-fonts'))
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('rejects web-only font formats', () => {
		const dir = makeApp()
		try {
			const woff = join(dir, 'fake.woff2')
			writeFileSync(woff, 'wOF2')
			const report = addFont(dir, [woff], {})
			assert.match(report.error, /\.ttf or \.otf/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('fails without a package.json', () => {
		const dir = mkdtempSync(join(tmpdir(), 'xplat-fonts-empty-'))
		try {
			const report = addFont(dir, [GEIST], {})
			assert.match(report.error, /no package\.json/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})
})
