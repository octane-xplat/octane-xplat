import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { access, cp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { homedir, arch, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appVersion = '0.1.0'
const bundleId = 'org.octane.xplat.macos-spike'
const nodeVersion = '26.7.0'
const nodeArchive = `node-v${nodeVersion}-darwin-arm64.tar.xz`
const cacheRoot = join(homedir(), 'Library', 'Caches', 'octane-xplat', 'macos')
const nodeDistribution = join(cacheRoot, `node-v${nodeVersion}-darwin-arm64`)
const nodeExecutable = join(nodeDistribution, 'bin', 'node')
const releaseRoot = join(appRoot, 'artifacts', 'macos-arm64')
const packageBuildRoot = join(appRoot, 'dist', 'package-build')
const appPath = join(releaseRoot, 'Octane.app')
const contentsPath = join(appPath, 'Contents')
const resourcesPath = join(contentsPath, 'Resources')
const packagedAppPath = join(resourcesPath, 'app')
const mainExecutable = join(contentsPath, 'MacOS', 'Octane')
const dmgPath = join(releaseRoot, 'Octane-macos-arm64.dmg')
const signingIdentity = process.env.MACOS_SIGNING_IDENTITY
const notaryProfile = process.env.MACOS_NOTARY_PROFILE

function run(command, args, options = {}) {
	execFileSync(command, args, { stdio: 'inherit', ...options })
}

async function fetchOk(url) {
	const response = await fetch(url)
	if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
	return response
}

async function ensureNodeRuntime() {
	if (platform() !== 'darwin' || arch() !== 'arm64') {
		throw new Error('The first macOS package target is Apple Silicon; build it on an arm64 Mac.')
	}

	if (await exists(nodeExecutable)) {
		const runtime = execFileSync(nodeExecutable, ['-p', '`${process.version} ${process.arch}`'], {
			encoding: 'utf8',
		}).trim()
		if (runtime !== `v${nodeVersion} arm64`) throw new Error(`Unexpected cached Node runtime: ${runtime}`)
		return nodeExecutable
	}

	await mkdir(cacheRoot, { recursive: true })
	const baseUrl = `https://nodejs.org/dist/v${nodeVersion}`
	const checksums = await (await fetchOk(`${baseUrl}/SHASUMS256.txt`)).text()
	const checksumLine = checksums.split(/\r?\n/).find((line) => line.endsWith(`  ${nodeArchive}`))
	const expectedHash = checksumLine?.split(/\s+/)[0]
	if (!expectedHash) throw new Error(`Node ${nodeVersion} has no checksum for ${nodeArchive}`)

	const archive = Buffer.from(await (await fetchOk(`${baseUrl}/${nodeArchive}`)).arrayBuffer())
	const actualHash = createHash('sha256').update(archive).digest('hex')
	if (actualHash !== expectedHash) throw new Error(`Node archive checksum mismatch: ${actualHash}`)

	const archivePath = join(cacheRoot, nodeArchive)
	await writeFile(archivePath, archive)
	run('tar', ['-xJf', archivePath, '-C', cacheRoot])
	if (!(await exists(nodeExecutable))) throw new Error(`Node ${nodeVersion} did not extract to ${nodeExecutable}`)
	return nodeExecutable
}

async function exists(path) {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}

function writeInfoPlist() {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleExecutable</key><string>Octane</string>
  <key>CFBundleIdentifier</key><string>${bundleId}</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>Octane macOS spike</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${appVersion}</string>
  <key>CFBundleVersion</key><string>${appVersion}</string>
  <key>LSMinimumSystemVersion</key><string>13.5</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
`
}

async function signApp(nativeRuntimePath) {
	if (!signingIdentity) {
		if (notaryProfile) throw new Error('MACOS_NOTARY_PROFILE requires MACOS_SIGNING_IDENTITY.')
		run('codesign', ['--force', '--sign', '-', mainExecutable])
		run('codesign', ['--force', '--sign', '-', appPath])
		run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
		console.log('[macos-package] app ad-hoc signed for local use; set MACOS_SIGNING_IDENTITY for distribution signing')
		return false
	}

	const entitlementsPath = join(appRoot, 'entitlements.plist')
	run('codesign', [
		'--force',
		'--sign', signingIdentity,
		'--options', 'runtime',
		'--timestamp',
		nativeRuntimePath,
	])
	run('codesign', ['--verify', '--strict', '--verbose=2', nativeRuntimePath])
	run('codesign', [
		'--force',
		'--sign', signingIdentity,
		'--options', 'runtime',
		'--timestamp',
		'--entitlements', entitlementsPath,
		appPath,
	])
	run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
	console.log('[macos-package] app signed with Developer ID')
	return true
}

async function signDiskImage() {
	if (!signingIdentity) return
	run('codesign', ['--force', '--sign', signingIdentity, '--timestamp', '--identifier', bundleId, dmgPath])
	run('codesign', ['--verify', '--strict', '--verbose=2', dmgPath])
	console.log('[macos-package] disk image signed with Developer ID')
}

async function notarize() {
	if (!notaryProfile) return
	if (!signingIdentity) throw new Error('Set MACOS_SIGNING_IDENTITY before notarizing.')
	run('xcrun', ['notarytool', 'submit', dmgPath, '--keychain-profile', notaryProfile, '--wait'])
	run('xcrun', ['stapler', 'staple', dmgPath])
	run('xcrun', ['stapler', 'validate', dmgPath])
	console.log('[macos-package] notarization ticket stapled and validated')
}

await rm(releaseRoot, { recursive: true, force: true })
await mkdir(join(contentsPath, 'MacOS'), { recursive: true })
await mkdir(packagedAppPath, { recursive: true })
await mkdir(join(resourcesPath, 'licenses'), { recursive: true })

console.log('[macos-package] building production Octane bundle')
await build({
	configFile: join(appRoot, 'vite.package.config.mjs'),
	root: appRoot,
	mode: 'production',
})
await cp(join(packageBuildRoot, 'main.cjs'), join(packagedAppPath, 'main.cjs'))

const nativeRuntimeEntry = fileURLToPath(import.meta.resolve('@nativescript/macos-node-api'))
const nativeRuntimePackage = dirname(nativeRuntimeEntry)
const nativeRuntimePath = join(
	packagedAppPath,
	'node_modules',
	'@nativescript',
	'macos-node-api',
)
const runtimeFrameworkRelativePath = join(
	'build',
	'RelWithDebInfo',
	'NativeScript.apple.node',
	'macos-arm64',
	'NativeScript.framework',
)
const nativeRuntimeBinary = join(
	nativeRuntimePath,
	runtimeFrameworkRelativePath,
	'Versions',
	'A',
	'NativeScript',
)
await mkdir(dirname(nativeRuntimePath), { recursive: true })
await mkdir(dirname(join(nativeRuntimePath, runtimeFrameworkRelativePath)), { recursive: true })
for (const file of ['index.cjs', 'index.mjs', 'index.d.ts', 'package.json', 'LICENSE']) {
	await cp(join(nativeRuntimePackage, file), join(nativeRuntimePath, file))
}
await cp(
	join(nativeRuntimePackage, runtimeFrameworkRelativePath),
	join(nativeRuntimePath, runtimeFrameworkRelativePath),
	{ recursive: true },
)
if (!(await exists(nativeRuntimeBinary))) throw new Error(`NativeScript runtime binary missing: ${nativeRuntimeBinary}`)

const octaneRoot = await realpath(join(appRoot, 'node_modules', 'octane'))
const octaneLicense = await readFile(join(octaneRoot, 'LICENSE'), 'utf8')
const nativeLicense = await readFile(join(nativeRuntimePackage, 'LICENSE'), 'utf8')
const nodeExecutablePath = await ensureNodeRuntime()
const nodeLicense = await readFile(join(nodeDistribution, 'LICENSE'), 'utf8')
await writeFile(
	join(resourcesPath, 'licenses', 'THIRD-PARTY-NOTICES.txt'),
	[
		`Node.js ${nodeVersion}\n${nodeLicense}`,
		`Octane\n${octaneLicense}`,
		`@nativescript/macos-node-api\n${nativeLicense}`,
	].join('\n\n'),
)
await writeFile(join(contentsPath, 'Info.plist'), writeInfoPlist())

const bootstrapPath = join(packageBuildRoot, 'sea-bootstrap.cjs')
const seaConfigPath = join(packageBuildRoot, 'sea-config.json')
await writeFile(
	bootstrapPath,
	`'use strict'\nconst path = require('node:path')\nconst { createRequire } = require('node:module')\nconst entry = path.resolve(path.dirname(process.execPath), '..', 'Resources', 'app', 'main.cjs')\ncreateRequire(entry)(entry)\n`,
)
await writeFile(
	seaConfigPath,
	JSON.stringify({ main: bootstrapPath, output: mainExecutable }, null, 2),
)
console.log(`[macos-package] embedding Node ${nodeVersion} arm64 runtime`)
run(nodeExecutablePath, ['--build-sea', seaConfigPath])
run('chmod', ['755', mainExecutable])

const signed = await signApp(nativeRuntimeBinary)
if (notaryProfile && !signed) throw new Error('Notarization requested for an unsigned bundle.')

console.log('[macos-package] creating read-only compressed DMG')
run('hdiutil', [
	'create',
	'-volname',
	'Octane macOS spike',
	'-srcfolder',
	appPath,
	'-ov',
	'-format',
	'UDZO',
	dmgPath,
])

await signDiskImage()
await notarize()
console.log(`[macos-package] app: ${appPath}`)
console.log(`[macos-package] dmg: ${dmgPath}`)
