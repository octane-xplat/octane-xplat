import { checkNativeSwipeEvents } from './navigation-swipe-events'
import { Application, Frame, GridLayout, Page } from '@nativescript/core'

/** Qualify the pinned SDK's lifecycle contract, rather than treating its
 * non-cancellable notification payload as a pre-navigation guard API. */
export async function checkNativeBackEvents(
	frame: Frame,
	base: Page,
	check: (name: string, pass: boolean, detail?: string) => void,
	wait: (name: string, condition: () => boolean) => Promise<void>,
): Promise<void> {
	const target = new Page()
	target.actionBarHidden = true
	target.content = new GridLayout()
	let pageFlag = false
	let frameFlag = false
	const refusePage = (event: object) => {
		pageFlag = Reflect.set(event, 'cancel', true)
	}
	const refuseFrame = (event: object) => {
		frameFlag = Reflect.set(event, 'cancel', true)
	}
	target.on('navigatingFrom', refusePage)
	try {
		frame.navigate({ create: () => target, animated: false })
		await wait('native event probe Page commits', () => frame.currentPage === target)
		if (!Application.android) {
			target.enableSwipeBackNavigation = false
			check(
				'Page flag disables iOS native edge Back',
				frame.ios.controller.interactivePopGestureRecognizer?.enabled === false,
			)
		}

		frame.on('navigatingTo', refuseFrame)
		frame.goBack()
		await wait('native event probe returns to base', () => frame.currentPage === base)
		check('Page lifecycle receives the extra cancel flag', pageFlag)
		check('Frame lifecycle receives the extra cancel flag', frameFlag)
		check('lifecycle cancel flags do not veto engine Back', frame.currentPage === base)
		await checkNativeSwipeEvents(frame, base, check, wait)
	} finally {
		frame.off('navigatingTo', refuseFrame)
		target.off('navigatingFrom', refusePage)
		if (frame.currentPage !== base) {
			const entry = frame.backStack.find((value) => value.resolvedPage === base)
			if (entry) {
				frame.goBack(entry)
				await wait('native event probe cleanup', () => frame.currentPage === base)
			}
		}
	}
}
