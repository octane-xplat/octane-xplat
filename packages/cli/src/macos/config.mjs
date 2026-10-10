import { existsSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { minimumJscHostSystemVersion } from './jsc-host/runtime.mjs'

const requiredPackageFields = [
	'productName',
	'bundleIdentifier',
	'executableName',
	'version',
	'minimumSystemVersion',
]

const macOSRenderers = new Set(['appkit', 'webview'])

function rendererOf(value, issues, prefix) {
	const renderer = value ?? 'appkit'
	if (!macOSRenderers.has(renderer)) {
		issues.push(`${prefix}.renderer must be "appkit" or "webview"`)
		return 'appkit'
	}

	return renderer
}

function resolveBuildPaths(appRoot, settings, issues, prefix, renderer, stage) {
	const webview = renderer === 'webview'
	const names = webview
		? [
				'webViteConfig',
				'hostViteConfig',
				'hostBundleFile',
				...(stage === 'package' ? ['webOutDir'] : []),
			]
		: ['viteConfig', 'bundleFile']

	const paths = {}
	for (const key of names) {
		if (typeof settings[key] !== 'string' || !settings[key].trim()) {
			issues.push(`missing ${prefix}.${key}`)
			continue
		}

		paths[key] = resolveProjectPath(
			appRoot,
			settings[key],
			`${prefix.slice('xplat.targets.macos.'.length)} ${key}`,
			issues,
			{
				mustExist: key.endsWith('Config'),
			},
		)
	}

	const bundleKey = webview ? 'hostBundleFile' : 'bundleFile'
	if (typeof settings[bundleKey] === 'string' && !settings[bundleKey].endsWith('.cjs')) {
		issues.push(`macOS ${bundleKey} must point to a CommonJS .cjs bundle`)
	}

	return paths
}

const macOSVersionPattern = /^\d+(?:\.\d+){1,2}$/

function compareVersions(left, right) {
	const leftParts = left.split('.').map(Number)
	const rightParts = right.split('.').map(Number)

	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
		const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
		if (difference !== 0) {
			return difference
		}
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
export function inspectMacOSPackageConfig(appRoot, value, selectedRenderer) {
	const issues = []
	const settings = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
	if (settings !== value) {
		issues.push('xplat.targets.macos.package must be an object')
	}

	for (const key of requiredPackageFields) {
		if (typeof settings[key] !== 'string' || !settings[key].trim()) {
			issues.push(`missing xplat.targets.macos.package.${key}`)
		}
	}

	const renderer = rendererOf(selectedRenderer, issues, 'xplat.targets.macos')

	if (
		settings.bundleIdentifier &&
		!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(settings.bundleIdentifier)
	) {
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

	const buildPaths = resolveBuildPaths(
		appRoot,
		settings,
		issues,
		'xplat.targets.macos.package',
		renderer,
		'package',
	)

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

	if (
		typeof settings.icon === 'string' &&
		settings.icon &&
		!settings.icon.toLowerCase().endsWith('.icns')
	) {
		issues.push('macOS icon must point to an .icns file')
	}

	const entitlementsPath =
		settings.entitlements === undefined
			? null
			: resolveProjectPath(appRoot, settings.entitlements, 'macOS entitlements', issues, {
					mustExist: true,
				})

	if (settings.infoPlist !== undefined) {
		if (!settings.infoPlist || typeof settings.infoPlist !== 'object' || Array.isArray(settings.infoPlist)) {
			issues.push('xplat.targets.macos.package.infoPlist must be an object')
		} else {
			for (const [key, value] of Object.entries(settings.infoPlist)) {
				if (!/^[A-Za-z0-9._() -]+$/.test(key)) {
					issues.push(`invalid macOS Info.plist key: ${key}`)
					continue
				}

				const kind = typeof value
				if (kind !== 'string' && kind !== 'boolean' && kind !== 'number') {
					issues.push(
						`xplat.targets.macos.package.infoPlist.${key} must be a string, number, or boolean`,
					)
				} else if (kind === 'number' && !Number.isInteger(value)) {
					issues.push(`xplat.targets.macos.package.infoPlist.${key} must be an integer`)
				}
			}
		}
	}

	return { settings, renderer, ...buildPaths, iconPath, entitlementsPath, issues }
}

/** Validate the CLI-owned CommonJS dev runner configuration. */
export function inspectMacOSDevConfig(appRoot, value, selectedRenderer) {
	const issues = []
	const settings = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
	if (settings !== value) {
		issues.push('xplat.targets.macos.dev must be an object')
	}

	const renderer = rendererOf(selectedRenderer, issues, 'xplat.targets.macos')
	if (renderer === 'webview') {
		const paths = resolveBuildPaths(
			appRoot,
			settings,
			issues,
			'xplat.targets.macos.dev',
			renderer,
			'dev',
		)

		return { ...paths, issues }
	}

	const paths = {}
	for (const key of ['viteConfig', 'bundleFile', 'shellViteConfig', 'shellBundleFile']) {
		if (settings[key] === undefined && key.startsWith('shell')) {
			continue
		}

		if (typeof settings[key] !== 'string' || !settings[key].trim()) {
			issues.push(`missing xplat.targets.macos.dev.${key}`)
			continue
		}

		paths[key] = resolveProjectPath(appRoot, settings[key], `macOS dev ${key}`, issues, {
			mustExist: key.endsWith('Config'),
		})

		if (key.endsWith('File') && !settings[key].endsWith('.cjs')) {
			issues.push(`macOS dev ${key} must end in .cjs`)
		}
	}

	if (Boolean(settings.shellViteConfig) !== Boolean(settings.shellBundleFile)) {
		issues.push('macOS dev shellViteConfig and shellBundleFile must be specified together')
	}

	return { ...paths, issues }
}
