import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { gifBytes } from './gif.mjs'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'xplat-conversion-consumer-'))
try {
	const modules = join(directory, 'node_modules/@octane-xplat')
	await mkdir(modules, { recursive: true })
	for (const name of ['media-converter', 'image-manipulator', 'macos-appkit']) {
		await symlink(join(repo, 'packages', name), join(modules, name), 'dir')
	}

	await writeFile(
		join(directory, 'package.json'),
		JSON.stringify({
			name: 'conversion-consumer',
			private: true,
			type: 'module',
			dependencies: {
				'@octane-xplat/media-converter': 'workspace:*',
				'@octane-xplat/image-manipulator': 'workspace:*',
			},
		}),
	)

	await writeFile(join(directory, 'input.gif'), gifBytes())
	const artifact = await buildMacOSNative(directory)
	assert.ok(artifact.leaves.includes('@octane-xplat/media-converter'))
	assert.ok(artifact.leaves.includes('@octane-xplat/image-manipulator'))
	const bootstrap = join(directory, 'bootstrap.js')
	await writeNativeBootstrap(artifact, bootstrap)
	const entry = join(directory, 'case.ts')
	await writeFile(
		entry,
		`
import { convertGif, isAvailable, releaseVideo } from '@octane-xplat/media-converter'
import { ImageManipulator, releaseImage } from '@octane-xplat/image-manipulator'
setTimeout(async()=>{
 try {
  if(!(await isAvailable('mp4')) || await isAvailable('webm'))throw new Error('Wrong availability')
  const video=await convertGif(${JSON.stringify(join(directory, 'input.gif'))}).result
  if(video.duration!==600||video.width!==16)throw new Error('Wrong video metadata')
  releaseVideo(video)
  const context=ImageManipulator.manipulate(${JSON.stringify(join(directory, 'input.gif'))})
  const image=await context.renderAsync();context.release()
  const webp=await image.saveAsync({format:'webp',base64:true});image.release()
  if(!webp.base64?.startsWith('UklGR')||webp.width!==16)throw new Error('Wrong WebP bytes')
  releaseImage(webp)
  console.log('CONVERSION_CONSUMER_OK actual-native-metadata,js-bridges,video,webp,cleanup')
 }catch(error){console.error('CONVERSION_CONSUMER_FAIL '+error.stack)}
 finally{globalThis.__xplatStopHost()}
},0)
`,
	)

	await build({
		root: directory,
		configFile: false,
		logLevel: 'error',
		resolve: { conditions: ['macos'], extensions: ['.macos.ts', '.ts', '.js'] },
		build: {
			outDir: join(directory, 'dist'),
			target: 'es2022',
			lib: { entry, formats: ['cjs'], fileName: () => 'case.cjs' },
			minify: false,
		},
	})

	const host = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos')
	const result = spawnSync(
		join(host, 'host'),
		[
			join(host, 'NativeScript.framework/Versions/A/NativeScript'),
			join(directory, 'dist/case.cjs'),
			artifact.metadata[process.arch === 'x64' ? 'x86_64' : 'arm64'],
			bootstrap,
		],
		{ encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 },
	)

	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.match(
		result.stdout + result.stderr,
		/CONVERSION_CONSUMER_OK/,
		result.stdout + result.stderr,
	)

	console.log('CONVERSION_CONSUMER_OK actual-native-metadata,js-bridges,video,webp,cleanup')
} finally {
	await rm(directory, { recursive: true, force: true })
}
