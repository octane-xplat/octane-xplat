import { createRequire } from 'node:module'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Generate a separate consumer-owned cache profile; leave app entries untouched. */
export async function workshopMacOSDev({ root, config, story }) {
	if (process.platform !== 'darwin' || process.arch !== 'arm64') {
		throw new Error('The AppKit workshop requires a macOS arm64 execution host')
	}

	const require = createRequire(join(root, 'package.json'))
	for (const name of [
		'@octane-xplat/macos-renderer',
		'@nativescript/macos-node-api',
		'octane',
		'@octanejs/vite-plugin',
		'vite',
	]) {
		try {
			require.resolve(name)
		} catch {
			throw new Error(
				`AppKit workshop prerequisite missing: ${name}; use the matching versions from your app's macOS setup`,
			)
		}
	}

	const cache = join(root, 'node_modules/.cache/xplat/workshop-macos')
	await mkdir(cache, { recursive: true })
	const directory = await mkdtemp(join(cache, 'session-'))
	// Payload sources (fed to the consumer's vite as file paths) ship under
	// src/ only — resolve through src/ whether this module runs from src/ or
	// dist/build/.
	const source = dirname(fileURLToPath(import.meta.url)).replace('/dist/', '/src/')
	const catalogPlugin = join(source, 'macos-vite.ts')
	const shell = join(source, 'macos/shell.macos.ts')
	const bundle = join(directory, 'stories.cjs')
	const shellBundle = join(directory, 'shell.cjs')
	const catalogFile = join(directory, 'catalog.gen.ts')
	const common = `import { xplatMacOS } from '@octane-xplat/cli/macos/vite'
import { macOSCatalogPlugin } from ${JSON.stringify(catalogPlugin)}
const root = ${JSON.stringify(root)}
`

	await writeFile(
		join(directory, 'stories.config.ts'),
		common +
			`
export default async ({ mode }) => {
 const settings = await xplatMacOS(mode, { root, packaged: false, hmr: false })
 return { ...settings, plugins: [macOSCatalogPlugin({ root, config: ${JSON.stringify(config)}, catalogFile: ${JSON.stringify(catalogFile)} }), ...settings.plugins],
  build: { ...settings.build, outDir: ${JSON.stringify(directory)}, emptyOutDir: false,
   lib: { entry: ${JSON.stringify(catalogFile)}, formats: ['cjs'], fileName: () => 'stories.cjs' } } }
}
`,
	)

	await writeFile(
		join(directory, 'entry.ts'),
		`import { startMacOSWorkshop } from ${JSON.stringify(shell)}
startMacOSWorkshop({ bundleFile: ${JSON.stringify(bundle)}, initialStoryId: ${JSON.stringify(story ?? null)},
 offscreen: process.env.OCTANE_WORKSHOP_OFFSCREEN === '1' })
`,
	)

	await writeFile(
		join(directory, 'shell.config.ts'),
		common +
			`
export default async ({ mode }) => {
 const settings = await xplatMacOS(mode, { root, packaged: true, entry: ${JSON.stringify(join(directory, 'entry.ts'))} })
 return { ...settings, build: { ...settings.build, outDir: ${JSON.stringify(directory)}, emptyOutDir: false,
  lib: { entry: ${JSON.stringify(join(directory, 'entry.ts'))}, formats: ['cjs'], fileName: () => 'shell.cjs' } } }
}
`,
	)

	try {
		const { runMacOSDev } = await import('@octane-xplat/cli/macos')
		return await runMacOSDev(root, {
			workshop: true,
			target: {
				runtime: 'appkit-node-api',
				renderer: 'appkit',
				dev: {
					productName: 'Octane component workshop',
					viteConfig: relative(root, join(directory, 'stories.config.ts')),
					bundleFile: relative(root, bundle),
					shellViteConfig: relative(root, join(directory, 'shell.config.ts')),
					shellBundleFile: relative(root, shellBundle),
				},
			},
		})
	} finally {
		await rm(directory, { recursive: true, force: true })
	}
}
