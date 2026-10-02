import type { NativeModifier } from './props'

/** Apply serializable modifiers to a NativeScript host view in array order. */
export function applyNativeModifiers(view: any, modifiers?: readonly NativeModifier[]): void {
	if (!view || !modifiers?.length) {
		return
	}
	for (const entry of modifiers) {
		if (entry.type === 'style') {
			Object.assign(view.style, entry.values)
		} else {
			view[entry.name] = entry.value
		}
	}
}
