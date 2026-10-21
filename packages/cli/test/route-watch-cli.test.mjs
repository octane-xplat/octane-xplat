import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const require = createRequire(import.meta.url)
const until = async (predicate, diagnostic = () => '') => {
	const deadline = Date.now() + 10000
	while (!(await predicate())) {
		assert.ok(Date.now() < deadline, `CLI watch condition did not settle: ${diagnostic()}`)
		await delay(20)
	}
}

const read = (file) =>
	readFile(file, 'utf8').catch((error) => {
		if (error.code === 'ENOENT') {
			return ''
		}
		throw error
	})

async function fixture(vite) {
	const root = await mkdtemp(join(tmpdir(), 'xplat-route-watch-cli-'))
	await mkdir(join(root, 'app'))
	await writeFile(join(root, 'app/first.tsx'), 'export default function First() { return null }')
	await writeFile(
		join(root, 'package.json'),
		JSON.stringify({ private: true, type: 'module', dependencies: vite ? { vite: '*' } : {} }),
	)
	if (vite) {
		const packageRoot = dirname(require.resolve('vite/package.json'))
		await mkdir(join(root, 'node_modules/.bin'), { recursive: true })
		await symlink(packageRoot, join(root, 'node_modules/vite'), 'dir')
		await symlink(join(packageRoot, 'bin/vite.js'), join(root, 'node_modules/.bin/vite'))
		await writeFile(join(root, 'index.html'), '<p>route watch fixture</p>')
		await writeFile(
			join(root, 'vite.config.mjs'),
			"export default { server: { host: '127.0.0.1', port: 0 } }",
		)
	}
	return root
}

function launch(root, args) {
	const child = spawn(process.execPath, [cli, ...args], {
		cwd: root,
		detached: true,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let output = ''
	child.stdout.on('data', (data) => {
		output += data
	})
	child.stderr.on('data', (data) => {
		output += data
	})
	const exited = new Promise((resolve) =>
		child.once('exit', (code, signal) => resolve({ code, signal })),
	)
	return {
		output: () => output,
		assertAlive() {
			assert.equal(child.exitCode, null, output)
		},
		async close() {
			try {
				process.kill(-child.pid, 'SIGTERM')
			} catch (error) {
				if (error.code !== 'ESRCH') {
					throw error
				}
			}
			const stopped = await Promise.race([
				exited.then(() => true),
				delay(4000, undefined, { ref: false }).then(() => false),
			])
			if (!stopped) {
				try {
					process.kill(-child.pid, 'SIGKILL')
				} catch (error) {
					if (error.code !== 'ESRCH') {
						throw error
					}
				}

				await exited
			}
			assert.ok(stopped, `CLI did not close its watcher/server: ${output}`)
		},
	}
}

test(
	'routes --watch regenerates through the built CLI and closes on SIGTERM',
	{ skip: process.platform === 'win32', timeout: 20000 },
	async () => {
		const root = await fixture(false)
		let runner
		try {
			runner = launch(root, ['routes', '--watch'])
			await until(() => runner.output().includes('Watching route sources'))
			await writeFile(
				join(root, 'app/second.tsx'),
				'export default function Second() { return null }',
			)

			await until(async () =>
				(await read(join(root, 'routes.gen.contracts.ts'))).includes('"/second"'),
			)

			assert.doesNotMatch(runner.output(), /Error:/)
		} finally {
			await runner?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)

test(
	'xplat dev recognizes a JavaScript config and watches routes alongside a real Vite server',
	{ skip: process.platform === 'win32', timeout: 25000 },
	async () => {
		const root = await fixture(true)
		let runner
		let url
		try {
			runner = launch(root, ['dev', 'web'])
			await until(() => {
				runner.assertAlive()
				url = runner.output().match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0]
				return !!url
			}, runner.output)

			assert.match(await (await fetch(url)).text(), /route watch fixture/)
			await writeFile(
				join(root, 'app/second.tsx'),
				'export default function Second() { return null }',
			)

			await until(async () =>
				(await read(join(root, 'routes.gen.contracts.ts'))).includes('"/second"'),
			)

			await runner.close()
			runner = undefined
			await assert.rejects(fetch(url))
		} finally {
			await runner?.close()
			await rm(root, { recursive: true, force: true })
		}
	},
)
