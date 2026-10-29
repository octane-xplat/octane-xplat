import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = process.env.XPLAT_TRACKING_PACKAGE ?? fileURLToPath(new URL('..', import.meta.url))
const output =
	process.env.XPLAT_TRACKING_CONTRACT_OUTPUT ?? join(tmpdir(), 'xplat-tracking-windows-contract')
const require = createRequire(join(root, 'package.json'))
const { build } = await import(pathToFileURL(require.resolve('vite')).href)
const result = await build({
	root,
	configFile: false,
	logLevel: 'warn',
	build: {
		write: false,
		minify: false,
		lib: {
			entry: join(root, 'tests/windows-entry.ts'),
			formats: ['es'],
			fileName: 'windows-contract',
		},
	},
})
const chunks = (Array.isArray(result) ? result : [result])
	.flatMap((value) => value.output)
	.filter((value) => value.type === 'chunk')
assert.equal(chunks.length, 1)
await mkdir(output, { recursive: true })
await writeFile(join(output, 'windows-contract.mjs'), chunks[0].code)
console.log(
	'Windows adapter contract bundled without execution; run synthetic/API checks through ssh windy.',
)
