import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../../cli/src/macos/native.mjs'
import { hostBundle } from '../../../cli/src/macos/jsc-host/runtime.mjs'
import { macOSExecutable } from '../../../cli/src/macos/executables.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../../..')
const leaf = join(repo, 'packages/lottie')
const animation = {
	v: '5.7.0',
	fr: 30,
	ip: 0,
	op: 30,
	w: 100,
	h: 100,
	nm: 'AppKit fixture',
	ddd: 0,
	assets: [],
	layers: [
		{
			ddd: 0,
			ind: 1,
			ty: 1,
			nm: 'moving solid',
			sr: 1,
			ks: {
				o: { a: 0, k: 100 },
				r: { a: 0, k: 0 },
				p: {
					a: 1,
					k: [
						{
							t: 0,
							s: [0, 50, 0],
							e: [100, 50, 0],
							o: { x: 0.33, y: 0.33 },
							i: { x: 0.67, y: 0.67 },
						},
						{ t: 30, s: [100, 50, 0] },
					],
				},
				a: { a: 0, k: [0, 0, 0] },
				s: { a: 0, k: [100, 100, 100] },
			},
			sw: 20,
			sh: 20,
			sc: '#ff0000',
			ip: 0,
			op: 30,
			st: 0,
			bm: 0,
		},
	],
}

await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/lottie-appkit-'))
await mkdir(join(app, 'node_modules'))
await mkdir(join(app, 'node_modules/@octane-xplat'))
await symlink(leaf, join(app, 'node_modules/@octane-xplat/lottie'))
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		private: true,
		dependencies: { '@octane-xplat/lottie': 'workspace:*' },
	}),
)

const fixturePath = join(app, 'animation.json')
const fixtureJSON = JSON.stringify(animation)
await writeFile(fixturePath, fixtureJSON)

console.log('Building the pinned Airbnb source through the production macOS native builder')
process.chdir(app) // Swift auxiliary outputs stay in the ignored scratch app.
const artifact = await buildMacOSNative(app)
assert.ok(artifact.leaves.includes('@octane-xplat/lottie'))
assert.ok(artifact.resources.some((resource) => resource.destination === 'PrivacyInfo.xcprivacy'))
assert.ok(artifact.notices.some((notice) => notice.leaf === '@octane-xplat/lottie'))

const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const host = await macOSExecutable(app, 'macos-arm64/host')
const result = await new Promise((resolveRun) => {
	const child = spawn(
		host,
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			join(here, 'probe.cjs'),
			artifact.metadata,
			bootstrap,
		],
		{
			cwd: app,
			env: {
				...process.env,
				LOTTIE_FIXTURE_PATH: fixturePath,
			},
		},
	)

	let stdout = ''
	let stderr = ''
	const timeout = setTimeout(() => child.kill('SIGKILL'), 20_000)
	child.stdout.setEncoding('utf8').on('data', (chunk) => {
		stdout += chunk
	})

	child.stderr.setEncoding('utf8').on('data', (chunk) => {
		stderr += chunk
	})

	child.once('close', (status, signal) => {
		clearTimeout(timeout)
		resolveRun({ status, signal, stdout, stderr })
	})
})

console.log(result.stdout)
console.log(result.stderr)
assert.equal(result.status, 0, `Real JSC host exited ${result.status ?? result.signal}`)
assert.match(result.stderr + result.stdout, /LOTTIE_APPKIT_INTEGRATION_OK/)
console.log(`Production native artifact and real JavaScriptCore checks passed in ${app}`)
