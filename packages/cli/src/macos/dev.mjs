import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'
import { inspectMacOSDevConfig } from './config.mjs'
import { buildMacOSNative, discoverMacOSNative, writeNativeBootstrap } from './native.mjs'
import { hostBundle, inspectJscHost, validateHostBundle } from './jsc-host/runtime.mjs'
import { createMacOSDevBundle } from './dev-bundle.mjs'

export { runMacOSWebViewDev } from './webview-dev.mjs'

/** Run the configured Vite watcher and native host, restarting after native edits. */
export async function runMacOSDev(appRoot = process.cwd()) {
	appRoot = resolve(appRoot)
	const readManifest = () => JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
	const target = readManifest().xplat?.targets?.macos
	if (target?.renderer === 'webview') {
		const { runMacOSWebViewDev } = await import('./webview-dev.mjs')
		return runMacOSWebViewDev(appRoot)
	}

	if (target?.runtime !== 'appkit-node-api') {
		throw new Error('Declare xplat.targets.macos.runtime as "appkit-node-api"')
	}

	const config = inspectMacOSDevConfig(appRoot, target.dev, target.renderer)
	if (config.issues.length) {
		throw new Error(config.issues.join('; '))
	}

	const inspection = inspectJscHost()
	if (inspection.issues.length) {
		throw new Error(`JavaScriptCore host is unavailable: ${inspection.issues.join('; ')}`)
	}

	const { build } = await import(
		pathToFileURL(createRequire(join(appRoot, 'package.json')).resolve('vite')).href
	)

	const prepare = () =>
		buildMacOSNative(appRoot, {
			minimumSystemVersion: readManifest().xplat?.targets?.macos?.package?.minimumSystemVersion,
		})

	let artifact = await prepare()
	const devBundle = await createMacOSDevBundle(appRoot, readManifest())
	const hostExecutable = devBundle.executable
	const devRoot = join(appRoot, 'node_modules/.cache/xplat/macos-dev')
	await mkdir(devRoot, { recursive: true })
	const bootstrap = join(devRoot, `bootstrap-${process.pid}.js`)
	let watcher
	let host
	let input
	let polling
	let rebuilding = null
	let stopping = false
	let restarting = false
	let observed = artifact.fingerprint
	let lastError
	let resolveDone
	let rejectDone
	const done = new Promise((resolve, reject) => {
		resolveDone = resolve
		rejectDone = reject
	})

	// Attach a rejection handler before any async startup can fail.
	done.catch(() => {})
	const stop = () => {
		stopping = true
		resolveDone()
	}

	const launch = async () => {
		await writeNativeBootstrap(artifact, bootstrap)
		host = spawn(
			hostExecutable,
			[
				join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
				config.shellBundleFile ?? config.bundleFile,
				artifact.metadata,
				bootstrap,
			],
			{
				cwd: appRoot,
				env: {
					...process.env,
					NODE_ENV: 'development',
					OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
					...(config.shellBundleFile ? { OCTANE_MACOS_DEV_BUNDLE: config.bundleFile } : {}),
				},
				stdio: ['pipe', 'pipe', 'pipe'],
			},
		)

		host.stdout.pipe(process.stdout)
		host.stderr.pipe(process.stdout)
		host.stdin.on('error', (error) => {
			if (error.code !== 'EPIPE') {
				console.error('[macos] host input failed', error)
			}
		})

		host.once('error', rejectDone)
		host.once('close', (code, signal) => {
			if (!restarting && !stopping) {
				if (code || signal) {
					rejectDone(new Error(`macOS host exited: ${code ?? signal}`))
				} else {
					resolveDone()
				}
			}
		})

		console.log(
			`[macos-native] host started pid=${host.pid}; ${artifact.libraries.length} leaf libraries`,
		)
	}

	const retire = async () => {
		if (!host || host.exitCode !== null || host.signalCode !== null) {
			return
		}

		await new Promise((resolve) => {
			const timer = setTimeout(() => host.kill('SIGKILL'), 3000)
			host.once('close', () => {
				clearTimeout(timer)
				resolve()
			})

			host.kill('SIGTERM')
		})
	}

	const restart = async (next) => {
		restarting = true
		try {
			await retire()
			artifact = next
			if (!stopping) {
				await launch()
			}
		} finally {
			restarting = false
		}
	}

	try {
		process.on('SIGINT', stop)
		process.on('SIGTERM', stop)
		if (config.shellViteConfig) {
			await build({ configFile: config.shellViteConfig, mode: 'development' })
		}

		watcher = await build({
			configFile: config.viteConfig,
			mode: 'development',
			build: { watch: {} },
		})

		let first = true
		await new Promise((resolve, reject) => {
			watcher.on('event', (event) => {
				if (event.code === 'BUNDLE_END') {
					if (first) {
						first = false
						resolve()
					} else if (config.shellBundleFile && host?.stdin.writable) {
						host.stdin.write('reload\n')
					} else if (host && !rebuilding && !stopping) {
						rebuilding = restart(artifact)
							.catch(rejectDone)
							.finally(() => {
								rebuilding = null
							})
					}
				} else if (event.code === 'ERROR') {
					console.error('[macos] JS rebuild failed; preserving the running app', event.error)
					if (first) {
						reject(event.error)
					}
				}
			})
		})

		await validateHostBundle(config.shellBundleFile ?? config.bundleFile, appRoot)
		await launch()
		if (process.env.OCTANE_MACOS_AUTOMATION === '1') {
			input = createInterface({ input: process.stdin })
			input.on('line', (line) => {
				if (host?.stdin.writable) {
					host.stdin.write(`${line}\n`)
				}
			})
		}

		polling = setInterval(() => {
			if (rebuilding || stopping) {
				return
			}

			rebuilding = (async () => {
				try {
					const fingerprint = discoverMacOSNative(appRoot).fingerprint
					if (fingerprint === observed) {
						return
					}

					observed = fingerprint
					const next = await prepare()
					if (next.key !== artifact.key || next.metadata !== artifact.metadata) {
						await restart(next)
						console.log('[macos-native] native rebuild applied')
					} else {
						artifact = next
					}

					lastError = undefined
				} catch (error) {
					const message = String(error)
					if (message !== lastError) {
						console.error('[macos-native] rebuild failed; preserving the running app', message)
					}

					lastError = message
				}
			})().finally(() => {
				rebuilding = null
			})
		}, 1000)

		await done
	} finally {
		stopping = true
		clearInterval(polling)
		process.off('SIGINT', stop)
		process.off('SIGTERM', stop)
		input?.close()
		if (input) {
			process.stdin.pause()
		}

		await rebuilding
		await watcher?.close()
		await retire()
		await devBundle.cleanup()
	}
}
