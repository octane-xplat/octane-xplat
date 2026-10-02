import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

export function inspectLinuxPackageConfig(appRoot) {
	const manifest = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
	const target = manifest.xplat?.targets?.linux ?? {}
	const settings = target.package ?? {}
	const issues = []
	if (target.runtime !== 'webkitgtk') {
		issues.push('linux.runtime must be webkitgtk')
	}
	const { applicationId, productName, executableName } = settings
	const version = settings.version ?? manifest.version
	const scheme = target.host?.scheme ?? 'xplat'
	if (
		typeof applicationId !== 'string' ||
		applicationId.length > 255 ||
		!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_-]*){2,}$/.test(applicationId)
	) {
		issues.push('linux.package.applicationId must be a reverse-DNS application ID')
	}

	if (
		typeof productName !== 'string' ||
		!productName.trim() ||
		[...productName].some(
			(character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
		)
	) {
		issues.push('linux.package.productName must be a nonempty single-line name')
	}

	if (
		typeof executableName !== 'string' ||
		['host', 'bundle'].includes(executableName) ||
		!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(executableName)
	) {
		issues.push(
			'linux.package.executableName must contain only letters, digits, underscores, or hyphens',
		)
	}

	if (
		typeof version !== 'string' ||
		!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(version)
	) {
		issues.push('linux.package.version (or package version) must be a semantic version')
	}

	if (
		typeof scheme !== 'string' ||
		!/^[a-z][a-z0-9+.-]*$/.test(scheme) ||
		['http', 'https', 'file', 'data', 'javascript'].includes(scheme)
	) {
		issues.push('linux.host.scheme must be a custom lowercase URI scheme')
	}

	const config = settings.viteConfig ?? 'vite.linux.config.ts'
	let viteConfig
	if (
		typeof config !== 'string' ||
		isAbsolute(config) ||
		relative(resolve(appRoot), resolve(appRoot, config)).startsWith('..')
	) {
		issues.push('linux.package.viteConfig must be a relative path inside the app')
	} else {
		viteConfig = resolve(appRoot, config)
		if (!existsSync(viteConfig)) {
			issues.push(`Linux Vite config not found: ${config}`)
		}
	}

	return { issues, applicationId, productName, executableName, version, scheme, viteConfig }
}
