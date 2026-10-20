import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { generateRoutes } from '../dist/commands/routes.js'

const require = createRequire(import.meta.url)
const exists = (file) =>
	readFile(file).then(
		() => true,
		(error) => {
			if (error.code === 'ENOENT') {
				return false
			}
			throw error
		},
	)

const until = async (predicate) => {
	const deadline = Date.now() + 10000
	while (!(await predicate())) {
		assert.ok(Date.now() < deadline, 'bake condition did not settle')
		await delay(20)
	}
}

test(
	'failed or aborted baking cannot publish partial or late generated artifacts',
	{ timeout: 20000 },
	async () => {
		const root = await mkdtemp(join(tmpdir(), 'xplat-route-publish-'))
		try {
			await mkdir(join(root, 'app'))
			await mkdir(join(root, 'node_modules'))
			await symlink(
				dirname(require.resolve('vite/package.json')),
				join(root, 'node_modules/vite'),
				'dir',
			)

			await writeFile(join(root, 'package.json'), '{"type":"module"}')
			await writeFile(
				join(root, 'app/first.tsx'),
				'export default function First() { return null }',
			)

			await generateRoutes(root)
			const generated = (await readdir(root)).filter((file) => file.startsWith('routes.gen.'))
			const before = new Map(
				await Promise.all(
					generated.map(async (file) => [file, await readFile(join(root, file), 'utf8')]),
				),
			)

			const unchanged = async () => {
				for (const [file, source] of before) {
					assert.equal(await readFile(join(root, file), 'utf8'), source, file)
				}
				assert.deepEqual(
					(await readdir(root)).filter((file) => file.startsWith('routes.gen.')).sort(),
					[...before.keys()].sort(),
				)
			}

			await writeFile(
				join(root, 'app/baked.tsx'),
				"export const dataMode = 'baked'; export default function Baked() { return null }",
			)

			await writeFile(
				join(root, 'app/baked.loader.mjs'),
				"export function loader() { throw new Error('intentional bake failure') }",
			)

			await assert.rejects(generateRoutes(root), /intentional bake failure/)
			await unchanged()
			await writeFile(
				join(root, 'app/baked.loader.mjs'),
				`
import { access, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
export async function loader() {
 await writeFile(new URL('./started', import.meta.url), 'ready');
 for (;;) {
  try { await access(new URL('./release', import.meta.url)); break } catch {}
  await setTimeout(10);
 }
 return { title: 'ready' };
}
`,
			)

			const abort = new AbortController()
			const pending = assert.rejects(
				generateRoutes(root, undefined, undefined, { signal: abort.signal }),
				{ name: 'AbortError' },
			)

			await until(() => exists(join(root, 'app/started')))
			abort.abort()
			await writeFile(join(root, 'app/release'), 'continue')
			await pending
			await unchanged()
			await generateRoutes(root)
			assert.match(await readFile(join(root, 'routes.gen.contracts.ts'), 'utf8'), /"\/baked"/)
			assert.match(await readFile(join(root, 'routes.gen.data.ts'), 'utf8'), /ready/)
		} finally {
			await rm(root, { recursive: true, force: true })
		}
	},
)
