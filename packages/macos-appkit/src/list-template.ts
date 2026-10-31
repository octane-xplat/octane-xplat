import { SaxesParser } from 'saxes'
import {
	universalPlan,
	universalValue,
	type UniversalHostPlan,
	type UniversalRenderable,
} from 'octane/universal/native'

import { templateProps } from './template-props.ts'
import { getBindingOptions } from './vendor/listview/binding-options.ts'
import { parseExpression, convertExpressionToValue } from './vendor/listview/expressions.ts'

type Reader = (item: any) => unknown
export interface ListTemplate {
	render(item: unknown): UniversalRenderable
	validate(
		validateProps: (tag: string, props: Record<string, any>) => void,
		validateChildren: (parent: string | undefined, child: string) => void,
	): void
}

const cache = new Map<string, ListTemplate>()
const error = (message: string) => new TypeError('[macos-host] listview itemTemplate: ' + message)

function reader(name: string, raw: string, kind: string): Reader {
	const value = raw.trim()
	if (value.startsWith('{{') && value.endsWith('}}')) {
		const options = getBindingOptions(name, value.slice(2, -2).trim())
		if (options.source) {
			throw error('explicit binding sources are outside item bindingContext')
		}

		if (options.expression) {
			let expression: any
			try {
				expression = parseExpression(options.expression)
			} catch {
				throw error('invalid binding expression for ' + name)
			}

			if (!expression) {
				throw error('empty binding expression for ' + name)
			}

			return (item) => {
				const model = Object(item ?? {})
				return convertExpressionToValue(expression, model, false, { $value: item })
			}
		}

		const path = String(options.sourceProperty ?? '').split('.')
		return (item) => path.reduce((value, key) => (key === '$value' ? item : value?.[key]), item)
	}

	if (name === 'style') {
		const style: Record<string, unknown> = {}
		for (const declaration of value.split(';').filter((entry) => entry.trim())) {
			const colon = declaration.indexOf(':')
			if (colon < 1) {
				throw error('invalid style declaration')
			}

			const key = declaration
				.slice(0, colon)
				.trim()
				.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

			const text = declaration.slice(colon + 1).trim()
			style[key] = /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text
		}

		return () => style
	}

	if (kind === 'boolean') {
		return () => value.toLowerCase() === 'true'
	}

	if (kind === 'number') {
		const number = Number(value)
		if (!Number.isFinite(number)) {
			throw error(name + ' must be numeric')
		}

		return () => number
	}

	return () => raw
}

/** Parse once at the prop boundary, evaluate bindings each time a cell binds.
 * The shared declaration map closes the vocabulary; AppKit's registry owns
 * actual host creation. No DOM parser or NativeScript startup is involved. */
export function parseListTemplate(markup: string): ListTemplate {
	const previous = cache.get(markup)
	if (previous) {
		return previous
	}

	const slots: {
		tag: string
		readers: Record<string, Reader>
		staticProps: Record<string, any>
	}[] = []

	const stack: UniversalHostPlan[] = []
	let root: UniversalHostPlan | undefined
	const parser = new SaxesParser({ xmlns: true })
	parser.on('error', (failure) => {
		throw error('invalid XML (' + failure.message + ')')
	})

	parser.on('doctype', () => {
		throw error('DOCTYPE is unsupported')
	})

	parser.on('opentag', (element) => {
		const tag = element.local.toLowerCase()
		const declared = templateProps[tag]
		if (!declared) {
			throw error('unknown intrinsic <' + element.local + '>')
		}

		const readers: Record<string, Reader> = {},
			staticProps: Record<string, any> = {}

		for (const attr of Object.values(element.attributes)) {
			if (attr.prefix === 'xmlns' || attr.name === 'xmlns') {
				continue
			}

			const name = attr.name === 'class' ? 'className' : attr.name
			if (!Object.hasOwn(declared, name)) {
				throw error('undeclared prop ' + attr.name + ' on <' + tag + '>')
			}

			readers[name] = reader(name, attr.value, declared[name])
			if (!(attr.value.trim().startsWith('{{') && attr.value.trim().endsWith('}}'))) {
				staticProps[name] = readers[name](undefined)
			}
		}

		const node: UniversalHostPlan = {
			kind: 'host',
			type: tag,
			propsSlot: slots.length,
			children: [],
		}

		slots.push({ tag, readers, staticProps })
		if (stack.length) {
			;(stack.at(-1)!.children as UniversalHostPlan[]).push(node)
		} else if (root) {
			throw error('exactly one root element is required')
		} else {
			root = node
		}

		stack.push(node)
	})

	parser.on('closetag', () => {
		stack.pop()
	})

	// Builder ignores XML whitespace/text nodes; TextBase content uses text=.
	parser.write(markup).close()
	if (!root) {
		throw error('one root element is required')
	}

	const plan = universalPlan('macos', root)
	const template: ListTemplate = {
		render(item) {
			try {
				return universalValue(
					plan,
					slots.map(({ readers }) =>
						Object.fromEntries(Object.entries(readers).map(([key, read]) => [key, read(item)])),
					),
				)
			} catch (failure) {
				throw error('binding evaluation failed: ' + String(failure))
			}
		},
		validate(validateProps, validateChildren) {
			for (const { tag, staticProps } of slots) {
				validateProps(tag, staticProps)
			}

			const walk = (node: UniversalHostPlan, parent?: string) => {
				validateChildren(parent, node.type)
				for (const child of node.children as UniversalHostPlan[]) {
					walk(child, node.type)
				}
			}

			walk(root!)
		},
	}

	if (cache.size >= 256) {
		cache.delete(cache.keys().next().value!)
	}

	cache.set(markup, template)
	return template
}

export function listFactory(props: Record<string, any>): (() => any) | undefined {
	if (typeof props.itemTemplate === 'function') {
		return props.itemTemplate
	}

	return props.itemTemplates?.find((entry: any) => entry.key === 'default')?.createView
}

export function validateListProps(
	props: Record<string, any>,
	validateTemplate?: (template: ListTemplate) => void,
) {
	if (
		props.items != null &&
		!Array.isArray(props.items) &&
		(typeof props.items.getItem !== 'function' ||
			!Number.isInteger(props.items.length) ||
			props.items.length < 0)
	) {
		throw error('items must be an array or an ItemsSource with length and getItem(index)')
	}

	if (props.renderItem != null && typeof props.renderItem !== 'function') {
		throw error('renderItem must be a function')
	}

	if (
		props.itemTemplate != null &&
		typeof props.itemTemplate !== 'function' &&
		typeof props.itemTemplate !== 'string'
	) {
		throw error('itemTemplate must be a string or zero-argument factory')
	}

	if (props.itemTemplates != null) {
		if (!Array.isArray(props.itemTemplates)) {
			throw error('itemTemplates must be an array of keyed factories')
		}

		for (const entry of props.itemTemplates) {
			if (entry?.key !== 'default') {
				throw error(
					'only the "default" itemTemplates key is reachable without itemTemplateSelector',
				)
			}

			if (typeof entry.createView !== 'function') {
				throw error('itemTemplates entries need createView()')
			}
		}
	}

	if (typeof props.itemTemplate === 'string') {
		const template = parseListTemplate(props.itemTemplate)
		validateTemplate?.(template)
	}
}
