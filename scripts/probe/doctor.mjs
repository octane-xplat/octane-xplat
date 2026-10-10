import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { command } from './process.mjs'
import { appFor, importFrom, repo } from './project.mjs'

const inspect = async (exe, args) => {
	try {
		return await command(exe, args, { timeout: 10000 })
	} catch (error) {
		return { code: 1, stdout: '', stderr: error.message }
	}
}

export async function doctor() {
	const targets = Object.fromEntries(
		['web', 'ios', 'android', 'macos', 'linux'].map((target) => [
			target,
			{ available: false, issues: [], devices: [] },
		]),
	)

	try {
		const { chromium } = await importFrom(appFor('web'), 'playwright')
		if (!existsSync(chromium.executablePath())) {
			targets.web.issues.push(
				'Chromium is missing; run pnpm --dir apps/web exec playwright install chromium',
			)
		}
	} catch {
		targets.web.issues.push('Install workspace dependencies with pnpm install --frozen-lockfile')
	}

	if (process.platform !== 'darwin') {
		targets.ios.issues.push('iOS simulator probes require macOS')
		targets.macos.issues.push('AppKit probes require an Apple Silicon Mac')
	} else {
		const sims = await inspect('xcrun', ['simctl', 'list', 'devices', 'available', '--json'])
		if (sims.code === 0) {
			targets.ios.devices = Object.values(JSON.parse(sims.stdout).devices)
				.flat()
				.filter((device) => device.isAvailable)
				.map(({ udid, name, state }) => ({ id: udid, name, state }))

			if (!targets.ios.devices.length) {
				targets.ios.issues.push('No available iOS simulator; configure one in Xcode')
			}

			const physical = await inspect('xcrun', [
				'devicectl',
				'list',
				'devices',
				'--json-output',
				'/dev/stdout',
			])

			if (physical.code === 0) {
				try {
					const reported = JSON.parse(physical.stdout)
					for (const entry of reported.result?.devices ?? []) {
						const hardware = entry.hardwareProperties ?? {}
						const deviceProps = entry.deviceProperties ?? {}
						const connection = entry.connectionProperties ?? {}
						if (
							hardware.reality !== 'physical' ||
							deviceProps.bootState !== 'booted' ||
							connection.pairingState !== 'paired'
						) {
							continue
						}

						targets.ios.devices.push({
							id: hardware.udid ?? entry.identifier,
							name: deviceProps.name ?? hardware.marketingName ?? 'iPhone',
							state: 'Booted',
							physical: true,
						})
					}
				} catch {
					// A malformed device list never blocks simulator probing.
				}
			}
		} else {
			targets.ios.issues.push(sims.stderr)
		}

		const ruby = await inspect('ruby', ['-e', 'require "xcodeproj"'])
		if (ruby.code) {
			targets.ios.issues.push('The Ruby on PATH cannot load xcodeproj')
		}

		if (process.arch !== 'arm64') {
			targets.macos.issues.push('The AppKit host requires arm64')
		}

		try {
			const { inspectJscHost } = await import(
				join(repo, 'packages/cli/src/macos/jsc-host/runtime.mjs')
			)

			targets.macos.issues.push(...inspectJscHost().issues)
			if (
				!existsSync(join(appFor('macos'), 'node_modules/@nativescript/macos-node-api/package.json'))
			) {
				targets.macos.issues.push('Install workspace dependencies')
			}
		} catch (error) {
			targets.macos.issues.push(error.message)
		}
	}

	const adb = await inspect('adb', ['devices', '-l'])
	if (adb.code) {
		targets.android.issues.push('adb is unavailable or its configured server cannot be reached')
	} else {
		targets.android.devices = adb.stdout
			.split('\n')
			.filter((line) => /^\S+\s+device\b/.test(line))
			.map((line) => ({
				id: line.split(/\s+/)[0],
				name: line.match(/model:(\S+)/)?.[1] ?? '',
				state: 'device',
			}))

		if (!targets.android.devices.length) {
			targets.android.issues.push('No authorized Android device on the configured adb server')
		}
	}

	const java =
		process.platform === 'darwin'
			? await inspect('/usr/libexec/java_home', ['-v', '21'])
			: await inspect('java', ['-version'])

	if (java.code) {
		targets.android.issues.push('JDK 21 is unavailable; configure JAVA_HOME')
	}

	if (
		!process.env.ANDROID_HOME &&
		!process.env.ANDROID_SDK_ROOT &&
		!existsSync(join(process.env.HOME ?? '', 'Library/Android/sdk'))
	) {
		targets.android.issues.push('Android SDK not found; configure ANDROID_HOME')
	}

	const ns = await inspect('which', ['ns'])
	for (const target of ['ios', 'android']) {
		if (ns.code) {
			targets[target].issues.push('NativeScript CLI missing from PATH')
		}
	}

	if (process.platform !== 'linux') {
		targets.linux.issues.push(
			'Run this command in a real Linux environment; no macOS stand-in is used',
		)
	} else {
		const gjs = await inspect('gjs', [
			'-c',
			"imports.gi.versions.Gtk='4.0'; imports.gi.versions.WebKit='6.0'; imports.gi.versions.Adw='1'; imports.gi.versions.Secret='1'; const {Gtk,WebKit,Adw,Secret}=imports.gi;",
		])

		if (gjs.code) {
			targets.linux.issues.push(
				'gjs or GTK4/WebKitGTK6/Adwaita/Secret introspection dependencies are unavailable',
			)
		}

		if (!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
			targets.linux.issues.push('No display session; run under an existing desktop or xvfb-run')
		}
	}

	for (const state of Object.values(targets)) {
		state.available = state.issues.length === 0
	}

	return { schema: 1, host: { os: process.platform, arch: process.arch }, targets }
}

export function selectDevice(target, state, requested) {
	if (requested) {
		if (!state.devices.some((device) => device.id === requested)) {
			throw new Error(`Unknown ${target} device: ${requested}`)
		}

		return requested
	}

	const candidates =
		target === 'ios' ? state.devices.filter((device) => device.state === 'Booted') : state.devices

	if (candidates.length !== 1) {
		throw new Error(
			`Select an explicit ${target} device with --device; found ${candidates.length} active devices`,
		)
	}

	return candidates[0].id
}
