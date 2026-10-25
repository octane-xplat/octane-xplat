import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { installedPackageRoot } from '../package-root.ts'

export const macOSRuntimePackageName = '@nativescript/macos-node-api'

const requiredPackageFiles = ['index.d.ts', 'LICENSE']

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
	// Hoisted workspaces install runtime packages at the workspace root, not
	// <app>/node_modules — resolve the way Node does. Fall back to the literal
	// path for the not-found packageRoot value.
	const packageRoot =
		installedPackageRoot(appRoot, macOSRuntimePackageName) ??
		join(appRoot, 'node_modules', ...macOSRuntimePackageName.split('/'))
	const packageManifest = readPackageManifest(join(packageRoot, 'package.json'))
	const missingPaths = requiredPackageFiles.filter((path) => !isFile(join(packageRoot, path)))

	return { packageRoot, packageManifest, missingPaths }
}
