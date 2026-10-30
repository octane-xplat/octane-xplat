import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
	chmodSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

for (const status of [0, 1]) {
	test(`local MasonKit installation restores metadata after exit ${status}`, (t) => {
		if (process.platform === 'win32') {
			return t.skip('POSIX executable fixture')
		}
		const root = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-local-mason-')))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const dist = join(root, 'links/nativescript-mason/dist/packages/nativescript-masonkit')
		mkdirSync(dist, { recursive: true })
		writeFileSync(
			join(dist, 'package.json'),
			JSON.stringify({ name: '@octane-xplat/nativescript-masonkit' }),
		)
		const before = '{ "private": true, "overrides": { "other": "1.0.0" } }\n'
		writeFileSync(join(root, 'package.json'), before)
		cpSync(new URL('../links/masonkit.ts', import.meta.url), join(root, 'links/masonkit.ts'))
		mkdirSync(join(root, 'bin'))
		const bin = join(root, 'bin/bun')
		writeFileSync(
			bin,
			`#!${process.execPath}\nconst fs=require('node:fs'); fs.writeFileSync('observed.json', JSON.stringify({pkg:JSON.parse(fs.readFileSync('package.json','utf8')),args:process.argv.slice(2)}));process.exit(${status})\n`,
		)
		chmodSync(bin, 0o755)
		const result = spawnSync(process.execPath, [join(root, 'links/masonkit.ts')], {
			cwd: root,
			env: { ...process.env, PATH: join(root, 'bin') },
			encoding: 'utf8',
		})
		assert.equal(result.status, status, result.stderr)
		assert.equal(readFileSync(join(root, 'package.json'), 'utf8'), before)
		const observed = JSON.parse(readFileSync(join(root, 'observed.json'), 'utf8'))
		assert.deepEqual(observed.args, ['install', '--ignore-scripts', '--no-save', '--force'])
		assert.equal(observed.pkg.overrides.other, '1.0.0')
		assert.equal(observed.pkg.overrides['@octane-xplat/nativescript-masonkit'], `link:${dist}`)
	})
}
