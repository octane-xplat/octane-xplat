/** Read-only Windows setup evidence. Prerequisites never qualify a host. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

function commandOutput(command, args) {
	try {
		return execFileSync(command, args, {
			encoding: 'utf8',
			timeout: 5000,
			maxBuffer: 65536,
			stdio: ['ignore', 'pipe', 'pipe'],
			windowsHide: true,
		}).trim()
	} catch {
		return null
	}
}

export function windowsPreflight(root, { platform = process.platform, run = commandOutput } = {}) {
	const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	const require = createRequire(join(root, 'package.json'))
	const installed = (name) => {
		for (const specifier of [`${name}/package.json`, name]) {
			try {
				require.resolve(specifier)
				return true
			} catch {
				/* Try the public entry. */
			}
		}

		return false
	}

	const runtime =
		manifest.devDependencies?.['@nativescript/windows'] ??
		manifest.dependencies?.['@nativescript/windows']

	const requirements = {
		'Windows host': platform === 'win32',
		'nativescript.config': ['ts', 'mts', 'js', 'mjs'].some((ext) =>
			existsSync(join(root, `nativescript.config.${ext}`)),
		),
		'App_Resources/Windows/Package.appxmanifest': existsSync(
			join(root, 'App_Resources/Windows/Package.appxmanifest'),
		),
		'@nativescript/windows exact version':
			typeof runtime === 'string' && /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(runtime),
	}

	for (const name of [
		'@nativescript/windows',
		'@nativescript/core',
		'@nativescript-community/octane',
		'@nativescript/vite',
		'nativescript',
		'vite',
	]) {
		requirements[name] = installed(name)
	}

	// Never run Windows commands on another host, boot a device, or change settings.
	if (platform === 'win32') {
		const sdk = run('dotnet', ['--version'])
		requirements['.NET SDK >= 10'] =
			typeof sdk === 'string' && /^\d+\.\d+\.\d+/.test(sdk) && Number(sdk.split('.')[0]) >= 10

		const devMode = run('powershell', [
			'-NoProfile',
			'-NonInteractive',
			'-Command',
			'(Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense',
		])

		requirements['Developer Mode (development launch)'] = devMode?.trim() === '1'
	}

	return {
		backend: 'experimental nativescript/winui',
		executionHost: { required: 'win32', current: platform, reachable: platform === 'win32' },
		qualification: 'unverified',
		requirements,
		status:
			platform !== 'win32'
				? 'remote-host-required'
				: Object.values(requirements).every(Boolean)
					? 'unqualified-backend'
					: 'missing-prerequisites',
		note:
			'Windows workshop mounting, shell and reload are not implemented or host-qualified. ' +
			(platform !== 'win32'
				? 'Run these commands in a Windows checkout; SDK and Developer Mode checks were not run. '
				: '') +
			'Prerequisites do not prove renderer compatibility, input, accessibility or lifecycle support. No web fallback is used.',
	}
}

export function windowsLaunchBlocker(report) {
	if (report.status === 'remote-host-required') {
		return 'Windows workshop requires a real Windows host. Run `xplat workshop doctor` in that host’s checkout. No web fallback is used.'
	}

	const missing = Object.entries(report.requirements)
		.filter(([, ok]) => !ok)
		.map(([name]) => name)

	return (
		(missing.length ? `Windows prerequisites missing: ${missing.join(', ')}. ` : '') +
		'Windows workshop mounting, shell and reload remain unimplemented and unqualified; launch is blocked. Run `xplat workshop doctor` for setup evidence.'
	)
}
