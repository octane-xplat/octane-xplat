import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert.equal(process.platform, 'darwin', 'Run iOS dependency checks on skymac.local')
const repo = process.env.XPLAT_NATIVE_TEST_REPO
const archive = process.env.XPLAT_STRIPE_CONSUMER_ARCHIVE
assert.ok(repo && archive, 'Select the Apple test checkout and locally packed Stripe archive')
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const consumer = join(packageRoot, 'tests/.runtime/packed-spm-consumer')
const installed = join(consumer, 'node_modules/@octane-xplat/stripe')
await mkdir(installed, { recursive: true })
function command(executable, args, cwd, log) {
	const result = spawnSync(executable, args, {
		cwd,
		detached: true,
		encoding: 'utf8',
		timeout: 300000,
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
await writeFile(entry, 'export {}\n')
const resources = join(consumer, 'App_Resources')
await cp(join(repo, 'packages/create/template/App_Resources'), resources, { recursive: true })
await writeFile(join(resources, 'iOS/build.xcconfig'), 'IPHONEOS_DEPLOYMENT_TARGET = 15.0\n')
const { prepare } = await import(pathToFileURL(join(repo, 'scripts/probe/project.ts')).href)
const project = await prepare('ios', entry, ['@octane-xplat/stripe'], resources)
await writeFile(join(project.root, 'src/index.ts'), 'export {}\n')
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
for (const product of ['StripePaymentSheet', 'StripePayments', 'StripeCore']) {
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
console.log(
	JSON.stringify({
		passed: true,
		version: stripe.state.version,
		products: ['StripePaymentSheet', 'StripePayments', 'StripeCore'],
		nativeCompilation: false,
		checkoutPresented: false,
	}),
)
