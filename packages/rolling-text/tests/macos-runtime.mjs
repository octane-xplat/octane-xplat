import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatMacOS } from '../../cli/src/macos/vite.ts'
import { macOSExecutable } from '../../cli/src/macos/executables.ts'
import {
	buildMacOSNative,
	writeNativeBootstrap,
} from '../../cli/src/macos/native.ts'
import { hostBundle, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../apps/macos', import.meta.url))
const human = process.argv.includes('--human-reduced-motion')
const buildOnly = process.argv.includes('--build-only')
const runName = human ? 'runHumanReducedMotion' : 'runRollingText'
const fixture = human ? 'human-reduced-motion.macos.tsx' : 'qualification.macos.tsx'
const directory = await mkdtemp(join(tmpdir(), 'octane-rolling-text-'))
try {
	const entry = join(directory, 'entry.ts')
	await writeFile(
		entry,
		`import { ${runName} } from ${JSON.stringify(join(packageRoot, 'tests', fixture))}\nNSApplication.sharedApplication\nvoid ${runName}()\n`,
	)

	const config = await xplatMacOS('development', {
		root: appRoot,
		entry,
		outDir: directory,
		packaged: true,
	})

	await build({
		...config,
		configFile: false,
		logLevel: 'error',
		build: { ...config.build, emptyOutDir: false },
	})

	const bundle = join(directory, 'main.cjs')
	await validateHostBundle(bundle, appRoot)
	if (buildOnly) {
		console.log(
			'ROLLING_TEXT_BUILD_ONLY_OK ' + (human ? 'human' : 'automatic') + '; no host launched',
		)
	} else {
		const artifact = await buildMacOSNative(appRoot)
		const bootstrap = join(directory, 'bootstrap.js')
		await writeNativeBootstrap(artifact, bootstrap)
		const child = spawn(
			await macOSExecutable(appRoot, 'macos-arm64/host'),
			[
				join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
				bundle,
				artifact.metadata,
				bootstrap,
			],
			{
				cwd: directory,
				env: {
					...process.env,
					OCTANE_MACOS_AUTOMATION: '1',
				},
			},
		)

		let output = ''
		for (const stream of [child.stdout, child.stderr]) {
			stream.on('data', (chunk) => {
				output += chunk.toString()
				process.stdout.write(chunk)
			})
		}

		const stop = () => child.kill('SIGTERM')
		process.on('SIGINT', stop)
		process.on('SIGTERM', stop)
		const timer = setTimeout(stop, human ? 540000 : 15000)
		try {
			const status = await new Promise((resolve, reject) => {
				child.once('error', reject)
				child.once('close', resolve)
			})

			assert.equal(status, 0, output)
			assert.doesNotMatch(output, /ROLLING_TEXT_(?:HUMAN_)?FAIL|uncaught render error/)
			assert.match(output, human ? /ROLLING_TEXT_HUMAN_OK/ : /ROLLING_TEXT_OK/)
		} finally {
			clearTimeout(timer)
			process.off('SIGINT', stop)
			process.off('SIGTERM', stop)
			if (human) {
				console.log(
					'Restore the exact Reduce Motion setting logged in ROLLING_TEXT_HUMAN_BASELINE, including after failure or interruption.',
				)
			}
		}
	}
} finally {
	await rm(directory, { recursive: true, force: true })
}
