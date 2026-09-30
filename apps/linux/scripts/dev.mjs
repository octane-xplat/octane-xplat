#!/usr/bin/env node
// dev.mjs — one-command Linux dev: vite on :5201 + the webview host pointed
// at it. On macOS the host is the WKWebView stand-in (host/run.sh); on real
// Linux it's gjs-host.js. Closing the host window stops the server.
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const url = 'http://localhost:5201'
const extraArgs = process.argv.slice(2) // e.g. --self-test

const vite = spawn(
	'vite', ['--config', 'vite.linux.config.ts', '--port', '5201', '--strictPort'],
	{ cwd: appRoot, stdio: 'inherit' },
)

async function waitForServer() {
	for (let i = 0; i < 300; i++) {
		try {
			const res = await fetch(url)
			if (res.ok) { return true }
		} catch {}

		await new Promise((r) => setTimeout(r, 100))
	}

	return false
}

function launchHost() {
	const [cmd, args] =
		process.platform === 'darwin'
			? ['sh', [join(appRoot, 'host/run.sh'), url]]
			: ['gjs', [join(appRoot, 'host/gjs-host.js'), url]]

	return spawn(cmd, [...args, ...extraArgs], { cwd: join(appRoot, 'host'), stdio: 'inherit' })
}

if (!(await waitForServer())) {
	console.error('[linux dev] vite never came up on :5201')
	vite.kill()
	process.exit(1)
}

const host = launchHost()
let exiting = false

function shutdown(code) {
	if (exiting) { return }
	exiting = true
	vite.kill()
	process.exit(code)
}

host.on('exit', (code) => shutdown(code ?? 0))
vite.on('exit', (code) => { if (!exiting) { host.kill(); process.exit(code ?? 0) } })
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
