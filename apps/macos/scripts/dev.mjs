import { build } from 'vite'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { join, resolve } from 'node:path'
import { hostBundle, hostRoot, inspectJscHost } from '../../../packages/cli/src/macos/jsc-host/runtime.mjs'

const appRoot = resolve(import.meta.dirname, '..')
const appConfig = join(appRoot, 'vite.dev.config.mjs')
const shellConfig = join(appRoot, 'vite.dev-shell.config.mjs')
const appBundle = join(appRoot, 'dist/dev/app.cjs')
const shellBundle = join(appRoot, 'dist/dev/shell.cjs')
const inspection = inspectJscHost()
if (inspection.issues.length) throw Error(`JavaScriptCore host is unavailable: ${inspection.issues.join('; ')}`)

await build({ configFile: shellConfig, mode: 'development' })
const watcher = await build({ configFile: appConfig, mode: 'development', build: { watch: {} } })
let host
let input
let stop
let stopping = false
let firstBundle = true
let settleReady
const ready = new Promise((resolve, reject) => { settleReady = { resolve, reject } })
watcher.on('event', (event) => {
	if (event.code === 'BUNDLE_END') {
		if (firstBundle) { firstBundle = false; settleReady.resolve() }
		else if (host?.stdin.writable) host.stdin.write('reload\n')
	} else if (event.code === 'ERROR') {
		console.error('[macos] rebuild failed; the last good component is still mounted', event.error)
		if (firstBundle) settleReady.reject(event.error)
	}
})

try {
	await ready
	host = spawn(join(hostBundle, 'host'), [
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		shellBundle,
		join(hostBundle, 'metadata.nsmd'),
		join(hostRoot, 'shim.js'),
	], {
		cwd: appRoot,
		env: { ...process.env, NODE_ENV: 'development', OCTANE_MACOS_EXTERNAL_RUNLOOP: '1', OCTANE_MACOS_DEV_BUNDLE: appBundle },
		stdio: ['pipe', 'pipe', 'pipe'],
	})
	host.stdout.pipe(process.stdout)
	host.stderr.pipe(process.stdout)
	host.stdin.on('error', (error) => {
		if (error.code !== 'EPIPE') console.error('[macos] host input failed', error)
	})
	if (process.env.OCTANE_MACOS_AUTOMATION === '1') {
		input = createInterface({ input: process.stdin })
		input.on('line', (line) => {
			if (host.stdin.writable) host.stdin.write(`${line}\n`)
		})
	}
	stop = () => { stopping = true; host.kill('SIGTERM') }
	process.on('SIGINT', stop)
	process.on('SIGTERM', stop)
	const result = await new Promise((resolve, reject) => {
		host.once('error', reject)
		host.once('close', (code, signal) => resolve({ code, signal }))
	})
	if (result.code && result.code !== 0) process.exitCode = result.code
	else if (result.signal && !stopping) process.exitCode = 1
	console.log('[macos] JavaScriptCore host exited')
} finally {
	if (stop) { process.off('SIGINT', stop); process.off('SIGTERM', stop) }
	input?.close()
	process.stdin.pause()
	await watcher.close()
	if (host && host.exitCode === null && host.signalCode === null) host.kill('SIGTERM')
}
