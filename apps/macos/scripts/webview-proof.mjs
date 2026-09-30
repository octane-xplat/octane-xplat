import { spawn } from 'node:child_process'
import { createServer, build } from 'vite'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../../packages/cli/src/macos/native.mjs'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.mjs'
import { hostBundle } from '../../../packages/cli/src/macos/jsc-host/runtime.mjs'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
const verifying = process.argv.includes('--verify')

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	throw new Error('The WKWebView proof requires an Apple Silicon Mac.')
}

const webServer = await createServer({
	configFile: resolve(appRoot, 'vite.webview-proof.config.mjs'),
})

let child
let stopping = false

async function stop() {
	if (stopping) {
		return
	}

	stopping = true
	if (child && child.exitCode === null) {
		const exited = new Promise((resolveExit) => child.once('exit', resolveExit))
		child.kill('SIGTERM')
		let forceTimer
		await Promise.race([
			exited,
			new Promise((resolveTimeout) => {
				forceTimer = setTimeout(resolveTimeout, 3000)
			}),
		])

		clearTimeout(forceTimer)
		if (child.exitCode === null) {
			child.kill('SIGKILL')
		}
	}

	await webServer.close()
}

process.once('SIGINT', () => {
	void stop()
})

process.once('SIGTERM', () => {
	void stop()
})

try {
	console.log('[webview-proof] building typed JSC host bundle')
	await build({ configFile: resolve(appRoot, 'vite.webview-host.config.mjs') })

	console.log('[webview-proof] compiling WKWebView native leaf and metadata')
	const native = await buildMacOSNative(appRoot)
	const hostExecutable = await macOSExecutable(appRoot, 'macos-arm64/host')
	const bootstrap = resolve(appRoot, 'node_modules/.cache/xplat/webview-proof/bootstrap.js')
	await mkdir(dirname(bootstrap), { recursive: true })
	await writeNativeBootstrap(native, bootstrap)

	await webServer.listen()
	const address = webServer.httpServer?.address()
	if (!address || typeof address === 'string') {
		throw new Error('Vite did not open a TCP listener for the webview proof.')
	}

	const url = `http://127.0.0.1:${address.port}/`

	child = spawn(
		hostExecutable,
		[
			resolve(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			resolve(appRoot, 'dist/webview-host/host.cjs'),
			native.metadata,
			bootstrap,
		],
		{
			cwd: appRoot,
			env: {
				...process.env,
				NODE_ENV: verifying ? 'test' : 'development',
				OCTANE_MACOS_EXTERNAL_RUNLOOP: '1',
				OCTANE_MACOS_WEBVIEW_URL: url,
			},
			stdio: ['pipe', 'pipe', 'pipe'],
		},
	)

	let output = ''
	let resolveResult
	let rejectResult
	const result = new Promise((resolvePromise, rejectPromise) => {
		resolveResult = resolvePromise
		rejectResult = rejectPromise
	})

	const capture = (chunk) => {
		const text = chunk.toString()
		output += text
		process.stdout.write(text)
		const match = output.match(/XPLAT_WEBVIEW_PROOF_(OK|FAILED) (\{[^\r\n]*\})/)
		if (!match) {
			return
		}

		if (match[1] === 'FAILED') {
			rejectResult(new Error(`WKWebView proof reported failure: ${match[2]}`))
		} else {
			resolveResult(JSON.parse(match[2]))
		}
	}

	child.stdout.on('data', capture)
	child.stderr.on('data', capture)
	child.once('error', rejectResult)
	child.once('exit', (code, signal) => {
		if (verifying && !output.includes('XPLAT_WEBVIEW_PROOF_OK')) {
			rejectResult(
				new Error(`WKWebView host exited before proof completed (code ${code}, signal ${signal}).`),
			)
		}
	})

	if (verifying) {
		let timeoutId
		const timeout = new Promise((_, reject) => {
			timeoutId = setTimeout(
				() => reject(new Error('Timed out waiting for the WKWebView proof.')),
				60_000,
			)
		})

		let proof
		try {
			proof = await Promise.race([result, timeout])
		} finally {
			clearTimeout(timeoutId)
		}

		console.log(`[webview-proof] verified ${proof.capabilities.length} typed host methods`)
		await stop()
	} else {
		console.log(`[webview-proof] running at ${url}; close the app window or press Ctrl-C to stop`)
		await new Promise((resolveExit) => child.once('exit', resolveExit))
		await stop()
	}
} catch (error) {
	await stop()
	throw error
}
