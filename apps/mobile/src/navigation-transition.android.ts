import { FadeTransition } from '@nativescript/core'
import { nativeMotion } from './navigation-motion'
class FixtureTransition extends FadeTransition {
	override createAndroidAnimator(type: string): any {
		const animator = super.createAndroidAnimator(type)
		nativeMotion.events.push('android-created:' + type)
		animator.addListener(
			new android.animation.Animator.AnimatorListener({
				onAnimationStart() {
					nativeMotion.events.push('android-start:' + type)
				},
				onAnimationEnd() {
					nativeMotion.events.push('android-end:' + type)
				},
				onAnimationCancel() {
					nativeMotion.events.push('android-cancel:' + type)
				},
				onAnimationRepeat() {},
			}),
		)
		return animator
	}
}

export function createFixtureTransition() {
	return new FixtureTransition(100)
}
