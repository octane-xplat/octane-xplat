// Headless browser qualification only; device/OS lifecycle qualification is deferred.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (process.argv.length > 2) {
	throw new Error('This task runs headless web only and accepts no target overrides')
}

const result = spawnSync(
	process.execPath,
	[
		fileURLToPath(new URL('./probe.ts', import.meta.url)),
		'run',
		'examples/probes/query-cache.tsrx',
		'--target',
		'web',
		'--timeout',
		'30000',
	],
	{ cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit' },
)

if (result.error) {
	throw result.error
}

process.exitCode = result.status ?? 1
