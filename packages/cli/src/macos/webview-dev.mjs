import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { inspectMacOSDevConfig } from './config.mjs'
import { buildMacOSNative, discoverMacOSNative, writeNativeBootstrap } from './native.mjs'
import { hostBundle, inspectJscHost, validateHostBundle } from './jsc-host/runtime.mjs'
import { macOSExecutable } from './executables.mjs'

/** Run the configured DOM frontend in WKWebView with a CLI-managed JSC host. */
export async function runMacOSWebViewDev(appRoot = process.cwd()) {
	appRoot = resolve(appRoot)
	const readManifest = () => JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
	const target = readManifest().xplat?.targets?.macos
	if (target?.runtime !== 'appkit-node-api') {
		throw new Error('Declare xplat.targets.macos.runtime as "appkit-node-api"')
	}

	const config = inspectMacOSDevConfig(appRoot, target.dev, 'webview')
	if (config.issues.length) {
		throw new Error(config.issues.join('; '))
	}

	const inspection = inspectJscHost()
	if (inspection.issues.length) {
		throw new Error(`JavaScriptCore host is unavailable: ${inspection.issues.join('; ')}`)
	}

	const vite = await import(
		pathToFileURL(createRequire(join(appRoot, 'package.json')).resolve('vite')).href
	)

	const { build, createServer } = vite
	const prepare = () =>
		buildMacOSNative(appRoot, {
			minimumSystemVersion: readManifest().xplat?.targets?.macos?.package?.minimumSystemVersion,
		})

	let artifact = await prepare()
	const hostExecutable = await macOSExecutable(appRoot, 'macos-arm64/host')
	const devRoot = join(appRoot, 'node_modules/.cache/xplat/macos-dev')
	await mkdir(devRoot, { recursive: true })
	const bootstrap = join(devRoot, `bootstrap-${process.pid}.js`)
	let webServer
	let webAddress
	let watcher
	let host
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

	done.catch(() => {})

	const stop = () => {
		stopping = true
		resolveDone()
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

	const launch = async () => {
		await writeNativeBootstrap(artifact, bootstrap)
		host = spawn(
			hostExecutable,
			[
				join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
				config.hostBundleFile,
				artifact.metadata,
				bootstrap,
			],
			{
				cwd: appRoot,
				env: {
					...process.env,
					NODE_ENV: 'development',
					OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
					OCTANE_MACOS_WEBVIEW_URL: webAddress,
				},
				stdio: ['pipe', 'pipe', 'pipe'],
			},
		)

		host.stdout.pipe(process.stdout)
		host.stderr.pipe(process.stdout)
		host.stdin.on('error', (error) => {
			if (error.code !== 'EPIPE') {
				console.error('[macos-webview] host input failed', error)
			}
		})

		host.once('error', rejectDone)
		host.once('close', (code, signal) => {
			if (restarting || stopping) {
				return
			}

			if (code || signal) {
				rejectDone(new Error(`macOS webview host exited: ${code ?? signal}`))
			} else {
				resolveDone()
			}
		})

		console.log(`[macos-webview] host started pid=${host.pid}`)
	}

	const restart = async (nextArtifact = artifact) => {
		restarting = true
		try {
			await retire()
			artifact = nextArtifact
			if (!stopping) {
				await launch()
			}
		} finally {
			restarting = false
		}
	}

	const signalStop = () => stop()
	try {
		process.on('SIGINT', signalStop)
		process.on('SIGTERM', signalStop)

		webServer = await createServer({
			configFile: config.webViteConfig,
			mode: 'development',
			server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: true },
		})

		await webServer.listen()
		const address = webServer.httpServer.address()
		if (!address || typeof address === 'string') {
			throw new Error('Vite did not provide a local webview development address')
		}

		webAddress = webServer.resolvedUrls?.local?.[0] ?? `http://127.0.0.1:${address.port}/`
		console.log(`[macos-webview] frontend ${webAddress}`)

		watcher = await build({
			configFile: config.hostViteConfig,
			mode: 'development',
			build: { watch: {} },
		})

		await new Promise((resolve, reject) => {
			let first = true
			watcher.on('event', (event) => {
				if (event.code === 'BUNDLE_END') {
					if (first) {
						first = false
						resolve()
					} else if (!rebuilding && !stopping) {
						rebuilding = restart()
							.catch(rejectDone)
							.finally(() => {
								rebuilding = null
							})
					}
				} else if (event.code === 'ERROR') {
					console.error(
						'[macos-webview] host rebuild failed; preserving the running app',
						event.error,
					)

					if (first) {
						reject(event.error)
					}
				}
			})
		})

		await validateHostBundle(config.hostBundleFile, appRoot)
		await launch()
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
						console.log('[macos-webview] native rebuild applied')
					} else {
						artifact = next
					}

					lastError = undefined
				} catch (error) {
					const message = String(error)
					if (message !== lastError) {
						console.error(
							'[macos-webview] native rebuild failed; preserving the running app',
							message,
						)
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
		process.off('SIGINT', signalStop)
		process.off('SIGTERM', signalStop)
		clearInterval(polling)
		if (watcher) {
			await watcher.close()
		}

		if (webServer) {
			await webServer.close()
		}

		await retire()
	}
}
