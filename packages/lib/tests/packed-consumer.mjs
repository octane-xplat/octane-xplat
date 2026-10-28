import { loadSource } from '../../../scripts/load-source.ts'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const temporary = mkdtempSync(join(tmpdir(), 'xplat-lib-consumer-'))
function run(command, args) {
	const result = spawnSync(command, args, { encoding: 'utf8' })
	assert.equal(result.status, 0, result.stderr || result.stdout)
}

try {
	run('pnpm', ['pack', '--pack-destination', temporary])
	const tarball = readdirSync(temporary).find((file) => file.endsWith('.tgz'))
	mkdirSync(join(temporary, 'unpacked'))
	run('tar', ['-xzf', join(temporary, tarball), '-C', join(temporary, 'unpacked')])
	const root = join(temporary, 'unpacked/package')
	const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	assert.equal(manifest.exports['.'].default, './src/index.ts')
	assert.match(readFileSync(join(root, manifest.exports['.'].types), 'utf8'), /cx/)
	const typeFixture = join(root, 'component-props.check.ts')
	writeFileSync(
		typeFixture,
		`
import { pickAccessibilityProps, pickLayoutChildProps } from './types/generated/index.js'
const accessibility = pickAccessibilityProps({ accessibilityRole: 'heading' as const, id: 'ignored' })
const role: 'heading' = accessibility.accessibilityRole
const layout = pickLayoutChildProps({ row: 0 as const, style: { color: 'red' } })
const row: 0 = layout.row
const indexedProps: { [name: string]: unknown; row: number } = { row: 2 }
const indexedRow: number = pickLayoutChildProps(indexedProps).row
// Narrow inputs remain assignable to a component's optional prop contract.
const forwardedAccessibility: { accessibilityRole?: 'heading'; accessible?: boolean } = accessibility
const forwardedLayout: { row?: number; dock?: 'left' | 'right' } = layout
// @ts-expect-error unrelated props are excluded
accessibility.id
// @ts-expect-error style merging belongs to the host
layout.style
void [role, row, indexedRow, forwardedAccessibility, forwardedLayout]
`,
	)

	run('pnpm', [
		'exec',
		'tsc',
		'--noEmit',
		'--module',
		'NodeNext',
		'--target',
		'ES2020',
		typeFixture,
	])

	const {
		cx,
		pickAccessibilityProps,
		equalAccessibilityProps,
		pickLayoutChildProps,
		equalLayoutChildProps,
	} = await loadSource(pathToFileURL(join(root, manifest.exports['.'].default)))

	assert.equal(cx('host', [false, ['active']]), 'host active')
	assert.equal(
		equalAccessibilityProps(pickAccessibilityProps({ accessible: false }), { accessible: false }),
		true,
	)

	assert.equal(equalLayoutChildProps(pickLayoutChildProps({ row: 0 }), { row: 0 }), true)
	// Node tooling must load emitted JavaScript, without TS stripping in node_modules.
	const routingEntry = manifest.exports['./route-pattern']
	assert.equal(routingEntry.default, './dist/route-pattern.js')
	const { routePatternPath, parseRouteLocation } = await import(
		pathToFileURL(join(root, routingEntry.default)).href
	)

	assert.equal(routePatternPath('items/[id]'), '/items/:id')
	assert.deepEqual(parseRouteLocation('/?tag=a&tag=b').search, { tag: ['a', 'b'] })
	console.log('lib packed consumer: published source and declarations pass')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
