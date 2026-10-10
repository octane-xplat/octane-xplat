import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { initializeUpdates } from '../src/commands/updates.mjs'

test('init resolves the app runtime, preserves edited hooks, and is repeatable', async (t) => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-updates-init-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	writeFileSync(join(root, 'package.json'), '{}')
	await assert.rejects(initializeUpdates(root), /Cannot find module/)
	const pkg = join(root, 'node_modules/@octane-xplat/updates')
	mkdirSync(pkg, { recursive: true })
	writeFileSync(
		join(pkg, 'package.json'),
		'{"name":"@octane-xplat/updates","exports":{"./prepare":"./prepare.cjs"}}',
	)

	writeFileSync(join(pkg, 'prepare.cjs'), 'module.exports = () => {}')
	const file = await initializeUpdates(root)
	const first = readFileSync(file, 'utf8')
	await initializeUpdates(root)
	assert.equal(readFileSync(file, 'utf8'), first)
	writeFileSync(file, '// user edit')
	await assert.rejects(initializeUpdates(root), /Existing OTA hook differs/)
	assert.equal(readFileSync(file, 'utf8'), '// user edit')
})
