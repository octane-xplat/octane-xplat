// Maintained release-lifecycle regression. Run under the repository target lock:
// node scripts/with-target-lock.mjs ios -- node packages/updates/tests/native-lifecycle.mjs --target ios --device UDID
// node scripts/with-target-lock.mjs android -- node packages/updates/tests/native-lifecycle.mjs --target android --device SERIAL
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { zipSync } from 'fflate/browser'
import { prepare, filesUnder } from '../../../scripts/probe/project.mjs'
import { command } from '../../../scripts/probe/process.mjs'
import { initializeUpdates } from '../../cli/src/commands/updates.mjs'

const { values } = parseArgs({
	options: { target: { type: 'string' }, device: { type: 'string' } },
})

const { target, device } = values
assert.ok(['ios', 'android'].includes(target) && device, 'Pass --target ios|android --device ID')
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const driver = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/driver.mobile.ts')
const events = []
const manifests = {}
const payloads = new Map()
let serverError
let serveVersion = '2.0.0'
const server = createServer(async (request, response) => {
	try {
		const url = new URL(request.url, 'http://localhost')
		if (url.pathname === '/manifest') {
			response.setHeader('content-type', 'application/json')
			response.end(
				JSON.stringify({
					...manifests[serveVersion],
					updateAvailable: true,
					platform: target,
					channel: 'stable',
				}),
			)
		} else if (url.pathname.startsWith('/bundles/')) {
			const bytes = payloads.get(url.pathname.split('/').at(-1))
			assert.ok(bytes)
			response.end(bytes)
		} else if (url.pathname === '/event') {
			const event = JSON.parse(url.searchParams.get('body'))
			events.push(event)
			if (event.name === 'healthy-v2') {
				serveVersion = '3.0.0'
			}

			console.log(JSON.stringify(event))
			response.end('ok')
		} else {
			response.writeHead(404)
			response.end()
		}
	} catch (error) {
		serverError = error
		response.writeHead(500)
		response.end('fixture failure')
	}
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const resources = join(repo, 'research/updates-lifecycle-resources', target)
await mkdir(resources, { recursive: true })
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })
await writeFile(
	join(resources, 'Android/src/main/res/xml/network_security_config.xml'),
	`<?xml version="1.0" encoding="utf-8"?><network-security-config><domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">127.0.0.1</domain></domain-config></network-security-config>`,
)

const project = await prepare(target, driver, ['@octane-xplat/updates'], resources)
await initializeUpdates(project.root)
await writeFile(
	join(project.root, 'src/index.ts'),
	`import { start } from ${JSON.stringify(driver)}\nstart(${port})\n`,
)

const badSentinel = `${project.appId}:${port}:bad-boot`
console.log(JSON.stringify({ target, device, project: project.root, appId: project.appId }))
const env = { ...process.env }
if (target === 'android') {
	env.JAVA_HOME = (await command('/usr/libexec/java_home', ['-v', '21'])).stdout.trim()
}

const adb = (args, allowFailure = false) =>
	command('adb', ['-s', device, ...args], { env, allowFailure })

const sim = (args, allowFailure = false) => command('xcrun', ['simctl', ...args], { allowFailure })
const wait = async (condition, label) => {
	const deadline = Date.now() + 30000
	while (Date.now() < deadline) {
		if (serverError) {
			throw serverError
		}

		const failed = events.find((event) => event.name === 'failed')
		if (failed) {
			throw new Error(JSON.stringify(failed))
		}

		if (await condition()) {
			return
		}

		await new Promise((resolve) => setTimeout(resolve, 150))
	}

	throw new Error('Timed out: ' + label)
}

const waitEvent = (name) => wait(() => events.some((event) => event.name === name), name)
const launch = async () => {
	if (target === 'ios') {
		await sim(['launch', device, project.appId])
	} else {
		await adb(['shell', 'am', 'start', '-n', `${project.appId}/com.tns.NativeScriptActivity`])
	}
}

const stop = async () => {
	if (target === 'ios') {
		await sim(['terminate', device, project.appId], true)
	} else {
		await adb(['shell', 'am', 'force-stop', project.appId])
	}
}

const ownershipFile = join(project.root, 'ota-test-owner.json')
let installed = false,
	reverse = false

try {
	// Android needs no signing service: the fixture uses the local debug key with
	// a release build. It stays release/non-debuggable and carries production JS.
	const releaseArgs =
		target === 'android'
			? [
					'--key-store-path',
					join(process.env.HOME, '.android/debug.keystore'),
					'--key-store-password',
					'android',
					'--key-store-alias',
					'androiddebugkey',
					'--key-store-alias-password',
					'android',
				]
			: ['--for-device', 'false']

	const build = await command(
		'ns',
		['build', target, '--path', project.root, '--release', '--no-hmr', ...releaseArgs],
		{ cwd: '/tmp', env, timeout: 300000 },
	)

	await writeFile(join(project.root, 'release-build.log'), build.stdout + build.stderr)
	const iosDirectory = join(project.root, 'platforms/ios')
	const iosProject =
		target === 'ios'
			? (await readdir(iosDirectory, { withFileTypes: true })).find(
					(entry) =>
						entry.isDirectory() &&
						entry.name !== 'build' &&
						entry.name !== 'internal' &&
						entry.name !== 'Pods' &&
						!entry.name.endsWith('.xcodeproj') &&
						!entry.name.endsWith('.xcworkspace'),
				)?.name
			: null

	const assets =
		target === 'ios'
			? join(iosDirectory, iosProject, 'app')
			: join(project.root, 'platforms/android/app/src/main/assets/app')

	const files = {}
	for (const file of await filesUnder(assets)) {
		files[file.slice(assets.length + 1)] = new Uint8Array(await readFile(file))
	}

	assert.ok(files['bundle.mjs'] && files['package.json'], 'Expected Vite production app/ output')
	for (const [version, prefix] of [
		['2.0.0', 'globalThis.__otaTestVersion = 2;\n'],
		[
			'3.0.0',
			target === 'ios'
				? `NSLog(${JSON.stringify(badSentinel)}); throw new Error('Intentional OTA startup failure');\n`
				: `android.util.Log.e('XplatOTATest', ${JSON.stringify(badSentinel)}); throw new Error('Intentional OTA startup failure');\n`,
		],
	]) {
		const entry = new TextEncoder().encode(prefix + new TextDecoder().decode(files['bundle.mjs']))
		const bytes = zipSync({ ...files, 'bundle.mjs': entry })
		const sha256 = createHash('sha256').update(bytes).digest('hex')
		payloads.set(sha256, bytes)
		manifests[version] = {
			version,
			sha256,
			size: bytes.length,
			minNativeVersion: '1.0.0',
			url: `https://ota.test/bundles/${sha256}`,
		}
	}

	const artifactDirectory =
		target === 'ios'
			? join(project.root, 'platforms/ios/build/Release-iphonesimulator')
			: join(project.root, 'platforms/android/app/build/outputs/apk/release')

	const artifact = join(
		artifactDirectory,
		(await readdir(artifactDirectory)).find((name) =>
			target === 'ios' ? name.endsWith('.app') : name.endsWith('.apk'),
		),
	)

	if (target === 'ios') {
		try {
			const owner = JSON.parse(await readFile(ownershipFile, 'utf8'))
			if (owner.appId === project.appId && owner.device === device) {
				await sim(['uninstall', device, project.appId], true)
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}

		await sim(['install', device, artifact])
	} else {
		// Never reinstall or clear an unrelated app. Each fixture uses its own hash ID.
		const existing = await adb(['shell', 'pm', 'path', project.appId], true)
		if (existing.stdout.trim()) {
			const owner = JSON.parse(await readFile(ownershipFile, 'utf8'))
			assert.ok(
				owner.appId === project.appId && owner.device === device,
				'Refuse to reset an app not owned by this test',
			)

			await adb(['uninstall', project.appId])
		}

		await adb(['install', artifact])
		await adb(['reverse', `tcp:${port}`, `tcp:${port}`])
		reverse = true
	}

	installed = true
	await writeFile(ownershipFile, JSON.stringify({ appId: project.appId, device }))
	await launch()
	await waitEvent('staged-good')
	await stop()
	await launch()
	await waitEvent('staged-bad')
	await stop()
	await launch()
	if (target === 'ios') {
		await wait(async () => {
			const container = (
				await sim(['get_app_container', device, project.appId, 'data'])
			).stdout.trim()

			try {
				const current = JSON.parse(
					await readFile(
						join(container, 'Library/Application Support/xplat-ota/current.json'),
						'utf8',
					),
				)

				return current.version === '3.0.0'
			} catch {
				return false
			}
		}, 'native bad-bundle activation')

		// Observe the throw from native logging rather than running downloaded recovery code.
		await wait(
			async () =>
				(
					await sim([
						'spawn',
						device,
						'log',
						'show',
						'--last',
						'1m',
						'--style',
						'compact',
						'--predicate',
						`eventMessage CONTAINS ${JSON.stringify(badSentinel)}`,
					])
				).stdout.includes(badSentinel),
			'bad bundle attempted startup',
		)
	} else {
		await wait(
			async () =>
				(await adb(['logcat', '-d', '-s', 'XplatOTATest:E'])).stdout.includes(badSentinel),
			'bad bundle attempted startup',
		)
	}

	await stop()
	await launch()
	await waitEvent('rollback-requested')
	await stop()
	await launch()
	await waitEvent('embedded-restored')
	const result = { target, device, artifact, appId: project.appId, events, status: 'passed' }
	await writeFile(join(project.root, 'ota-lifecycle-result.json'), JSON.stringify(result, null, 2))
	console.log(
		JSON.stringify({
			target,
			status: 'passed',
			result: join(project.root, 'ota-lifecycle-result.json'),
		}),
	)
} finally {
	if (installed) {
		await stop()
	}

	if (reverse) {
		await adb(['reverse', '--remove', `tcp:${port}`])
	}

	await new Promise((resolve) => server.close(resolve))
}
