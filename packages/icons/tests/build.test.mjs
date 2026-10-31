import { loadSource } from '../../../scripts/load-source.ts'
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { emitIconRegistry } = await loadSource(new URL('../src/build/index.ts', import.meta.url))

const root = mkdtempSync(join(tmpdir(), 'xplat-icons-build-'))
mkdirSync(join(root, 'node_modules/@iconify-json/mini'), { recursive: true })
writeFileSync(
	join(root, 'node_modules/@iconify-json/mini/icons.json'),
	JSON.stringify({
		prefix: 'mini',
		width: 32,
		height: 16,
		icons: { wide: { body: '<path d="M0 0h32v16H0z"/>' } },
		aliases: { turned: { parent: 'wide', rotate: 1 } },
	}),
)
writeFileSync(join(root, 'package.json'), '{"type":"module"}')
mkdirSync(join(root, 'src'), { recursive: true })
writeFileSync(
	join(root, 'src/app.ts'),
	`import wide from 'icons:mini/wide'
import turned from 'icons:mini/turned'
import dup from "icons:mini/wide"
`,
)
writeFileSync(join(root, 'src/skip.css'), `/* icons:mini/not-an-icon is not source */`)
writeFileSync(join(root, 'package.json'), '{"type":"module"}')
after(() => rmSync(root, { recursive: true, force: true }))

test('emitIconRegistry emits addIcons over scanned icons: specifiers', async () => {
	const out = join(root, 'src/icons.gen.ts')
	const result = await emitIconRegistry({ root, out })
	assert.deepEqual(result.icons, ['mini:turned', 'mini:wide'])
	const source = readFileSync(out, 'utf8')
	assert.match(source, /import icon0 from 'icons:mini\/turned'/)
	assert.match(source, /import icon1 from 'icons:mini\/wide'/)
	assert.match(source, /'mini:wide': icon1/)
	assert.match(source, /addIcons\(\{/)
	// Second run is a no-op.
	assert.equal((await emitIconRegistry({ root, out })).unchanged, true)
})

test('emitIconRegistry --inline writes icon data instead of specifiers', async () => {
	const out = join(root, 'src/icons.inline.gen.ts')
	const result = await emitIconRegistry({ root, out, inline: true })
	const source = readFileSync(out, 'utf8')
	assert.match(source, /'mini:wide': \{"width":32,"height":16,"body":"<path d=\\"M0 0h32v16H0z\\"\/>"\}/)
	assert.match(source, /'mini:turned': \{"rotate":1.*"body":"/)
	assert.doesNotMatch(source, /from 'icons:/)
	assert.deepEqual(result.icons, ['mini:turned', 'mini:wide'])
})

test('emitIconRegistry fails on missing icons', async () => {
	mkdirSync(join(root, 'broken'), { recursive: true })
	writeFileSync(join(root, 'broken/x.ts'), `import x from 'icons:mini/nope'`)
	await assert.rejects(() => emitIconRegistry({ root, include: ['broken'], out: join(root, 'broken/gen.ts') }), /Icon "nope" not found/)
	writeFileSync(join(root, 'broken/x.ts'), `import x from 'icons:absent/x'`)
	await assert.rejects(() => emitIconRegistry({ root, include: ['broken'], out: join(root, 'broken/gen.ts') }), /Cannot resolve @iconify-json\/absent/)
})
