import { existsSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { minimumJscHostSystemVersion } from './jsc-host/runtime.mjs'

const requiredFields = [
	'productName',
	'bundleIdentifier',
	'executableName',
	'version',
	'minimumSystemVersion',
	'viteConfig',
	'bundleFile',
]

const macOSVersionPattern = /^\d+(?:\.\d+){1,2}$/

function compareVersions(left, right) {
	const leftParts = left.split('.').map(Number)
	const rightParts = right.split('.').map(Number)

	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
		const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
		if (difference !== 0) {return difference}
	}

	return 0
}

function resolveProjectPath(root, value, label, issues, { mustExist = false } = {}) {
	if (typeof value !== 'string' || !value.trim() || isAbsolute(value)) {
		issues.push(`${label} must be a path relative to the app root`)
		return null
	}

	const path = resolve(root, value)
	const fromRoot = relative(root, path)
	if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
		issues.push(`${label} must stay inside the app root`)
		return null
	}

	if (mustExist && !existsSync(path)) {
		issues.push(`${label} does not exist: ${value}`)
		return null
	}

	return path
}

/** Validate the macOS packaging contract shared by `xplat build` and `doctor`. */
export function inspectMacOSPackageConfig(appRoot, value) {
	const issues = []
	const settings = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
	if (settings !== value) {issues.push('xplat.targets.macos.package must be an object')}

	for (const key of requiredFields) {
		if (typeof settings[key] !== 'string' || !settings[key].trim()) {
			issues.push(`missing xplat.targets.macos.package.${key}`)
		}
	}

	if (settings.bundleIdentifier && !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(settings.bundleIdentifier)) {
		issues.push(`invalid macOS bundle identifier: ${settings.bundleIdentifier}`)
	}

	if (settings.executableName && !/^[A-Za-z0-9][A-Za-z0-9._ -]*$/.test(settings.executableName)) {
		issues.push(`invalid macOS executable name: ${settings.executableName}`)
	}

	if (settings.version && !/^\d+(?:\.\d+){1,2}$/.test(settings.version)) {
		issues.push(`invalid macOS bundle version: ${settings.version}`)
	}

	if (settings.minimumSystemVersion && !macOSVersionPattern.test(settings.minimumSystemVersion)) {
		issues.push(`invalid macOS minimum system version: ${settings.minimumSystemVersion}`)
	}

	if (
		typeof settings.minimumSystemVersion === 'string' &&
		macOSVersionPattern.test(settings.minimumSystemVersion) &&
		compareVersions(settings.minimumSystemVersion, minimumJscHostSystemVersion) < 0
	) {
		issues.push(
			`macOS minimum system version must be at least ${minimumJscHostSystemVersion} for the JavaScriptCore host`,
		)
	}

	if (
		typeof settings.bundleFile === 'string' &&
		settings.bundleFile &&
		!settings.bundleFile.endsWith('.cjs')
	) {
		issues.push('macOS bundleFile must point to a CommonJS .cjs bundle')
	}

	const viteConfig = settings.viteConfig
		? resolveProjectPath(appRoot, settings.viteConfig, 'macOS viteConfig', issues, { mustExist: true })
		: null

	const bundleFile = settings.bundleFile
		? resolveProjectPath(appRoot, settings.bundleFile, 'macOS bundleFile', issues)
		: null

	const iconPath =
		settings.icon === undefined
			? null
			: resolveProjectPath(appRoot, settings.icon, 'macOS icon', issues, { mustExist: true })

	if (iconPath) {
		try {
			if (!statSync(iconPath).isFile()) {
				issues.push('macOS icon must point to a file')
			}
		} catch {
			issues.push('macOS icon could not be inspected')
		}
	}

	if (typeof settings.icon === 'string' && settings.icon && !settings.icon.toLowerCase().endsWith('.icns')) {
		issues.push('macOS icon must point to an .icns file')
	}

	const entitlementsPath =
		settings.entitlements === undefined
			? null
			: resolveProjectPath(appRoot, settings.entitlements, 'macOS entitlements', issues, {
					mustExist: true,
				})

	return { settings, viteConfig, bundleFile, iconPath, entitlementsPath, issues }
}
