import { NSTimer, NSRunLoop } from '@octane-xplat/platform/macos'

/** @internal Owned metadata polling, including during AppKit tracking modes. */
export function startFocusClock(read: () => void): () => void {
	const timer = NSTimer.timerWithTimeIntervalRepeatsBlock(1 / 60, true, read)
	try {
		NSRunLoop.mainRunLoop.addTimerForMode(timer, 'kCFRunLoopCommonModes')
	} catch (error) {
		timer.invalidate()
		throw error
	}
	return () => timer.invalidate()
}
