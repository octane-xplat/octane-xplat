import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const hostRoot = dirname(fileURLToPath(import.meta.url))
export const prebuiltRoot = join(hostRoot, 'prebuilt')
export const hostBundle = join(prebuiltRoot, 'macos-arm64')
export const minimumJscHostSystemVersion = '13.5'

const supportedImports = new Set([
	'@nativescript/macos-node-api',
	'node:crypto',
	'node:fs',
	'node:os',
	'node:path',
])

function isFile(path) {
	try {return statSync(path).isFile()} catch {return false}
}

function inspectMachO(bytes, label, issues) {
	if (bytes.length < 32 || bytes.readUInt32LE(0) !== 0xfeedfacf || bytes.readUInt32LE(4) !== 0x0100000c) {
		issues.push(`${label} is not an arm64 Mach-O binary`)
		return
	}
	const commands = bytes.readUInt32LE(16)
	let offset = 32
	let minimumVersion
	for (let index = 0; index < commands; index++) {
		if (offset + 8 > bytes.length) {issues.push(`${label} has truncated load commands`); return}
		const command = bytes.readUInt32LE(offset)
		const size = bytes.readUInt32LE(offset + 4)
		if (size < 8 || offset + size > bytes.length) {issues.push(`${label} has invalid load commands`); return}
		if (command === 0x32 && size >= 24) {
			const version = bytes.readUInt32LE(offset + 12)
			minimumVersion = `${version >>> 16}.${(version >>> 8) & 255}`
		}
		if (command === 0xc && size >= 24) {
			const nameOffset = bytes.readUInt32LE(offset + 8)
			if (nameOffset < size) {
				const name = bytes.toString('utf8', offset + nameOffset, offset + size).split('\0')[0]
				if (name.startsWith('@rpath/')) {issues.push(`${label} requires an unpackaged library: ${name}`)}
			}
		}
		offset += size
	}
	if (!minimumVersion) {issues.push(`${label} does not declare a macOS deployment target`)}
	else {
		const [major, minor] = minimumVersion.split('.').map(Number)
		const [allowedMajor, allowedMinor] = minimumJscHostSystemVersion.split('.').map(Number)
		if (major > allowedMajor || (major === allowedMajor && minor > allowedMinor)) {
			issues.push(`${label} requires macOS ${minimumVersion}, above the declared ${minimumJscHostSystemVersion}`)
		}
	}
}

export function inspectJscHost() {
	const issues = []
	let manifest
	try {
		manifest = JSON.parse(readFileSync(join(prebuiltRoot, 'manifest.json'), 'utf8'))
	} catch {
		return { issues: ['JavaScriptCore host manifest is missing or invalid'], manifest: null }
	}

	for (const [relativePath, expectedHash] of Object.entries(manifest.sha256 ?? {})) {
		const path = join(prebuiltRoot, relativePath)
		if (!isFile(path)) {
			issues.push(`JavaScriptCore host file is missing: ${relativePath}`)
			continue
		}
		const bytes = readFileSync(path)
		const actualHash = createHash('sha256').update(bytes).digest('hex')
		if (actualHash !== expectedHash) {issues.push(`JavaScriptCore host checksum mismatch: ${relativePath}`)}
		if (relativePath.endsWith('/host') || relativePath.endsWith('/NativeScript')) {
			inspectMachO(bytes, relativePath, issues)
		}
	}
	for (const relativePath of ['macos-arm64/host', 'macos-arm64/metadata.nsmd', 'macos-arm64/NativeScript.framework/Versions/A/NativeScript']) {
		if (!manifest.sha256?.[relativePath]) {issues.push(`JavaScriptCore host manifest omits ${relativePath}`)}
	}
	if (manifest.minimumSystemVersion !== minimumJscHostSystemVersion) {
		issues.push('JavaScriptCore host deployment target differs from package configuration')
	}
	if (!isFile(join(hostRoot, 'shim.js'))) {issues.push('JavaScriptCore host shim is missing')}
	return { issues, manifest }
}

export function validateHostBundle(bundle) {
	const source = readFileSync(bundle, 'utf8')
	const imports = [...source.matchAll(/\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g)]
	const unknown = [...new Set(imports.map((match) => match[2]).filter((name) => !supportedImports.has(name)))]
	if (unknown.length) {
		throw new Error(`Unsupported macOS JavaScriptCore host imports: ${unknown.join(', ')}. Bundle them or use the documented host API.`)
	}
	const requireCalls = [...source.matchAll(/\brequire\s*\(/g)].length
	if (requireCalls !== imports.length) {
		throw new Error('Unsupported dynamic require in the macOS JavaScriptCore bundle. Use static imports that Vite can bundle.')
	}
}
