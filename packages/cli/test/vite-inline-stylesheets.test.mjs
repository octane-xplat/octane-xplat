import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, it } from 'node:test'
import { build } from 'vite'
import { xplatCss } from '../src/css-platform.ts'
import { xplatInlineStylesheets } from '../src/inline-stylesheets.ts'

const dir = mkdtempSync(join(tmpdir(), 'xplat-inline-css-'))
mkdirSync(join(dir, 'src'), { recursive: true })
writeFileSync(
	join(dir, 'src', 'a.css'),
	'@layer base { .a { width: 12px } }\n@platform macos { .m { width: 4px } }\n@platform gtk { .g { width: 6px } }\n@platform web { .w { width: 8px } }\n',
)
writeFileSync(join(dir, 'src', 'b.css'), '.b { padding: 2px 4px }\n')
writeFileSync(
	join(dir, 'src', 'entry.ts'),
	"import './a.css'\nimport './b.css'\nexport const x = 1\n",
)
writeFileSync(
	join(dir, 'src', 'gtk-entry.ts'),
	"import Gtk from 'gi://Gtk?version=4.0'\nimport './a.css'\nexport const g = Gtk.MAJOR_VERSION\n",
)

it('collects .css assets, processes them, and prepends one push line to the entry chunk', async () => {
	const out = join(dir, 'out')
	await build({
		root: dir,
		logLevel: 'silent',
		plugins: [xplatCss('macos'), xplatInlineStylesheets()],
		build: {
			cssCodeSplit: true,
			outDir: out,
			lib: { entry: 'src/entry.ts', formats: ['cjs'], fileName: 'main' },
			rollupOptions: { output: { codeSplitting: false } },
		},
	})

	const files = readdirSync(out)
	assert.ok(!files.some((f) => f.endsWith('.css')), `css assets remain: ${files}`)
	const js = files.find((f) => f.endsWith('.cjs') || f.endsWith('.js'))
	const code = readFileSync(join(out, js), 'utf8')

	const line = code.split('\n')[0]
	assert.ok(line.startsWith('(globalThis.__xplatStylesheets ??= []).push('), line.slice(0, 80))
	const ids = [...line.matchAll(/\["([^"]+)",/g)].map((m) => m[1])
	assert.equal(ids.length, 1, 'lib mode merges css into one asset')

	const payload = JSON.parse('[' + line.match(/\(\["[\s\S]+"\]\);/)[0].slice(1, -2) + ']')
	const cssA = payload.find(([, css]) => css.includes('.a'))[1]
	assert.ok(cssA.includes('width:4dip'), 'px→dip applied')
	assert.ok(cssA.includes('.m'), 'macos block kept')
	assert.ok(!cssA.includes('.w {'), 'web block stripped')
	assert.ok(!cssA.includes('@layer'), 'layer unwrapped')
	assert.ok(cssA.includes('padding:2dip 4dip'), 'second sheet merged + processed')
})

it('prepends the push before ESM imports for the GTK host', async () => {
	const out = join(dir, 'out-gtk')
	await build({
		root: dir,
		logLevel: 'silent',
		plugins: [xplatCss('gtk'), xplatInlineStylesheets()],
		build: {
			cssCodeSplit: true,
			outDir: out,
			lib: { entry: 'src/gtk-entry.ts', formats: ['es'], fileName: 'app' },
			rollupOptions: {
				external: (id) => id.startsWith('gi://'),
				output: { inlineDynamicImports: true },
			},
		},
	})

	const files = readdirSync(out)
	assert.ok(!files.some((f) => f.endsWith('.css')), `css assets remain: ${files}`)
	const js = files.find((f) => f.endsWith('.js') || f.endsWith('.mjs'))
	const code = readFileSync(join(out, js), 'utf8')

	const lines = code.split('\n')
	assert.ok(
		lines[0].startsWith('(globalThis.__xplatStylesheets ??= []).push('),
		lines[0].slice(0, 80),
	)
	assert.match(
		code,
		/from\s+["']gi:\/\/Gtk\?version=4\.0["']/,
		'gi:// import survived after the prepended push',
	)

	const payload = JSON.parse('[' + lines[0].match(/\(\["[\s\S]+"\]\);/)[0].slice(1, -2) + ']')
	const cssA = payload.find(([, css]) => css.includes('.a'))[1]
	assert.ok(cssA.includes('width:6dip'), 'px→dip applied to the gtk block')
	assert.ok(cssA.includes('.g'), 'gtk block kept')
	assert.ok(!cssA.includes('.w {'), 'web block stripped')
})

after(() => {
	rmSync(dir, { recursive: true, force: true })
})
