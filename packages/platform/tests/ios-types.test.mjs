import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

test('importing iOS native types does not eagerly read crash-prone globals', () => {
	const script = `
const names = [
	'CGVectorMake',
	'NSMakeCollectable',
	'TNSWidgetsVersionString',
	'UIGraphicsImageRendererContext',
	'UIGraphicsImageRendererFormat',
	'kCFAllocatorUseContext',
]
for (const name of names) {
	Object.defineProperty(globalThis, name, {
		configurable: true,
		get() { throw new Error(name + ' was eagerly read') },
	})
}
const types = await import(${JSON.stringify(new URL('../src/types/ios.ts', import.meta.url).href)})
for (const name of ['CGVectorMake', 'NSMakeCollectable']) {
	if (typeof types[name] !== 'function') throw new Error(name + ' binding is missing')
}
for (const name of names.slice(2)) {
	if (!Object.hasOwn(types, name)) throw new Error(name + ' binding is missing')
}
`

	const result = spawnSync(
		process.execPath,
		['--experimental-strip-types', '--input-type=module', '-e', script],
		{ encoding: 'utf8' },
	)

	assert.equal(result.status, 0, result.stdout + result.stderr)
})
