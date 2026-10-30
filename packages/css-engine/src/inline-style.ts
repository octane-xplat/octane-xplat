/// <reference path="./vendor/css-tree.d.ts" />
import * as cssTree from 'css-tree'
import { cssValueToStyle } from './cascade.ts'

/** Convert authored inline declarations to the existing native style vocabulary.
 * This does not add stylesheet rules or extend supported properties/units.
 * Like the native cascade, !important has no separate priority. */
export function normalizeInlineStyle(value: unknown): Record<string, any> | null | undefined {
	if (value == null) {return value}
	if (typeof value === 'object' && !Array.isArray(value)) {return value as Record<string, any>}
	const out: Record<string, any> = {}
	const put = (name: string, value: any) => Object.defineProperty(out, name, { value, enumerable: true, configurable: true, writable: true })
	if (Array.isArray(value)) {
		for (const part of value) {
			const style = normalizeInlineStyle(part)
			if (style) {for (const [name, entry] of Object.entries(style)) {put(name, entry)}}
		}
		return out
	}
	if (typeof value !== 'string') {throw new TypeError('Inline style must be an object, declaration string or array')}
	let ast: any
	try { ast = cssTree.parse(value, { context: 'declarationList', parseValue: false, onParseError: () => { throw new Error('Invalid declaration') } }) }
	catch { throw new TypeError('Invalid inline style declaration list') }
	ast.children.forEach((declaration: any) => {
		if (declaration.type !== 'Declaration' || typeof declaration.value?.value !== 'string') {throw new TypeError('Inline style accepts declarations only')}
		const name = declaration.property.startsWith('--') ? declaration.property : declaration.property.toLowerCase().replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
		put(name, name.startsWith('--') ? declaration.value.value.trim() : cssValueToStyle(declaration.value.value))
	})
	return out
}
