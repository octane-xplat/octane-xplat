import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { publishRelease } from './publish-release.ts'

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-release-test-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	for (const name of ['a', 'b', 'tsrx-typegen']) {
		mkdirSync(join(root, 'packages', name), { recursive: true })
		writeFileSync(
			join(root, 'packages', name, 'package.json'),
			JSON.stringify({ name, version: '1.0.0' }),
		)
	}
	return root
}
function registry(code = 'E404') {
	return { status: 1, stdout: JSON.stringify({ error: { code } }), stderr: '' }
}
test('packs all pending packages before npm publication and skips existing versions', (t) => {
	const root = fixture(t)
	const calls = []
	const run = (command, args, options) => {
		calls.push([command, ...args])
		if (args[0] === 'view') {
			return registry()
		}
		if (command === 'bun') {
			writeFileSync(join(args.at(-1), `${options.cwd.split('/').at(-1)}.tgz`), '')
		}
		return { status: 0, stdout: '', stderr: '' }
	}
	assert.deepEqual(publishRelease({ root, tag: 'nightly', run }), ['a@1.0.0', 'b@1.0.0'])
	assert.deepEqual(
		calls.map((c) => c.slice(0, 2)),
		[
			['npm', 'view'],
			['bun', 'pm'],
			['npm', 'view'],
			['bun', 'pm'],
			['npm', 'publish'],
			['npm', 'publish'],
		],
	)
	for (const call of calls.filter((c) => c[1] === 'publish')) {
		assert.deepEqual(call.slice(3), ['--access', 'public', '--provenance', '--tag', 'nightly'])
	}
	const skipped = []
	assert.deepEqual(
		publishRelease({
			root,
			run: (command, args) => {
				skipped.push(args)
				return { status: 0, stdout: '"1.0.0"' }
			},
		}),
		[],
	)
	assert.equal(skipped.length, 2)
})
test('registry/auth failures and pack failures stop before publication', (t) => {
	const root = fixture(t)
	assert.throws(
		() => publishRelease({ root, run: () => registry('E401') }),
		/Registry lookup failed/,
	)
	const calls = []
	assert.throws(
		() =>
			publishRelease({
				root,
				run: (command, _args) => {
					calls.push(command)
					return command === 'npm' ? registry() : { status: 1, stderr: 'broken' }
				},
			}),
		/Bun pack failed/,
	)
	assert.deepEqual(calls, ['npm', 'bun'])
})
test('independent typegen release only selects its package; unknown names fail', (t) => {
	const root = fixture(t)
	const calls = []
	publishRelease({
		root,
		packageName: 'tsrx-typegen',
		run: (command, args) => {
			calls.push(args)
			return { status: 0, stdout: '"1.0.0"' }
		},
	})
	assert.deepEqual(calls, [['view', 'tsrx-typegen@1.0.0', 'version', '--json']])
	assert.throws(() => publishRelease({ root, packageName: 'missing' }), /No publishable package/)
})
