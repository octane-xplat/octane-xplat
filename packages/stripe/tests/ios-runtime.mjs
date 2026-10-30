import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, readdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repo = process.env.XPLAT_NATIVE_TEST_REPO
const sdk = process.env.XPLAT_STRIPE_IOS_SDK
const device = process.env.XPLAT_IOS_DEVICE
assert.ok(
	repo && sdk && device,
	'Select the skymac checkout, official SDK directory and task-owned simulator',
)
const runtime = join(packageRoot, 'tests/.runtime')
await mkdir(runtime, { recursive: true })
const plugin = join(runtime, 'sdk-plugin')
await mkdir(join(plugin, 'platforms/ios'), { recursive: true })
await writeFile(
	join(plugin, 'package.json'),
	JSON.stringify({
		name: '@xplat/stripe-sdk-fixture',
		version: '1.0.0',
		private: true,
		nativescript: { platforms: { ios: '9.1.0' } },
	}),
)
let count = 0
async function visit(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue
		}
		const path = join(directory, entry.name)
		if (entry.name.endsWith('.xcframework')) {
			try {
				await symlink(path, join(plugin, 'platforms/ios', entry.name), 'dir')
			} catch (error) {
				if (error.code !== 'EEXIST') {
					throw error
				}
			}
			count++
		} else {
			await visit(path)
		}
	}
}
await visit(sdk)
assert.ok(count, 'Official SDK frameworks are required')
for (const [name, source] of [
	['@xplat/stripe-sdk-fixture', plugin],
	['@nativescript/core', join(repo, 'apps/mobile/node_modules/@nativescript/core')],
	['@octane-xplat/lib', process.env.XPLAT_IMAGE_LIB_ROOT ?? join(repo, 'packages/lib')],
]) {
	const destination = join(packageRoot, 'node_modules', name)
	await mkdir(resolve(destination, '..'), { recursive: true })
	try {
		await symlink(await realpath(source), destination, 'dir')
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}
	}
}
const resources = join(runtime, 'App_Resources')
await cp(join(repo, 'apps/mobile/App_Resources'), resources, {
	recursive: true,
	filter: (path) => !path.endsWith('google-services.json'),
})
await mkdir(join(resources, 'iOS/src'), { recursive: true })
await cp(
	join(packageRoot, 'platforms/ios/src/XplatStripePaymentSheet.swift'),
	join(resources, 'iOS/src/XplatStripePaymentSheet.swift'),
)
const result = spawnSync(
	'bun',
	[
		'probe',
		'run',
		join(packageRoot, 'tests/runtime.ios.ts'),
		'--target',
		'ios',
		'--device',
		device,
		'--deps',
		'@xplat/stripe-sdk-fixture,@octane-xplat/lib',
		'--resources',
		resources,
		'--timeout',
		'45000',
		'--startup-timeout',
		'180000',
	],
	{ cwd: repo, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 },
)
assert.equal(result.status, 0, `${result.stdout}${result.stderr}`)
const report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')))
assert.equal(report.results.length, 1)
assert.equal(report.results[0].status, 'pass', JSON.stringify(report.results[0]))
console.log(
	`iOS SDK runtime: ${report.results[0].assertions.length} initialization, concurrency and failed-checkout cleanup assertions passed. Success, wallets and redirects remain unverified.`,
)
