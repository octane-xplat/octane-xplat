// Target + device discovery. Everything degrades quietly — a missing
// toolchain means the target is absent from prompts, not an error.
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const run = (cmd, args) => {
	try {
		return execFileSync(cmd, args, {
			encoding: 'utf8',
			timeout: 15000,
			stdio: ['ignore', 'pipe', 'ignore'],
		})
	} catch {
		return null
	}
}

export const hasWeb = (cwd) =>
	existsSync(`${cwd}/vite.config.ts`) || existsSync(`${cwd}/vite.config.mts`)
export const hasNative = (cwd) => existsSync(`${cwd}/nativescript.config.ts`)

/** iOS targets: booted sims first, then other available sims, then physical devices. */
export function iosTargets() {
	const out = run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])
	if (!out) return []
	try {
		const j = JSON.parse(out)
		const sims = []
		for (const list of Object.values(j.devices ?? {})) {
			for (const d of list) {
				if (!d.isAvailable) continue
				sims.push({
					kind: 'ios',
					id: d.udid,
					name: d.name + (d.state === 'Booted' ? ' (booted)' : ''),
					device: d.udid,
					booted: d.state === 'Booted',
				})
			}
		}

		// Booted first — that's almost always the one you mean.
		return sims.sort((a, b) => (b.booted ? 1 : 0) - (a.booted ? 1 : 0))
	} catch {
		return []
	}
}

/** Android targets: emulators + physical devices from adb. */
export function androidTargets() {
	const out = run('adb', ['devices'])
	if (!out) return []
	return out
		.split('\n')
		.slice(1)
		.map((l) => l.trim())
		.filter((l) => l.endsWith('\tdevice'))
		.map((l) => {
			const serial = l.split('\t')[0]
			const emu = serial.startsWith('emulator-')
			return {
				kind: 'android',
				id: serial,
				name: emu ? `${serial} (emulator)` : `${serial} (device)`,
				device: serial,
			}
		})
}

/** Every launchable target for this project + machine. */
export function discoverTargets(cwd) {
	const targets = []
	if (hasWeb(cwd)) targets.push({ kind: 'web', id: 'web', name: 'Web (vite :5200)' })
	if (hasNative(cwd)) {
		targets.push(...iosTargets(), ...androidTargets())
	}

	return targets
}

/** Distinct platform buckets for `build` — one entry per platform, no device picks. */
export function buildTargets(cwd) {
	const t = []
	if (hasWeb(cwd)) t.push({ kind: 'web', id: 'web', name: 'Web (vite build)' })
	if (hasNative(cwd)) {
		if (iosTargets().length || run('xcrun', ['--version']))
			t.push({ kind: 'ios', id: 'ios', name: 'iOS (ns build ios)' })
		t.push({ kind: 'android', id: 'android', name: 'Android (ns build android)' })
	}

	return t
}
