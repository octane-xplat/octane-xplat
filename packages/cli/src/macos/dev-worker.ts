// Project development engine. Native sessions retain policy and lifetime ownership.
import { readFileSync, writeFileSync, renameSync, statSync, lstatSync, realpathSync, readdirSync } from 'node:fs'
import { Console } from 'node:console'
import { runMacOSDev } from './dev.ts'
import { installedPackageRoot } from '../package-root.ts'

const [, , input, output] = process.argv
if (!input || !output) { throw new Error('Usage: node dev-worker.js REQUEST.json READY.json') }
const protocol = 'octane-dev-worker', version = 1
globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })
let id: unknown = null
function reply(value: Record<string, unknown>): void {
	const temporary = output + '.next'
	writeFileSync(temporary, JSON.stringify({ protocol, version, id, ...value }))
	renameSync(temporary, output)
}
try {
	if (statSync(input).size > 65536) { throw new Error('Development request exceeds 64 KiB') }
	const request = JSON.parse(readFileSync(input, 'utf8'))
	id = request.id
	if (request.protocol !== protocol || request.version !== version || typeof id !== 'string' || request.operation !== 'macos-dev') {
		throw new Error('Unsupported development worker request')
	}
	if (process.platform !== 'darwin') { throw new Error('macOS development requires a Mac') }
	if (typeof request.project !== 'string' || realpathSync(request.project) !== realpathSync(process.cwd())) {
		throw new Error('Development project must match the selected working directory')
	}
	const resource = request.resourceRoot
	if (typeof resource !== 'string' || !lstatSync(resource).isDirectory() || readdirSync(resource).length) {
		throw new Error('Expected an empty native-owned development resource directory')
	}
	for (const name of ['vite', 'octane', '@nativescript/macos-node-api']) {
		if (!installedPackageRoot(process.cwd(), name)) { throw new Error(`Install ${name} in the selected project before starting macOS development`) }
	}
	await runMacOSDev(process.cwd(), {
		resourceRoot: resource,
		onReady: (meta: Record<string, unknown>) => reply({ ok: true, data: meta }),
	})
} catch (error) {
	const message = error instanceof Error ? error.message : String(error)
	console.error(message)
	reply({ ok: false, error: { code: 'execution_failure', message: message.slice(0, 8192) } })
	process.exitCode = 1
}
