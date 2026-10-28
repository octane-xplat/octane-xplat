import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { command, ownedProcess } from '../../../scripts/probe/process.ts'
import { directory, filesUnder, importFrom, prepare, repo } from '../../../scripts/probe/project.ts'
import nativeCaseConfig from '../../../scripts/probe/native-case.config.ts'
import { argumentsFor } from '../../../scripts/probe.ts'
import { acquireCaseLock } from '../../../scripts/probe/lock.ts'
import { runTarget } from '../../../scripts/probe/runner.ts'

const { values } = parseArgs({ options: { 'build-only': { type: 'boolean', default: false } } })
const fixture = fileURLToPath(new URL('./fixtures/transactions.android.ts', import.meta.url))

if (values['build-only']) {
	// No doctor/device selection, install, launch, or AVD provisioning in this mode.
	const project = await prepare('android', fixture, ['@octane-xplat/sqlite'])
	await writeFile(
		join(project.root, 'src/case.ts'),
		[
			`import * as probe from ${JSON.stringify(fixture)}`,
			`import { executeCase } from ${JSON.stringify(join(directory, 'runtime.ts'))}`,
			`import { mobileAdapter } from ${JSON.stringify(join(directory, 'mobile.mobile.ts'))}`,
			`import '@octane-xplat/ui/theme/tokens.css'`,
			'export async function start(options, emit) { return executeCase(probe, mobileAdapter(), options, emit) }',
		].join('\n'),
	)

	const { build } = await importFrom(project.root, 'vite')
	await build({ ...(await nativeCaseConfig(project.root, 'android')), configFile: false })
	const nativeRoot = project.deps.resolved.get('nativescript')
	const manifest = JSON.parse(await readFile(join(nativeRoot, 'package.json'), 'utf8'))
	const environment = { ...process.env }
	if (process.platform === 'darwin') {
		environment.JAVA_HOME = (await command('/usr/libexec/java_home', ['-v', '21'])).stdout.trim()
	}

	const built = ownedProcess(
		'python3',
		[
			join(repo, 'scripts/with-native-target-lock.py'),
			'android',
			process.execPath,
			join(nativeRoot, manifest.bin.ns),
			'build',
			'android',
			'--path',
			project.root,
			'--no-hmr',
		],
		{ cwd: '/tmp', env: environment },
	)

	built.child.stdout.on('data', (chunk) => process.stdout.write(chunk))
	built.child.stderr.on('data', (chunk) => process.stderr.write(chunk))
	let stopping
	let interrupted = false
	let timedOut = false
	const stop = () => (stopping ??= built.stop())
	const interrupt = () => {
		interrupted = true
		void stop()
	}

	process.once('SIGINT', interrupt)
	process.once('SIGTERM', interrupt)
	const timer = setTimeout(() => {
		timedOut = true
		void stop()
	}, 600000)

	try {
		await built.closed
		assert.equal(timedOut, false, 'Android build timed out')
		assert.equal(interrupted, false, 'Android build interrupted')
		assert.equal(built.child.exitCode, 0, built.failure?.message)
	} finally {
		clearTimeout(timer)
		// Stop the entire owned group, including helpers that outlive the
		// Python wrapper, and await cleanup before returning to the caller.
		await stop()
		await built.closed
		process.off('SIGINT', interrupt)
		process.off('SIGTERM', interrupt)
	}

	const apks = (
		await filesUnder(join(project.root, 'platforms/android/app/build/outputs/apk/debug'))
	).filter((path) => path.endsWith('.apk'))

	assert.equal(apks.length, 1, 'expected one isolated Android debug APK')
	console.log(
		JSON.stringify(
			{
				evidence: 'build-only',
				target: 'android',
				runtimeVerified: false,
				appId: project.appId,
				project: project.root,
				caseBundle: join(project.root, 'case-dist/case.cjs'),
				apk: apks[0],
			},
			null,
			2,
		),
	)
} else {
	const device = process.env.XPLAT_SQLITE_ANDROID_DEVICE?.trim()
	assert.ok(
		device && !device.startsWith('-') && !/\s/.test(device),
		'Set XPLAT_SQLITE_ANDROID_DEVICE to an explicitly owned, booted Android device; this task never boots or selects one',
	)

	const ready = await command('adb', ['-s', device, 'shell', 'getprop', 'sys.boot_completed'])
	assert.equal(ready.stdout.trim(), '1', 'the selected Android host has not finished booting')
	// Caller owns the full host reservation. The existing runner owns its
	// case/target locks, unique app identity, reverse mapping and force-stop.
	const args = argumentsFor([
		'run',
		fixture,
		'--target',
		'android',
		'--device',
		device,
		'--deps',
		'@octane-xplat/sqlite',
		'--timeout',
		'30000',
		'--startup-timeout',
		'600000',
		'--verbose',
	])

	const abort = new AbortController()
	// The shared runner awaits doctor/prepare before registering its abort
	// listener. Guard subsequent option reads so cancellation cannot launch a host.
	const guardedArgs = new Proxy(args, {
		get(target, key, receiver) {
			abort.signal.throwIfAborted()
			return Reflect.get(target, key, receiver)
		},
	})

	const interrupt = () => abort.abort()
	const results = []
	const release = await acquireCaseLock('android', fixture)
	process.once('SIGINT', interrupt)
	process.once('SIGTERM', interrupt)
	try {
		await runTarget('android', guardedArgs, (result) => results.push(result), abort.signal)
	} catch (error) {
		results.push({
			target: 'android',
			device,
			case: fixture,
			status: error.unavailable ? 'unavailable' : 'fail',
			assertions: [],
			measurements: {},
			errors: [{ message: error.message }],
		})
	} finally {
		// runTarget awaits launcher/app/reverse-map cleanup before resolving;
		// keep the case lock held until that cleanup has finished.
		await release()
		process.off('SIGINT', interrupt)
		process.off('SIGTERM', interrupt)
	}

	console.log(JSON.stringify({ schema: 1, results }, null, 2))
	assert.equal(abort.signal.aborted, false, 'Android runtime probe interrupted')
	assert.equal(results.length, 1, 'expected exactly one Android runtime result')
	const outcome = results[0]
	assert.equal(outcome.target, 'android')
	assert.equal(outcome.device, device)
	assert.equal(outcome.case, fixture)
	assert.equal(outcome.status, 'pass')
	assert.ok(
		outcome.assertions.some(
			(entry) =>
				entry.name === 'default-threading transaction persists its insert' && entry.pass === true,
		),
		'fixture must reach the committed-row assertion; an empty probe is not a pass',
	)
}
