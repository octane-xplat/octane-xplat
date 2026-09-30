import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', '5220', '--strictPort'], {
	cwd: process.cwd(),
	stdio: ['ignore', 'pipe', 'pipe'],
	detached: true,
})

let previewOutput = ''
let baseUrl

let browser
try {
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Timed out waiting for Vite preview')), 120_000)
		const onData = (chunk) => {
			previewOutput += String(chunk)
			if (previewOutput.includes('Local:')) {
				baseUrl = previewOutput.match(/Local:\s+(https?:\/\/\S+)/)?.[1]
				clearTimeout(timeout)
				if (baseUrl) {resolve()}
				else {reject(new Error(`Could not find Vite preview URL: ${previewOutput}`))}
			}
		}

		preview.stdout.on('data', onData)
		preview.stderr.on('data', onData)
		preview.on('exit', (code) => {
			clearTimeout(timeout)
			reject(new Error(`Vite preview exited before ready (${code}): ${previewOutput}`))
		})
	})

	browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
	const pageErrors = []
	let resolveResult
	let rejectResult
	const resultPromise = new Promise((resolve, reject) => {
		resolveResult = resolve
		rejectResult = reject
	})

	const resultTimeout = setTimeout(
		() => rejectResult(new Error('Timed out waiting for the VirtualList profile result')),
		120_000,
	)

	page.on('pageerror', (error) => pageErrors.push(error.message))
	page.on('console', (message) => {
		const line = message.text()
		const marker = '[vlist-benchmark] result '
		const at = line.indexOf(marker)
		if (at === -1) {return}
		try {
			resolveResult(JSON.parse(line.slice(at + marker.length)))
		} catch (error) {
			rejectResult(new Error(`Could not parse benchmark result: ${error}`))
		}
	})

	await page.goto(baseUrl, { waitUntil: 'networkidle' })
	await page.locator('button:text("Test")').click()
	await page.locator('#menu-vlist-perf').click()
	await page.locator('#vlist-bench-run').waitFor({ state: 'visible', timeout: 10_000 })
	await page.locator('#vlist-bench-run').click()
	const result = await resultPromise
	clearTimeout(resultTimeout)
	if (pageErrors.length) {throw new Error(`Web app errors: ${pageErrors.join('; ')}`)}
	console.log(JSON.stringify(result, null, 2))
} finally {
	await browser?.close()
	if (preview.pid) {
		try {
			process.kill(-preview.pid, 'SIGTERM')
		} catch {}
	}
}
