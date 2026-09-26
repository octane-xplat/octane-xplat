// Parity dump (web) — serves apps/web/dist, opens /parity, and writes the
// stage's measured tree to parity-report/web.json for scripts/parity-check.mjs.
// Run after `vite build` (the package script chains it).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const webDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const repoDir = webDir + '/../..'
const PORT = 4320
const BASE = `http://localhost:${PORT}`

// detached: the preview is pnpm→vite — kill the whole process group or the
// vite child outlives the script and orphans the port.
const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT)], {
	cwd: webDir,
	stdio: ['ignore', 'pipe', 'pipe'],
	detached: true,
})

const stopPreview = () => {
	try {
		process.kill(-preview.pid, 'SIGTERM')
	} catch {
		preview.kill()
	}
}

await new Promise((r) => preview.stdout.on('data', (d) => String(d).includes('Local') && r()))
await new Promise((r) => setTimeout(r, 500))

try {
	const browser = await chromium.launch()
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

	await page.goto(BASE + '/parity', { waitUntil: 'networkidle' })
	await page.waitForSelector('#parity-stage .vx-switch', { timeout: 10000 })
	// Slider's fill/thumb sizes come from a ResizeObserver pass — give it a
	// frame to settle before dumping.
	await page.waitForTimeout(400)

	const dump = await page.evaluate(() =>
		globalThis.__xplatParity ? globalThis.__xplatParity() : null,
	)

	if (!dump) {
		console.log('[parity] __xplatParity missing or returned null')
		process.exitCode = 1
	} else {
		const out = path.join(repoDir, 'parity-report', 'web.json')
		mkdirSync(path.dirname(out), { recursive: true })
		writeFileSync(out, JSON.stringify(dump, null, 2))
		const cells = Object.keys(dump.cells ?? {})
		console.log(`[parity] web dump → parity-report/web.json (${cells.length} fixtures)`)
		if (errors.length) {
			console.log('[parity] page errors: ' + errors.join(' | '))
		}
	}

	await browser.close()
} finally {
	stopPreview()
}
