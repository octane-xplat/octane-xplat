// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Target discovery for the six required platforms. Mirrors
// packages/cli/src/targets.ts conventions (the same way discovery.mjs
// mirrors platform detection) so MCP and the Xplat CLI agree on what a
// launchable target is. Every probe degrades quietly — a missing toolchain
// is a reported reason, never an error and never a phantom-ready target.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { execText } from './process.ts'

export const HOST_PLATFORM = {
	web: null, // any host can run a dev server + Chromium
	ios: 'darwin',
	android: null, // adb tooling exists on every desktop host
	macos: 'darwin',
	linux: 'linux',
	windows: 'win32',
}

/** Whether this machine can run the platform at all. */
export function hostSupports(platform, host = process.platform) {
	const required = HOST_PLATFORM[platform]
	return required === null || required === host
}

/** Reason a target is unavailable on this host, or null when fine. */
export function hostBlock(platform, host = process.platform) {
	if (hostSupports(platform, host)) {
		return null
	}

	const names = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' }
	return `requires a ${names[HOST_PLATFORM[platform]]} host (this server runs on ${names[host] ?? host})`
}

/** iOS simulators (booted first). Physical devices are out of discovery scope. */
export function iosSimulators({ exec = execText } = {}) {
	const out = exec('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])
	if (!out) {
		return {
			targets: [],
			reason: 'xcrun simctl unavailable — install Xcode and the iOS simulator runtime',
		}
	}

	try {
		const doc = JSON.parse(out)
		const targets = []
		for (const [runtime, list] of Object.entries(doc.devices ?? {})) {
			const os = runtime.match(/iOS[- ]([\d-]+)/)?.[1]?.replaceAll('-', '.')
			for (const device of list) {
				if (!device.isAvailable) {
					continue
				}

				targets.push({
					targetId: device.udid,
					name: `${device.name}${os ? ` iOS ${os}` : ''}${device.state === 'Booted' ? ' (booted)' : ''}`,
					kind: 'simulator',
					booted: device.state === 'Booted',
					availability: 'available',
				})
			}
		}

		targets.sort((a, b) => (b.booted ? 1 : 0) - (a.booted ? 1 : 0))
		return { targets }
	} catch {
		return { targets: [], reason: 'xcrun simctl output could not be parsed' }
	}
}

/** Android targets: emulators + physical devices reported by adb. */
export function androidDevices({ exec = execText } = {}) {
	const out = exec('adb', ['devices'])
	if (!out) {
		return {
			targets: [],
			reason: 'adb unavailable — install Android platform-tools (adb on PATH)',
		}
	}

	const targets = out
		.split('\n')
		.slice(1)
		.map((line) => line.trim())
		.filter((line) => line.endsWith('\tdevice'))
		.map((line) => {
			const serial = line.split('\t')[0]
			const emulator = serial.startsWith('emulator-')
			return {
				targetId: serial,
				name: `${serial} (${emulator ? 'emulator' : 'device'})`,
				kind: emulator ? 'emulator' : 'device',
				availability: 'available',
			}
		})

	return { targets }
}

/** Locate a Chromium executable for browser-driven sessions. */
export function chromiumExecutable({
	env = process.env,
	exec = execText,
	host = process.platform,
} = {}) {
	const candidates = []
	if (env.XPLAT_MCP_CHROMIUM) {
		candidates.push(env.XPLAT_MCP_CHROMIUM)
	}

	// Playwright caches (the repo's e2e installs live here) — the default
	// location is per-OS.
	const cache =
		env.PLAYWRIGHT_BROWSERS_PATH ??
		(host === 'darwin'
			? join(homedir(), 'Library', 'Caches', 'ms-playwright')
			: host === 'win32'
				? join(env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'ms-playwright')
				: join(env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'ms-playwright'))

	if (host === 'darwin') {
		candidates.push(
			'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
			'/Applications/Chromium.app/Contents/MacOS/Chromium',
			'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
		)
	} else if (host === 'linux') {
		for (const bin of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
			const found = exec('which', [bin])
			if (found?.trim()) {
				candidates.push(found.trim())
			}
		}
	} else if (host === 'win32' && env.PROGRAMFILES) {
		candidates.push(
			join(env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
			join(env['PROGRAMFILES(X86)'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
			join(env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
		)
	}

	// Playwright's numbered chromium builds under the cache root — the inner
	// dir varies by arch/channel (chrome-mac, chrome-mac-arm64, chrome-linux…).
	const appNames = ['Chromium', 'Google Chrome for Testing', 'chrome']
	try {
		for (const entry of existsSync(cache) ? readdirDescending(cache) : []) {
			const inner = join(cache, entry)
			for (const sub of readdirSync(inner)) {
				for (const name of appNames) {
					candidates.push(
						join(inner, sub, `${name}.app`, 'Contents', 'MacOS', name),
						join(inner, sub, name),
						join(inner, sub, `${name}.exe`),
					)
				}
			}
		}
	} catch {}

	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) {
			return candidate
		}
	}

	return null
}

function readdirDescending(dir) {
	const num = (name) => parseInt(name.split('-').pop(), 10) || 0
	const entries = readdirSync(dir)
		.filter((name) => /^chromium-\d+$/.test(name) || /^chromium_headless_shell-\d+$/.test(name))
		.sort((a, b) => num(b) - num(a))

	// Full browser builds first — headless shells are a valid fallback.
	return entries.sort(
		(a, b) => (a.startsWith('chromium-') ? 0 : 1) - (b.startsWith('chromium-') ? 0 : 1),
	)
}
