import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-tracking-transparency-consumer-'))
const run = (cmd, args, cwd) => {
	const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 120000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
try {
	const pack = join(temporary, 'pack')
	await mkdir(pack)
	run('pnpm', ['pack', '--config.ignore-scripts=true', '--pack-destination', pack], root)
	const archive = (await readdir(pack)).find((name) => name.endsWith('.tgz'))
	assert.ok(archive)
	run('tar', ['-xzf', join(pack, archive), '-C', pack], root)
	const packed = join(pack, 'package')
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'gtk', 'windows']) {
		const app = join(temporary, target)
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packed, join(app, 'node_modules/@octane-xplat/tracking-transparency'), {
			recursive: true,
		})
		await symlink(join(root, 'node_modules/octane'), join(app, 'node_modules/octane'), 'dir')
		await symlink(
			join(root, 'node_modules/@octane-xplat/lib'),
			join(app, 'node_modules/@octane-xplat/lib'),
			'dir',
		)
		await writeFile(join(app, 'package.json'), '{"type":"module"}')
		await writeFile(
			join(app, 'consumer.ts'),
			`import { TrackingTransparency, getTrackingPermissionsAsync, requestTrackingPermissionsAsync, isAvailable, getAdvertisingId, getAdvertisingIdAsync, useTrackingPermissions, PermissionStatus, type PermissionResponse, type PermissionHookOptions } from '@octane-xplat/tracking-transparency'
const options: PermissionHookOptions = { get: false }
function Consumer() { const [permission, request, refresh] = useTrackingPermissions(options); void permission; void request; void refresh; return null }
const read: Promise<PermissionResponse> = getTrackingPermissionsAsync()
const request: Promise<PermissionResponse> = requestTrackingPermissionsAsync()
const available: boolean = isAvailable()
const identifier: string | null = getAdvertisingId()
const asynchronous: Promise<string | null> = getAdvertisingIdAsync()
const prompt: boolean = TrackingTransparency.capabilities.prompt
const status: PermissionResponse['status'] = PermissionStatus.GRANTED
void Consumer; void read; void request; void available; void identifier; void asynchronous; void prompt; void status
`,
		)
		await writeFile(
			join(app, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					noEmit: true,
					strict: true,
					skipLibCheck: false,
					module: 'esnext',
					moduleResolution: 'bundler',
					target: 'es2022',
					types: [],
					customConditions: [target === 'ios' || target === 'android' ? 'native' : target],
				},
				include: ['consumer.ts'],
			}),
		)
		run(
			process.execPath,
			[join(repo, 'node_modules/typescript/bin/tsc'), '-p', join(app, 'tsconfig.json')],
			app,
		)
	}
	console.log(
		'Packed tracking-transparency consumer: seven target declarations without native ambient types pass. Runtime qualification is a separate check.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
