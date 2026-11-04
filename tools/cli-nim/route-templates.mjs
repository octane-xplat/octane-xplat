// Extract the native command descriptor from the canonical TypeScript command.
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url))
const { parseModule } = require('@tsrx/core')

function nodes(root, predicate) {
	const found = []
	function visit(value) {
		if (value === null || typeof value !== 'object') {
			return
		}
		if (predicate(value)) {
			found.push(value)
		}
		for (const child of Object.values(value)) {
			if (Array.isArray(child)) {
				child.forEach(visit)
			} else {
				visit(child)
			}
		}
	}
	visit(root)
	return found
}

function single(values, label) {
	if (values.length !== 1) {
		throw Error(`Expected one canonical route ${label}, got ${values.length}`)
	}
	return values[0]
}

export function commandDescriptor(source, name) {
	const ast = parseModule(source, `${name}.ts`)
	const declaration = single(
		nodes(ast, (node) => node.type === 'VariableDeclarator' && node.id?.name === name),
		'command',
	).init
	const property = (node, key) =>
		single(
			node.properties.filter((item) => (item.key?.name ?? item.key?.value) === key),
			key,
		).value
	if (declaration.type !== 'CallExpression' || declaration.callee.name !== 'command') {
		throw Error(`Unsupported ${name} command declaration`)
	}
	const args = property(declaration.arguments[0], 'args')
	const expand = (object, seen = []) =>
		object.properties.flatMap((entry) => {
			if (entry.type !== 'SpreadElement') {
				return [entry]
			}
			const identifier = entry.argument?.name
			if (!identifier || seen.includes(identifier) || seen.length > 16) {
				throw Error(`Unsupported ${name} argument spread`)
			}
			const value = single(
				nodes(ast, (node) => node.type === 'VariableDeclarator' && node.id?.name === identifier),
				identifier,
			).init
			if (value?.type !== 'ObjectExpression') {
				throw Error(`Unsupported ${name} argument object`)
			}
			return expand(value, [...seen, identifier])
		})
	const entries = expand(args)
	const positionals = entries
		.filter((entry) => ['positional', 'restPositionals'].includes(entry.value?.callee?.name))
		.map((entry) => {
			const type = property(entry.value.arguments[0], 'type')
			const optional = type.type === 'CallExpression' && type.callee.name === 'optional'
			if ((optional ? type.arguments[0]?.name : type.name) !== 'string') {
				throw Error(`Unsupported ${name} positional type`)
			}
			return {
				name: entry.key.name,
				...(entry.value.callee.name === 'restPositionals' ? { variadic: true } : { required: !optional }),
			}
		})
	const flags = entries
		.filter((entry) => !['positional', 'restPositionals'].includes(entry.value?.callee?.name))
		.map((entry) => {
			const call = entry.value
			if (call.type !== 'CallExpression' || !['flag', 'option'].includes(call.callee.name)) {
				throw Error(`Unsupported ${name} flag`)
			}
			const config = call.arguments[0]
			const string = (key) => {
				const value = property(config, key)
				if (typeof value.value !== 'string') {
					throw Error(`Unsupported ${name} ${key}`)
				}
				return value.value
			}
			if (call.callee.name === 'option') {
				const type = property(config, 'type')
				if (
					type.type !== 'CallExpression' ||
					type.callee.name !== 'optional' ||
					type.arguments[0]?.name !== 'string'
				) {
					throw Error(`Unsupported ${name} option type`)
				}
			}
			return {
				flag: string('long'),
				...(entry.key.name !== string('long') ? { key: entry.key.name } : {}),
				...(config.properties.some((item) => item.key?.name === 'short')
					? { short: string('short') }
					: {}),
				type: call.callee.name === 'flag' ? 'boolean' : 'string',
				description: string('description'),
				...(call.callee.name === 'flag' ? { default: false } : {}),
			}
		})
	const summary = property(declaration.arguments[0], 'description').value
	if (typeof summary !== 'string') {
		throw Error(`Unsupported ${name} description`)
	}
	return { name, summary, flags, positionals }
}

export const routeCommandDescriptor = (source) => commandDescriptor(source, 'routes')
export const typecheckCommandDescriptor = (source) => commandDescriptor(source, 'typecheck')
export const buildCommandDescriptor = (source) => commandDescriptor(source, 'build')
