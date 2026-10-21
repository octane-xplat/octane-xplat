// Optional local Chromium qualification. Kept outside *.test.mjs so PR
// checks never install engines or start browsers. Build the CLI first and
// use the existing apps/web Playwright installation; no images are captured.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { listDevRuns, readDevLogs } from '../dist/dev-logs.js'
const requireWeb = createRequire(new URL('../../../apps/web/package.json', import.meta.url))
const { chromium } = requireWeb('playwright')
const cache = fileURLToPath(new URL('../node_modules/.cache/', import.meta.url))
mkdirSync(cache, { recursive: true })
const root = mkdtempSync(join(cache, 'logs-browser-'))
writeFileSync(
	join(root, 'package.json'),
	JSON.stringify({
		name: 'dev-log-smoke',
		private: true,
		dependencies: { '@octane-xplat/ui': '0.16.1' },
	}),
)

const bridgeUrl = new URL('../dist/mcp/dev-bridge.js', import.meta.url).href
writeFileSync(
	join(root, 'vite.config.mjs'),
	`import { xplatDevBridge } from ${JSON.stringify(bridgeUrl)}; export default {plugins:[xplatDevBridge()],server:{host:'127.0.0.1',port:0}}`,
)

writeFileSync(
	join(root, 'index.html'),
	'<!doctype html><html><head></head><body><script type="module">console.warn("warning-before-agent");setTimeout(()=>{throw new Error("uncaught-before-agent")},20);Promise.reject("rejection-before-agent");</script></body></html>',
)

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const child = spawn(process.execPath, [cli, 'dev', 'web'], {
	cwd: root,
	stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
child.stdout.on('data', (chunk) => (output += chunk))
child.stderr.on('data', (chunk) => (output += chunk))
let browser
const wait = async (predicate) => {
	const deadline = Date.now() + 15000
	while (Date.now() < deadline) {
		const result = predicate()
		if (result) {
			return result
		}

		if (child.exitCode !== null) {
			throw new Error(`Development command exited ${child.exitCode}: ${output.slice(-2000)}`)
		}

		await new Promise((resolve) => setTimeout(resolve, 50))
	}
	throw new Error(`Condition timed out: ${output.slice(-2000)}`)
}

try {
	const url = await wait(() => /http:\/\/127\.0\.0\.1:\d+\//.exec(output)?.[0])
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	await page.goto(url)
	const run = await wait(() => listDevRuns(root)[0])
	await wait(() => {
		const lines = readDevLogs(root, run.runId)
			.records.map((r) => r.line)
			.join('\n')
		return ['warning-before-agent', 'uncaught-before-agent', 'rejection-before-agent'].every((s) =>
			lines.includes(s),
		)
	})

	const listed = JSON.parse(
		execFileSync(process.execPath, [cli, 'diagnostics', '--project', root, '--json'], {
			encoding: 'utf8',
		}),
	)

	assert.equal(listed.ok, true)
	assert.equal(listed.data.runs[0].runId, run.runId)
	await browser.close()
	browser = null
	const closed = new Promise((resolve) => child.once('close', resolve))
	child.kill('SIGTERM')
	await closed
	const after = JSON.parse(
		execFileSync(
			process.execPath,
			[cli, 'diagnostics', '--run', run.runId, '--project', root, '--cursor', '0', '--json'],
			{ encoding: 'utf8' },
		),
	)

	assert.equal(after.ok, true)
	assert.equal(after.data.logs.historical, true)
	assert.ok(
		after.data.logs.records.some(
			(r) => r.line.includes('uncaught-before-agent') && r.source === 'browser',
		),
	)

	const requireCli = createRequire(new URL('../package.json', import.meta.url))
	const { build } = await import(pathToFileURL(requireCli.resolve('vite')).href)
	await build({ root, logLevel: 'silent' })
	const release = readFileSync(join(root, 'dist/index.html'), 'utf8')
	assert.ok(!release.includes('__XPLAT_LOGS_INSTALLED__'))
	assert.ok(!release.includes('__xplat_dev__/logs'))
	console.log(
		'PASS: real Chromium warnings/errors/rejections recorded before agent connection, CLI reads after dev exit, and release HTML excludes forwarding.',
	)
} finally {
	await browser?.close()
	if (child.exitCode === null && child.signalCode === null) {
		const closed = new Promise((resolve) => child.once('close', resolve))
		child.kill('SIGTERM')
		await closed
	}

	rmSync(root, { recursive: true, force: true })
}
