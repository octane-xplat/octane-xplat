const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { createRequire } = require('node:module')
const { pathToFileURL } = require('node:url')
const { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } = require('node:fs')
const { basename, dirname, join, resolve } = require('node:path')

const START = '// xplat-updates:start'
const END = '// xplat-updates:end'
function replaceBlock(source, content, insert) {
	const start = source.indexOf(START)
	if (start >= 0) {
		const end = source.indexOf(END, start)
		if (end < 0) {
			throw new Error('Incomplete xplat OTA boot block')
		}

		return source.slice(0, start) + START + '\n' + content + '\n' + source.slice(end)
	}

	return insert(source, START + '\n' + content + '\n' + END + '\n')
}

/** Idempotent after-prepare wiring; refuse unknown runtime templates. */
module.exports = async function prepare({
	projectDir,
	platform,
	projectName,
	platformsDir = join(projectDir, 'platforms'),
	nativeConfig,
	toolchain,
	release = false,
}) {
	platform = platform?.toLowerCase()
	if (!['ios', 'android'].includes(platform)) {
		throw new Error('OTA prepare supports only ios and android')
	}
	const {
		createFingerprintAsync,
		captureNativeToolchainAsync,
		resolveNativeConfigAsync,
		NATIVE_FINGERPRINT_FORMAT,
	} = await import(
		pathToFileURL(
			createRequire(join(projectDir, 'package.json')).resolve('@octane-xplat/fingerprint'),
		).href
	)
	nativeConfig ??= await resolveNativeConfigAsync(projectDir)
	toolchain ??= await captureNativeToolchainAsync(projectDir, platform)
	const nativeFlags = {}
	for (const name of [
		'--for-device',
		'--emulator',
		'--gradle-flavor',
		'--gradle-args',
		'--arch',
		'--architecture',
		'--sdk',
	]) {
		const index = process.argv.findIndex((value) => value === name || value.startsWith(name + '='))
		if (index >= 0) {
			nativeFlags[name] = process.argv[index].includes('=')
				? process.argv[index].slice(name.length + 1)
				: process.argv[index + 1]?.startsWith('--')
					? true
					: (process.argv[index + 1] ?? true)
		}
	}
	toolchain = {
		...toolchain,
		configuration: release ? 'release' : 'debug',
		nativeFlags: createHash('sha256').update(JSON.stringify(nativeFlags)).digest('hex'),
	}
	const resources = resolve(projectDir, nativeConfig.appResourcesPath ?? 'App_Resources')
	const platformRoot = join(platformsDir, platform)
	const appDirs =
		platform === 'android'
			? [join(platformRoot, 'app/src/main/assets/app')]
			: projectName
				? [join(platformRoot, projectName, 'app')]
				: readdirSync(platformRoot, { withFileTypes: true })
						.filter((entry) => entry.isDirectory())
						.map((entry) => join(platformRoot, entry.name, 'app'))
						.filter((path) => existsSync(join(path, 'package.json')))
	if (appDirs.length !== 1 || !existsSync(join(appDirs[0], 'package.json'))) {
		throw new Error(
			'OTA requires exactly one prepared app output; run NativeScript prepare before this hook',
		)
	}
	if (platform === 'ios') {
		const name = projectName ?? basename(dirname(appDirs[0]))
		const project = join(platformRoot, name + '.xcodeproj')
		const pbx = join(project, 'project.pbxproj')
		if (existsSync(pbx) && /XCRemoteSwiftPackageReference/.test(readFileSync(pbx, 'utf8'))) {
			// NativeScript first resolves runtime Swift packages during build,
			// after this hook. Resolve now so its actual pins enter the baked hash.
			const workspace = join(platformRoot, name + '.xcworkspace')
			try {
				execFileSync(
					'xcodebuild',
					[
						existsSync(workspace) ? '-workspace' : '-project',
						existsSync(workspace) ? workspace : project,
						'-scheme',
						name,
						'-destination',
						'generic/platform=iOS',
						'-resolvePackageDependencies',
					],
					{ cwd: projectDir, stdio: 'pipe', timeout: 300000 },
				)
			} catch {
				throw new Error(
					'OTA could not resolve Swift packages before recording native compatibility; resolve the Xcode project dependencies and retry',
				)
			}
		}
	}
	const fingerprint = await createFingerprintAsync(projectDir, {
		platforms: [platform],
		nativeConfig,
		toolchain,
	})
	const artifact = {
		format: NATIVE_FINGERPRINT_FORMAT,
		platform,
		hash: fingerprint.hash,
		release,
	}
	const artifactJSON = JSON.stringify(artifact, null, 2) + '\n'
	const stamp = () => {
		writeFileSync(join(appDirs[0], 'xplat-native.json'), artifactJSON)
		const directory = join(projectDir, '.xplat/fingerprints')
		mkdirSync(directory, { recursive: true })
		writeFileSync(
			join(directory, platform + '.json'),
			JSON.stringify({ ...artifact, toolchain, sources: fingerprint.sources }, null, 2) + '\n',
		)
	}

	if (platform === 'ios') {
		const xcconfig = join(resources, 'iOS/build.xcconfig')
		if (existsSync(xcconfig) && /NS_SWIFTUI_BOOT\s*=\s*1\b/.test(readFileSync(xcconfig, 'utf8'))) {
			throw new Error(
				'OTA requires the stock iOS main.m startup; SwiftUI boot needs an explicit integration',
			)
		}

		const file = join(platformRoot, 'internal/main.m')
		if (!existsSync(file)) {
			throw new Error('OTA: generated iOS main.m not found')
		}

		let source = readFileSync(file, 'utf8')
		const guard = readFileSync(join(__dirname, 'native/boot.m'), 'utf8').replaceAll(
			'__XPLAT_NATIVE_FINGERPRINT__',
			fingerprint.hash,
		)
		source = replaceBlock(source, guard, (text, block) => {
			const offset = text.search(/int\s+main\s*\(/)
			if (offset < 0) {
				throw new Error('OTA: unsupported iOS main.m template')
			}

			return text.slice(0, offset) + block + '\n' + text.slice(offset)
		})

		if (!source.includes('baseDir = XplatOTABoot(baseDir);')) {
			const anchor = /NSString\s*\*\s*baseDir\s*=\s*\[\[NSBundle mainBundle\] resourcePath\];/
			if (!anchor.test(source)) {
				throw new Error('OTA: unsupported iOS baseDir initialization')
			}

			source = source.replace(anchor, '$&\n    baseDir = XplatOTABoot(baseDir);')
		}

		writeFileSync(file, source)
		stamp()
	} else if (platform === 'android') {
		const manifest = join(platformRoot, 'app/src/main/AndroidManifest.xml')
		const xml = readFileSync(manifest, 'utf8')
		const application = xml.match(/<application\b[^>]*>/s)?.[0]
		if (!application?.match(/android:name\s*=\s*["']com\.tns\.NativeScriptApplication["']/)) {
			throw new Error(
				'OTA requires the stock NativeScriptApplication; custom Android Application startup needs an explicit integration',
			)
		}

		const file = join(platformRoot, 'app/src/main/java/com/tns/NativeScriptApplication.java')

		let source = readFileSync(file, 'utf8')
		const guard = readFileSync(join(__dirname, 'native/boot.java'), 'utf8').replaceAll(
			'__XPLAT_NATIVE_FINGERPRINT__',
			fingerprint.hash,
		)
		source = replaceBlock(source, guard, (text, block) => {
			const offset = text.lastIndexOf('}')
			if (offset < 0) {
				throw new Error('OTA: unsupported Android Application template')
			}

			return text.slice(0, offset) + block + text.slice(offset)
		})

		if (!source.includes('xplatOTABoot();')) {
			const anchor = 'com.tns.Runtime runtime = RuntimeHelper.initRuntime(this);'
			if (!source.includes(anchor)) {
				throw new Error('OTA: unsupported Android runtime initialization')
			}

			source = source.replace(anchor, 'xplatOTABoot();\n            ' + anchor)
		}

		writeFileSync(file, source)
		stamp()
	} else {
		throw new Error('OTA prepare supports only ios and android')
	}
}
