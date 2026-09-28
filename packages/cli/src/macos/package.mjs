import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
	access,
	cp,
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	relative,
	rename,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises'

import { existsSync, readFileSync } from 'node:fs'
import { arch, homedir, platform } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectMacOSPackageConfig } from './config.mjs'
import { bundledNodeRuntime } from './runtime.mjs'

const nativeRuntimePackageName = '@nativescript/macos-node-api'
const nodeVersion = bundledNodeRuntime.version
const nodeArchive = `node-v${nodeVersion}-darwin-arm64.tar.xz`
const runtimeFrameworkRelativePath = join(
	'build',
	'RelWithDebInfo',
	'NativeScript.apple.node',
	'macos-arm64',
	'NativeScript.framework',
)

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
	if (config.issues.length) {throw new Error(config.issues.join('; '))}
	return config
}

async function exists(path) {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

async function fetchOk(url) {
	const response = await fetch(url)
	if (!response.ok) {throw new Error(`Download failed (${response.status}): ${url}`)}
	return response
}

async function ensureNodeRuntime() {
	const cacheRoot = join(homedir(), 'Library', 'Caches', 'octane-xplat', 'macos')
	const nodeDistribution = join(cacheRoot, `node-v${nodeVersion}-darwin-arm64`)
	const nodeExecutable = join(nodeDistribution, 'bin', 'node')

	if (await exists(nodeExecutable)) {
		const runtime = execFileSync(nodeExecutable, ['-p', '`${process.version} ${process.arch}`'], {
			encoding: 'utf8',
		}).trim()

		if (runtime !== `v${nodeVersion} arm64`) {
			throw new Error(`Unexpected cached Node runtime: ${runtime}`)
		}

		return { executable: nodeExecutable, distribution: nodeDistribution }
	}

	await mkdir(cacheRoot, { recursive: true })
	const baseUrl = `https://nodejs.org/dist/v${nodeVersion}`
	const archive = Buffer.from(await (await fetchOk(`${baseUrl}/${nodeArchive}`)).arrayBuffer())
	const actualHash = createHash('sha256').update(archive).digest('hex')
	if (actualHash !== bundledNodeRuntime.archiveSha256) {
		throw new Error(
			`Node archive checksum mismatch (expected ${bundledNodeRuntime.archiveSha256}, got ${actualHash})`,
		)
	}

	const archivePath = join(cacheRoot, nodeArchive)
	await writeFile(archivePath, archive)
	run('tar', ['-xJf', archivePath, '-C', cacheRoot])
	if (!(await exists(nodeExecutable))) {
		throw new Error(`Node ${nodeVersion} did not extract to ${nodeExecutable}`)
	}

	return { executable: nodeExecutable, distribution: nodeDistribution }
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
	nodeExecutable,
	nodeIdentifier,
	mainExecutable,
	appPath,
}) {
	if (!signingIdentity) {
		run('codesign', ['--force', '--sign', '-', nativeRuntimeFramework])
		run('codesign', ['--force', '--sign', '-', nodeExecutable])
		run('codesign', ['--force', '--sign', '-', mainExecutable])
		run('codesign', ['--force', '--sign', '-', appPath])
		run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
		console.log('[macos-package] app ad-hoc signed for local use; set MACOS_SIGNING_IDENTITY for distribution signing')
		return false
	}

	run('codesign', [
		'--force',
		'--sign',
		signingIdentity,
		'--timestamp',
		nativeRuntimeFramework,
	])

	run('codesign', ['--verify', '--strict', '--verbose=2', nativeRuntimeFramework])
	run('codesign', [
		'--force',
		'--sign',
		signingIdentity,
		'--identifier',
		nodeIdentifier,
		'--options',
		'runtime',
		'--timestamp',
		'--entitlements',
		entitlementsPath,
		nodeExecutable,
	])

	run('codesign', ['--verify', '--strict', '--verbose=2', nodeExecutable])
	run('codesign', [
		'--force',
		'--sign',
		signingIdentity,
		'--options',
		'runtime',
		'--timestamp',
		appPath,
	])

	run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
	console.log('[macos-package] app signed with Developer ID')
	return true
}

function signDiskImage(signingIdentity, bundleIdentifier, dmgPath) {
	if (!signingIdentity) {return}
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
	if (!notaryProfile) {return}
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

	const { settings, viteConfig, bundleFile, iconPath, entitlementsPath } = readPackageConfig(appRoot)
	const signingIdentity = process.env.MACOS_SIGNING_IDENTITY
	const notaryProfile = process.env.MACOS_NOTARY_PROFILE
	if (notaryProfile && !signingIdentity) {
		throw new Error('MACOS_NOTARY_PROFILE requires MACOS_SIGNING_IDENTITY.')
	}

	if (signingIdentity && !entitlementsPath) {
		throw new Error('Set xplat.targets.macos.package.entitlements before using MACOS_SIGNING_IDENTITY.')
	}

	console.log('[macos-package] building production Octane bundle')
	run('pnpm', ['exec', 'vite', 'build', '--config', viteConfig], { cwd: appRoot })
	if (!existsSync(bundleFile)) {throw new Error(`Packaged JS bundle not found: ${bundleFile}`)}

	let nativeRuntimePackage
	try {
		nativeRuntimePackage = await realpath(join(appRoot, 'node_modules', '@nativescript', 'macos-node-api'))
	} catch {
		throw new Error(`Cannot resolve ${nativeRuntimePackageName} from the app. Declare it in dependencies.`)
	}

	const nativeRuntimeSource = join(nativeRuntimePackage, runtimeFrameworkRelativePath)
	const nativeRuntimeBinary = join(
		nativeRuntimeSource,
		'Versions',
		'A',
		'NativeScript',
	)

	if (!(await exists(nativeRuntimeBinary))) {
		throw new Error(`NativeScript runtime binary missing: ${nativeRuntimeBinary}`)
	}

	const octaneRoot = await realpath(join(appRoot, 'node_modules', 'octane'))
	const octaneLicense = await readFile(join(octaneRoot, 'LICENSE'), 'utf8')
	const nativeLicense = await readFile(join(nativeRuntimePackage, 'LICENSE'), 'utf8')
	const nodeRuntime = await ensureNodeRuntime()
	const nodeLicense = await readFile(join(nodeRuntime.distribution, 'LICENSE'), 'utf8')

	const releaseRoot = join(appRoot, 'artifacts', 'macos-arm64')
	await mkdir(releaseRoot, { recursive: true })
	const stagingRoot = await mkdtemp(join(releaseRoot, '.xplat-macos-'))
	const appPath = join(stagingRoot, `${settings.executableName}.app`)
	const contentsPath = join(appPath, 'Contents')
	const resourcesPath = join(contentsPath, 'Resources')
	const packagedAppPath = join(resourcesPath, 'app')
	const mainExecutable = join(contentsPath, 'MacOS', settings.executableName)
	const nodeExecutable = join(contentsPath, 'Helpers', 'octane-node')
	const dmgPath = join(stagingRoot, `${settings.executableName}-macos-arm64.dmg`)

	let preserveStagingRoot = false
	try {
		await mkdir(dirname(mainExecutable), { recursive: true })
		await mkdir(dirname(nodeExecutable), { recursive: true })
		await mkdir(join(resourcesPath, 'licenses'), { recursive: true })
		await mkdir(packagedAppPath, { recursive: true })
		await cp(bundleFile, join(packagedAppPath, 'main.cjs'))
		await cp(nodeRuntime.executable, nodeExecutable)
		run('chmod', ['755', nodeExecutable])

		const nativeRuntimePath = join(
			packagedAppPath,
			'node_modules',
			'@nativescript',
			'macos-node-api',
		)

		const runtimeFrameworkPath = join(nativeRuntimePath, runtimeFrameworkRelativePath)
		const packagedFrameworkPath = join(contentsPath, 'Frameworks', 'NativeScript.framework')
		await mkdir(nativeRuntimePath, { recursive: true })
		await mkdir(dirname(runtimeFrameworkPath), { recursive: true })
		await mkdir(dirname(packagedFrameworkPath), { recursive: true })
		for (const file of ['index.cjs', 'index.mjs', 'index.d.ts', 'package.json', 'LICENSE']) {
			await cp(join(nativeRuntimePackage, file), join(nativeRuntimePath, file))
		}

		await cp(nativeRuntimeSource, packagedFrameworkPath, { recursive: true })
		await symlink(
			relative(dirname(runtimeFrameworkPath), packagedFrameworkPath),
			runtimeFrameworkPath,
			'dir',
		)

		if (iconPath) {
			await cp(iconPath, join(resourcesPath, 'AppIcon.icns'))
		}

		await writeFile(
			join(resourcesPath, 'licenses', 'THIRD-PARTY-NOTICES.txt'),
			[
				`Node.js ${nodeVersion}\n${nodeLicense}`,
				`Octane\n${octaneLicense}`,
				`${nativeRuntimePackageName}\n${nativeLicense}`,
			].join('\n\n'),
		)

		await writeFile(
			join(contentsPath, 'Info.plist'),
			writeInfoPlist(settings, iconPath ? 'AppIcon.icns' : null),
		)

		const launcherSource = fileURLToPath(new URL('./launcher.c', import.meta.url))
		console.log(`[macos-package] compiling app launcher and embedding Node ${nodeVersion} arm64 runtime`)
		run('clang', [
			'-arch',
			'arm64',
			`-mmacosx-version-min=${settings.minimumSystemVersion}`,
			'-O2',
			'-std=c11',
			'-Wall',
			'-Wextra',
			'-Werror',
			'-o',
			mainExecutable,
			launcherSource,
		])

		run('chmod', ['755', mainExecutable])

		const signed = signApp({
			signingIdentity,
			entitlementsPath,
			nativeRuntimeFramework: packagedFrameworkPath,
			nodeExecutable,
			nodeIdentifier: `${settings.bundleIdentifier}.node`,
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
