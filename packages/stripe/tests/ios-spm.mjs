import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, stat, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
	options: {
		build: { type: 'boolean', default: false },
		runtime: { type: 'boolean', default: false },
	},
})

assert.equal(process.platform, 'darwin', 'Run iOS dependency checks on skymac.local')
const repo = process.env.XPLAT_NATIVE_TEST_REPO
const archive = process.env.XPLAT_STRIPE_CONSUMER_ARCHIVE
assert.ok(repo && archive, 'Select the Apple test checkout and locally packed Stripe archive')
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const consumer = join(packageRoot, 'tests/.runtime/packed-spm-consumer')
const installed = join(consumer, 'node_modules/@octane-xplat/stripe')
await mkdir(installed, { recursive: true })
function command(executable, args, cwd, log, timeout = 300000) {
	const result = spawnSync(executable, args, {
		cwd,
		detached: true,
		encoding: 'utf8',
		timeout,
		maxBuffer: 16 * 1024 * 1024,
	})
	if (result.error && result.pid > 0) {
		// A timed-out NativeScript parent can otherwise leave its resolver running.
		try {
			process.kill(-result.pid, 'SIGTERM')
		} catch {}
	}
	if (log) {
		return writeFile(log, (result.stdout ?? '') + (result.stderr ?? '')).then(() => {
			assert.equal(result.status, 0, `See ${log}; ${result.error?.message ?? 'command failed'}`)
			return result
		})
	}
	assert.equal(result.status, 0, (result.stdout ?? '') + (result.stderr ?? ''))
	return result
}
command('tar', ['-xzf', archive, '--strip-components=1', '-C', installed], '/tmp')
const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'))
assert.equal(manifest.name, '@octane-xplat/stripe')
const resolveFrom = createRequire(join(packageRoot, 'package.json'))
for (const name of Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })) {
	let resolved
	try {
		resolved = dirname(resolveFrom.resolve(name + '/package.json'))
	} catch {
		resolved = dirname(resolveFrom.resolve(name))
		while (
			!existsSync(join(resolved, 'package.json')) ||
			JSON.parse(readFileSync(join(resolved, 'package.json'), 'utf8')).name !== name
		) {
			assert.notEqual(dirname(resolved), resolved, `Cannot locate dependency ${name}`)
			resolved = dirname(resolved)
		}
	}
	const destination = join(consumer, 'node_modules', name)
	await mkdir(dirname(destination), { recursive: true })
	try {
		await symlink(resolved, destination, 'dir')
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}
	}
}
const entry = join(consumer, 'entry.ts')
await writeFile(
	entry,
	values.runtime
		? await readFile(join(packageRoot, 'tests/spm-runtime.ios.ts'), 'utf8')
		: 'export {}\n',
)
const resources = join(consumer, 'App_Resources')
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })
// Include the entire packed native input in the probe's resource identity.
// Old probe hosts do not hash a plugin's root nativescript.config.ts themselves.
const archiveHash = createHash('sha256')
	.update(await readFile(archive))
	.digest('hex')
await writeFile(
	join(resources, 'iOS/build.xcconfig'),
	`IPHONEOS_DEPLOYMENT_TARGET = 15.0\n// Packed Stripe archive: ${archiveHash}\n`,
)
const { prepare } = await import(pathToFileURL(join(repo, 'scripts/probe/project.ts')).href)
const project = await prepare('ios', entry, ['@octane-xplat/stripe'], resources)
await writeFile(
	join(project.root, 'src/index.ts'),
	values.runtime ? 'import ' + JSON.stringify(entry) + '\n' : 'export {}\n',
)
console.log(
	JSON.stringify({ phase: 'prepare-packed-plugin', project: project.root, sdkCompilation: false }),
)
await command(
	'ns',
	['prepare', 'ios', '--path', project.root, '--release', '--for-device', 'false', '--no-hmr'],
	'/tmp',
	join(consumer, 'native-prepare.log'),
)
const ios = join(project.root, 'platforms/ios')
const projects = (await readdir(ios)).filter((name) => name.endsWith('.xcodeproj'))
assert.equal(projects.length, 1)
const xcode = join(ios, projects[0])
const pbx = await readFile(join(xcode, 'project.pbxproj'), 'utf8')
assert.ok(
	pbx.includes('https://github.com/stripe/stripe-ios'),
	'NativeScript must consume the packed plugin SPM declaration',
)
assert.ok(pbx.includes('26.15.1'), 'SDK version must remain pinned')
for (const product of ['StripePaymentSheet', 'StripePayments']) {
	assert.ok(pbx.includes(product), `Missing SPM product ${product}`)
}
// NativeScript prepare already invokes xcodebuild -resolvePackageDependencies.
// Assert its actual lock instead of running resolution a second time.
const locks = [join(xcode, 'project.xcworkspace/xcshareddata/swiftpm/Package.resolved')]
for (const workspace of (await readdir(ios)).filter((name) => name.endsWith('.xcworkspace'))) {
	locks.push(join(ios, workspace, 'xcshareddata/swiftpm/Package.resolved'))
}
const resolved = locks.find(existsSync)
assert.ok(resolved, 'NativeScript must finish SPM resolution and persist its actual pins')
const lock = JSON.parse(await readFile(resolved, 'utf8'))
const stripe = lock.pins.find((pin) => pin.identity === 'stripe-ios')
assert.equal(stripe?.state.version, '26.15.1')
// StripeCore is a transitive target in 26.15.1, not a public SPM product.
assert.doesNotMatch(pbx, /productName\s*=\s*"?StripeCore"?\s*;/)
console.log(JSON.stringify({ phase: 'validate-xcode-package-products', sdkCompilation: false }))
await command(
	'xcrun',
	['xcodebuild', '-showBuildSettings', '-project', xcode, '-sdk', 'iphonesimulator'],
	'/tmp',
	join(consumer, 'package-products.log'),
)
let app
if (values.build) {
	assert.ok(
		pbx.includes('XplatStripePaymentSheet.swift'),
		'The packed Swift bridge must belong to the native target',
	)
	console.log(JSON.stringify({ phase: 'build-unsigned-spm-consumer', sdkCompilation: true }))
	await command(
		'ns',
		['build', 'ios', '--path', project.root, '--release', '--for-device', 'false', '--no-hmr'],
		'/tmp',
		join(consumer, 'native-build.log'),
		600000,
	)
}
if (values.build || values.runtime) {
	const output = join(ios, 'build/Release-iphonesimulator')
	const apps = (await readdir(output)).filter((name) => name.endsWith('.app'))
	assert.equal(apps.length, 1, 'Expected one unsigned simulator app')
	app = join(output, apps[0])
	const executable = command(
		'/usr/libexec/PlistBuddy',
		['-c', 'Print :CFBundleExecutable', join(app, 'Info.plist')],
		'/tmp',
	).stdout.trim()
	assert.ok(existsSync(join(app, executable)), 'Compiled consumer executable must exist')
}
let runtime
if (values.runtime) {
	const device = process.env.XPLAT_IOS_DEVICE
	assert.ok(device, 'Select the owned iOS simulator; runtime mode reuses an existing build')
	const assets = []
	for (const directory of await readdir(ios, { withFileTypes: true })) {
		if (!directory.isDirectory()) {
			continue
		}
		const candidate = join(ios, directory.name, 'app')
		try {
			if ((await stat(join(candidate, 'package.json'))).isFile()) {
				assets.push(candidate)
			}
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}
	}
	assert.equal(assets.length, 1)
	const refreshed = join(project.root, 'stripe-refreshed-spm.app')
	await cp(app, refreshed, { recursive: true })
	await cp(assets[0], join(refreshed, 'app'), { recursive: true })
	const sim = (args) => command('xcrun', ['simctl', ...args], '/tmp')
	// The caller reserves the owned simulator and shuts it down after this task.
	sim(['bootstatus', device, '-b'])
	try {
		sim(['install', device, refreshed])
		const container = sim(['get_app_container', device, project.appId, 'data']).stdout.trim()
		const documents = join(container, 'Documents')
		await mkdir(documents, { recursive: true })
		const nonce = randomUUID()
		await writeFile(join(documents, 'stripe-request.json'), JSON.stringify({ nonce }))
		sim(['launch', device, project.appId])
		const deadline = Date.now() + 60000
		while (Date.now() < deadline) {
			try {
				const result = JSON.parse(await readFile(join(documents, 'stripe-result.json'), 'utf8'))
				if (result.nonce === nonce) {
					runtime = result
					break
				}
			} catch (error) {
				if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) {
					throw error
				}
			}
			await new Promise((resolve) => setTimeout(resolve, 150))
		}
		assert.ok(runtime, 'Packed Stripe SDK runtime timed out')
		assert.equal(runtime.passed, true, JSON.stringify(runtime))
		console.log(JSON.stringify(runtime))
	} finally {
		const stopped = spawnSync('xcrun', ['simctl', 'terminate', device, project.appId], {
			encoding: 'utf8',
			timeout: 10000,
		})
		if (stopped.status !== 0) {
			console.warn(
				'The owned Stripe app was already stopped or could not be terminated; the caller shuts down its simulator.',
			)
		}
	}
}
console.log(
	JSON.stringify({
		passed: true,
		version: stripe.state.version,
		products: ['StripePaymentSheet', 'StripePayments'],
		nativeCompilation: values.build,
		...(runtime ? { runtime } : {}),
		...(app ? { app } : {}),
		presentationAttempted: values.runtime,
		paymentAuthorized: false,
	}),
)
