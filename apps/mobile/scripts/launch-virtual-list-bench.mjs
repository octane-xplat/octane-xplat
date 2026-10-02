import { spawn, execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const [target, device] = process.argv.slice(2)
if (!['ios', 'android'].includes(target) || !device) {
	throw new Error('Usage: launch-virtual-list-bench.mjs <ios|android> <device>')
}

const appId = process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat.vlistbench'
const env = { ...process.env, XPLAT_VLIST_APP_ID: appId }
const run = (command, args) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, { env, stdio: 'inherit' })
		child.once('error', reject)
		child.once('exit', (code) =>
			code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
		)
	})

if (target === 'android') {
	execFileSync('adb', ['-s', device, 'get-state'], { encoding: 'utf8' })
	let pid = ''
	try {
		pid = execFileSync('adb', ['-s', device, 'shell', 'pidof', appId], { encoding: 'utf8' }).trim()
	} catch (error) {
		if (error.status !== 1) {
			throw error
		}
	}

	if (pid) {
		throw new Error(`Benchmark app already running (${pid}); refusing to replace its session`)
	}

	if (process.env.XPLAT_VLIST_FRESH_INSTALL === '1') {
		// NativeScript preserves extracted bundle files on adb install -r.
		// Explicitly opting in removes this benchmark app's data under the target lock.
		let installed = false
		try {
			installed = Boolean(
				execFileSync('adb', ['-s', device, 'shell', 'pm', 'path', appId], {
					encoding: 'utf8',
				}).trim(),
			)
		} catch (error) {
			if (error.status !== 1) {
				throw error
			}
		}

		if (installed) {
			const result = execFileSync('adb', ['-s', device, 'uninstall', appId], { encoding: 'utf8' })
			if (!result.includes('Success')) {
				throw new Error('Could not remove benchmark app for a fresh install')
			}
		}
	}

	await run('pnpm', ['exec', 'ns', 'run', 'android', '--no-hmr', '--no-watch', '--device', device])
} else {
	const devices = JSON.parse(
		execFileSync('xcrun', ['simctl', 'list', 'devices', '--json'], { encoding: 'utf8' }),
	)

	const selected = Object.values(devices.devices)
		.flat()
		.find((item) => item.udid === device)

	if (!selected) {
		throw new Error(`Unknown simulator ${device}`)
	}
	if (selected.state === 'Shutdown') {
		await run('xcrun', ['simctl', 'boot', device])
	}
	await run('xcrun', ['simctl', 'bootstatus', device, '-b'])
	const jobs = execFileSync('xcrun', ['simctl', 'spawn', device, 'launchctl', 'list'], {
		encoding: 'utf8',
	})

	if (jobs.split('\n').some((line) => line.includes(appId) && /^\d+\s/.test(line))) {
		throw new Error('Benchmark app already running; refusing to replace its session')
	}

	// Build without rebooting the shared simulator; only install this benchmark ID.
	await run('pnpm', ['exec', 'ns', 'build', 'ios', '--emulator'])
	const buildDir = path.resolve('platforms/ios/build/Debug-iphonesimulator')
	const apps = readdirSync(buildDir).filter((name) => name.endsWith('.app'))
	if (apps.length !== 1) {
		throw new Error(`Expected one simulator app in ${buildDir}: ${apps}`)
	}
	await run('xcrun', ['simctl', 'install', device, path.join(buildDir, apps[0])])
	await run('xcrun', ['simctl', 'launch', '--console', device, appId])
}
