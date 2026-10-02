import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

function inspectMachO(bytes, label, issues) {
	if (
		bytes.length < 32 ||
		bytes.readUInt32LE(0) !== 0xfeedfacf ||
		bytes.readUInt32LE(4) !== 0x0100000c
	) {
		issues.push(`${label} is not an arm64 Mach-O binary`)
		return
	}

	const commands = bytes.readUInt32LE(16)
	let offset = 32
	let minimumVersion
	for (let index = 0; index < commands; index++) {
		if (offset + 8 > bytes.length) {
			issues.push(`${label} has truncated load commands`)
			return
		}
		const command = bytes.readUInt32LE(offset)
		const size = bytes.readUInt32LE(offset + 4)
		if (size < 8 || offset + size > bytes.length) {
			issues.push(`${label} has invalid load commands`)
			return
		}
		if (command === 0x32 && size >= 24) {
			const version = bytes.readUInt32LE(offset + 12)
			minimumVersion = `${version >>> 16}.${(version >>> 8) & 255}`
		}

		if (command === 0xc && size >= 24) {
			const nameOffset = bytes.readUInt32LE(offset + 8)
			if (nameOffset < size) {
				const name = bytes.toString('utf8', offset + nameOffset, offset + size).split('\0')[0]
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
		const [allowedMajor, allowedMinor] = minimumJscHostSystemVersion.split('.').map(Number)
		if (major > allowedMajor || (major === allowedMajor && minor > allowedMinor)) {
			issues.push(
				`${label} requires macOS ${minimumVersion}, above the declared ${minimumJscHostSystemVersion}`,
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
		}
	}

	for (const relativePath of [
		'macos-arm64/host',
		'macos-arm64/metadata.nsmd',
		'macos-arm64/NativeScript.framework/Versions/A/NativeScript',
	]) {
		if (!manifest.sha256?.[relativePath]) {
			issues.push(`JavaScriptCore host manifest omits ${relativePath}`)
		}
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
