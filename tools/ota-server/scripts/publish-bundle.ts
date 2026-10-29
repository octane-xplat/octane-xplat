// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Publishes an OTA payload: zips a built vite `app/` dir, uploads it to R2
// under bundles/<sha256>, then repoints the matching native-fingerprint cohort.
//
// Usage:
//   node scripts/publish-bundle.ts --dir <app-dir> --platform ios|android \
//     --version x.y.z --project-dir APP_ROOT [--channel stable] [--bucket NAME] [--dry-run]
//
// Requires `zip` and a wrangler-authenticated shell (the same credentials used
// for `wrangler deploy`). The pointer is written AFTER the bundle lands, so a
// failed upload never leaves a channel pointing at a missing object.

import { createFingerprintAsync, NATIVE_FINGERPRINT_FORMAT } from '@octane-xplat/fingerprint'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
	options: {
		dir: { type: 'string' },
		platform: { type: 'string' },
		channel: { type: 'string', default: 'stable' },
		version: { type: 'string' },
		'project-dir': { type: 'string' },
		bucket: { type: 'string', default: 'octane-xplat-ota-bundles' },
		'dry-run': { type: 'boolean', default: false },
	},
})

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function fail(message) {
	console.error(`publish-bundle: ${message}`)
	process.exit(1)
}

if (!args.dir) {
	fail('--dir <path to built app/ dir> is required')
}

if (!['ios', 'android'].includes(args.platform ?? '')) {
	fail('--platform must be ios or android')
}

if (
	!args.version ||
	!VERSION_RE.test(args.version) ||
	!args.version.split('.').every((part) => Number.isSafeInteger(Number(part)))
) {
	fail('--version must be numeric x.y.z')
}

if (!args['project-dir']) {
	fail('--project-dir <source app root> is required')
}

if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(args.channel)) {
	fail('--channel must match [a-z0-9-]{1,32}')
}

const appDir = resolve(args.dir)
if (!statSync(appDir, { throwIfNoEntry: false })?.isDirectory()) {
	fail(`${appDir} is not a directory`)
}

if (!statSync(join(appDir, 'package.json'), { throwIfNoEntry: false })?.isFile()) {
	fail(`${appDir} has no package.json — is this the built vite app/ output?`)
}

const metadata = JSON.parse(readFileSync(join(appDir, 'xplat-native.json'), 'utf8'))
if (
	metadata.format !== NATIVE_FINGERPRINT_FORMAT ||
	metadata.platform !== args.platform ||
	metadata.release !== true ||
	!/^[0-9a-f]{64}$/.test(metadata.hash)
) {
	fail('A prepared release payload with native build metadata is required')
}
const record = JSON.parse(
	readFileSync(
		join(resolve(args['project-dir']), '.xplat/fingerprints', args.platform + '.json'),
		'utf8',
	),
)
if (
	record.hash !== metadata.hash ||
	record.platform !== metadata.platform ||
	record.release !== true ||
	record.format !== metadata.format ||
	!record.toolchain ||
	typeof record.toolchain !== 'object' ||
	Array.isArray(record.toolchain) ||
	Object.values(record.toolchain).some((value) => typeof value !== 'string')
) {
	fail('Native build record does not match this release payload')
}
const current = await createFingerprintAsync(resolve(args['project-dir']), {
	platforms: [args.platform],
	toolchain: record.toolchain,
})
if (current.hash !== metadata.hash) {
	fail(
		'Native inputs changed after this payload was prepared; rebuild the native binary and payload before publishing',
	)
}

const scratch = mkdtempSync(join(tmpdir(), 'xplat-ota-'))
process.on('exit', () => rmSync(scratch, { recursive: true, force: true }))
const zipPath = join(scratch, 'payload.zip')

run('zip', ['-qr', zipPath, '.'], { cwd: appDir })

const sha256 = createHash('sha256').update(readFileSync(zipPath)).digest('hex')
const size = statSync(zipPath).size
const pointer = {
	version: args.version,
	sha256,
	size,
	nativeFingerprint: metadata.hash,
	releasedAt: new Date().toISOString(),
}

const pointerPath = join(scratch, 'pointer.json')
writeFileSync(pointerPath, JSON.stringify(pointer, null, '\t') + '\n')

const bundleKey = `bundles/${sha256}`
const channelKey = `channels/${args.channel}/${args.platform}/${metadata.hash}.json`

if (args['dry-run']) {
	console.log(`bundle  ${args.bucket}/${bundleKey}  (${size} bytes)`)
	console.log(`pointer ${args.bucket}/${channelKey}`)
	console.log(JSON.stringify(pointer, null, '\t'))
	process.exit(0)
}

wrangler([
	'r2',
	'object',
	'put',
	`${args.bucket}/${bundleKey}`,
	'--file',
	zipPath,
	'--content-type',
	'application/zip',
])

wrangler([
	'r2',
	'object',
	'put',
	`${args.bucket}/${channelKey}`,
	'--file',
	pointerPath,
	'--content-type',
	'application/json',
])

console.log(
	`published ${args.platform}/${args.channel} -> ${pointer.version} (${sha256.slice(0, 12)}…)`,
)

console.log(
	`manifest: GET /manifest?platform=${args.platform}&channel=${args.channel}&nativeFingerprint=${metadata.hash}`,
)

function wrangler(argv) {
	const result = spawnSync('wrangler', argv, { stdio: 'inherit' })
	if (result.error) {
		fail(`wrangler not found: ${result.error.message}`)
	}

	if (result.status !== 0) {
		fail(`wrangler ${argv.join(' ')} exited ${result.status}`)
	}
}

function run(cmd, argv, options = {}) {
	const result = spawnSync(cmd, argv, { stdio: 'inherit', ...options })
	if (result.error) {
		fail(`${cmd} not found: ${result.error.message}`)
	}

	if (result.status !== 0) {
		fail(`${cmd} ${argv.join(' ')} exited ${result.status}`)
	}
}
