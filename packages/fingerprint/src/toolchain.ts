import process from 'node:process'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Platform } from './types.ts'
/** Capture compiler/SDK identity at native prepare; publishing reuses these recorded public versions. */
export async function captureNativeToolchainAsync(
	projectRoot: string,
	platform: Platform,
): Promise<Record<string, string>> {
	const overrides: Record<string, string> = {}
	for (const key of [
		'CFLAGS',
		'CPPFLAGS',
		'CXXFLAGS',
		'OBJCFLAGS',
		'OTHER_CFLAGS',
		'OTHER_SWIFT_FLAGS',
		'LDFLAGS',
		'CC',
		'CXX',
		'SWIFT_VERSION',
		'ARCHS',
		'VALID_ARCHS',
		'SDKROOT',
		'IPHONEOS_DEPLOYMENT_TARGET',
		'MACOSX_DEPLOYMENT_TARGET',
		'JAVA_TOOL_OPTIONS',
		'GRADLE_OPTS',
		'ANDROID_NDK_HOME',
		'ANDROID_NDK_ROOT',
	]) {
		if (process.env[key] !== undefined) {
			overrides[key] = process.env[key]!.replaceAll(resolve(projectRoot), '<project>')
		}
	}
	const environment = createHash('sha256').update(JSON.stringify(overrides)).digest('hex')
	if (platform === 'ios' || platform === 'macos') {
		try {
			const xcode = execFileSync('xcodebuild', ['-version'], {
				encoding: 'utf8',
				timeout: 15000,
			}).match(/^Xcode [0-9.]+\r?\nBuild version [A-Za-z0-9]+/m)?.[0]
			const sdk = execFileSync(
				'xcrun',
				['--sdk', platform === 'ios' ? 'iphoneos' : 'macosx', '--show-sdk-version'],
				{ encoding: 'utf8', timeout: 15000 },
			).trim()
			if (!xcode || !/^[0-9.]+$/.test(sdk)) {
				throw new Error()
			}
			return { xcode, sdk, environment }
		} catch {
			throw new Error('Cannot identify the Apple compiler/SDK for this native build')
		}
	}
	if (platform === 'android') {
		let sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT
		const properties = join(resolve(projectRoot), 'platforms/android/local.properties')
		if (!sdk && existsSync(properties)) {
			sdk = (await readFile(properties, 'utf8'))
				.split(/\r?\n/)
				.find((line) => line.startsWith('sdk.dir='))
				?.slice(8)
				.replaceAll('\\:', ':')
				.replaceAll('\\\\', '\\')
		}
		if (!sdk || !existsSync(sdk)) {
			throw new Error('Cannot identify the Android SDK for this native build')
		}
		const versions: Record<string, string> = {}
		for (const group of ['platforms', 'build-tools', 'ndk', 'cmdline-tools']) {
			const path = join(sdk, group)
			if (!existsSync(path)) {
				continue
			}
			for (const name of (await readdir(path)).sort()) {
				const properties = join(path, name, 'source.properties')
				if (existsSync(properties)) {
					versions[`${group}/${name}`] = (await readFile(properties, 'utf8')).trim()
				}
			}
		}
		if (!Object.keys(versions).some((name) => name.startsWith('platforms/'))) {
			throw new Error('No installed Android platform SDK metadata')
		}
		const java = spawnSync(
			process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin/java') : 'java',
			['-version'],
			{ encoding: 'utf8', timeout: 15000 },
		)
		if (java.status !== 0 || !(java.stdout + java.stderr).trim()) {
			throw new Error('Cannot identify the Java toolchain for this native build')
		}
		const version = (java.stdout + java.stderr).match(
			/^(?:openjdk|java)(?: version)? "?([0-9][A-Za-z0-9._+-]*)/m,
		)?.[1]
		if (!version) {
			throw new Error('Cannot parse the Java toolchain version')
		}
		versions.java = version
		return { ...versions, environment }
	}
	throw new Error('Automatic native toolchain capture is implemented for Apple and Android builds')
}
