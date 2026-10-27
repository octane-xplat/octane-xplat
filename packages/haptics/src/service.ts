// Simple haptics service — the platform `haptics` capability contract over
// this leaf's own engine (Pulsar on native, Vibration API on web), so no
// second plugin is needed.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import { createHaptics } from './haptics'
import type { Haptics, HapticsImpl } from './types'

// Optional capability — importing must never throw for absence, so the
// engine is constructed lazily and a failed construction reports
// unsupported instead of crashing at module evaluation.
let engine: Haptics | null | undefined
const getEngine = (): Haptics | null => {
	if (engine === undefined) {
		try {
			engine = createHaptics()
		} catch {
			engine = null
		}
	}

	return engine
}

const available = (): boolean => haptics.supported

const withEngine = (run: (engine: Haptics) => boolean | void) => {
	const engine = getEngine()
	if (!engine?.capabilities().supported) {
		throw new UnavailabilityError('haptics')
	}

	return run(engine)
}

export const haptics: Service<HapticsImpl> = {
	get supported() {
		try {
			return getEngine()?.capabilities().supported ?? false
		} catch {
			return false
		}
	},
	isAvailable: async () => available(),
	impact: (style = 'light') => void withEngine((engine) => engine.play(`impact-${style}`)),
	notification: (kind) => void withEngine((engine) => engine.play(kind)),
	selection: () => void withEngine((engine) => engine.play('selection')),
}
