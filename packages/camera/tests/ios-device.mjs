// Nonvisual physical-iPhone qualification, including actual OS backgrounding.
import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepare } from '../../../tools/probe/project.ts'

const self = fileURLToPath(import.meta.url)
const repo = resolve(dirname(self), '../../..')
const caseFile = resolve(dirname(self), 'movie-switch.ios.tsrx')
const device = process.env.XPLAT_IOS_DEVICE
if (!device || !/^[A-Za-z0-9-]+$/.test(device)) {
	throw new Error('Set XPLAT_IOS_DEVICE to the paired physical iPhone UDID')
}
if (process.platform !== 'darwin') {
	throw new Error('Physical iOS qualification requires macOS')
}
const call = (command, args, options = {}) => {
	const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30_000, ...options })
	if (result.error || result.status !== 0) {
		throw result.error ?? new Error(`${command} failed: ${result.stderr}`)
	}
	return result.stdout
}
const broker = (resources, purpose, args) =>
	call(
		'goddard-agent',
		['resource', 'run', '--json', JSON.stringify({ resources, purpose }), '--', ...args],
		{ stdio: 'inherit', timeout: 0 },
	)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const bounded = async (promise, ms) => {
	let timer
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error('Probe completion timed out')), ms)
			}),
		])
	} finally {
		clearTimeout(timer)
	}
}

if (process.argv[2] !== '--device') {
	const project = await prepare('ios', caseFile, ['@octane-xplat/camera'])
	broker({ native_builds: 1 }, 'Build signed isolated camera qualification app', [
		'python3',
		resolve(repo, 'scripts/with-native-target-lock.py'),
		'ios',
		process.execPath,
		resolve(repo, 'tools/probe/mobile-launch.ts'),
		'ios',
		device,
		project.root,
		project.appId,
		'http://localhost:1',
		'600000',
		'physical-build',
	])
	broker(
		{ exclusive: [`device:${device}`] },
		'Qualify camera switching and OS background recovery without visual analysis',
		[process.execPath, self, '--device', project.appId],
	)
} else {
	const expectedApp = process.argv[3]
	const scratch = resolve(homedir(), 'agent-scratch/octane-xplat/camera-ios-device')
	mkdirSync(scratch, { recursive: true })
	const work = mkdtempSync(resolve(scratch, 'run-'))
	const token = randomUUID()
	const tokenPath = resolve(work, 'token.txt')
	const phasePath = resolve(work, 'phase.json')
	writeFileSync(tokenPath, token)
	const ctl = (...args) =>
		call('xcrun', [
			'devicectl',
			'device',
			...args.slice(0, 2),
			'--device',
			device,
			'--quiet',
			...args.slice(2),
		])
	const child = spawn(
		'bun',
		[
			'run',
			'probe',
			'run',
			caseFile,
			'--target',
			'ios',
			'--device',
			device,
			'--deps',
			'@octane-xplat/camera',
			'--timeout',
			'120000',
			'--verbose',
		],
		{ cwd: repo, stdio: ['ignore', 'inherit', 'pipe'] },
	)
	let logs = '',
		exited = false,
		result,
		phaseExercised = false
	const completion = new Promise((resolve, reject) => {
		child.on('error', reject)
		child.on('exit', (code, signal) => {
			exited = true
			result = { code, signal }
			resolve()
		})
	})
	child.stderr.on('data', (data) => {
		logs += data
		process.stderr.write(data)
	})
	const stop = () => child.kill('SIGTERM')
	process.on('SIGINT', stop)
	process.on('SIGTERM', stop)
	try {
		const deadline = Date.now() + 180_000
		while (!exited && !phaseExercised) {
			if (Date.now() > deadline) {
				throw new Error('Physical camera phase timed out')
			}
			await delay(1000)
			const app = logs.match(/\[xplat-probe-ios-app\] ([A-Za-z0-9.]+)/)?.[1]
			if (!app) {
				continue
			}
			if (app !== expectedApp) {
				throw new Error('Probe source changed after its build; rerun qualification')
			}
			let phase
			try {
				ctl(
					'copy',
					'to',
					'--source',
					tokenPath,
					'--destination',
					'Documents/camera-probe-token.txt',
					'--domain-type',
					'appDataContainer',
					'--domain-identifier',
					app,
				)
				ctl(
					'copy',
					'from',
					'--source',
					'Documents/camera-probe-phase.txt',
					'--destination',
					phasePath,
					'--domain-type',
					'appDataContainer',
					'--domain-identifier',
					app,
				)
				phase = JSON.parse(readFileSync(phasePath, 'utf8'))
			} catch {
				continue
			} // The app may not have written this run's phase yet.
			if (phase.phase !== 'background-recording' || phase.token !== token) {
				continue
			}
			console.error('Backgrounding isolated camera probe through Settings launch')
			ctl('process', 'launch', 'com.apple.Preferences')
			await delay(2000)
			ctl('process', 'launch', app) // foreground the same process; do not terminate/relaunch it
			phaseExercised = true
		}
		await bounded(completion, 120_000)
		if (result.code !== 0 || !phaseExercised) {
			throw new Error(`Camera probe failed: ${JSON.stringify({ ...result, phaseExercised })}`)
		}
	} finally {
		if (!exited) {
			stop()
			try {
				await bounded(completion, 15_000)
			} finally {
				if (!exited) {
					child.kill('SIGKILL')
				}
			}
		}
		process.off('SIGINT', stop)
		process.off('SIGTERM', stop)
		rmSync(work, { recursive: true, force: true })
	}
}
