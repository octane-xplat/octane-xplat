import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-stripe-consumer-'))

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
	assert.equal(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`)
}

const chunks = (result) =>
	(Array.isArray(result) ? result : [result]).flatMap((output) => output.output)

try {
	const packed = join(temporary, 'packed')
	await mkdir(packed)
	run('pnpm', ['pack', '--config.ignore-scripts=true', '--pack-destination', packed], packageRoot)
	const tarballs = (await readdir(packed)).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1)
	const modules = join(temporary, 'node_modules')
	const scoped = join(modules, '@octane-xplat')
	await mkdir(scoped, { recursive: true })
	run('tar', ['-xzf', join(packed, tarballs[0]), '-C', packed], temporary)
	const unpacked = join(packed, 'package')
	await symlink(unpacked, join(scoped, 'stripe'), 'dir')
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
import { Stripe, initStripe, initPaymentSheet, presentPaymentSheet, resetPaymentSheet, useStripe } from '@octane-xplat/stripe'
import type { InitPaymentSheetResult, PresentPaymentSheetResult } from '@octane-xplat/stripe'
export async function checkout(publishableKey: string, paymentIntentClientSecret: string): Promise<PresentPaymentSheetResult> {
 await initStripe({ publishableKey })
 const initialized: InitPaymentSheetResult = await initPaymentSheet({ merchantDisplayName: 'Store', paymentIntentClientSecret, returnURL: 'https://example.com/return' })
 return initialized.error ? initialized : presentPaymentSheet()
}
export { Stripe, useStripe, resetPaymentSheet }
// @ts-expect-error customFlow is outside the supported contract
initPaymentSheet({ merchantDisplayName: 'Store', paymentIntentClientSecret: 'fixture', customFlow: true })
`,
	)
	await readFile(
		join(unpacked, 'platforms/android/java/com/octanexplat/stripe/PaymentSheetBridge.java'),
	)
	await readFile(join(unpacked, 'platforms/android/AndroidManifest.xml'))
	await readFile(join(unpacked, 'nativescript.config.ts'))
	await readFile(join(unpacked, 'platforms/ios/src/XplatStripePaymentSheet.swift'))
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
		chunks(browser).some((chunk) => chunk.type === 'chunk' && chunk.exports.includes('checkout')),
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
			noExternal: ['@octane-xplat/stripe', '@octane-xplat/lib'],
			resolve: { conditions: ['native'] },
		},
	})
	// A packed iOS graph must reach its real platform backend, not the unsupported fallback.
	assert.ok(
		chunks(native).some(
			(chunk) =>
				chunk.type === 'chunk' &&
				chunk.code.includes('XplatStripePaymentSheet') &&
				chunk.code.includes('presentCompletion'),
		),
	)
	console.log(
		'Packed consumer: ambient-free public types, web production bundle, and iOS SDK bridge resolution, and packaged native bridges/config passed.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
