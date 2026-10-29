import {
	createPortal as createUniversalPortal,
	type UniversalRenderable,
	type UniversalPortalValue,
} from 'octane/universal/native'

export function createPortal(children: unknown, target: unknown): UniversalPortalValue {
	return createUniversalPortal(children as UniversalRenderable, target)
}
