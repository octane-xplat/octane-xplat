import assert from 'node:assert/strict'
import { SourceMap } from 'node:module'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

// Explicit local artifact check; performs no upload and opens no browser.
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fixture = await mkdtemp(join(root, '.reporting-artifacts-'))
try {
	const entry = join(fixture, 'entry.ts')
	await writeFile(
		entry,
		"export { startReporting, stopReporting, reportDeliveryCheck } from '../examples/reporting.web.ts'\n",
	)
	const output = join(fixture, 'dist')
	await build({
		configFile: false,
		root: fixture,
		logLevel: 'error',
		build: {
			outDir: output,
			sourcemap: 'hidden',
			minify: true,
			lib: { entry, name: 'ReportingGuide', formats: ['iife'], fileName: () => 'reporting.js' },
		},
	})
	const injected = spawnSync('pnpm', ['exec', 'sentry-cli', 'sourcemaps', 'inject', output], {
		cwd: root,
		encoding: 'utf8',
	})
	assert.equal(injected.status, 0, injected.stderr)
	const script = await readFile(join(output, 'reporting.js'), 'utf8')
	const map = JSON.parse(await readFile(join(output, 'reporting.js.map'), 'utf8'))
	assert.ok(map.debugId)
	assert.ok(script.includes(map.debugId))
	assert.ok(map.sources.some((source) => source.includes('reporting.web.ts')))
	assert.ok(map.sourcesContent.some((source) => source?.includes('Xplat reporting check')))
	const marker = script.indexOf('Xplat reporting check')
	assert.ok(marker >= 0)
	const before = script.slice(0, marker).split('\n')
	const original = new SourceMap(map).findEntry(before.length - 1, before.at(-1).length)
	assert.ok(original.originalSource.endsWith('reporting.web.ts'))
	const sourceIndex = map.sources.findIndex((source) => source.endsWith('reporting.web.ts'))
	assert.ok(
		map.sourcesContent[sourceIndex]
			.split('\n')
			[original.originalLine].includes('Xplat reporting check'),
	)
	const help = spawnSync('pnpm', ['exec', 'sentry-cli', 'sourcemaps', 'upload', '--help'], {
		cwd: root,
		encoding: 'utf8',
	})
	assert.equal(help.status, 0, help.stderr)
	assert.ok(help.stdout.includes('--release') && help.stdout.includes('--dist'))
	console.log(
		`Built browser reporting example and matched Debug ID ${map.debugId}; maps retain original TS. No upload or runtime delivery executed.`,
	)
	assert.equal((await readdir(output)).length >= 2, true)
} finally {
	await rm(fixture, { recursive: true, force: true })
}
