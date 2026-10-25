import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
for (const args of [['--device', 'phone'], ['android', '--device', 'phone'], ['phone']]) {
	test(`dev selects one exact device: ${args.join(' ')}`, (t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-dev-device-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		mkdirSync(join(root, 'bin'))
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({ private: true, devDependencies: { '@nativescript/android': '*' } }),
		)
		writeFileSync(join(root, 'nativescript.config.ts'), 'export default {}')
		for (const [name, body] of Object.entries({
			adb: "console.log('List of devices attached\\nphone\\tdevice\\nother\\tdevice')",
			pnpm: `require('node:fs').writeFileSync(${JSON.stringify(join(root, 'args.json'))}, JSON.stringify(process.argv.slice(2)))`,
		})) {
			const path = join(root, 'bin', name)
			writeFileSync(path, `#!${process.execPath}\n${body}\n`)
			chmodSync(path, 0o755)
		}
		const result = spawnSync(process.execPath, [cli, 'dev', ...args], {
			cwd: root,
			env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}` },
			encoding: 'utf8',
			timeout: 20000,
		})
		assert.equal(result.status, 0, result.stdout + result.stderr)
		assert.deepEqual(JSON.parse(readFileSync(join(root, 'args.json'), 'utf8')), [
			'exec',
			'ns',
			'run',
			'android',
			'--device',
			'phone',
		])
	})
}

for (const args of [['--device'], ['--device', ''], ['--device=']]) {
	test(`dev rejects an empty device: ${JSON.stringify(args)}`, () => {
		const result = spawnSync(process.execPath, [cli, 'dev', ...args], {
			encoding: 'utf8',
			timeout: 20000,
		})
		assert.equal(result.status, 1, result.stdout + result.stderr)
		assert.match(result.stdout + result.stderr, /--device requires an exact device target id/)
	})
}
