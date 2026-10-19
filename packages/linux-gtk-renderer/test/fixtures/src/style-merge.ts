

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())

/** Anything accepted as a style value, including nested arrays. */
export type StyleInput =
	| string
	| Record<string, any>
	| null
	| undefined
	| readonly StyleInput[]

/** Merge component-emitted style defaults under the authored `style` prop.
 *  Authored keys win; array styles fold in order; a string style is appended
 *  after the serialized defaults so its declarations override them too. */
export function mergeStyle(
	base: Record<string, any>,
	style?: Record<string, any> | readonly (Record<string, any> | null | undefined)[] | null,
): Record<string, any>
export function mergeStyle(
	base: Record<string, any>,
	style?: StyleInput,
): string | Record<string, any>
export function mergeStyle(
	base: Record<string, any>,
	style?: StyleInput,
): string | Record<string, any> {
	if (style == null) {
		return base
	}

	let obj: Record<string, any> = { ...base }
	const strings: string[] = []
	const add = (s: StyleInput) => {
		if (s == null) {
			return
		}
		if (typeof s === 'string') {
			strings.push(s)
		} else if (Array.isArray(s)) {
			for (const part of s) {
				add(part)
			}
		} else {
			obj = { ...obj, ...s }
		}
	}
	add(style)

	if (strings.length === 0) {
		return obj
	}

	const prefix = Object.entries(obj)
		.filter(([, v]) => v != null)
		.map(([k, v]) => `${kebab(k)}:${v}`)
		.join(';')
	return [prefix, ...strings].filter(Boolean).join(';')
}

export type StyleProp = string | Record<string, any> | readonly StyleProp[] | null | undefined
