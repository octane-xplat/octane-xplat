import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import test from 'node:test'

const exec = promisify(execFile)
const binary = fileURLToPath(
	new URL(`../dist/${process.platform === 'win32' ? 'xplat.exe' : 'xplat'}`, import.meta.url),
)

test('standalone runs outside the checkout, initializes concurrently, and loads native tools', async (t) => {
	const cwd = await mkdtemp(join(tmpdir(), 'xplat-executable-test-'))
	t.after(() => rm(cwd, { recursive: true, force: true }))
	const env = { ...process.env, PATH: cwd, XPLAT_CLI_CACHE: join(cwd, 'cache') }
	const run = (args) =>
		exec(binary, args, { cwd, env, maxBuffer: 10 * 1024 * 1024, timeout: 30_000 })
	const catalogs = await Promise.all([run(['catalog', '--json']), run(['catalog', '--json'])])
	for (const { stdout } of catalogs) {
		assert.equal(JSON.parse(stdout).ok, true)
	}
	assert.match((await run(['--help'])).stdout, /xplat/)
	await writeFile(join(cwd, 'example.ts'), 'const value=1\n')
	await run(['fmt', 'example.ts'])
	assert.match(await readFile(join(cwd, 'example.ts'), 'utf8'), /const value = 1/)
	await run(['fmt', '--check', 'example.ts'])
	await run(['lint', '--help'])
	await run(['lint', 'example.ts'])
	await writeFile(
		join(cwd, 'component.web.tsrx'),
		'export function Hello() { return <div>Hello</div> }\n',
	)
	await run(['fmt', 'component.web.tsrx'])
	await run(['lint', 'component.web.tsrx'])
	await assert.rejects(run(['fmt', '--invalid-option']), { code: 2 })
	const status = JSON.parse((await run(['session', 'list', '--json'])).stdout)
	assert.equal(status.ok, true)
})
