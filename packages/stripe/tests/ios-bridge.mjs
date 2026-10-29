import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = process.env.XPLAT_STRIPE_IOS_SDK
assert.ok(root, 'Point XPLAT_STRIPE_IOS_SDK at the extracted official 26.15.1 SDK on skymac.local')
const frameworkRoots = []
async function visit(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue
		}
		const path = join(directory, entry.name)
		if (entry.name.endsWith('.xcframework')) {
			const slices = await readdir(path)
			const simulator = slices.find(
				(name) => name.startsWith('ios-') && name.endsWith('-simulator'),
			)
			if (simulator) {
				frameworkRoots.push(join(path, simulator))
			}
		} else {
			await visit(path)
		}
	}
}
await visit(root)
assert.ok(frameworkRoots.length, 'No simulator framework slices were found')
const sdk = spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
	encoding: 'utf8',
})
assert.equal(sdk.status, 0, sdk.stderr)
const source = fileURLToPath(
	new URL('../platforms/ios/src/XplatStripePaymentSheet.swift', import.meta.url),
)
for (const languageVersion of ['4', '5']) {
	const result = spawnSync(
		'xcrun',
		[
			'swiftc',
			'-typecheck',
			'-swift-version',
			languageVersion,
			'-target',
			'arm64-apple-ios15.0-simulator',
			'-sdk',
			sdk.stdout.trim(),
			...frameworkRoots.flatMap((path) => ['-F', path]),
			source,
		],
		{ encoding: 'utf8', timeout: 60000 },
	)
	assert.equal(result.status, 0, `${result.stdout}${result.stderr}`)
}
console.log(
	'Official Stripe iOS 26.15.1 simulator SDK: Swift/Objective-C bridge typecheck passed; no checkout or charge was performed.',
)
