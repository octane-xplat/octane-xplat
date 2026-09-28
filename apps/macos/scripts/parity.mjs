import { createInterface } from 'node:readline'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = dirname(dirname(fileURLToPath(import.meta.url)))
const repoDir = resolve(appDir, '../..')
const outputFile = join(repoDir, 'parity-report', 'macos.json')
const host = spawn(process.execPath, ['./scripts/dev.mjs'], {
	cwd: appDir,
	env: {
		...process.env,
		OCTANE_MACOS_AUTOMATION: '1',
		OCTANE_MACOS_PARITY_ONLY: '1',
	},
	stdio: ['pipe', 'pipe', 'inherit'],
})

let resolveReady
let rejectReady
let resolveReport
let rejectReport
let hasReport = false
const ready = new Promise((resolve, reject) => {
	resolveReady = resolve
	rejectReady = reject
})
const report = new Promise((resolve, reject) => {
	resolveReport = resolve
	rejectReport = reject
})
const closed = new Promise((resolve) => host.once('close', (code, signal) => resolve({ code, signal })))

function within(promise, timeout, message) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), timeout)
		promise.then(
			(value) => {
				clearTimeout(timer)
				resolve(value)
			},
			(error) => {
				clearTimeout(timer)
				reject(error)
			},
		)
	})
}

host.once('error', (error) => {
	rejectReady(error)
	rejectReport(error)
})
host.once('close', (code, signal) => {
	if (!hasReport) {
		const error = new Error(`AppKit parity host exited before reporting (code=${code}, signal=${signal})`)
		rejectReady(error)
		rejectReport(error)
	}
})

createInterface({ input: host.stdout }).on('line', (line) => {
	if (line.includes('[macos] AppKit window ready')) {resolveReady()}

	const marker = '[parity-json] '
	const at = line.indexOf(marker)
	if (at !== -1) {
		try {
			const dump = JSON.parse(line.slice(at + marker.length))
			hasReport = true
			resolveReport(dump)
		} catch (error) {
			rejectReport(error)
		}
		return
	}

	console.log(line)
})

try {
	await within(ready, 120000, 'Timed out waiting for the AppKit host to start')
	host.stdin.write('parity\n')
	const dump = await within(report, 30000, 'Timed out waiting for the AppKit geometry dump')
	if (dump.target !== 'macos' || !dump.cells || Object.keys(dump.cells).length === 0) {
		throw new Error('AppKit parity returned an empty or malformed dump')
	}

	mkdirSync(dirname(outputFile), { recursive: true })
	writeFileSync(outputFile, JSON.stringify(dump, null, 2))
	console.log(`[parity] macOS dump → parity-report/macos.json (${Object.keys(dump.cells).length} fixtures)`)
} catch (error) {
	console.error('[parity] macOS sweep failed: ' + error.message)
	process.exitCode = 1
} finally {
	host.kill('SIGTERM')
	const result = await Promise.race([closed, new Promise((resolve) => setTimeout(() => resolve(null), 3000))])
	if (!result && host.exitCode === null && host.signalCode === null) {
		host.kill('SIGKILL')
		await closed
	}
}
