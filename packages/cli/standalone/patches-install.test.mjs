import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { applyPatches, inspectPatches } from '../dist/patches.js'

for (const manager of ['bun', 'pnpm']) {
	test(`${manager} installs canonical patches and repeats a frozen install`, (t) => {
		const root = mkdtempSync(join(tmpdir(), `xplat-patch-install-${manager}-`))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({
				private: true,
				packageManager: `${manager}@${manager === 'bun' ? '1.4.4' : '11.24.0'}`,
				dependencies: { css: '3.0.0' },
			}),
		)
		assert.equal(applyPatches(root).conflicts.length, 0)
		const run = (args) =>
			execFileSync(manager, args, { cwd: root, encoding: 'utf8', timeout: 120_000 })
		run(['install', '--ignore-scripts'])
		assert.equal(inspectPatches(root).find((row) => row.specifier === 'css@3.0.0').state, 'applied')
		const require = createRequire(join(root, 'package.json'))
		const css = require('css')
		const parsed = css.parse('@layer reset { button { color: red } }')
		assert.equal(parsed.stylesheet.rules[0].type, 'layer')
		const lock = join(root, manager === 'bun' ? 'bun.lock' : 'pnpm-lock.yaml')
		const before = readFileSync(lock, 'utf8')
		run(['install', '--frozen-lockfile', '--ignore-scripts'])
		assert.equal(readFileSync(lock, 'utf8'), before)
	})
}
