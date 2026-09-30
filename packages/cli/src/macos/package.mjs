import { execFileSync } from 'node:child_process'
import {
	access,
	cp,
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rename,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises'

import { existsSync, readFileSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectMacOSPackageConfig } from './config.mjs'
import { inspectMacOSRuntimePackage, macOSRuntimePackageName } from './runtime-package.mjs'
import {
	hostBundle,
	inspectJscHost,
	prebuiltRoot,
	validateHostBundle,
} from './jsc-host/runtime.mjs'

import { buildMacOSNative, writeNativeBootstrap } from './native.mjs'

function run(command, args, options = {}) {
	execFileSync(command, args, { stdio: 'inherit', ...options })
}

function readPackageConfig(appRoot) {
	const packagePath = join(appRoot, 'package.json')
	const manifest = JSON.parse(readFileSync(packagePath, 'utf8'))
	const target = manifest.xplat?.targets?.macos
	if (target?.runtime !== 'appkit-node-api') {
		throw new Error('Declare xplat.targets.macos.runtime as "appkit-node-api".')
	}

	const config = inspectMacOSPackageConfig(appRoot, target.package)
	if (config.issues.length) {
		throw new Error(config.issues.join('; '))
	}

	return config
}

function viteExecutable(appRoot) {
	const viteRoot = join(appRoot, 'node_modules', 'vite')
	let manifest
	try {
		manifest = JSON.parse(readFileSync(join(viteRoot, 'package.json'), 'utf8'))
	} catch {
		throw new Error(
			'Cannot resolve Vite from the macOS app. Declare vite in devDependencies and run pnpm install.',
		)
	}

	const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.vite
	if (typeof bin !== 'string') {
		throw new Error('Installed Vite package has no CLI binary.')
	}

	return join(viteRoot, bin)
}

async function exists(path) {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

function xmlEscape(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function writeInfoPlist(settings, iconFile = null) {
	const productName = xmlEscape(settings.productName)
	const executableName = xmlEscape(settings.executableName)
	const bundleIdentifier = xmlEscape(settings.bundleIdentifier)
	const version = xmlEscape(settings.version)
	const minimumSystemVersion = xmlEscape(settings.minimumSystemVersion)
	const iconEntry = iconFile
		? `  <key>CFBundleIconFile</key><string>${xmlEscape(iconFile)}</string>\n`
		: ''

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleExecutable</key><string>${executableName}</string>
  <key>CFBundleIdentifier</key><string>${bundleIdentifier}</string>
${iconEntry}  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>${productName}</string>
  <key>CFBundleDisplayName</key><string>${productName}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${version}</string>
  <key>CFBundleVersion</key><string>${version}</string>
  <key>LSMinimumSystemVersion</key><string>${minimumSystemVersion}</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
`
}

function signApp({
	signingIdentity,
	entitlementsPath,
	nativeRuntimeFramework,
	nativeLibraries = [],
	mainExecutable,
	appPath,
}) {
	if (process.env.XPLAT_MACOS_SKIP_SIGNING === '1' && !signingIdentity) {
		console.log('[macos-package] signing skipped for local host validation')
		return false
	}

	if (!signingIdentity) {
		for (const library of nativeLibraries) {
			run('codesign', ['--force', '--sign', '-', library])
		}

		run('codesign', ['--force', '--sign', '-', nativeRuntimeFramework])
		run('codesign', ['--force', '--sign', '-', mainExecutable])
		run('codesign', ['--force', '--sign', '-', appPath])
		run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
		console.log(
			'[macos-package] app ad-hoc signed for local use; set MACOS_SIGNING_IDENTITY for distribution signing',
		)

		return false
	}

	for (const library of nativeLibraries) {
		run('codesign', ['--force', '--sign', signingIdentity, '--timestamp', library])
		run('codesign', ['--verify', '--strict', '--verbose=2', library])
	}

	run('codesign', ['--force', '--sign', signingIdentity, '--timestamp', nativeRuntimeFramework])

	run('codesign', ['--verify', '--strict', '--verbose=2', nativeRuntimeFramework])
	run('codesign', [
		'--force',
		'--sign',
		signingIdentity,
		'--entitlements',
		entitlementsPath,
		'--options',
		'runtime',
		'--timestamp',
		appPath,
	])

	run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
	console.log('[macos-package] app signed with Developer ID')
	return true
}

async function completeFrameworkSymlinks(frameworkPath) {
	const aliases = [
		['A', join(frameworkPath, 'Versions', 'Current')],
		['Versions/Current/Headers', join(frameworkPath, 'Headers')],
		['Versions/Current/Resources', join(frameworkPath, 'Resources')],
		['Versions/Current/NativeScript', join(frameworkPath, 'NativeScript')],
	]

	for (const [target, path] of aliases) {
		try {
			await symlink(target, path)
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
		}
	}
}

function signDiskImage(signingIdentity, bundleIdentifier, dmgPath) {
	if (!signingIdentity) {
		return
	}

	run('codesign', [
		'--force',
		'--sign',
		signingIdentity,
		'--timestamp',
		'--identifier',
		bundleIdentifier,
		dmgPath,
	])

	run('codesign', ['--verify', '--strict', '--verbose=2', dmgPath])
	console.log('[macos-package] disk image signed with Developer ID')
}

function notarize(notaryProfile, dmgPath) {
	if (!notaryProfile) {
		return
	}

	run('xcrun', ['notarytool', 'submit', dmgPath, '--keychain-profile', notaryProfile, '--wait'])
	run('xcrun', ['stapler', 'staple', dmgPath])
	run('xcrun', ['stapler', 'validate', dmgPath])
	console.log('[macos-package] notarization ticket stapled and validated')
}

/** Build the app bundle and disk image for an opted-in AppKit Node-API app. */
export async function packageMacOS(appRoot) {
	if (platform() !== 'darwin' || arch() !== 'arm64') {
		throw new Error('The first macOS package target is Apple Silicon; build it on an arm64 Mac.')
	}

	const { settings, viteConfig, bundleFile, iconPath, entitlementsPath } =
		readPackageConfig(appRoot)

	const signingIdentity = process.env.MACOS_SIGNING_IDENTITY
	const notaryProfile = process.env.MACOS_NOTARY_PROFILE
	if (notaryProfile && !signingIdentity) {
		throw new Error('MACOS_NOTARY_PROFILE requires MACOS_SIGNING_IDENTITY.')
	}

	if (signingIdentity && !entitlementsPath) {
		throw new Error(
			'Set xplat.targets.macos.package.entitlements before using MACOS_SIGNING_IDENTITY.',
		)
	}

	const runtimeInspection = inspectMacOSRuntimePackage(appRoot)
	if (!runtimeInspection.packageManifest) {
		throw new Error(
			`Cannot resolve ${macOSRuntimePackageName} from the app. Declare it in dependencies.`,
		)
	}

	if (runtimeInspection.missingPaths.length) {
		const version = runtimeInspection.packageManifest.version
		const installed =
			typeof version === 'string'
				? `${macOSRuntimePackageName}@${version}`
				: macOSRuntimePackageName

		throw new Error(
			`Installed ${installed} is missing required files: ${runtimeInspection.missingPaths.join(', ')}`,
		)
	}

	let nativeRuntimePackage
	try {
		nativeRuntimePackage = await realpath(runtimeInspection.packageRoot)
	} catch {
		throw new Error(
			`Cannot resolve ${macOSRuntimePackageName} from the app. Declare it in dependencies.`,
		)
	}

	const hostInspection = inspectJscHost()
	if (hostInspection.issues.length) {
		throw new Error(`JavaScriptCore host is unavailable: ${hostInspection.issues.join('; ')}`)
	}

	console.log('[macos-package] building production Octane bundle')
	const native = await buildMacOSNative(appRoot, {
		minimumSystemVersion: settings.minimumSystemVersion,
	})

	if (native.libraries.length) {
		console.log(
			`[macos-native] ${native.cached ? 'cached' : 'compiled'} ${native.libraries.length} leaf libraries`,
		)
	}

	run(
		process.execPath,
		[fileURLToPath(new URL('./jsc-host/check-vite.mjs', import.meta.url)), appRoot, viteConfig],
		{ cwd: appRoot },
	)

	run(process.execPath, [viteExecutable(appRoot), 'build', '--config', viteConfig], {
		cwd: appRoot,
	})

	if (!existsSync(bundleFile)) {
		throw new Error(`Packaged JS bundle not found: ${bundleFile}`)
	}

	await validateHostBundle(bundleFile, appRoot)

	const octaneRoot = await realpath(join(appRoot, 'node_modules', 'octane'))
	const octaneLicense = await readFile(join(octaneRoot, 'LICENSE'), 'utf8')
	const nativeLicense = await readFile(join(nativeRuntimePackage, 'LICENSE'), 'utf8')
	const hostLicenses = await Promise.all(
		['libjsc', 'libjs', 'libnapi', 'libuv', 'libutf', 'libintrusive'].map(
			async (name) =>
				`${name}\n${await readFile(join(prebuiltRoot, 'licenses', `${name}.txt`), 'utf8')}`,
		),
	)

	const releaseRoot = join(appRoot, 'artifacts', 'macos-arm64')
	await mkdir(releaseRoot, { recursive: true })
	const stagingRoot = await mkdtemp(join(releaseRoot, '.xplat-macos-'))
	const appPath = join(stagingRoot, `${settings.executableName}.app`)
	const contentsPath = join(appPath, 'Contents')
	const resourcesPath = join(contentsPath, 'Resources')
	const packagedAppPath = join(resourcesPath, 'app')
	const mainExecutable = join(contentsPath, 'MacOS', settings.executableName)
	const dmgPath = join(stagingRoot, `${settings.executableName}-macos-arm64.dmg`)

	let preserveStagingRoot = false
	try {
		await mkdir(dirname(mainExecutable), { recursive: true })
		await mkdir(join(resourcesPath, 'licenses'), { recursive: true })
		await mkdir(packagedAppPath, { recursive: true })
		await cp(bundleFile, join(packagedAppPath, 'main.cjs'))
		await cp(join(hostBundle, 'host'), mainExecutable)
		await cp(native.metadata, join(resourcesPath, 'metadata.macos.arm64.nsmd'))
		await writeNativeBootstrap(native, join(resourcesPath, 'host-shim.js'), { packaged: true })
		const packagedFrameworkPath = join(contentsPath, 'Frameworks', 'NativeScript.framework')
		await mkdir(dirname(packagedFrameworkPath), { recursive: true })
		await cp(join(hostBundle, 'NativeScript.framework'), packagedFrameworkPath, {
			recursive: true,
			// Keep framework-relative symlinks resolving within the copied bundle.
			verbatimSymlinks: true,
		})

		await completeFrameworkSymlinks(packagedFrameworkPath)
		const nativeLibraries = []
		for (const library of native.libraries) {
			const path = join(contentsPath, 'Frameworks', library.file)
			await cp(join(native.directory, library.file), path)
			nativeLibraries.push(path)
		}

		if (iconPath) {
			await cp(iconPath, join(resourcesPath, 'AppIcon.icns'))
		}

		await writeFile(
			join(resourcesPath, 'licenses', 'THIRD-PARTY-NOTICES.txt'),
			[
				`Octane\n${octaneLicense}`,
				`${macOSRuntimePackageName}\n${nativeLicense}`,
				...hostLicenses,
				...(native.libraries.length
					? [
							`Metadata generator\n${await readFile(join(prebuiltRoot, 'licenses/metadata-generator.txt'), 'utf8')}`,
						]
					: []),
			].join('\n\n'),
		)

		await writeFile(
			join(contentsPath, 'Info.plist'),
			writeInfoPlist(settings, iconPath ? 'AppIcon.icns' : null),
		)

		console.log('[macos-package] staging JavaScriptCore AppKit host')
		run('chmod', ['755', mainExecutable])

		const signed = signApp({
			signingIdentity,
			entitlementsPath,
			nativeRuntimeFramework: packagedFrameworkPath,
			nativeLibraries,
			mainExecutable,
			appPath,
		})

		if (notaryProfile && !signed) {
			throw new Error('Notarization requested for an unsigned bundle.')
		}

		console.log('[macos-package] creating read-only compressed DMG')
		run('hdiutil', [
			'create',
			'-volname',
			settings.productName,
			'-srcfolder',
			appPath,
			'-ov',
			'-format',
			'UDZO',
			dmgPath,
		])

		signDiskImage(signingIdentity, settings.bundleIdentifier, dmgPath)
		notarize(notaryProfile, dmgPath)

		const finalAppPath = join(releaseRoot, `${settings.executableName}.app`)
		const finalDmgPath = join(releaseRoot, `${settings.executableName}-macos-arm64.dmg`)
		const previousAppPath = join(stagingRoot, `${settings.executableName}.previous.app`)
		let previousAppMoved = false
		let appPublished = false
		try {
			if (await exists(finalAppPath)) {
				await rename(finalAppPath, previousAppPath)
				previousAppMoved = true
			}

			await rename(appPath, finalAppPath)
			appPublished = true
			await rename(dmgPath, finalDmgPath)
		} catch (error) {
			const rollbackErrors = []
			if (appPublished) {
				try {
					await rm(finalAppPath, { recursive: true, force: true })
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError)
				}
			}

			if (previousAppMoved) {
				try {
					await rename(previousAppPath, finalAppPath)
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError)
				}
			}

			if (rollbackErrors.length > 0) {
				preserveStagingRoot = true
				throw new AggregateError(
					[error, ...rollbackErrors],
					`Failed to publish macOS artifacts and roll back; recovery files remain in ${stagingRoot}`,
				)
			}

			throw error
		}

		if (previousAppMoved) {
			try {
				await rm(previousAppPath, { recursive: true, force: true })
			} catch (error) {
				preserveStagingRoot = true
				console.error(`[macos-package] previous app backup remains at ${previousAppPath}`, error)
			}
		}

		console.log(`[macos-package] app: ${finalAppPath}`)
		console.log(`[macos-package] dmg: ${finalDmgPath}`)
	} finally {
		if (preserveStagingRoot) {
			console.error(`[macos-package] staging directory retained for recovery: ${stagingRoot}`)
		} else {
			await rm(stagingRoot, { recursive: true, force: true })
		}
	}
}
