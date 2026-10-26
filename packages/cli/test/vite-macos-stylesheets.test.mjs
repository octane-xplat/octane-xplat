import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'node:test'
import { build } from 'vite'
import { xplatCss } from '../src/css-platform.ts'
import { xplatMacOSStylesheets } from '../src/macos/stylesheets.ts'

const dir = mkdtempSync(join(tmpdir(), 'xplat-macos-css-'))
mkdirSync(join(dir, 'src'), { recursive: true })
writeFileSync(
	join(dir, 'src', 'a.css'),
	'@layer base { .a { width: 12px } }\n@platform macos { .m { width: 4px } }\n@platform web { .w { width: 8px } }\n',
)
writeFileSync(join(dir, 'src', 'b.css'), '.b { padding: 2px 4px }\n')
writeFileSync(
	join(dir, 'src', 'entry.ts'),
	"import './a.css'\nimport './b.css'\nexport const x = 1\n",
)

it('collects .css assets, processes them, and prepends one push line to the entry chunk', async () => {
	const out = join(dir, 'out')
	await build({
		root: dir,
		logLevel: 'silent',
		plugins: [xplatCss('macos'), xplatMacOSStylesheets()],
		build: {
			cssCodeSplit: true,
			outDir: out,
			lib: { entry: 'src/entry.ts', formats: ['cjs'], fileName: 'main' },
			rollupOptions: { output: { codeSplitting: false } },
		},
	})

	const { readFileSync, readdirSync } = await import('node:fs')
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
	rmSync(dir, { recursive: true, force: true })
})
