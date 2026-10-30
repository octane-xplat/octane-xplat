import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-orientation-consumer-'))
const run = (cmd, args, cwd) => {
	const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 120000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
try {
	const pack = join(temporary, 'pack')
	await mkdir(pack)
	run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', pack], root)
	const archive = (await readdir(pack)).find((name) => name.endsWith('.tgz'))
	assert.ok(archive)
	run('tar', ['-xzf', join(pack, archive), '-C', pack], root)
	const packed = join(pack, 'package')
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
		const app = join(temporary, target)
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packed, join(app, 'node_modules/@octane-xplat/screen-orientation'), {
			recursive: true,
		})
		await writeFile(join(app, 'package.json'), '{"type":"module"}')
		await writeFile(
			join(app, 'consumer.ts'),
			`import { ScreenOrientation, Orientation, OrientationLock, WebOrientationLock, getOrientationAsync, getOrientationLockAsync, getPlatformOrientationLockAsync, lockAsync, lockPlatformAsync, unlockAsync, supportsOrientationLockAsync, addOrientationChangeListener, getIOSSupportedInterfaceOrientations, type OrientationChangeEvent, type PlatformOrientationInfo } from '@octane-xplat/screen-orientation'
const current: Promise<Orientation> = getOrientationAsync()
const policy: Promise<OrientationLock> = getOrientationLockAsync()
const platform: Promise<PlatformOrientationInfo> = getPlatformOrientationLockAsync()
const possible: Promise<boolean> = supportsOrientationLockAsync(OrientationLock.LANDSCAPE)
const listener = addOrientationChangeListener((event: OrientationChangeEvent) => { console.log(event.orientationInfo.orientation) })
listener.remove()
const locked: Promise<void> = lockAsync(OrientationLock.PORTRAIT_UP)
void lockPlatformAsync({ screenOrientationLockWeb: WebOrientationLock.PORTRAIT })
void unlockAsync()
const available: boolean = ScreenOrientation.capabilities.observe
const mask: number = getIOSSupportedInterfaceOrientations(null)
void current; void policy; void platform; void possible; void locked; void available; void mask
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
		'Packed screen-orientation consumer: six target declarations without native ambient types pass. Runtime qualification is a separate check.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
