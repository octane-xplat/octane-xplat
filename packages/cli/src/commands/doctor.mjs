import { command } from '@alloc/cmd-ts'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, parse, relative, resolve } from 'node:path'
import * as p from '@clack/prompts'
import { hasMacOS, hasNative, hasWindows } from '../targets.mjs'
import { inspectPatches, patchStateDetail } from '../patches.mjs'
import { inspectMacOSPackageConfig } from '../macos/config.mjs'
import { inspectJscHost } from '../macos/jsc-host/runtime.mjs'
import { inspectMacOSRuntimePackage, macOSRuntimePackageName } from '../macos/runtime-package.mjs'

const frameworkFallbacks = {
	'@octane-xplat/ui': [
		'@nativescript-community/gesturehandler',
		'@nativescript-community/ui-drawer',
	],
	'@octane-xplat/platform': [
		'@nativescript-community/ui-document-picker',
		'@nativescript/biometrics',
		'@nativescript/camera',
		'@nativescript/geolocation',
		'@nativescript/haptics',
		'@nativescript/imagepicker',
		'@nativescript/local-notifications',
		'@nativescript/secure-storage',
	],
}

const nativePlugin = (name) =>
	(name.startsWith('@nativescript/') ||
		name.startsWith('@nativescript-community/') ||
		name.startsWith('nativescript-')) &&
	!name.endsWith('/octane') &&
	!name.endsWith('/core')

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

const packageName = (specifier) => {
	if (!specifier.startsWith('@') && !specifier.includes('/')) {
		return specifier
	}

	const parts = specifier.split('/')
	return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const importSpecifiers = (source) => {
	const specs = new Set()
	for (const pattern of [
		/\bfrom\s*['"]([^'"]+)['"]/g,
		/\bimport\s*['"]([^'"]+)['"]/g,
		/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
	]) {
		for (const match of source.matchAll(pattern)) {
			specs.add(match[1])
		}
	}

	return specs
}

const sourceFiles = (root) => {
	if (!existsSync(root)) {
		return []
	}

	const out = []
	const visit = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
				continue
			}

			const file = join(dir, entry.name)
			if (entry.isDirectory()) {
				visit(file)
			} else if (/\.(?:m?[jt]sx?|tsrx)$/.test(entry.name)) {
				out.push(file)
			}
		}
	}

	visit(root)
	return out
}

const workspacePackages = (cwd) => {
	const found = new Map()
	let dir = resolve(cwd)
	while (true) {
		for (const group of ['apps', 'packages']) {
			const parent = join(dir, group)
			if (!existsSync(parent)) {
				continue
			}

			for (const name of readdirSync(parent)) {
				const root = join(parent, name)
				const manifest = readJson(join(root, 'package.json'))
				if (manifest?.name) {
					found.set(manifest.name, root)
				}
			}
		}

		const next = dirname(dir)
		if (next === dir) {
			break
		}

		dir = next
	}

	return found
}

const packageRoot = (cwd, name, workspaces) => {
	const direct = join(cwd, 'node_modules', ...name.split('/'))
	if (existsSync(join(direct, 'package.json'))) {
		return direct
	}

	return workspaces.get(name)
}

const frameworkPlugins = (cwd, name, workspaces) => {
	const root = packageRoot(cwd, name, workspaces)
	const manifest = root && readJson(join(root, 'package.json'))
	// Only peers are app-declared contracts — real `dependencies` travel
	// transitively and merge through `ns prepare`'s BFS without the app
	// redeclaring them (decision #51).
	const declared = Object.keys(manifest?.peerDependencies ?? {}).filter(nativePlugin)

	return declared.length ? declared : (frameworkFallbacks[name] ?? [])
}

/**
 * Find native plugins required by the framework packages reachable from an app
 * source tree, then compare them with the app's own package.json. This is a
 * warning because the web target does not need native plugin declarations and
 * a package may intentionally keep an optional native capability unused.
 */
export function findMissingPluginDeclarations(cwd) {
	const manifest = readJson(join(cwd, 'package.json')) ?? {}
	const owned = new Set([
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.devDependencies ?? {}),
		...Object.keys(manifest.optionalDependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
	])

	const workspaces = workspacePackages(cwd)
	const pending = sourceFiles(join(cwd, 'src'))
	for (const dir of ['app', 'src/app']) {
		pending.push(...sourceFiles(join(cwd, dir)))
	}

	const visited = new Set()
	const frameworks = new Map()

	while (pending.length) {
		const file = pending.pop()
		if (visited.has(file)) {
			continue
		}

		visited.add(file)
		let source
		try {
			source = readFileSync(file, 'utf8')
		} catch {
			continue
		}

		for (const specifier of importSpecifiers(source)) {
			const name = packageName(specifier)
			if (frameworkFallbacks[name]) {
				if (!frameworks.has(name)) {
					frameworks.set(name, new Set())
				}

				frameworks.get(name).add(relative(cwd, file) || parse(file).base)
				continue
			}

			const root = packageRoot(cwd, name, workspaces)
			if (root && workspaces.has(name)) {
				pending.push(...sourceFiles(root))
			}
		}
	}

	const missing = new Map()
	for (const [framework] of frameworks) {
		for (const plugin of frameworkPlugins(cwd, framework, workspaces)) {
			if (!owned.has(plugin)) {
				if (!missing.has(plugin)) {
					missing.set(plugin, new Set())
				}

				missing.get(plugin).add(framework)
			}
		}
	}

	return [...missing.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([plugin, frameworks]) => ({ plugin, frameworks: [...frameworks].sort() }))
}

/**
 * @nativescript/vite scopes HMR to the app source dir plus the roots named in
 * the app's tsconfig `paths` — a workspace package imported but absent from
 * `paths` still builds and serves, but edits to it never reach `handleHotUpdate`
 * and the save is dropped silently. Warn when that gap exists.
 */
export function findHmrScopeGaps(cwd) {
	if (!existsSync(join(cwd, 'nativescript.config.ts'))) {
		return []
	}

	const tsconfig = readJson(join(cwd, 'tsconfig.json'))
	let paths = tsconfig?.compilerOptions?.paths
	if (!paths && typeof tsconfig?.extends === 'string') {
		paths = readJson(join(cwd, tsconfig.extends))?.compilerOptions?.paths ?? undefined
	}

	if (!paths) {
		return []
	}

	const workspaces = workspacePackages(cwd)
	if (workspaces.size === 0) {
		return []
	}

	// '@scope/pkg' and '@scope/pkg/*' both cover the package.
	const covered = new Set(Object.keys(paths).map((k) => k.replace(/\/?\*$/, '')))

	const pending = [
		...sourceFiles(join(cwd, 'src')),
		...sourceFiles(join(cwd, 'app')),
		...sourceFiles(join(cwd, 'src/app')),
	]

	const visited = new Set()
	const gaps = new Set()
	while (pending.length) {
		const file = pending.pop()
		if (visited.has(file)) {
			continue
		}

		visited.add(file)
		let source
		try {
			source = readFileSync(file, 'utf8')
		} catch {
			continue
		}

		for (const specifier of importSpecifiers(source)) {
			const name = packageName(specifier)
			const root = workspaces.get(name)
			if (!root) {
				continue
			}

			if (!covered.has(name)) {
				gaps.add(name)
			}

			pending.push(...sourceFiles(root))
		}
	}

	return [...gaps].sort()
}

const check = (cmd, args, cwd = process.cwd(), timeout = 15000) => {
	try {
		return {
			ok: true,
			out: execFileSync(cmd, args, {
				encoding: 'utf8',
				cwd,
				timeout,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
				.trim()
				.split('\n')[0],
		}
	} catch (error) {
		return {
			ok: false,
			out: [error.stdout, error.stderr].filter(Boolean).join('\n').trim(),
		}
	}
}

/** env checks — the things that have actually bitten this stack. */
export const doctor = command({
	name: 'doctor',
	description: 'Check the toolchain required by this project’s declared targets',
	args: {},
	handler: async () => {
		const cwd = process.cwd()
		p.intro('xplat doctor')
		const rows = []
		const row = (name, ok, detail, hint) => rows.push({ name, ok, detail, hint })
		const native = hasNative(cwd)
		const macos = hasMacOS(cwd)
		const manifest = readJson(join(cwd, 'package.json')) ?? {}
		let declarationPackCheckFailed = false
		let declarationPackCheckOutput = ''
		if (existsSync(join(cwd, 'tsrx-typegen.json'))) {
			const declarations = check('pnpm', ['exec', 'tsrx-typegen', '--pack-check'], cwd, 120000)
			row(
				'tsrx package declarations',
				declarations.ok,
				declarations.out,
				'run pnpm exec tsrx-typegen --pack-check and resolve the reported package issue',
			)

			declarationPackCheckFailed = !declarations.ok
			declarationPackCheckOutput = declarations.out
		}

		row('node', check('node', ['--version']).ok, check('node', ['--version']).out)
		row('pnpm', check('pnpm', ['--version']).ok, check('pnpm', ['--version']).out)
		if (native) {
			row(
				'ns CLI',
				check('pnpm', ['exec', 'ns', '--version']).ok,
				check('pnpm', ['exec', 'ns', '--version']).out,
				'add the nativescript devDep (the starter ships it)',
			)

			row(
				'xcodebuild',
				check('xcodebuild', ['-version']).ok,
				check('xcodebuild', ['-version']).out,
				'iOS needs Xcode — App Store install + xcode-select',
			)

			row(
				'xcodeproj gem',
				check('ruby', ['-e', 'require "xcodeproj"']).ok,
				'',
				'gem install --user-install xcodeproj',
			)

			const sims = check('xcrun', ['simctl', 'list', 'devices', 'booted'])
			row('iOS simulator', sims.ok, sims.out || 'none booted')
			const adb = check('adb', ['devices'])
			const devices = adb.ok
				? adb.out
						.split('\n')
						.slice(1)
						.filter((l) => l.includes('\tdevice')).length
				: 0

			row('adb', adb.ok, `${devices} device(s)`, 'Android SDK platform-tools on PATH')
			row(
				'ANDROID_HOME',
				!!process.env.ANDROID_HOME,
				process.env.ANDROID_HOME || 'unset',
				'export ANDROID_HOME=$HOME/Library/Android/sdk',
			)

			row(
				'JAVA_HOME',
				!!process.env.JAVA_HOME,
				process.env.JAVA_HOME || 'unset',
				'JDK 17 (JDK 25 breaks the Android toolchain)',
			)
		}

		if (macos) {
			const target = manifest.xplat?.targets?.macos ?? {}
			const packageConfig = target.package ?? {}
			const runtimeVersion =
				manifest.dependencies?.[macOSRuntimePackageName] ??
				manifest.devDependencies?.[macOSRuntimePackageName]

			const runtimeInspection = inspectMacOSRuntimePackage(cwd)

			let runtimeHint
			if (typeof runtimeVersion !== 'string') {
				runtimeHint = `declare ${macOSRuntimePackageName} in dependencies`
			} else if (!runtimeInspection.packageManifest) {
				runtimeHint = `declared ${runtimeVersion}, but its installed package.json is missing or unreadable; run pnpm install`
			} else if (runtimeInspection.missingPaths.length) {
				runtimeHint = `installed ${runtimeInspection.packageManifest.version ?? runtimeVersion} is missing required files: ${runtimeInspection.missingPaths.join(', ')}; install a compatible ${macOSRuntimePackageName} release`
			}

			const scripts = manifest.scripts ?? {}
			const macHost = process.platform === 'darwin'
			const signingIdentity = process.env.MACOS_SIGNING_IDENTITY
			const notaryProfile = process.env.MACOS_NOTARY_PROFILE
			const packageInspection = inspectMacOSPackageConfig(cwd, target.package)
			const packageIssues = [...packageInspection.issues]
			if (signingIdentity && !packageInspection.entitlementsPath) {
				packageIssues.push('set xplat.targets.macos.package.entitlements when signing')
			}

			row(
				'macOS host',
				macHost,
				process.platform,
				'run AppKit Node-API development and packaging on macOS',
			)

			row(
				'macOS architecture',
				process.arch === 'arm64',
				process.arch,
				'the current packaged runtime targets Apple Silicon (arm64)',
			)

			row(
				'macOS dev script',
				typeof scripts.dev === 'string',
				scripts.dev ? 'present' : 'missing',
				'define scripts.dev in package.json to start the AppKit host',
			)

			row(
				'macOS package config',
				packageIssues.length === 0,
				packageIssues.length ? packageIssues.join('; ') : packageConfig.bundleIdentifier,
				'declare xplat.targets.macos.package metadata and valid Vite/entitlements paths',
			)

			row(
				'macOS NativeScript declarations',
				runtimeHint === undefined,
				runtimeInspection.packageManifest?.version ?? runtimeVersion ?? 'not declared',
				runtimeHint,
			)

			const jscHost = inspectJscHost()
			row(
				'macOS JavaScriptCore package host',
				jscHost.issues.length === 0,
				jscHost.issues.length ? jscHost.issues.join('; ') : 'pinned arm64 host and addon verified',
				'reinstall @octane-xplat/cli or rebuild its pinned macOS host artifacts',
			)

			if (macHost) {
				const codesign = check('codesign', ['--verify', '/usr/bin/codesign'])
				const hdiutil = check('hdiutil', ['help'])
				row(
					'codesign',
					codesign.ok,
					codesign.out || 'available',
					'ensure /usr/bin/codesign is available',
				)

				row(
					'hdiutil',
					hdiutil.ok,
					hdiutil.out || 'available',
					'install macOS command-line tools',
				)

			}

			if (notaryProfile) {
				const notarytool = check('xcrun', ['notarytool', '--version'])
				row(
					'macOS notarization signing',
					!!signingIdentity,
					signingIdentity ? 'Developer ID configured' : 'not configured',
					'set MACOS_SIGNING_IDENTITY when MACOS_NOTARY_PROFILE is set',
				)

				row(
					'xcrun notarytool',
					notarytool.ok,
					notarytool.out || 'unavailable',
					'install Xcode Command Line Tools',
				)
			}
		}

		for (const patch of inspectPatches(cwd)) {
			if (patch.state === 'not-declared') {continue}
			row(
				`patch ${patch.specifier}`,
				patch.state === 'applied',
				patchStateDetail(patch.state),
				patch.state === 'not-installed'
					? 'run `pnpm install`'
					: 'run `xplat patches apply`',
			)
		}

		const windows = hasWindows(cwd)
		if (windows) {
			const winHost = process.platform === 'win32'
			row(
				'Windows host',
				winHost,
				process.platform,
				'the WinUI 3 target builds and runs only on Windows 10 1809+',
			)

			const windowsRuntimeVersion =
				manifest.devDependencies?.['@nativescript/windows'] ??
				manifest.dependencies?.['@nativescript/windows']

			row(
				'@nativescript/windows',
				typeof windowsRuntimeVersion === 'string' && !/[\^~]/.test(windowsRuntimeVersion),
				windowsRuntimeVersion ?? 'not declared',
				'pin an exact version — ranges match incompatible older prereleases',
			)

			if (winHost) {
				const dotnet = check('dotnet', ['--version'])
				const dotnetMajor = parseInt(dotnet.out ?? '', 10)
				row(
					'.NET SDK',
					dotnet.ok && dotnetMajor >= 10,
					dotnet.out || 'not found',
					'install the .NET 10 SDK — the WinUI 3 host builds with dotnet build',
				)

				const devMode = check('powershell', [
					'-NoProfile',
					'-Command',
					'(Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense',
				])

				row(
					'Developer Mode',
					devMode.ok && devMode.out?.trim() === '1',
					devMode.ok ? `AllowDevelopmentWithoutDevLicense=${devMode.out?.trim() || 'unset'}` : 'unverified',
					'enable Settings → For developers → Developer Mode, or signed MSIX packaging',
				)
			}
		}

		const pluginWarnings = native ? findMissingPluginDeclarations(cwd) : []
		for (const { plugin, frameworks } of pluginWarnings) {
			p.log.warn(
				`native plugin declaration — ${plugin} is required by ${frameworks.join(', ')}; add it to this app's package.json`,
			)
		}

		const scopeGaps = native ? findHmrScopeGaps(cwd) : []
		for (const name of scopeGaps) {
			p.log.warn(
				`HMR scope — ${name} is imported but missing from tsconfig paths; native hot updates silently skip its files`,
			)
		}

		let bad = 0
		for (const r of rows) {
			if (r.ok) {
				p.log.success(`${r.name} — ${r.detail || 'ok'}`)
			} else {
				bad++
				p.log.warn(`${r.name} — missing${r.hint ? ` (${r.hint})` : ''}`)
			}
		}

		const summary =
			bad === 0
				? 'All checks pass'
				: `${bad} check(s) need attention — see the missing items above`

		p.outro(
			pluginWarnings.length
				? `${summary}; ${pluginWarnings.length} native plugin declaration warning(s)`
				: summary,
		)

		if (declarationPackCheckFailed) {
			if (declarationPackCheckOutput) {console.error(declarationPackCheckOutput)}
			process.exitCode = 1
		}
	},
})
