import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const macOSRuntimePackageName = '@nativescript/macos-node-api'

export const macOSRuntimeFrameworkRelativePath = join(
	'build',
	'RelWithDebInfo',
	'NativeScript.apple.node',
	'macos-arm64',
	'NativeScript.framework',
)

const requiredPackageFiles = ['index.cjs', 'index.mjs', 'index.d.ts', 'LICENSE']

function readPackageManifest(path) {
	try {
		const manifest = JSON.parse(readFileSync(path, 'utf8'))
		return manifest && typeof manifest === 'object' && !Array.isArray(manifest) ? manifest : null
	} catch {
		return null
	}
}

function isFile(path) {
	try {
		return statSync(path).isFile()
	} catch {
		return false
	}
}

export function inspectMacOSRuntimePackage(appRoot) {
	const packageRoot = join(appRoot, 'node_modules', ...macOSRuntimePackageName.split('/'))
	const packageManifest = readPackageManifest(join(packageRoot, 'package.json'))
	const requiredPaths = [
		...requiredPackageFiles,
		join(macOSRuntimeFrameworkRelativePath, 'Versions', 'A', 'NativeScript'),
	]

	const missingPaths = requiredPaths.filter((path) => !isFile(join(packageRoot, path)))

	return { packageRoot, packageManifest, missingPaths }
}
