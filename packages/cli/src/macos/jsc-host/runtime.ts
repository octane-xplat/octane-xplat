// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { srcUrl } from '../../env.ts'

export const hostRoot = fileURLToPath(srcUrl(import.meta.url, ''))
export const prebuiltRoot = join(hostRoot, 'prebuilt')
export const hostBundle = join(prebuiltRoot, 'macos')
export const minimumJscHostSystemVersion = '13.5'
export const macOSArchitectures = ['arm64', 'x86_64'] as const

/** Map a Node `process.arch` token to a macOS architecture name. */
export function macOSHostArch(arch = process.arch) {
	return arch === 'x64' ? 'x86_64' : 'arm64'
}

const supportedImports = new Set([
	'@nativescript/macos-node-api',
	'node:crypto',
	'node:fs',
	'node:os',
	'node:path',
])

const supportedMembers = new Map([
	['node:crypto', new Set(['createHash'])],
	['node:fs', new Set(['mkdirSync', 'existsSync', 'readFileSync', 'writeFileSync'])],
	['node:os', new Set(['homedir'])],
	['node:path', new Set(['join', 'resolve'])],
	['process', new Set(['env', 'cwd'])],
	['Buffer', new Set(['from'])],
	['console', new Set(['log', 'warn', 'error'])],
])

function isFile(path) {
	try {
		return statSync(path).isFile()
	} catch {
		return false
	}
}

const machOArchNames = new Map([
	[0x0100000c, 'arm64'],
	[0x01000007, 'x86_64'],
])

/** Slice `bytes` into thin Mach-O images: itself, or each fat-arch member. */
function machOSlices(bytes) {
	const magic = bytes.readUInt32BE(0)
	if (magic !== 0xcafebabe && magic !== 0xcafebabf) {
		return [bytes]
	}

	const wide = magic === 0xcafebabf
	const count = bytes.readUInt32BE(4)
	const entrySize = wide ? 32 : 20
	const slices = []
	for (let index = 0; index < count; index++) {
		const entry = 8 + index * entrySize
		if (entry + entrySize > bytes.length) {
			break
		}

		const offset = wide
			? Number(bytes.readBigUInt64BE(entry + 8))
			: bytes.readUInt32BE(entry + 8)
		const size = wide
			? Number(bytes.readBigUInt64BE(entry + 16))
			: bytes.readUInt32BE(entry + 12)
		slices.push(bytes.subarray(offset, offset + size))
	}

	return slices
}

export function inspectMachO(
	bytes,
	label,
	issues,
	minimumSystemVersion = minimumJscHostSystemVersion,
	architectures = macOSArchitectures,
) {
	if (bytes.length < 32) {
		issues.push(`${label} is not a Mach-O binary`)
		return
	}

	const found = new Set()
	let images = 0
	for (const slice of machOSlices(bytes)) {
		if (slice.length < 32 || slice.readUInt32LE(0) !== 0xfeedfacf) {
			continue
		}

		images++
		const arch = machOArchNames.get(slice.readUInt32LE(4))
		if (arch) {
			found.add(arch)
		}

		inspectThinMachO(slice, arch ? `${label} (${arch})` : label, issues, minimumSystemVersion)
	}

	if (!images) {
		issues.push(`${label} is not a Mach-O binary`)
		return
	}

	for (const arch of architectures) {
		if (!found.has(arch)) {
			issues.push(`${label} lacks an ${arch} slice`)
		}
	}
}

function inspectThinMachO(slice, label, issues, minimumSystemVersion) {
	const commands = slice.readUInt32LE(16)
	let offset = 32
	let minimumVersion
	for (let index = 0; index < commands; index++) {
		if (offset + 8 > slice.length) {
			issues.push(`${label} has truncated load commands`)
			return
		}

		const command = slice.readUInt32LE(offset)
		const size = slice.readUInt32LE(offset + 4)
		if (size < 8 || offset + size > slice.length) {
			issues.push(`${label} has invalid load commands`)
			return
		}

		if (command === 0x32 && size >= 24) {
			const version = slice.readUInt32LE(offset + 12)
			minimumVersion = `${version >>> 16}.${(version >>> 8) & 255}`
		}

		if (command === 0xc && size >= 24) {
			const nameOffset = slice.readUInt32LE(offset + 8)
			if (nameOffset < size) {
				const name = slice.toString('utf8', offset + nameOffset, offset + size).split('\0')[0]
				if (name.startsWith('@rpath/')) {
					issues.push(`${label} requires an unpackaged library: ${name}`)
				}
			}
		}

		offset += size
	}

	if (!minimumVersion) {
		issues.push(`${label} does not declare a macOS deployment target`)
	} else {
		const [major, minor] = minimumVersion.split('.').map(Number)
		const [allowedMajor, allowedMinor] = minimumSystemVersion.split('.').map(Number)
		if (major > allowedMajor || (major === allowedMajor && minor > allowedMinor)) {
			issues.push(
				`${label} requires macOS ${minimumVersion}, above the declared ${minimumSystemVersion}`,
			)
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
		if (actualHash !== expectedHash) {
			issues.push(`JavaScriptCore host checksum mismatch: ${relativePath}`)
		}

		if (relativePath.endsWith('/host') || relativePath.endsWith('/NativeScript')) {
			inspectMachO(bytes, relativePath, issues)
		} else if (relativePath.endsWith('/objc-metadata-generator')) {
			// The generator is a build-time tool; its @rpath/libclang.dylib load
			// is expected (it resolves Xcode/CLT libclang at run time), unlike
			// the packaged host/framework which must stay self-contained.
			const generatorIssues = []
			inspectMachO(
				bytes,
				relativePath,
				generatorIssues,
				minimumJscHostSystemVersion,
				['arm64'],
			)
			issues.push(
				...generatorIssues.filter((issue) => !issue.includes('unpackaged library')),
			)
		}
	}

	for (const relativePath of [
		'macos/host',
		'macos/metadata.macos.arm64.nsmd',
		'macos/metadata.macos.x86_64.nsmd',
		'macos/NativeScript.framework/Versions/A/NativeScript',
		'macos/objc-metadata-generator',
	]) {
		if (!manifest.sha256?.[relativePath]) {
			issues.push(`JavaScriptCore host manifest omits ${relativePath}`)
		}
	}

	if (
		!Array.isArray(manifest.architectures) ||
		manifest.architectures.length !== macOSArchitectures.length ||
		!macOSArchitectures.every((arch) => manifest.architectures.includes(arch))
	) {
		issues.push(
			`JavaScriptCore host manifest architectures must be ${macOSArchitectures.join(',')}`,
		)
	}

	if (manifest.minimumSystemVersion !== minimumJscHostSystemVersion) {
		issues.push('JavaScriptCore host deployment target differs from package configuration')
	}

	if (!isFile(join(hostRoot, 'shim.js'))) {
		issues.push('JavaScriptCore host shim is missing')
	}

	return { issues, manifest }
}

function memberName(member) {
	if (!member.computed && member.property.type === 'Identifier') {
		return member.property.name
	}

	if (member.property.type === 'Literal' && typeof member.property.value === 'string') {
		return member.property.value
	}

	return null
}

function visitAst(root, callback) {
	const pending = [root]
	while (pending.length) {
		const node = pending.pop()
		if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
			continue
		}

		callback(node)
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) {
				pending.push(...value)
			} else if (value && typeof value === 'object' && typeof value.type === 'string') {
				pending.push(value)
			}
		}
	}
}

function declarationName(pattern, callback) {
	if (!pattern || typeof pattern !== 'object') {
		return
	}

	if (pattern.type === 'Identifier') {
		callback(pattern.name)
		return
	}

	if (pattern.type === 'RestElement') {
		declarationName(pattern.argument, callback)
		return
	}

	if (pattern.type === 'AssignmentPattern') {
		declarationName(pattern.left, callback)
		return
	}

	if (pattern.type === 'ObjectPattern') {
		for (const property of pattern.properties) {
			declarationName(property.value ?? property.argument, callback)
		}
	}

	if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements) {
			declarationName(element, callback)
		}
	}
}

function childNodes(node, callback) {
	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item && typeof item.type === 'string') {
					callback(item)
				}
			}
		} else if (value && typeof value === 'object' && typeof value.type === 'string') {
			callback(value)
		}
	}
}

function isFunction(node) {
	return (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	)
}

function walkHostMembers(ast, moduleOf, issues) {
	function scope(parent) {
		return { parent, bindings: new Map() }
	}

	function binding(parent, name) {
		for (let current = parent; current; current = current.parent) {
			if (current.bindings.has(name)) {
				return current.bindings.get(name)
			}
		}

		return supportedMembers.has(name) ? name : null
	}

	function declareVariable(node, current) {
		for (const item of node.declarations) {
			const module = moduleOf(item.init)
			declarationName(item.id, (name) =>
				current.bindings.set(name, item.id.type === 'Identifier' ? module : null),
			)
		}
	}

	function hoistVars(node, current) {
		childNodes(node, (child) => {
			if (isFunction(child)) {
				return
			}

			if (child.type === 'VariableDeclaration' && child.kind === 'var') {
				declareVariable(child, current)
			} else {
				hoistVars(child, current)
			}
		})
	}

	function visit(node, current) {
		if (node.type === 'Program' || isFunction(node)) {
			const nested = scope(current)
			if (node.type === 'Program') {
				for (const statement of node.body) {
					if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
						declareVariable(statement, nested)
					}
				}
			}

			if (isFunction(node)) {
				for (const parameter of node.params) {
					declarationName(parameter, (name) => nested.bindings.set(name, null))
				}

				if (node.id?.name) {
					nested.bindings.set(node.id.name, null)
				}
			}

			hoistVars(node.body?.type ? node.body : node, nested)
			childNodes(node, (child) => visit(child, nested))
			return
		}

		if (node.type === 'BlockStatement') {
			const nested = scope(current)
			for (const statement of node.body) {
				if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
					declareVariable(statement, nested)
				}

				if (
					(statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
					statement.id?.name
				) {
					nested.bindings.set(statement.id.name, null)
				}
			}

			for (const statement of node.body) {
				visit(statement, nested)
			}

			return
		}

		if (node.type === 'CatchClause') {
			const nested = scope(current)
			declarationName(node.param, (name) => nested.bindings.set(name, null))
			visit(node.body, nested)
			return
		}

		if (
			node.type === 'ForStatement' ||
			node.type === 'ForOfStatement' ||
			node.type === 'ForInStatement'
		) {
			const nested = scope(current)
			const declaration = node.init ?? node.left
			if (declaration?.type === 'VariableDeclaration' && declaration.kind !== 'var') {
				declareVariable(declaration, nested)
			}

			childNodes(node, (child) => visit(child, nested))
			return
		}

		if (node.type === 'MemberExpression') {
			const owner =
				node.object?.type === 'Identifier'
					? binding(current, node.object.name)
					: moduleOf(node.object)

			const allowed = supportedMembers.get(owner)
			if (allowed) {
				const member = memberName(node)
				if (!member || !allowed.has(member)) {
					issues.add(`${owner}.${member ?? '[dynamic]'}`)
				}
			}
		}

		childNodes(node, (child) => visit(child, current))
	}

	visit(ast, null)
}

export async function validateHostBundle(bundle, appRoot) {
	const source = readFileSync(bundle, 'utf8')
	const require = createRequire(resolve(appRoot, 'package.json'))
	const { parseAst } = await import(pathToFileURL(require.resolve('vite')).href)
	const ast = parseAst(source)
	const imports = new Set()
	const issues = new Set()
	const moduleOf = (call) => {
		if (
			call?.type !== 'CallExpression' ||
			call.callee?.type !== 'Identifier' ||
			call.callee.name !== 'require'
		) {
			return null
		}

		const name = call.arguments?.[0]?.value
		return typeof name === 'string' ? name : null
	}

	visitAst(ast, (node) => {
		if (
			node.type === 'CallExpression' &&
			node.callee?.type === 'Identifier' &&
			node.callee.name === 'require'
		) {
			const name = moduleOf(node)
			if (!name) {
				issues.add('dynamic require')
			} else if (!supportedImports.has(name)) {
				imports.add(name)
			}
		}

		if (node.type === 'CallExpression' && node.callee?.name === 'setImmediate') {
			issues.add('setImmediate')
		}

		if (node.type !== 'VariableDeclarator') {
			return
		}

		const name = moduleOf(node.init)
		if (name && node.id.type === 'ObjectPattern') {
			for (const property of node.id.properties) {
				const member = property.key?.name ?? property.key?.value
				if (!supportedMembers.get(name)?.has(member)) {
					issues.add(`${name}.${String(member)}`)
				}
			}
		}
	})

	if (imports.size) {
		throw new Error(
			`Unsupported macOS JavaScriptCore host imports: ${[...imports].sort().join(', ')}. Bundle them or use the documented host API.`,
		)
	}

	walkHostMembers(ast, moduleOf, issues)
	if (issues.size) {
		throw new Error(
			`Unsupported macOS JavaScriptCore host APIs: ${[...issues].sort().join(', ')}. Use the documented host API.`,
		)
	}
}
