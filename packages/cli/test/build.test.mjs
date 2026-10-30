import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import test from 'node:test'

const exec = promisify(execFile)
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))

async function fixture(t, { android = false, web = true, manager = 'pnpm' } = {}) {
	const root = await mkdtemp(join(tmpdir(), 'xplat-build-selection-'))
	t.after(() => rm(root, { recursive: true, force: true }))
	await mkdir(join(root, 'bin'))
	await mkdir(join(root, 'app'))
	await writeFile(join(root, 'app/index.tsx'), 'export default function Home() { return null }')
	await writeFile(
		join(root, 'package.json'),
		JSON.stringify({
			private: true,
			packageManager: `${manager}@${manager === 'bun' ? '1.4.4' : '11.24.0'}`,
			type: 'module',
			devDependencies: android ? { '@nativescript/android': '*' } : {},
		}),
	)
	if (web) {
		await writeFile(join(root, 'vite.config.ts'), 'export default {}')
	}
	if (android) {
		await writeFile(join(root, 'nativescript.config.ts'), 'export default {}')
	}
	const log = join(root, 'launched.jsonl')
	await writeFile(
		join(root, 'bin', manager),
		`#!${process.execPath}\nimport { appendFileSync } from 'node:fs'; appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + '\\n')\n`,
		{ mode: 0o755 },
	)
	const generated = join(root, 'routes.gen.web.ts')
	const sentinel = '// existing manifest must survive invalid target selection\n'
	await writeFile(generated, sentinel)
	return {
		async run(targets, extra = []) {
			const args = ['build', ...(targets === undefined ? [] : ['--targets', targets]), ...extra]
			try {
				const result = await exec(process.execPath, [cli, ...args], {
					cwd: root,
					env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}` },
					encoding: 'utf8',
					timeout: 20000,
				})

				return { code: 0, output: result.stdout + result.stderr }
			} catch (error) {
				return { code: error.code, output: String(error.stdout) + String(error.stderr) }
			}
		},
		calls: async () =>
			(await readFile(log, 'utf8').catch(() => ''))
				.trim()
				.split('\n')
				.filter(Boolean)
				.map(JSON.parse),
		unchanged: async () => assert.equal(await readFile(generated, 'utf8'), sentinel),
	}
}

for (const targets of ['web,android', 'web,unknown', '', 'web,,', '   ']) {
	test(`rejects the complete invalid explicit selection ${JSON.stringify(targets)} before side effects`, async (t) => {
		const project = await fixture(t)
		const result = await project.run(targets)
		assert.equal(result.code, 1, result.output)
		assert.match(result.output, /Unavailable build target/)
		assert.match(result.output, /Available: web/)
		assert.doesNotMatch(result.output, /Build complete|regenerated/)
		assert.deepEqual(await project.calls(), [])
		await project.unchanged()
	})
}

test('accepts trimmed duplicate kinds once and forwards release to the declared native build', async (t) => {
	const project = await fixture(t, { android: true })
	const result = await project.run(' web, android,web ', ['--release'])
	assert.equal(result.code, 0, result.output)
	assert.match(result.output, /Build complete/)
	assert.deepEqual(await project.calls(), [
		['exec', 'vite', 'build'],
		['exec', 'ns', 'build', 'android', '--release'],
	])
})

test('noninteractive implicit selection still builds all declared kinds', async (t) => {
	const project = await fixture(t, { android: true })
	const result = await project.run()
	assert.equal(result.code, 0, result.output)
	assert.deepEqual(await project.calls(), [
		['exec', 'vite', 'build'],
		['exec', 'ns', 'build', 'android'],
	])
})

test('explicit selection reports that no build kinds are available', async (t) => {
	const project = await fixture(t, { web: false })
	const result = await project.run('web')
	assert.equal(result.code, 1, result.output)
	assert.match(result.output, /Unavailable build target\(s\): web/)
	assert.match(result.output, /Available: \(none\)/)
	assert.deepEqual(await project.calls(), [])
	await project.unchanged()
})

for (const argument of ['--targets', '--targets=']) {
	test(`rejects explicit presence without a target value: ${argument}`, async (t) => {
		const project = await fixture(t)
		const result = await project.run(undefined, [argument])
		assert.equal(result.code, 1, result.output)
		assert.match(result.output, /Unavailable build target/)
		assert.deepEqual(await project.calls(), [])
		await project.unchanged()
	})
}

test('Bun-managed apps build through their installed Bun toolchain', async (t) => {
	const project = await fixture(t, { manager: 'bun' })
	const result = await project.run('web')
	assert.equal(result.code, 0, result.output)
	assert.deepEqual(await project.calls(), [['run', 'vite', 'build']])
})
