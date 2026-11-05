// @ts-nocheck — canonical platform checks shared by reference and selected-project workers.
import { runDoctorTool as check } from '../doctor-tool.ts'
import type { DoctorCheck } from '../doctor-checks.ts'
import { inspectMacOSPackageConfig, inspectMacOSDevConfig } from './config.ts'
import { inspectMacOSNative } from './native.ts'
import { inspectJscHost } from './jsc-host/runtime.ts'
import { inspectMacOSRuntimePackage, macOSRuntimePackageName } from './runtime-package.ts'

/** Tool and payload observations only; no app launch or native compilation. */
export async function inspectMacOSDoctor(
	cwd: string,
	manifest: Record<string, any>,
	hostPackage = '@octane-xplat/cli',
) {
	const rows: DoctorCheck[] = []
	const row = (name, ok, detail, hint) => rows.push({ name, ok, detail, hint })
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
		runtimeHint = `declared ${runtimeVersion}, but its installed package.json is missing or unreadable; run bun install`
	} else if (runtimeInspection.missingPaths.length) {
		runtimeHint = `installed ${runtimeInspection.packageManifest.version ?? runtimeVersion} is missing required files: ${runtimeInspection.missingPaths.join(', ')}; install a compatible ${macOSRuntimePackageName} release`
	}

	const scripts = manifest.scripts ?? {}
	const macHost = process.platform === 'darwin'
	const signingIdentity = process.env.MACOS_SIGNING_IDENTITY
	const notaryProfile = process.env.MACOS_NOTARY_PROFILE
	const packageInspection = inspectMacOSPackageConfig(cwd, target.package, target.renderer)
	const packageIssues = [...packageInspection.issues]
	if (signingIdentity && !packageInspection.entitlementsPath) {
		packageIssues.push('set xplat.targets.macos.package.entitlements when signing')
	}

	row(
		'macOS host',
		macHost,
		process.platform,
		target.renderer === 'webview'
			? 'run WKWebView with the JavaScriptCore + NativeScript host on macOS'
			: 'run AppKit Node-API development and packaging on macOS',
	)

	row(
		'macOS architecture',
		process.arch === 'arm64' || process.arch === 'x64',
		process.arch === 'x64' ? 'x86_64' : process.arch,
		'the packaged runtime targets macOS arm64 and x86_64 (universal)',
	)

	row(
		'macOS dev script',
		target.dev
			? inspectMacOSDevConfig(cwd, target.dev, target.renderer).issues.length === 0
			: typeof scripts.dev === 'string',
		target.dev
			? inspectMacOSDevConfig(cwd, target.dev, target.renderer).issues.join('; ') ||
					(target.renderer === 'webview'
						? 'CLI-owned WKWebView + JavaScriptCore runner'
						: 'CLI-owned AppKit Node-API runner')
			: scripts.dev
				? 'present'
				: 'missing',
		'declare xplat.targets.macos.dev (required for native leaves), or scripts.dev for an existing JS-only runner',
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
		jscHost.issues.length ? jscHost.issues.join('; ') : 'pinned universal host and addon verified',
		`reinstall ${hostPackage} or rebuild its pinned macOS host artifacts`,
	)

	try {
		const native = await inspectMacOSNative(cwd)
		row(
			'macOS native leaf toolchain',
			true,
			native.leaves.length
				? `${native.leaves.length} leaves; SDK ${native.toolchain.sdk}; ${native.toolchain.libclang}`
				: 'no native leaves; no compilation tools needed',
		)

		if (native.leaves.length) {
			row(
				'macOS native dev runner',
				Boolean(target.dev),
				target.dev ? 'configured' : 'missing',
				'declare xplat.targets.macos.dev so native changes rebuild and restart the host',
			)
		}
	} catch (error) {
		row(
			'macOS native leaf toolchain',
			false,
			String(error),
			'fix the named package inputs, install/select Xcode and Command Line Tools, and install Zig only for Zig leaves',
		)
	}

	if (macHost) {
		const codesign = check('codesign', ['--verify', '/usr/bin/codesign'])
		const hdiutil = check('hdiutil', ['help'])
		row(
			'codesign',
			codesign.ok,
			codesign.out || 'available',
			'ensure /usr/bin/codesign is available',
		)

		row('hdiutil', hdiutil.ok, hdiutil.out || 'available', 'install macOS command-line tools')
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
	return rows
}
