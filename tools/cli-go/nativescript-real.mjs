// Real installed NativeScript SDK compilation. Never launch a device or app.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	readdirSync,
	existsSync,
	realpathSync,
	lstatSync,
} from 'node:fs'

import { join, resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const target = process.env.XPLAT_GO_NS_TARGET ?? 'ios'
assert.ok(['ios', 'android'].includes(target), 'Choose ios or android for this SDK gate')
assert.ok(target !== 'ios' || process.platform === 'darwin', 'iOS requires macOS')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale SDK build source: ${file}`)
}

const app = realpathSync(join(root, 'apps/mobile'))
const engine = JSON.parse(readFileSync(join(app, 'node_modules/nativescript/package.json')))
const runtime = JSON.parse(
	readFileSync(join(app, `node_modules/@nativescript/${target}/package.json`)),
)

const projectInputs = Object.fromEntries(
	[
		'bun.lock',
		'tsconfig.base.json',
		'apps/mobile/package.json',
		'apps/mobile/nativescript.config.ts',
		'apps/mobile/vite.config.mts',
		'apps/mobile/tsconfig.json',
	].map((file) => [file, sha(readFileSync(join(root, file)))]),
)

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

const started = new Date().toISOString(),
	outFile = join(work, `nativescript-${target}-qualification.json`)

mkdirSync(work, { recursive: true })
const gradleHome = join(work, 'nativescript-gradle-cache')
mkdirSync(gradleHome, { recursive: true })
// Keep this qualification run from leaving a persistent compiler service.
writeFileSync(join(gradleHome, 'gradle.properties'), 'org.gradle.daemon=false\n')
const env = {
	...process.env,
	NODE_OPTIONS: '',
	NODE_PATH: '',
	CI: '1',
	GRADLE_USER_HOME: gradleHome,
}

// These feature switches belong to visual/device runners, not compilation.
for (const key of [
	'VISUAL_CAPTURE_URL',
	'VISUAL_RUN_ID',
	'VISUAL_REVISION',
	'VISUAL_SCENARIO_HASH',
]) {
	delete env[key]
}

let stdout = '',
	stderr = ''

const child = spawn(binary, ['build', '--targets', target], {
	cwd: app,
	env,
	stdio: ['ignore', 'pipe', 'pipe'],
})

const tail = (before, bytes) => (before + bytes.toString('utf8')).slice(-(2 << 20))
child.stdout.on('data', (bytes) => {
	stdout = tail(stdout, bytes)
	process.stdout.write(bytes)
})

child.stderr.on('data', (bytes) => {
	stderr = tail(stderr, bytes)
	process.stderr.write(bytes)
})

let timedOut = false,
	interrupted = null

const forward = (signal) => {
	interrupted ??= signal
	child.kill(signal)
}

const onInterrupt = () => forward('SIGINT'),
	onTerminate = () => forward('SIGTERM')

process.on('SIGINT', onInterrupt)
process.on('SIGTERM', onTerminate)
const deadline = setTimeout(
	() => {
		timedOut = true
		child.kill('SIGTERM')
	},
	20 * 60 * 1000,
)

const result = await new Promise((resolve) => {
	child.once('error', (error) => resolve({ code: null, signal: null, error: error.message }))
	child.once('close', (code, signal) => resolve({ code, signal }))
}).finally(() => {
	clearTimeout(deadline)
	process.off('SIGINT', onInterrupt)
	process.off('SIGTERM', onTerminate)
})

const artifacts = []
function visit(dir, depth = 0) {
	if (depth > 12 || !existsSync(dir)) {
		return
	}
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name)
		if (entry.isSymbolicLink()) {
			continue
		}

		if (entry.isDirectory()) {
			if (entry.name.endsWith('.app')) {
				const info = join(path, 'Info.plist')
				const executable = execFileSync(
					'/usr/libexec/PlistBuddy',
					['-c', 'Print :CFBundleExecutable', info],
					{ encoding: 'utf8' },
				).trim()

				assert.ok(executable && !/[\\/]/.test(executable), 'Invalid app executable name')
				const entry = join(path, executable)
				assert.ok(lstatSync(entry).isFile(), 'App executable must be an ordinary file')
				const bytes = readFileSync(entry)
				assert.ok(bytes.length > 0, 'App executable must not be empty')
				artifacts.push({
					path: relative(root, path),
					kind: 'app',
					infoPlistSha256: sha(readFileSync(info)),
					executable,
					executableBytes: bytes.length,
					executableSha256: sha(bytes),
				})
			} else {
				visit(path, depth + 1)
			}
		} else if (/\.(apk|aab|appx|msix)$/.test(entry.name)) {
			const bytes = readFileSync(path)
			artifacts.push({
				path: relative(root, path),
				kind: entry.name.split('.').at(-1),
				bytes: bytes.length,
				sha256: sha(bytes),
			})
		}
	}
}

let artifactError = null
try {
	visit(join(app, 'platforms', target, 'build'))
	visit(join(app, 'platforms', target, 'app/build/outputs'))
} catch (error) {
	artifactError = error.message
}

const record = {
	target,
	host,
	source: build.inputs,
	projectInputs,
	revision,
	binarySha256: build.sha256,
	started,
	ended: new Date().toISOString(),
	node: process.version,
	nativescript: engine.version,
	runtime: runtime.version,
	...result,
	timedOut,
	interrupted,
	artifacts,
	artifactError,
	stdout,
	stderr,
	scope:
		'Actual installed project NativeScript SDK build through the native Go CLI; compilation only, no device/app launch or visual analysis.',
}

writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n')
assert.equal(timedOut, false, 'SDK deadline reached; retained build record')
assert.equal(interrupted, null, 'SDK qualification was interrupted; retained build record')
assert.deepEqual(
	result,
	{ code: 0, signal: null },
	`NativeScript ${target} build failed; inspect ${outFile}`,
)

assert.equal(artifactError, null, `Artifact inspection failed; inspect ${outFile}`)
assert.ok(artifacts.length > 0, 'A successful SDK build must produce an actual platform artifact')
console.log(`Qualified real ${target} SDK compilation: ${artifacts.length} artifact(s); ${outFile}`)
