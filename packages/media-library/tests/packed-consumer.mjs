import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-library-consumer-'))

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
	assert.equal(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`)
}

const chunks = (result) =>
	(Array.isArray(result) ? result : [result]).flatMap((output) => output.output)

try {
	const packed = join(temporary, 'packed')
	await mkdir(packed)
	run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packed], packageRoot)
	const tarballs = (await readdir(packed)).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1)
	const modules = join(temporary, 'node_modules')
	const scoped = join(modules, '@octane-xplat')
	await mkdir(scoped, { recursive: true })
	run('tar', ['-xzf', join(packed, tarballs[0]), '-C', packed], temporary)
	const unpacked = join(packed, 'package')
	await symlink(unpacked, join(scoped, 'media-library'), 'dir')
	const manifest = JSON.parse(await readFile(join(unpacked, 'package.json'), 'utf8'))
	for (const dependency of Object.keys({
		...manifest.dependencies,
		...manifest.peerDependencies,
	})) {
		const target = join(modules, dependency)
		await mkdir(dirname(target), { recursive: true })
		await symlink(join(packageRoot, 'node_modules', dependency), target, 'dir')
	}
	for (const value of Object.values(manifest.exports['.'])) {
		assert.equal(typeof value, 'string')
		await readFile(join(unpacked, value))
	}
	await writeFile(
		join(temporary, 'package.json'),
		JSON.stringify({ private: true, type: 'module' }),
	)
	await writeFile(
		join(temporary, 'consumer.ts'),
		`
import { Asset, Album, Query, AssetField, MediaType, MediaLibrary, usePermissions, releaseAssetUri } from '@octane-xplat/media-library'
import type { AssetInfo, AssetMetadata, PermissionResponse } from '@octane-xplat/media-library'
export async function browse(): Promise<AssetMetadata[]> {
 return new Query().eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
  .orderBy({ key: AssetField.CREATION_TIME, ascending: false }).limit(20).offset(0).exeForMetadata()
}
export async function save(source: string): Promise<AssetInfo> {
 const asset: Asset = await Asset.create(source)
 const album: Album = await Album.create('Attachments', [asset])
 await album.add(asset)
 return asset.getInfo()
}
const hook: () => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>] = usePermissions
export { MediaLibrary, hook, releaseAssetUri }
// @ts-expect-error width filters require a number
new Query().eq(AssetField.WIDTH, 'wide')
`,
	)
	await readFile(
		join(unpacked, 'platforms/android/java/com/octanexplat/medialibrary/LibraryObserver.java'),
	)
	await readFile(join(unpacked, 'platforms/android/AndroidManifest.xml'))
	for (const [name, conditions, lib] of [
		['web', ['web'], ['ESNext', 'DOM']],
		['native', ['native'], ['ESNext']],
	]) {
		const config = join(temporary, `${name}.json`)
		await writeFile(
			config,
			JSON.stringify({
				compilerOptions: {
					strict: true,
					skipLibCheck: false,
					noEmit: true,
					module: 'ESNext',
					moduleResolution: 'Bundler',
					target: 'ES2022',
					customConditions: conditions,
					lib,
					types: [],
				},
				files: ['consumer.ts'],
			}),
		)
		run(
			process.execPath,
			[join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', config],
			temporary,
		)
	}
	const browser = await build({
		root: temporary,
		configFile: false,
		logLevel: 'error',
		resolve: { conditions: ['web'], extensions: ['.web.ts', '.ts', '.tsx', '.js'] },
		build: {
			write: false,
			lib: { entry: join(temporary, 'consumer.ts'), formats: ['es'] },
			minify: false,
		},
	})
	assert.ok(
		chunks(browser).some((chunk) => chunk.type === 'chunk' && chunk.exports.includes('browse')),
	)
	const native = await build({
		root: temporary,
		configFile: false,
		logLevel: 'error',
		resolve: {
			conditions: ['native'],
			extensions: ['.ios.ts', '.mobile.ts', '.ts', '.tsx', '.js'],
		},
		build: {
			write: false,
			ssr: true,
			lib: { entry: join(temporary, 'consumer.ts'), formats: ['es'] },
			rollupOptions: { external: ['octane', '@nativescript/core'] },
			minify: false,
		},
		ssr: {
			noExternal: ['@octane-xplat/media-library', '@octane-xplat/lib'],
			resolve: { conditions: ['native'] },
		},
	})
	// A packed iOS graph must reach its real platform backend, not the unsupported fallback.
	assert.ok(
		chunks(native).some(
			(chunk) =>
				chunk.type === 'chunk' &&
				chunk.code.includes('authorizationStatusForAccessLevel') &&
				chunk.code.includes('registerChangeObserver'),
		),
	)
	console.log(
		'Packed consumer: ambient-free public types, web production bundle, and iOS PhotoKit backend resolution, and packaged Android observer/permissions passed.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
