import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { ImageBackend } from './backend-types'

function unavailable(): never {
	throw new UnavailabilityError('ImageManipulator')
}

export const backend: ImageBackend<unknown> = {
	isAvailable: () => false,
	load: async () => unavailable(),
	transform: unavailable,
	save: async () => unavailable(),
	release: () => {},
	releaseResult: unavailable,
}
