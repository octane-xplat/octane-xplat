import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { test } from 'node:test'
import { appFor, dependencies, json, repo } from './project.ts'

// These are host imports, so a case must not need --dep to activate their
// native binaries. A devDependency makes JS resolvable but skips ns prepare.
for (const target of ['ios', 'android']) {
	test(`${target} host declares and fingerprints the renderer's native plugin`, async () => {
		const deps = await dependencies(target, join(repo, 'examples/probes/hello.tsrx'), [])
		const name = '@triniwiz/nativescript-masonkit'
		assert.ok(deps.names.has(name))
		assert.ok(deps.nativeFiles.includes(join(deps.resolved.get(name), 'package.json')))
		assert.ok(
			deps.nativeFiles.some((file) => file.startsWith(join(deps.resolved.get(name), 'platforms'))),
		)
		assert.ok((await json(join(appFor(target), 'package.json'))).dependencies[name])
	})
}

test('native preset folds the Windows branch in host builds', async () => {
	const cwd = process.cwd()
	try {
		process.chdir(appFor('ios'))
		const require = createRequire(join(process.cwd(), 'package.json'))
		const { xplatNative } = await import(require.resolve('@octane-xplat/cli/vite'))
		const config = await xplatNative('production')
		assert.equal(config.define.__WINDOWS__, 'false')
	} finally {
		process.chdir(cwd)
	}
})
