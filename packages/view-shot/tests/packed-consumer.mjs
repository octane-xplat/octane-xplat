import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-view-shot-consumer-'))
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
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'gtk', 'windows']) {
		const app = join(temporary, target)
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packed, join(app, 'node_modules/@octane-xplat/view-shot'), {
			recursive: true,
		})
		await symlink(join(root, 'node_modules/octane'), join(app, 'node_modules/octane'), 'dir')
		await writeFile(join(app, 'package.json'), '{"type":"module"}')
		await writeFile(
			join(app, 'consumer.ts'),
			`import ViewShot, { captureRef, captureScreen, releaseCapture, viewShot, type CaptureOptions, type ViewShotProps, type ViewShotRef } from '@octane-xplat/view-shot'
const ref: { current: ViewShotRef | null } = { current: null }
const options: CaptureOptions = { format: 'png', result: 'tmpfile', width: 320, height: 200 }
const props: ViewShotProps = { ref, options, captureMode: 'mount', onCapture: uri => { console.log(uri) }, onCaptureFailure: error => { console.log(error.message) } }
void ViewShot(props)
const result: Promise<string> = captureRef(ref, options)
const screen: Promise<string> = captureScreen(options)
const supported: boolean = viewShot.capabilities.view
releaseCapture('file:///foreign')
void result; void screen; void supported
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
		'Packed view-shot consumer: seven target declarations without native ambient types pass. Runtime qualification is a separate check.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
