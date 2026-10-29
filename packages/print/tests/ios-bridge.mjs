import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
const sdk = spawnSync('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
	encoding: 'utf8',
})
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
			'arm64-apple-ios13.0-simulator',
			'-sdk',
			sdk.stdout.trim(),
			fileURLToPath(new URL('../platforms/ios/src/XplatPrintEngine.swift', import.meta.url)),
		],
		{ encoding: 'utf8', timeout: 60000 },
	)
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
console.log(
	'iOS print engine: UIKit/WebKit/PDFKit Swift4/5 API checks passed; this task does not exercise runtime behavior.',
)
