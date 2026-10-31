import { loadSource } from '../../../scripts/load-source.ts'
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { xplatIcons } = await loadSource(new URL('../src/vite/index.ts', import.meta.url))

const root = mkdtempSync(join(tmpdir(), 'xplat-icons-plugin-'))
const importer = join(root, 'src/App.ts')
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

const plugin = xplatIcons()
plugin.configResolved({ root })

const context = (watched = []) => ({
	error(message) {
		throw new Error(typeof message === 'string' ? message : message?.message ?? String(message))
	},
	addWatchFile(id) {
		watched.push(id)
	},
})

test('xplatIcons resolves icons: specifiers to per-icon IconifyIcon modules', () => {
	const watched = []
	const ctx = context(watched)
	const id = plugin.resolveId.call(ctx, 'icons:mini/wide', importer)
	const code = plugin.load.call(ctx, id)
	const icon = JSON.parse(code.replace('export default ', ''))
	assert.equal(icon.body, '<path d="M0 0h32v16H0z"/>')
	// Collection dimensions and aliases are baked in at resolve time.
	assert.equal(icon.width, 32)
	assert.equal(icon.height, 16)
	const aliasId = plugin.resolveId.call(ctx, 'icons:mini/turned', importer)
	const alias = JSON.parse(plugin.load.call(ctx, aliasId).replace('export default ', ''))
	assert.equal(alias.rotate, 1)
	assert.equal(watched.length, 2)
	assert.equal(plugin.load.call(ctx, '\0icons:unknown'), null)
})

test('xplatIcons rejects bad specifiers, missing collections, and missing icons', () => {
	const ctx = context()
	assert.equal(plugin.resolveId.call(ctx, './local.js', importer), null)
	assert.throws(
		() => plugin.resolveId.call(ctx, 'icons:Mini/Bad', importer),
		/expected icons:<prefix>\/<name>/,
	)
	assert.throws(
		() => plugin.resolveId.call(ctx, 'icons:absent/x', importer),
		/Cannot resolve @iconify-json\/absent/,
	)
	const id = plugin.resolveId.call(ctx, 'icons:mini/nope', importer)
	assert.throws(() => plugin.load.call(ctx, id), /Icon "nope" not found in @iconify-json\/mini/)
})

after(() => rmSync(root, { recursive: true, force: true }))
