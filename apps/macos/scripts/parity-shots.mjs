// Parity screenshots (macOS) — boots the AppKit dev host, mounts /parity,
// then steps the stage's ScrollView through fixed offsets. At each offset
// it writes a per-cell geometry sidecar (parity-report/shots/macos/
// shot-NNN.cells.json) and waits for a window capture to appear at
// shot-NNN.png — captured externally (Computer Use, screencapture -l, …)
// at 2x backing scale. scripts/parity-shots-compare.mjs pairs the crops
// with the web captures.
import { createInterface } from 'node:readline'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = dirname(dirname(fileURLToPath(import.meta.url)))
const repoDir = resolve(appDir, '../..')
const outDir = join(repoDir, 'parity-report', 'shots', 'macos')

// Same stepped coverage as the web script: every ~89pt cell lands fully
// inside at least one 420pt viewport shot at a 300pt step.
const STEP = 300

const host = spawn(process.execPath, ['./scripts/dev.mjs'], {
	cwd: appDir,
	env: {
		...process.env,
		OCTANE_MACOS_AUTOMATION: '1',
		OCTANE_MACOS_PARITY_ONLY: '1',
	},
	stdio: ['pipe', 'pipe', 'inherit'],
})

let lineQueue = []
let lineWaiters = []
createInterface({ input: host.stdout }).on('line', (line) => {
	const waiter = lineWaiters.find((w) => w.match(line))
	if (waiter) {
		lineWaiters = lineWaiters.filter((w) => w !== waiter)
		waiter.resolve(line)
	} else {
		lineQueue.push(line)
	}
})

function nextLine(match, timeoutMs, label) {
	const buffered = lineQueue.findIndex((line) => match(line))
	if (buffered >= 0) {return Promise.resolve(lineQueue.splice(buffered, 1)[0])}
	return new Promise((resolvePromise, reject) => {
		const waiter = { match, resolve: resolvePromise }
		lineWaiters.push(waiter)
		setTimeout(() => {
			lineWaiters = lineWaiters.filter((w) => w !== waiter)
			reject(new Error('Timed out waiting for ' + label))
		}, timeoutMs)
	})
}

const send = (command) => host.stdin.write(command + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const closed = new Promise((resolve) => host.once('close', (code, signal) => resolve({ code, signal })))

async function cells() {
	send('cells')
	const line = await nextLine((l) => l.includes('[parity-cells] '), 10000, 'cell frames')
	return JSON.parse(line.slice(line.indexOf('[parity-cells] ') + 15))
}

async function waitForCapture(file, timeoutMs = 600000) {
	const path = join(outDir, file)
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		if (existsSync(path) && statSync(path).size > 0) {
			// settle: a still-writing capture grows between checks
			const size = statSync(path).size
			await sleep(250)
			if (existsSync(path) && statSync(path).size === size) {return}
		}

		await sleep(200)
	}

	throw new Error('Timed out waiting for capture ' + file)
}

mkdirSync(outDir, { recursive: true })

try {
	await nextLine((l) => l.includes('[macos] AppKit window ready'), 120000, 'window ready')
	send('parity')
	await nextLine((l) => l.includes('[parity-json] '), 30000, 'parity dump')
	// The AppKit host's constraint-driven content re-fits the window on
	// commits; pin it back to the shared 640x420 viewport before measuring.
	send('pin-window')
	await nextLine((l) => l.startsWith('[frame] '), 10000, 'window pin')

	const first = await cells()
	const maxTop = Math.max(0, first.docHeight - first.viewportHeight)
	const offsets = []
	for (let o = 0; o <= maxTop; o += STEP) {offsets.push(o)}
	if (offsets.length === 0 || offsets[offsets.length - 1] !== maxTop) {offsets.push(maxTop)}

	const manifest = {
		target: 'macos',
		docHeight: first.docHeight,
		viewportHeight: first.viewportHeight,
		docFlipped: first.docFlipped,
		shots: [],
	}

	for (let i = 0; i < offsets.length; i++) {
		const file = `shot-${String(i).padStart(3, '0')}.png`
		send(`scrolltop ${offsets[i]}`)
		const scrolled = await nextLine((l) => l.includes('[scrolled] '), 10000, 'scroll')
		await sleep(250)
		const frames = await cells()
		const sidecar = { requested: offsets[i], scrollTop: JSON.parse(scrolled.slice(scrolled.indexOf('[scrolled] ') + 11)).scrollTop, ...frames }
		writeFileSync(join(outDir, file.replace(/\.png$/, '.cells.json')), JSON.stringify(sidecar, null, 2))
		// The capturer watches the window title — drop 'shot-NNN' there.
		send('title ' + file.replace(/\.png$/, ''))
		console.log(`[shots] macos waiting for ${file} (scrollTop=${sidecar.scrollTop})`)
		await waitForCapture(file)
		manifest.shots.push({ file, scrollTop: sidecar.scrollTop, cellsFile: file.replace(/\.png$/, '.cells.json') })
	}

	send('title parity-done')
	writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
	console.log(`[shots] macos → ${outDir} (${manifest.shots.length} shots)`)
} catch (error) {
	console.error('[shots] macOS capture failed: ' + error.message)
	process.exitCode = 1
} finally {
	host.kill('SIGTERM')
	const result = await Promise.race([closed, new Promise((resolve) => setTimeout(() => resolve(null), 3000))])
	if (!result && host.exitCode === null && host.signalCode === null) {
		host.kill('SIGKILL')
		await closed
	}
}
