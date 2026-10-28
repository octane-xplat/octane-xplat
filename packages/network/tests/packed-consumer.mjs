import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	readdirSync,
	mkdtempSync,
	mkdirSync,
	symlinkSync,
	rmSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const repo = fileURLToPath(new URL('../../../', import.meta.url))
const temp = mkdtempSync(join(tmpdir(), 'xplat-network-pack-'))
function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 120000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
}

try {
	run('pnpm', ['pack', '--pack-destination', temp], root)
	const tarball = join(
		temp,
		readdirSync(temp).find((name) => name.endsWith('.tgz')),
	)

	const installed = join(temp, 'node_modules/@octane-xplat/network')
	mkdirSync(installed, { recursive: true })
	run('tar', ['-xzf', tarball, '-C', installed, '--strip-components=1'], temp)
	assert.ok(
		readFileSync(join(installed, 'platforms/ios/src/module.modulemap'), 'utf8').includes(
			'XplatStreamingRequest.h',
		),
	)

	assert.equal(
		readFileSync(join(installed, 'platforms/ios/src/XplatStreamingRequest.m'), 'utf8'),
		readFileSync(join(installed, 'platforms/macos/src/XplatStreamingRequest.m'), 'utf8'),
	)

	assert.ok(readFileSync(join(installed, 'platforms/android/network.aar')).byteLength > 1000)
	assert.ok(
		readFileSync(join(installed, 'platforms/android/include.gradle'), 'utf8').includes(
			'okhttp:4.12.0',
		),
	)

	symlinkSync(
		join(root, 'node_modules/web-streams-polyfill'),
		join(temp, 'node_modules/web-streams-polyfill'),
	)

	writeFileSync(join(temp, 'package.json'), '{"type":"module"}')
	writeFileSync(
		join(temp, 'consumer.ts'),
		`
import { requestStream, type StreamResponse } from '@octane-xplat/network'
async function consume() {
 const result: StreamResponse = await requestStream('https://example.test/', { method: 'PUT', body: new Uint8Array([0, 255]) })
 const reader = result.body.getReader()
 const bytes: Uint8Array | undefined = (await reader.read()).value
 await reader.cancel()
 reader.releaseLock()
 return bytes
}
void consume
`,
	)

	for (const target of ['web', 'native', 'macos', 'linux', 'windows']) {
		for (const mode of ['bundler', 'nodenext']) {
			const config = join(temp, `${target}-${mode}.json`)
			writeFileSync(
				config,
				JSON.stringify({
					compilerOptions: {
						strict: true,
						noEmit: true,
						target: 'esnext',
						lib: ['esnext'],
						types: [],
						moduleResolution: mode,
						module: mode === 'nodenext' ? 'nodenext' : 'esnext',
						customConditions: [target],
						skipLibCheck: false,
					},
					files: ['consumer.ts'],
				}),
			)

			run(process.execPath, [join(repo, 'node_modules/typescript/bin/tsc'), '-p', config], temp)
		}
	}

	console.log(
		'Packed network exports compile without DOM globals on web/native/macos/linux/windows in Bundler and NodeNext modes.',
	)
} finally {
	rmSync(temp, { recursive: true, force: true })
}
