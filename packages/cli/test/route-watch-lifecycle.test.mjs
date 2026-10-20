import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createRouteWatcher } from '../dist/route-watch.js'
import { loadRoutingConfig } from '../dist/route-config.js'

const screen = 'export default function Screen() { return null }'
const until = async (predicate) => {
	const deadline = Date.now() + 5000
	while (!(await predicate())) {
		assert.ok(Date.now() < deadline, 'watch condition did not settle')
		await delay(20)
	}
}

const text = (file) =>
	readFile(file, 'utf8').catch((error) => {
		if (error.code === 'ENOENT') {
			return ''
		}
		throw error
	})

const fixture = async () => {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-watch-'))
	await mkdir(join(root, 'app'), { recursive: true })
	await writeFile(join(root, 'app/first.tsx'), screen)
	return root
}

test(
	'creating a missing configured source repairs the initial build',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		try {
			await writeFile(
				join(root, 'xplat.routes.json'),
				JSON.stringify({ context: { module: './src/context', export: 'context' } }),
			)

			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: async () => {
					loadRoutingConfig(root)
					return 1
				},
				onError: (error) => errors.push(error),
			})

			await until(() => errors.length > 0)
			assert.match(String(errors[0]), /existing source module/)
			await mkdir(join(root, 'src'))
			await writeFile(join(root, 'src/context.ts'), 'export const context = {}')
			assert.equal(await watcher.ready, 1)
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'watching recovers from invalid initial configuration and follows its new source tree',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const roots = []
		try {
			await writeFile(join(root, 'xplat.routes.json'), '{')
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: async () => {
					const config = JSON.parse(await text(join(root, 'xplat.routes.json')))
					roots.push(config.directory)
					return roots.length
				},
				onError: (error) => errors.push(error),
			})

			await until(() => errors.length === 1)
			await writeFile(join(root, 'xplat.routes.json'), '{"directory":"app"}')
			assert.equal(await watcher.ready, 1)
			await mkdir(join(root, 'other'))
			await writeFile(join(root, 'xplat.routes.json.tmp'), '{"directory":"other"}')
			await rename(join(root, 'xplat.routes.json.tmp'), join(root, 'xplat.routes.json'))
			await until(() => roots.at(-1) === 'other')
			const before = roots.length
			await writeFile(join(root, 'other/second.tsx'), screen)
			await until(() => roots.length > before)
			assert.equal(roots.at(-1), 'other')
			assert.equal(errors.length, 1)
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test('closing before initial generation cancels readiness without calling the generator', async () => {
	const root = await fixture()
	let called = false
	const watcher = createRouteWatcher({
		cwd: root,
		generate: async () => {
			called = true
			return 1
		},
		onError: (error) => {
			throw error
		},
	})
	try {
		await watcher.close()
		await assert.rejects(watcher.ready, { name: 'AbortError' })
		assert.equal(called, false)
	} finally {
		await watcher.close()
		await rm(root, { recursive: true, force: true })
	}
})

test(
	'watch serializes builds, invalidates obsolete work, and drains it on close',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		const attempts = []
		const published = []
		let active = 0
		let maximum = 0
		let watcher
		try {
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				async generate(signal) {
					maximum = Math.max(maximum, ++active)
					let release
					const pending = new Promise((resolve) => {
						release = resolve
					})
					attempts.push({ signal, release })
					await pending
					active--
					return attempts.length
				},
				onGenerated: (count) => published.push(count),
				onError: (error) => {
					throw error
				},
			})

			await until(() => attempts.length === 1)
			await writeFile(join(root, 'app/second.tsx'), screen)
			await until(() => attempts[0].signal.aborted)
			attempts[0].release()
			await until(() => attempts.length === 2)
			attempts[1].release()
			assert.equal(await watcher.ready, 2)
			assert.deepEqual(published, [2])
			assert.equal(maximum, 1)
			await writeFile(join(root, 'app/third.tsx'), screen)
			await until(() => attempts.length === 3)
			let closed = false
			const closing = watcher.close().then(() => {
				closed = true
			})

			assert.ok(attempts[2].signal.aborted)
			await delay(30)
			assert.equal(closed, false)
			attempts[2].release()
			await closing
			assert.deepEqual(published, [2])
		} finally {
			for (const attempt of attempts) {
				attempt.release()
			}

			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)
