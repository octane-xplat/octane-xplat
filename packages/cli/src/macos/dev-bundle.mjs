import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { inspectMacOSPackageConfig } from './config.mjs'
import { macOSExecutable } from './executables.mjs'
import { writeInfoPlist } from './info-plist.mjs'

const execFileAsync = promisify(execFile)

/**
 * Pick a stable certificate identity for the throwaway dev bundle so
 * keychain-trusted processes keep their access across sessions; ad-hoc
 * signatures derive the ACL from the code hash and re-prompt every time.
 * XPLAT_MACOS_DEV_SIGNING_IDENTITY overrides detection ('-' forces ad hoc).
 * The SHA-1 fingerprint is returned because certificate names can match
 * several keychain entries.
 */
async function resolveDevSigningIdentity() {
	const configured = process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY
	if (configured) {
		return { identity: configured, explicit: true }
	}

	let listing
	try {
		listing = (await execFileAsync('security', ['find-identity', '-v', '-p', 'codesigning'])).stdout
	} catch {
		return { identity: '-', explicit: false }
	}

	let development, developerId, other
	for (const line of listing.split('\n')) {
		if (line.includes('CSSMERR')) {
			continue
		}

		const sha = /\b[0-9a-f]{40}\b/i.exec(line)?.[0]
		if (!sha) {
			continue
		}

		if (line.includes('Apple Development:')) {
			development ??= sha
		} else if (line.includes('Developer ID Application:')) {
			developerId ??= sha
		} else {
			other ??= sha
		}
	}

	return { identity: development ?? developerId ?? other ?? '-', explicit: false }
}

/** Sign the materialized bundle; fall back to ad hoc unless an identity was requested. */
async function signDevBundle(appPath) {
	if (
		process.env.XPLAT_MACOS_SKIP_SIGNING === '1' &&
		!process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY
	) {
		return
	}

	// security/codesign exist only on macOS; other hosts (CI exercising bundle
	// materialization) skip unless an identity was explicitly requested.
	if (process.platform !== 'darwin' && !process.env.XPLAT_MACOS_DEV_SIGNING_IDENTITY) {
		return
	}

	const { identity, explicit } = await resolveDevSigningIdentity()
	try {
		await execFileAsync('codesign', ['--force', '--sign', identity, appPath])
	} catch (error) {
		if (explicit) {
			throw new Error(
				`macOS dev bundle signing failed (identity ${identity}): ` +
					(error.stderr || error.message),
			)
		}

		console.warn(`[macos-dev] signing with ${identity} failed; falling back to ad hoc`)

		await execFileAsync('codesign', ['--force', '--sign', '-', appPath])
	}
}

/** Keep dev arguments/stdio while giving AppKit a real main bundle identity. */
export async function createMacOSDevBundle(appRoot, manifest) {
	const target = manifest.xplat?.targets?.macos ?? {}
	const packageSettings = target.package ?? {}
	const dev = target.dev ?? {}
	const productName =
		dev.productName ?? packageSettings.productName ?? manifest.name ?? 'Octane App'

	const executableName = packageSettings.executableName ?? 'App'
	const settings = {
		productName,
		executableName,
		bundleIdentifier:
			packageSettings.bundleIdentifier ??
			`org.octane.dev.${createHash('sha256').update(appRoot).digest('hex').slice(0, 16)}`,
		version: packageSettings.version ?? '0.0.0',
		minimumSystemVersion: packageSettings.minimumSystemVersion ?? '13.5',
		icon: dev.icon ?? packageSettings.icon,
		// Validate identity independently of production build/signing configuration.
		viteConfig: dev.viteConfig ?? dev.hostViteConfig,
		bundleFile: dev.bundleFile ?? dev.hostBundleFile,
	}

	const { iconPath, issues } = inspectMacOSPackageConfig(appRoot, settings)
	if (issues.length) {
		throw new Error(issues.join('; '))
	}

	const source = await macOSExecutable(appRoot, 'macos-arm64/host')
	const cache = join(appRoot, 'node_modules/.cache/xplat/macos-dev')
	await mkdir(cache, { recursive: true })
	const directory = await mkdtemp(join(cache, 'session-'))
	const cleanup = () => rm(directory, { recursive: true, force: true })
	try {
		const contents = join(directory, `${executableName}.app`, 'Contents')
		const executable = join(contents, 'MacOS', executableName)
		await mkdir(join(contents, 'MacOS'), { recursive: true })
		await mkdir(join(contents, 'Resources'), { recursive: true })
		await cp(source, executable)
		await chmod(executable, 0o755)
		if (iconPath) {
			await cp(iconPath, join(contents, 'Resources', 'AppIcon.icns'))
		}

		await writeFile(
			join(contents, 'Info.plist'),
			writeInfoPlist(settings, iconPath ? 'AppIcon.icns' : null),
		)

		await signDevBundle(join(directory, `${executableName}.app`))

		return { executable, cleanup }
	} catch (error) {
		await cleanup()
		throw error
	}
}
