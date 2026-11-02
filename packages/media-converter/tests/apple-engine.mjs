import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gifBytes } from './gif.mjs'
const root = fileURLToPath(new URL('..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'xplat-converter-engine-'))
function run(command, args) {
	const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result.stdout
}
try {
	await copyFile(join(root, 'tests/apple-main.swift'), join(directory, 'main.swift'))
	const engine = join(root, 'platforms/macos/src/XplatMediaConverter.swift')
	assert.equal(
		await import('node:fs/promises').then(({ readFile }) => readFile(engine, 'utf8')),
		await import('node:fs/promises').then(({ readFile }) =>
			readFile(join(root, 'platforms/ios/src/XplatMediaConverter.swift'), 'utf8'),
		),
	)
	// NativeScript app targets compile package Swift sources at SWIFT_VERSION 4.2,
	// where try? does not flatten nested optionals — keep the source compiling there.
	run('xcrun', ['swiftc', '-swift-version', '4.2', '-typecheck', engine])
	run('xcrun', [
		'swiftc',
		'-swift-version',
		'5',
		engine,
		join(directory, 'main.swift'),
		'-o',
		join(directory, 'case'),
	])
	await writeFile(join(directory, 'source.gif'), gifBytes())
	const result = run(join(directory, 'case'), [join(directory, 'source.gif')])
	assert.match(result, /APPLE_CONVERTER_OK/)
	console.log(result.trim())
	const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path']).trim()
	run('xcrun', [
		'swiftc',
		'-swift-version',
		'5',
		'-typecheck',
		'-sdk',
		sdk,
		'-target',
		'arm64-apple-ios15.0-simulator',
		engine,
	])
	console.log('iOS simulator SDK: native engine typecheck passed (not a device runtime check).')
} finally {
	await rm(directory, { recursive: true, force: true })
}
