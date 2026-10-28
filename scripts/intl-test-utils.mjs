import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Build actual consuming modules, then execute in a fresh process. Tests never
// mutate the host's Intl or rely on another leaf having initialized it first.
export async function checkIntlBundle(
	build,
	{ source, check, mobile = true, before = 'delete globalThis.Intl', root = process.cwd() },
) {
	const entry = join(root, 'intl-consumer.ts')
	const result = await build({
		configFile: false,
		root,
		logLevel: 'error',
		plugins: [
			{
				name: 'intl-consumer',
				enforce: 'pre',
				resolveId(id) {
					if (id === entry) {
						return id
					}
					if (id === './detect-locale') {
						return '\0locale-host'
					}
				},
				load(id) {
					if (id === entry) {
						return source
					}
					if (id === '\0locale-host') {
						return 'export const detectSystemLocale = () => "en"'
					}
				},
			},
		],
		resolve: {
			extensions: mobile
				? ['.mobile.ts', '.ts', '.mjs', '.js', '.json']
				: ['.web.ts', '.ts', '.mjs', '.js', '.json'],
		},
		build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
	})
	const chunks = [result]
		.flat()
		.flatMap((result) => result.output)
		.filter((item) => item.type === 'chunk')
	assert.equal(chunks.length, 1)
	const directory = await mkdtemp(join(tmpdir(), 'xplat-intl-'))
	try {
		const file = join(directory, 'consumer.mjs')
		await writeFile(file, chunks[0].code)
		const child = spawnSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				`
   import assert from 'node:assert/strict'
   ${before}
   const leaf = await import(${JSON.stringify(pathToFileURL(file).href)})
   ${check}
  `,
			],
			{ encoding: 'utf8', timeout: 60000 },
		)
		assert.equal(child.status, 0, child.stdout + child.stderr)
	} finally {
		await rm(directory, { recursive: true, force: true })
	}
	return { modules: Object.keys(chunks[0].modules), bytes: Buffer.byteLength(chunks[0].code) }
}
