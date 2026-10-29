import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const platform = process.argv[2]
assert.equal(platform, 'ios')
assert.equal(process.platform, 'darwin', 'Apple API checks require the designated Apple host')
const sdk = spawnSync(
	'xcrun',
	['--sdk', platform === 'ios' ? 'iphonesimulator' : 'macosx', '--show-sdk-path'],
	{ encoding: 'utf8' },
)
assert.equal(sdk.status, 0, sdk.stderr)
for (const language of ['4', '5']) {
	const result = spawnSync(
		'xcrun',
		[
			'swiftc',
			'-typecheck',
			'-swift-version',
			language,
			'-target',
			platform === 'ios' ? 'arm64-apple-ios13.0-simulator' : 'arm64-apple-macos13.0',
			'-sdk',
			sdk.stdout.trim(),
			fileURLToPath(
				new URL(`../platforms/${platform}/src/XplatTrackingTransparency.swift`, import.meta.url),
			),
		],
		{ encoding: 'utf8', timeout: 60000 },
	)
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
console.log(
	`${platform} Swift4/5 API checks pass. No permission prompt or advertising identifier read was performed.`,
)
