import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
	options: { target: { type: 'string' }, device: { type: 'string' } },
})

const { target, device } = values
assert.ok(
	['ios', 'android'].includes(target) && device,
	'Use --target ios|android --device DEVICE_ID; boot and reserve that device first',
)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const output = join(root, 'research/keyboard-os-input', `${target}-${Date.now()}.json`)
mkdirSync(dirname(output), { recursive: true })
const actions = [],
	children = new Set()

const env = { ...process.env, AI_AGENT: 'Codex/keyboard-qualification' }
const run = (command, args, timeout = 60000) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, { env, cwd: root })
		children.add(child)
		let stdout = '',
			stderr = ''
		const timer = setTimeout(() => child.kill('SIGTERM'), timeout)
		child.stdout.on('data', (data) => (stdout += data))
		child.stderr.on('data', (data) => (stderr += data))
		child.on('error', reject)
		child.on('close', (code) => {
			clearTimeout(timer)
			children.delete(child)
			actions.push({ timestampMs: Date.now(), command, args, code })
			writeFileSync(output, JSON.stringify({ target, device, actions }, null, 2))
			if (code === 0) {
				resolve(stdout)
			} else {
				reject(Error(`${command} exited ${code}: ${stderr}`))
			}
		})
	})

const pause = () => new Promise((resolve) => setTimeout(resolve, 500))
const probe = spawn(
	process.execPath,
	[
		join(root, 'scripts/probe.ts'),
		'run',
		join(root, `packages/keyboard/tests/fixtures/os-input.${target}.tsrx`),
		'--target',
		target,
		'--device',
		device,
		'--timeout',
		'190000',
		'--startup-timeout',
		'600000',
		'--verbose',
	],
	{ cwd: root, env },
)

children.add(probe)
let ready = false,
	ended = false

probe.stdout.on('data', (data) => {
	process.stdout.write(data)
	if (String(data).includes('[xplat-probe-host-ready]')) {
		ready = true
	}
})

probe.stderr.on('data', (data) => {
	process.stderr.write(data)
	if (String(data).includes('[xplat-probe-host-ready]')) {
		ready = true
	}
})

const completion = new Promise((resolve, reject) => {
	probe.on('error', reject)
	probe.on('close', (code) => {
		ended = true
		children.delete(probe)
		resolve(code)
	})
})

try {
	const startup = Date.now() + 600000
	while (!ready && !ended && Date.now() < startup) {
		await pause()
	}

	assert.ok(ready, 'Probe must mount before OS input starts')
	for (const [identifier, text] of [
		['keyboard-os-form-ready', 'FormVerified'],
		['keyboard-os-sheet-ready', 'SheetVerified'],
	]) {
		if (target === 'ios') {
			const idb = (args) =>
				run('idb', [
					'ui',
					...args,
					'--udid',
					device,
					'--reason',
					'Qualify OS touch and typed input across the form and presented sheet',
				])

			await idb(['wait', identifier, '--match-key', 'AXUniqueId', '--timeout', '45', '--json'])
			const { elements: item } = JSON.parse(
				await idb(['describe', identifier, '--match-key', 'AXUniqueId', '--json']),
			)

			const frame = item.frame
			assert.ok(frame.height >= 40 && frame.width > 0)
			await idb([
				'tap',
				String(Math.round(frame.x + frame.width / 2)),
				String(Math.round(frame.y + frame.height / 2)),
				'--api',
				'hid',
			])

			await idb(['text', text])
		} else {
			const adb = (args) => run('adb', ['-s', device, ...args], 15000)
			const deadline = Date.now() + 90000
			let bounds
			while (!bounds && Date.now() < deadline && !ended) {
				await adb(['shell', 'uiautomator', 'dump', '/sdcard/window-keyboard-qualification.xml'])
				const xml = await adb(['shell', 'cat', '/sdcard/window-keyboard-qualification.xml'])
				const node = [...xml.matchAll(/<node\b[^>]*>/g)]
					.map((match) => match[0])
					.find((node) => node.includes(`content-desc="${identifier}"`))

				bounds = node
					?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)
					?.slice(1)
					.map(Number)

				if (!bounds) {
					await pause()
				}
			}

			assert.ok(bounds, `Accessible field must appear: ${identifier}`)
			const [x1, y1, x2, y2] = bounds
			assert.ok(y2 - y1 >= 40 && x2 > x1)
			await adb([
				'shell',
				'input',
				'tap',
				String(Math.round((x1 + x2) / 2)),
				String(Math.round((y1 + y2) / 2)),
			])

			await adb(['shell', 'input', 'text', text])
		}
	}

	assert.equal(
		await completion,
		0,
		'OS-input fixture must pass its geometry and editing assertions',
	)

	console.log(`OS touch/typing actions: ${output}`)
} finally {
	for (const child of children) {
		child.kill('SIGTERM')
	}
}
