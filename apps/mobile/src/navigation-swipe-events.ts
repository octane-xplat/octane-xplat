import type { Frame, Page } from '@nativescript/core'

/** iOS-only UIKit admission diagnostic; other SDK targets have no such delegate. */
export async function checkNativeSwipeEvents(
	_frame: Frame,
	_base: Page,
	_check: (name: string, pass: boolean, detail?: string) => void,
	_wait: (name: string, condition: () => boolean) => Promise<void>,
): Promise<void> {}

export async function requestNavigationSwipe(
	_frame: Frame,
	_phase:
		| 'canonical-blocker-deny'
		| 'canonical-blocker-admit'
		| 'canonical-modal-down'
		| 'canonical-root-probe'
		| 'canonical-short'
		| 'canonical-content'
		| 'canonical-deny'
		| 'canonical-admit'
		| 'canonical-tab',
): Promise<void> {}
