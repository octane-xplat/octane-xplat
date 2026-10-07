import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-image-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with ${result.status}`)
	}
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/image')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	symlinkSync(join(packageRoot, 'node_modules/octane'), join(modules, 'octane'), 'dir')
	// The leaf's ImageProps extends core ui's — consumers resolve its types
	// through the @octane-xplat/ui peer, whose surface in turn references
	// @nativescript/core ambient namespaces (android.*, UIKit classes) that
	// @nativescript/types declares globally — source it from ui's own
	// devDependencies where it is installed.
	mkdirSync(join(modules, '@octane-xplat'), { recursive: true })
	mkdirSync(join(modules, '@nativescript'), { recursive: true })
	symlinkSync(
		join(packageRoot, 'node_modules', '@octane-xplat/ui'),
		join(modules, '@octane-xplat/ui'),
		'dir',
	)

	symlinkSync(
		join(packageRoot, 'node_modules', '@nativescript/core'),
		join(modules, '@nativescript/core'),
		'dir',
	)

	symlinkSync(
		join(repoRoot, 'packages/ui/node_modules/@nativescript/types'),
		join(modules, '@nativescript/types'),
		'dir',
	)

	writeFileSync(
		join(consumerRoot, 'consumer.tsx'),
		`import {
	Image,
	clearImageCaches,
	evictImage,
	initializeImageCache,
	isImageCached,
	prefetch,
	type ImageCacheConfig,
	type ImageCachePolicy,
	type ImageCacheQueryOptions,
	type ImageCacheState,
	type ImageProps,
	type PrefetchOptions,
} from '@octane-xplat/image'
const config: ImageCacheConfig = { memoryCacheScreens: 2 }
initializeImageCache(config)
// The core Image contract — same names/types as @octane-xplat/ui's Image.
const props: ImageProps = {
	src: [
		{ uri: 'https://example.com/a.png', width: 400, height: 300 },
		{ uri: 'https://example.com/a@2x.png', width: 400, height: 300, scale: 2 },
	],
	alt: 'a',
	placeholder: 'blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj',
	recyclingKey: 'row-7',
	contentFit: 'scale-down',
	contentPosition: 'top right',
	cachePolicy: 'none',
}
const image = <Image {...props} onLoad={(e) => console.log(e.width, e.source)} />
// @ts-expect-error src is required
const missingSource = <Image />
// @ts-expect-error contentFit follows the CSS object-fit vocabulary
const invalidFit = <Image src="a.png" contentFit="aspectFill" />
// @ts-expect-error only 'memory-disk' and 'none' are honest cache policies
const invalidPolicy = <Image src="a.png" cachePolicy="memory" />
const policy: ImageCachePolicy = 'memory-disk'
const state: Promise<Record<string, ImageCacheState>> = isImageCached('https://example.com/a.png')
const query: ImageCacheQueryOptions = { decodeWidth: 200, decodeHeight: 100 }
const batch: Promise<Record<string, ImageCacheState>> = isImageCached(
	['https://example.com/a.png', 'https://example.com/b.png'],
	query,
)
void batch
const prefetchResult: Promise<boolean> = prefetch(
	['https://example.com/a.png', 'https://example.com/b.png'],
	{ headers: { Authorization: 'Bearer x' }, concurrency: 3 } satisfies PrefetchOptions,
)
void prefetchResult
void evictImage('https://example.com/a.png')
void clearImageCaches()
${target === 'web' ? 'const webReturn: import("octane/jsx-runtime").JSX.Element = Image(props)' : ''}
void image
void missingSource
void invalidFit
void invalidPolicy
void policy
void state
`,
	)

	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: mode.module,
					moduleResolution: mode.moduleResolution,
					target: 'esnext',
					jsx: 'react-jsx',
					jsxImportSource: 'octane',
					customConditions: [target],
					types: ['@nativescript/types'],
					// NativeScript apps always run skipLibCheck — core's own
					// d.ts graph does not typecheck standalone.
					skipLibCheck: true,
				},
				files: ['consumer.tsx'],
			},
			null,
			2,
		),
	)

	run(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
		consumerRoot,
	)
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
	assert.ok(
		workspaceManifest.publishConfig?.exports,
		'the package declares publish-time export mappings',
	)

	const exportMaps = [workspaceManifest.exports, packedManifest.exports]
	const uniqueExportMaps = exportMaps.filter(
		(exportsMap, index) =>
			exportsMap &&
			exportMaps.findIndex(
				(candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
			) === index,
	)

	for (const [index, exportsMap] of uniqueExportMaps.entries()) {
		const consumerPackage = join(temporary, `package-${index}`)
		cpSync(packedRoot, consumerPackage, { recursive: true })
		if (index > 0) {
			const consumerManifestPath = join(consumerPackage, 'package.json')
			const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
			consumerManifest.exports = exportsMap
			writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)
		}

		for (const target of ['web', 'native']) {
			for (const mode of [
				{ name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
				{ name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log('image packed consumer: web/native exports typecheck in Bundler and NodeNext modes')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
