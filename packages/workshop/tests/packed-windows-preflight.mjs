/** Packed Node CLI seam only. This never launches or qualifies WinUI. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'workshop-packed-windows-')))
const consumer = join(work, 'consumer')
const packs = join(work, 'packs')
mkdirSync(consumer)
mkdirSync(packs)

function run(args, cwd = consumer) {
	const result = spawnSync('bun', args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
		shell: process.platform === 'win32',
	})
	assert.equal(
		result.status,
		0,
		`bun ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`,
	)

	return result.stdout
}

try {
	const tarballs = {}
	for (const dir of ['create', 'cli', 'lib', 'ui', 'workshop']) {
		const root = join(repo, 'packages', dir)
		const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
		run(['pm', 'pack', '--ignore-scripts', '--destination', packs], root)
		tarballs[manifest.name] =
			`file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
	}

	writeFileSync(
		join(consumer, 'package.json'),
		JSON.stringify({
			name: 'packed-windows-setup',
			private: true,
			type: 'module',
			devDependencies: {
				'@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
				'@octane-xplat/cli': tarballs['@octane-xplat/cli'],
				'@octanejs/vite-plugin': '0.1.61',
				vite: '8.3.0',
				octane: '0.14.0',
			},
		}),
	)

	const file = join(consumer, 'package.json')
	const manifest = JSON.parse(readFileSync(file, 'utf8'))
	manifest.overrides = tarballs
	manifest.packageManager = 'bun@1.4.4'
	writeFileSync(file, JSON.stringify(manifest))

	run(['install', '--ignore-scripts'])
	const require = createRequire(join(consumer, 'package.json'))
	assert.ok(realpathSync(require.resolve('@octane-xplat/workshop/node')).startsWith(work))
	const reportText = run(['run', 'xplat', 'workshop', 'doctor', '--json'])
	const report = JSON.parse(reportText.slice(reportText.indexOf('{')))
	assert.equal(report.targets.windows.executionHost.current, process.platform)
	assert.equal(report.targets.windows.qualification, 'unverified')
	assert.notEqual(report.targets.windows.status, 'available')

	// Both imports and evaluation would fail. Discovery must read metadata only.
	const story = (id, target) => `import { defineStory } from '@octane-xplat/workshop'
import 'nonexistent-native-leaf'
throw new Error('must never evaluate')
export const Basic = defineStory({ id: '${id}', title: 'Examples / ${id}', targets: ['${target}'], component: Component, args: {} })`

	writeFileSync(join(consumer, 'native.stories.windows.tsrx'), story('native/basic', 'windows'))
	writeFileSync(join(consumer, 'browser.stories.web.tsrx'), story('browser/basic', 'web'))
	const listText = run(['run', 'xplat', 'workshop', 'list', '--target', 'windows', '--json'])
	const list = JSON.parse(listText.slice(listText.indexOf('{')))
	assert.equal(list.diagnostics.length, 0)
	assert.equal(list.entries.find((entry) => entry.id === 'native/basic').applicable, true)
	assert.equal(list.entries.find((entry) => entry.id === 'browser/basic').applicable, false)

	writeFileSync(
		join(consumer, 'workshop.config.mjs'),
		'throw new Error("unexpected config evaluation")',
	)

	const blocked = spawnSync('bun', ['run', 'xplat', 'workshop', 'dev', '--target', 'windows'], {
		shell: process.platform === 'win32',
		cwd: consumer,
		encoding: 'utf8',
		timeout: 15000,
	})

	assert.notEqual(blocked.status, 0)
	assert.equal(blocked.error, undefined)
	assert.match(
		blocked.stdout + blocked.stderr,
		process.platform === 'win32' ? /launch is blocked/ : /real Windows host/,
	)

	assert.doesNotMatch(
		blocked.stdout + blocked.stderr,
		/unexpected config evaluation|WORKSHOP_READY/,
	)

	console.log(
		'PASS packed external Node CLI: Windows prerequisite status, static target filtering, blocked launch before config evaluation; no WinUI runtime qualification',
	)
} finally {
	rmSync(work, { recursive: true, force: true })
}
