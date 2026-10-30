import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-splash-consumer-'))
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
	for (const file of [
		'platforms/ios/src/XplatSplashScreen.swift',
		'platforms/android/java/com/octanexplat/splashscreen/SplashScreenBridge.java',
	]) {
		assert.equal(
			await readFile(join(packed, file), 'utf8'),
			await readFile(join(root, file), 'utf8'),
		)
	}
	for (const target of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
		const app = join(temporary, target)
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packed, join(app, 'node_modules/@octane-xplat/splash-screen'), { recursive: true })
		await writeFile(join(app, 'package.json'), '{"type":"module"}')
		await writeFile(
			join(app, 'consumer.ts'),
			`import { SplashScreen, preventAutoHideAsync, hide, hideAsync, setOptions, type SplashScreenOptions } from '@octane-xplat/splash-screen'
const options: SplashScreenOptions = { duration: 250, fade: true }
const held: Promise<boolean> = preventAutoHideAsync()
const dismissed: Promise<void> = hideAsync()
const supported: boolean = SplashScreen.capabilities.hold
const fade: boolean = SplashScreen.capabilities.fade
setOptions(options)
hide()
void held; void dismissed; void supported; void fade
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
		'Packed splash consumer: six target declarations without native ambient types; shipped Swift/Java file contents verified. Native runtime is a separate check.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
