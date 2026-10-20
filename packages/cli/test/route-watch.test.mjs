import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createRouteWatcher } from '../dist/route-watch.js'
import { generateRoutes } from '../dist/commands/routes.js'

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
	'a programmatic-only app observes its first conventional file route',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		try {
			await rm(join(root, 'app'), { recursive: true })
			await writeFile(
				join(root, 'extra.ts'),
				"throw new Error('Do not execute discovery'); export const extra = {}",
			)

			await writeFile(
				join(root, 'xplat.routes.json'),
				JSON.stringify({ manifests: [{ module: './extra', export: 'extra' }] }),
			)

			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: (signal, inputs) =>
					generateRoutes(root, inputs.directory, inputs.out, { bake: false, signal }),
				onError: (error) => errors.push(error),
			})

			assert.equal(await watcher.ready, 0)
			await mkdir(join(root, 'src/app'), { recursive: true })
			await writeFile(join(root, 'src/app/first.tsx'), screen)
			await until(async () =>
				(await text(join(root, 'src/routes.gen.contracts.ts'))).includes('"/first"'),
			)

			assert.deepEqual(errors, [])
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'removing and recreating the conventional route tree clears and restores contracts',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const contracts = join(root, 'routes.gen.contracts.ts')
		try {
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: (signal, inputs) =>
					generateRoutes(root, inputs.directory, inputs.out, { bake: false, signal }),
				onError: (error) => errors.push(error),
			})

			assert.equal(await watcher.ready, 1)
			await rm(join(root, 'app'), { recursive: true })
			await until(async () => !(await text(contracts)).includes('"/first"'))
			await mkdir(join(root, 'app'))
			await writeFile(join(root, 'app/restored.tsx'), screen)
			await until(async () => (await text(contracts)).includes('"/restored"'))
			assert.deepEqual(errors, [])
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'moving output while watching gives a repair instead of silently leaving stale client imports',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const contracts = join(root, 'routes.gen.contracts.ts')
		try {
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: (signal, inputs) =>
					generateRoutes(root, inputs.directory, inputs.out, { bake: false, signal }),
				onError: (error) => errors.push(error),
			})

			await watcher.ready
			const before = await text(contracts)
			await writeFile(join(root, 'xplat.routes.json'), '{"out":"other/routes.gen"}')
			await until(() => errors.length > 0)
			assert.match(String(errors[0]), /route\/watch-output-changed:.*update client\/type imports/)
			assert.equal(await text(contracts), before)
			assert.equal(await text(join(root, 'other/routes.gen.contracts.ts')), '')
			await writeFile(join(root, 'xplat.routes.json'), '{}')
			await writeFile(join(root, 'app/second.tsx'), screen)
			await until(async () => (await text(contracts)).includes('"/second"'))
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'filesystem watch follows nested additions, rename, removal and configuration changes',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const counts = []
		const contracts = join(root, 'routes.gen.contracts.ts')
		try {
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: (signal, inputs) =>
					generateRoutes(root, inputs.directory, inputs.out, { bake: false, signal }),
				onGenerated: (count) => counts.push(count),
				onError: (error) => errors.push(error),
			})

			assert.equal(await watcher.ready, 1)
			await mkdir(join(root, 'app/nested'))
			await writeFile(join(root, 'app/nested/index.tsx'), screen)
			await until(async () => (await text(contracts)).includes('"/nested"'))
			await rename(join(root, 'app/nested'), join(root, 'app/renamed'))
			await rm(join(root, 'app/first.tsx'))
			await until(async () => {
				const source = await text(contracts)
				return (
					source.includes('"/renamed"') &&
					!source.includes('"/first"') &&
					!source.includes('"/nested"')
				)
			})

			await mkdir(join(root, 'other'))
			await writeFile(join(root, 'other/second.tsx'), screen)
			await writeFile(join(root, 'xplat.routes.json.tmp'), JSON.stringify({ directory: 'other' }))
			await rename(join(root, 'xplat.routes.json.tmp'), join(root, 'xplat.routes.json'))
			const changedContracts = join(root, 'routes.gen.contracts.ts')
			await until(async () => (await text(changedContracts)).includes('"/second"'))
			await rm(join(root, 'other'), { recursive: true })
			await until(async () => !(await text(changedContracts)).includes('"/second"'))
			await mkdir(join(root, 'other'))
			await writeFile(join(root, 'other/restored.tsx'), screen)
			await until(async () => (await text(changedContracts)).includes('"/restored"'))
			assert.deepEqual(errors, [])
			assert.ok(counts.includes(2))
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'watch errors retain the last good outputs and a later edit recovers',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const contracts = join(root, 'routes.gen.contracts.ts')
		try {
			watcher = createRouteWatcher({
				cwd: root,
				debounceMs: 20,
				generate: (signal, inputs) =>
					generateRoutes(root, inputs.directory, inputs.out, { bake: false, signal }),
				onError: (error) => errors.push(error),
			})

			await watcher.ready
			const before = await text(contracts)
			await writeFile(join(root, 'app/first.tsx'), 'export const dataMode = computeMode()')
			await until(() => errors.length > 0)
			assert.match(String(errors[0]), /route\/invalid-data-mode/)
			assert.equal(await text(contracts), before)
			await writeFile(join(root, 'app/second.tsx'), screen)
			await writeFile(join(root, 'app/first.tsx'), screen)
			await until(async () => (await text(contracts)).includes('"/second"'))
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'generated outputs inside the route tree never become inputs or a write loop',
	{ timeout: 15000 },
	async () => {
		const root = await fixture()
		let watcher
		const errors = []
		const counts = []
		try {
			watcher = createRouteWatcher({
				cwd: root,
				directory: 'app',
				out: 'app/routes.gen',
				debounceMs: 20,
				generate: (signal) =>
					generateRoutes(root, 'app', 'app/routes.gen', { bake: false, signal }),
				onGenerated: (count) => counts.push(count),
				onError: (error) => errors.push(error),
			})

			assert.equal(await watcher.ready, 1)
			await delay(150)
			assert.deepEqual(counts, [1])
			await writeFile(join(root, 'app/second.tsx'), screen)
			await until(() => counts.length > 1)
			await delay(150)
			assert.deepEqual(counts, [1, 2])
			assert.deepEqual(errors, [])
		} finally {
			await watcher?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)
