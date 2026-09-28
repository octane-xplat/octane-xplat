// Parity screenshots (web) — serves apps/web/dist, opens /parity in a
// 640x420 viewport at 2x device scale (matching the AppKit host's window
// on a Retina display), and captures the stage at stepped scroll offsets.
// Writes parity-report/shots/web/shot-NNN.png plus manifest.json holding
// per-cell rects — scripts/parity-shots-compare.mjs pairs these with the
// macOS captures. Run after `vite build`.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const webDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const repoDir = webDir + '/../..'
const outDir = path.join(repoDir, 'parity-report', 'shots', 'web')
const PORT = 4417
const BASE = `http://localhost:${PORT}`

// Matched capture contract — the AppKit host window is a 640x420 content
// view on a 2x display, in light appearance.
const VIEWPORT = { width: 640, height: 420 }
const SCALE = 2
const STEP = 300

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
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
	const page = await browser.newPage({
		viewport: VIEWPORT,
		deviceScaleFactor: SCALE,
		colorScheme: 'light',
	})

	const errors = []
	page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

	await page.goto(BASE + '/parity', { waitUntil: 'networkidle' })
	await page.waitForSelector('#parity-stage .vx-switch', { timeout: 10000 })
	await page.waitForTimeout(400)

	const scrollInfo = await page.evaluate(() => {
		const app = document.querySelector('.vx-app')
		const cellCount = document.querySelectorAll('.parity-cell').length
		const scroller = app && app.scrollHeight > app.clientHeight ? app : document.scrollingElement
		const max = scroller === document.scrollingElement
			? document.scrollingElement.scrollHeight - window.innerHeight
			: scroller.scrollHeight - scroller.clientHeight

		return { max, docHeight: scroller.scrollHeight, cellCount }
	})

	if (scrollInfo.cellCount < 40) {
		throw new Error(`parity stage shows ${scrollInfo.cellCount} cells — wrong server or stale build?`)
	}

	const offsets = []
	for (let o = 0; o <= scrollInfo.max; o += STEP) {offsets.push(o)}
	if (offsets.length === 0 || offsets[offsets.length - 1] !== scrollInfo.max) {
		offsets.push(scrollInfo.max)
	}

	mkdirSync(outDir, { recursive: true })
	const manifest = {
		target: 'web',
		viewport: { ...VIEWPORT, scale: SCALE },
		docHeight: scrollInfo.docHeight,
		shots: [],
	}

	for (let i = 0; i < offsets.length; i++) {
		const offset = offsets[i]
		const file = `shot-${String(i).padStart(3, '0')}.png`
		const cells = await page.evaluate(async (off) => {
			const app = document.querySelector('.vx-app')
			const scroller = app && app.scrollHeight > app.clientHeight ? app : document.scrollingElement
			if (scroller === document.scrollingElement) {
				window.scrollTo(0, off)
			} else {
				scroller.scrollTop = off
			}

			await new Promise((r) => setTimeout(r, 120))
			const actual = scroller === document.scrollingElement ? window.scrollY : scroller.scrollTop
			const out = { actual, cells: {} }
			for (const el of document.querySelectorAll('.parity-cell')) {
				const r = el.getBoundingClientRect()
				out.cells[el.id.replace(/^cell-/, '')] = {
					x: r.x, y: r.y, w: r.width, h: r.height,
					visible: r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0,
				}
			}

			return out
		}, offset)

		await page.screenshot({ path: path.join(outDir, file) })
		manifest.shots.push({ file, requested: offset, scrollTop: cells.actual, cells: cells.cells })
		console.log(`[shots] web ${file} scrollTop=${cells.actual}`)
	}

	writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
	console.log(`[shots] web → ${outDir} (${manifest.shots.length} shots)`)
	if (errors.length) {console.log('[shots] page errors: ' + errors.join(' | '))}

	await browser.close()
} finally {
	stopPreview()
}
