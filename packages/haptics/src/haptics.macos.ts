import {
	NSHapticFeedbackManager,
	NSHapticFeedbackPattern,
	NSHapticFeedbackPerformanceTime,
} from '@octane-xplat/platform/macos'
import type { Haptics } from './types'

/** AppKit offers discrete trackpad feedback; patterns and continuous intensity
 * are unavailable. A successful request does not guarantee attached hardware. */
/** Create an owned haptic engine (see Haptics). */
export const createHaptics = (): Haptics => {
	let disposed = false
	const performer = NSHapticFeedbackManager.defaultPerformer
	return {
		capabilities: () => ({
			supported: !disposed && Boolean(performer),
			presets: !disposed && Boolean(performer),
			patterns: false,
			realtime: false,
			reason: 'AppKit supplies discrete feedback on compatible trackpads; patterns and realtime intensity are unavailable.',
		}),
		play: (preset) => {
			if (disposed || !performer) {return false}
			try {
				const pattern = preset === 'selection'
					? NSHapticFeedbackPattern.Alignment
					: preset.startsWith('impact-')
						? NSHapticFeedbackPattern.LevelChange
						: NSHapticFeedbackPattern.Generic
				performer.performFeedbackPatternPerformanceTime(pattern, NSHapticFeedbackPerformanceTime.Now)
				return true
			} catch {
				return false
			}
		},
		playPattern: () => false,
		startRealtime: () => ({ update: () => {}, stop: () => {} }),
		stop: () => {},
		dispose: () => { disposed = true },
	}
}
