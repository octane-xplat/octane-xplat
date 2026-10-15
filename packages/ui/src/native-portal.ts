import {
	createPortal as createUniversalPortal,
	type UniversalRenderable,
} from 'octane/universal/native'

export function createPortal(children: unknown, target: unknown) {
	return createUniversalPortal(children as UniversalRenderable, target)
}
