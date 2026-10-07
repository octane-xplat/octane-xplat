import { createHash } from 'node:crypto'
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { inspectMacOSPackageConfig } from './config.mjs'
import { macOSExecutable } from './executables.mjs'
import { writeInfoPlist } from './info-plist.mjs'

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

		return { executable, cleanup }
	} catch (error) {
		await cleanup()
		throw error
	}
}
