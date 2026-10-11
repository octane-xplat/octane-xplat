// Simple haptics service — the platform `haptics` capability contract over
// this leaf's own engine (Pulsar on native, Vibration API on web), so no
// second plugin is needed.
import { createHaptics } from './haptics'
import type { Capability, Haptics, HapticsImpl } from './types'

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

export const haptics: Capability<HapticsImpl> = {
	get supported() {
		try {
			return getEngine()?.capabilities().supported ?? false
		} catch {
			return false
		}
	},
	async ensure() {
		return haptics.supported ? 'granted' : 'unsupported'
	},
	impl: {
		impact: (style = 'light') => void getEngine()?.play(`impact-${style}`),
		notification: (kind) => void getEngine()?.play(kind),
		selection: () => void getEngine()?.play('selection'),
	},
}
