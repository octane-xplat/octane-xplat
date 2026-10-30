// Maintained release-lifecycle regression. Run under the repository target lock:
// node scripts/with-target-lock.ts ios -- node packages/updates/tests/native-lifecycle.mjs --target ios --device UDID
// node scripts/with-target-lock.ts android -- node packages/updates/tests/native-lifecycle.mjs --target android --device SERIAL
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { cp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { zipSync } from 'fflate/browser'
import { createFingerprintAsync } from '@octane-xplat/fingerprint'
import { initializeUpdates } from '../../cli/src/commands/updates.ts'

const { values } = parseArgs({
	options: {
		target: { type: 'string' },
		device: { type: 'string' },
		'reuse-build': { type: 'boolean', default: false },
		'refresh-js': { type: 'boolean', default: false },
	},
})

const { target, device } = values
assert.ok(['ios', 'android'].includes(target) && device, 'Pass --target ios|android --device ID')
assert.ok(
	!values['refresh-js'] || (target === 'ios' && values['reuse-build']),
	'Refreshing JS requires an existing unsigned iOS simulator build',
)
const repo =
	process.env.XPLAT_NATIVE_TEST_REPO ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const { prepare, filesUnder, dependencies } = await import(
	pathToFileURL(join(repo, 'scripts/probe/project.ts')).href
)
const { command } = await import(pathToFileURL(join(repo, 'scripts/probe/process.ts')).href)
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

const resources = join(repo, 'research/updates-lifecycle-resources', target)
await mkdir(resources, { recursive: true })
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })
await writeFile(
	join(resources, 'Android/src/main/res/xml/network_security_config.xml'),
	`<?xml version="1.0" encoding="utf-8"?><network-security-config><domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">127.0.0.1</domain></domain-config></network-security-config>`,
)

const selected = await dependencies(target, driver, ['@octane-xplat/updates'])
const project = await prepare(target, driver, ['@octane-xplat/updates'], resources)
const fixtureBuildFile = join(project.root, 'ota-test-build.json')
const fixtureBuild = values['reuse-build']
	? JSON.parse(await readFile(fixtureBuildFile, 'utf8'))
	: { port: 0 }
assert.ok(
	Number.isInteger(fixtureBuild.port) && fixtureBuild.port >= 0 && fixtureBuild.port <= 65535,
)
await new Promise((resolve, reject) => {
	server.once('error', reject)
	server.listen(fixtureBuild.port, '127.0.0.1', resolve)
})
const port = server.address().port
// Reuse the maintained probe runtime and its installed native engines.
// The probe runner links installed packages rather than producing a lockfile;
// ask Bun to resolve that exact source graph without replacing those links.
const projectPackage = JSON.parse(await readFile(join(project.root, 'package.json'), 'utf8'))
const buildToolRoot = resolve(
	dirname(createRequire(import.meta.url).resolve('@octane-xplat/fingerprint')),
	'..',
)
selected.resolved.set('@octane-xplat/fingerprint', buildToolRoot)
projectPackage.devDependencies['@octane-xplat/fingerprint'] = JSON.parse(
	await readFile(join(buildToolRoot, 'package.json'), 'utf8'),
).version
const overrides = Object.fromEntries(
	[...selected.resolved].map(([name, path]) => [name, 'file:' + path]),
)
// Directory dependencies may contain development edges of directory dependencies while making
// the lockfile. Resolve their workspace references from this checkout too.
for (const entry of await readdir(join(repo, 'packages'), { withFileTypes: true })) {
	const directory = join(repo, 'packages', entry.name)
	if (!entry.isDirectory()) {
		continue
	}
	let manifest
	try {
		manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
	} catch (error) {
		if (error.code === 'ENOENT') {
			continue
		}
		throw error
	}
	if (manifest.name && !Object.hasOwn(overrides, manifest.name)) {
		overrides[manifest.name] = 'file:' + directory
	}
}
await mkdir(join(project.root, 'node_modules/@octane-xplat'), { recursive: true })
try {
	await symlink(
		await realpath(buildToolRoot),
		join(project.root, 'node_modules/@octane-xplat/fingerprint'),
		'dir',
	)
} catch (error) {
	if (error.code !== 'EEXIST') {
		throw error
	}
}
const repoPackage = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
const catalog = repoPackage.workspaces.catalog
for (const [name, version] of Object.entries(catalog)) {
	if (!Object.hasOwn(overrides, name)) {
		overrides[name] = version
	}
}
projectPackage.packageManager = 'bun@1.4.4'
projectPackage.workspaces = { packages: [], catalog }
projectPackage.overrides = overrides
await writeFile(join(project.root, 'package.json'), JSON.stringify(projectPackage, null, 2))
await command('bun', ['install', '--lockfile-only', '--ignore-scripts'], {
	cwd: project.root,
	timeout: 120000,
})
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
let changedNativeSource

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

	if (!values['reuse-build']) {
		const build = await command(
			'ns',
			['build', target, '--path', project.root, '--release', '--no-hmr', ...releaseArgs],
			{ cwd: '/tmp', env, timeout: 300000 },
		)

		await writeFile(join(project.root, 'release-build.log'), build.stdout + build.stderr)
		await writeFile(fixtureBuildFile, JSON.stringify({ port }))
	} else if (values['refresh-js']) {
		const prepared = await command(
			'ns',
			['prepare', target, '--path', project.root, '--release', '--no-hmr', ...releaseArgs],
			{ cwd: '/tmp', env, timeout: 300000 },
		)
		await writeFile(join(project.root, 'release-prepare.log'), prepared.stdout + prepared.stderr)
	}
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

	const buildMetadata = JSON.parse(await readFile(join(assets, 'xplat-native.json'), 'utf8'))
	const buildRecord = JSON.parse(
		await readFile(join(project.root, '.xplat/fingerprints', target + '.json'), 'utf8'),
	)
	assert.equal(
		(
			await createFingerprintAsync(project.root, {
				platforms: [target],
				toolchain: buildRecord.toolchain,
			})
		).hash,
		buildMetadata.hash,
	)
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
			nativeFingerprint: buildMetadata.hash,
			url: `https://ota.test/bundles/${sha256}`,
		}
	}

	const artifactDirectory =
		target === 'ios'
			? join(project.root, 'platforms/ios/build/Release-iphonesimulator')
			: join(project.root, 'platforms/android/app/build/outputs/apk/release')

	let artifact = join(
		artifactDirectory,
		(await readdir(artifactDirectory)).find((name) =>
			target === 'ios' ? name.endsWith('.app') : name.endsWith('.apk'),
		),
	)

	if (target === 'ios') {
		await sim(['boot', device], true)
		await sim(['bootstatus', device, '-b'])
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

		const bundledMetadata = JSON.parse(
			await readFile(join(artifact, 'app/xplat-native.json'), 'utf8'),
		)
		assert.deepEqual(
			bundledMetadata,
			buildMetadata,
			'installed artifact must match the prepared payload',
		)
		if (values['refresh-js']) {
			// Reuse the exact native executable only after proving its baked input
			// identity still matches. Replace resources in a task-owned copy.
			const copy = join(project.root, 'ota-refreshed-release.app')
			await cp(artifact, copy, { recursive: true })
			await cp(assets, join(copy, 'app'), { recursive: true })
			artifact = copy
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
	if (target === 'ios') {
		await stop()
		const changed = join(project.root, 'App_Resources/iOS/fingerprint-change.swift')
		await writeFile(changed, '// A native source added after the installed binary was built.\n', {
			flag: 'wx',
		})
		changedNativeSource = changed
		const incompatible = await createFingerprintAsync(project.root, {
			platforms: [target],
			toolchain: buildRecord.toolchain,
		})
		assert.notEqual(incompatible.hash, buildMetadata.hash)
		const container = (
			await sim(['get_app_container', device, project.appId, 'data'])
		).stdout.trim()
		const ota = join(container, 'Library/Application Support/xplat-ota')
		const next = join(ota, 'next/app')
		await mkdir(next, { recursive: true })
		for (const [name, bytes] of Object.entries(files)) {
			await mkdir(dirname(join(next, name)), { recursive: true })
			await writeFile(join(next, name), bytes)
		}
		await writeFile(
			join(next, 'xplat-native.json'),
			JSON.stringify({ ...buildMetadata, hash: incompatible.hash }),
		)
		await writeFile(
			join(next, 'bundle.mjs'),
			"throw new Error('Incompatible native payload must never execute');\n",
		)
		const incompatibleSHA = '4'.repeat(64)
		await writeFile(
			join(ota, 'next/release.json'),
			JSON.stringify({
				version: '4.0.0',
				nativeFingerprint: incompatible.hash,
				sha256: incompatibleSHA,
				size: 1,
				url: 'https://ota.test/bundles/' + incompatibleSHA,
			}),
		)
		const checkpoint = events.length
		await writeFile(join(container, 'Documents/ota-test-phase.txt'), 'awaiting-embedded')
		await launch()
		await wait(
			() =>
				events
					.slice(checkpoint)
					.some((event) => event.name === 'embedded-restored' && event.marker === 1),
			'incompatible native payload rejected before JavaScript',
		)
		assert.equal((await readFile(join(ota, 'rejected.txt'), 'utf8')).trim(), incompatibleSHA)
		assert.equal((await readdir(ota)).includes('next'), false)
	}
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
	if (changedNativeSource) {
		await rm(changedNativeSource)
	}
	if (installed) {
		await stop()
	}

	if (reverse) {
		await adb(['reverse', '--remove', `tcp:${port}`])
	}

	await new Promise((resolve) => server.close(resolve))
}
