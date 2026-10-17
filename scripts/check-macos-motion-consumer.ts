// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Package acceptance only: real core shim + universal object driver. This does
// not load AppKit or qualify transforms, clipping, input, or OS preferences.
export async function checkMacOSMotionConsumer({
	packageRoot,
	consumerRoot,
	packageName,
	exportsMap,
}) {
	const require = createRequire(join(packageRoot, 'package.json'))
	const { build } = await import(pathToFileURL(require.resolve('vite')).href)
	const { octane } = await import(pathToFileURL(require.resolve('octane/compiler/vite')).href)
	const repoRoot = resolve(packageRoot, '../..')
	const entry = join(consumerRoot, 'safe-import.ts')
	writeFileSync(
		entry,
		`export * from '${packageName}'\nexport { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'\n`,
	)

	let resolvedEntry = false
	await build({
		configFile: false,
		root: consumerRoot,
		logLevel: 'warn',
		plugins: [
			{
				name: 'macos-package-boundary',
				generateBundle() {
					const modules = [...this.getModuleIds()]
					assert.equal(
						modules.some((id) => id.includes('@nativescript-community/gesturehandler')),
						false,
						'no mobile gesture backend in macOS graph',
					)

					const expected = realpathSync(
						join(consumerRoot, 'node_modules', packageName, exportsMap['.'].macos),
					)

					assert.ok(
						modules.includes(expected),
						`macos condition must select ${expected}; resolved: ${modules.filter((id) => id.includes(packageName)).join(', ')}`,
					)

					resolvedEntry = true
				},
			},
			octane({
				ssr: false,
				renderers: {
					registry: {
						macos: {
							module: '@octane-xplat/macos-renderer',
							target: 'universal',
							server: 'unsupported',
							text: 'host',
							intrinsics: '@octane-xplat/macos-renderer/intrinsics',
						},
					},
					rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
				},
			}),
		],
		resolve: {
			conditions: ['macos', 'native'],
			dedupe: ['octane'],
			extensions: [
				'.macos.tsrx',
				'.tsrx',
				'.macos.tsx',
				'.tsx',
				'.macos.ts',
				'.ts',
				'.mts',
				'.ts',
				'.jsx',
				'.js',
				'.json',
			],
			alias: [
				{ find: /^octane$/, replacement: 'octane/universal/native' },
				// Substitute only the driver: keep the production core compatibility
				// surface so missing named mobile exports still fail the build.
				{ find: /^@octane-xplat\/macos-renderer$/, replacement: 'octane/universal/native' },
				{ find: /^@nativescript-community\/octane$/, replacement: 'octane/universal/native' },
				{
					find: /^@nativescript\/core(?:\/animation-frame)?$/,
					replacement: join(repoRoot, 'packages/macos-renderer/src/native-core-shim.ts'),
				},
			],
		},
		build: {
			outDir: join(consumerRoot, 'safe-import'),
			emptyOutDir: true,
			minify: false,
			lib: { entry, formats: ['es'], fileName: () => 'index.ts' },
		},
	})

	assert.equal(resolvedEntry, true, 'macos condition resolved the public package import')
	const bundle = join(consumerRoot, 'safe-import/index.ts')
	assert.doesNotMatch(readFileSync(bundle, 'utf8'), /@nativescript-community\/gesturehandler/)

	// Detect startup timers, preference polling, or eager frame scheduling.
	const timeout = globalThis.setTimeout
	const interval = globalThis.setInterval
	const unexpectedTimer = () => {
		throw new Error('package import installed a startup timer')
	}

	let api
	try {
		globalThis.setTimeout = unexpectedTimer
		globalThis.setInterval = unexpectedTimer
		api = await import(pathToFileURL(bundle).href)
	} finally {
		globalThis.setTimeout = timeout
		globalThis.setInterval = interval
	}

	const container = api.createObjectContainer('macos')
	const driver = api.createObjectDriver('macos')
	const originalTransaction = globalThis.CATransaction
	if (packageName === '@octane-xplat/motion') {
		// Supply explicit AppKit property doubles for this import/mount check.
		// The object driver alone has no NSView/CALayer behavior.
		const publicInstance = driver.getPublicInstance.bind(driver)
		driver.getPublicInstance = (...args) => {
			const node = publicInstance(...args)
			if (!node.layer) {
				const values = new Map()
				node.alphaValue = 1
				node.layer = {
					valueForKeyPath: (path) => values.get(path) ?? (path.includes('scale') ? 1 : 0),
					setValueForKeyPath: (value, path) => values.set(path, value),
				}
			}

			return node
		}

		globalThis.CATransaction = { begin() {}, setDisableActions() {}, commit() {} }
	}

	const root = api.createUniversalRoot(container, driver)
	try {
		if (packageName === '@octane-xplat/motion') {
			assert.deepEqual(
				Object.keys(api).filter((name) => !name.startsWith('create')),
				[
					'MotionConfig',
					'Presence',
					'motion',
					'useAnimate',
					'useMotionValue',
					'useMotionValueEvent',
					'useReducedMotion',
					'useSpring',
					'useTransform',
				],
			)

			for (const host of [api.motion.View, api.motion.Row, api.motion.Pressable]) {
				root.render(host, { id: 'safe-motion' })
				assert.equal(container.children.length, 1, 'motion host mounts with default props')
			}
		} else {
			assert.equal(typeof api.RollingText, 'function')
			root.render(api.RollingText, { value: 'Ready', id: 'safe-rolling-text' })
		}

		assert.equal(container.children.length, 1, 'initial object-driver mount creates a host')
	} finally {
		root.unmount()
		if (originalTransaction === undefined) {
			delete globalThis.CATransaction
		} else {
			globalThis.CATransaction = originalTransaction
		}
	}

	assert.equal(container.children.length, 0, 'unmount removes the host')
}
