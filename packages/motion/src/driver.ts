import type { DelegatedRequest, DelegatedRun } from './host-types'
import { bezierPoints, isBezierEase } from './engine'
import { delegationStats, trackDelegatedRun } from './delegation'
import type { Target } from './types'

const platform = globalThis as any

function iosRun(node: any, req: DelegatedRequest, write: (t: Target) => void): DelegatedRun | null {
	const view = node.ios ?? node.nativeViewProtected
	if (!view?.layer || !platform.UIViewPropertyAnimator) {
		return null
	}

	const { eff, target, transition: t } = req
	const [x1, y1, x2, y2] = bezierPoints(t.ease)
	const params = platform.UICubicTimingParameters.alloc().initWithControlPoint1ControlPoint2(
		platform.CGPointMake(x1, y1),
		platform.CGPointMake(x2, y2),
	)

	const animator = platform.UIViewPropertyAnimator.alloc().initWithDurationTimingParameters(
		t.duration ?? 0.3,
		params,
	)

	// UIViewPropertyAnimator owns view.transform/alpha presentation; the model
	// props land at the destination immediately, so sample() reads the
	// presentation layer and cancel() syncs the model back before stopping.
	const radians = ((eff.rotate ?? 0) * Math.PI) / 180
	const dest = platform.CGAffineTransformScale(
		platform.CGAffineTransformRotate(
			platform.CGAffineTransformMakeTranslation(eff.x ?? 0, eff.y ?? 0),
			radians,
		),
		eff.scaleX ?? 1,
		eff.scaleY ?? 1,
	)

	const sample = (): Target => {
		const layer = view.layer.presentationLayer?.() ?? view.layer
		const tr = layer.transform
		return {
			opacity: layer.opacity,
			x: tr.m41,
			y: tr.m42,
			scaleX: Math.hypot(tr.m11, tr.m12),
			scaleY: Math.hypot(tr.m21, tr.m22),
			rotate: (Math.atan2(tr.m12, tr.m11) * 180) / Math.PI,
		}
	}

	let resolve!: (result: 'finished' | 'cancelled') => void
	const finished = new Promise<'finished' | 'cancelled'>((done) => {
		resolve = done
	})

	let settled = false
	const settle = (result: 'finished' | 'cancelled') => {
		if (!settled) {
			settled = true
			resolve(result)
		}
	}

	animator.addAnimations(() => {
		if (
			target.x !== undefined ||
			target.y !== undefined ||
			target.rotate !== undefined ||
			target.scale !== undefined ||
			target.scaleX !== undefined ||
			target.scaleY !== undefined
		) {
			view.transform = dest
		}

		if (target.opacity !== undefined) {
			view.alpha = Math.min(1, Math.max(0, eff.opacity))
		}
	})

	animator.addCompletion((position: number) => {
		if (position === 0) {
			write(req.dest)
			settle('finished')
		} else {
			settle('cancelled')
		}
	})

	if (t.delay) {
		animator.startAnimationAfterDelay(t.delay)
	} else {
		animator.startAnimation()
	}

	return {
		finished,
		sample,
		cancel() {
			const current = sample()
			animator.stopAnimation(true)
			write({
				opacity: current.opacity,
				x: current.x,
				y: current.y,
				scaleX: current.scaleX,
				scaleY: current.scaleY,
				rotate: current.rotate,
			})

			settle('cancelled')
		},
	}
}

function androidRun(
	node: any,
	req: DelegatedRequest,
	write: (t: Target) => void,
): DelegatedRun | null {
	const view = node.nativeViewProtected ?? node.android
	const android = platform.android
	const androidx = platform.androidx
	if (
		!view?.animate ||
		!android?.animation ||
		!androidx?.core?.view?.animation?.PathInterpolatorCompat
	) {
		return null
	}

	const { eff, target, transition: t } = req
	const animator = view.animate()
	const [x1, y1, x2, y2] = bezierPoints(t.ease)
	animator.setInterpolator(
		androidx.core.view.animation.PathInterpolatorCompat.create(x1, y1, x2, y2),
	)

	animator.setDuration(Math.round((t.duration ?? 0.3) * 1000))
	animator.setStartDelay(Math.round((t.delay ?? 0) * 1000))
	if (target.x !== undefined) {
		animator.translationX(eff.x)
	}

	if (target.y !== undefined) {
		animator.translationY(eff.y)
	}

	if (target.scale !== undefined || target.scaleX !== undefined) {
		animator.scaleX(eff.scaleX)
	}

	if (target.scale !== undefined || target.scaleY !== undefined) {
		animator.scaleY(eff.scaleY)
	}

	if (target.rotate !== undefined) {
		animator.rotation(eff.rotate)
	}

	if (target.opacity !== undefined) {
		animator.alpha(Math.min(1, Math.max(0, eff.opacity)))
	}

	let resolve!: (result: 'finished' | 'cancelled') => void
	const finished = new Promise<'finished' | 'cancelled'>((done) => {
		resolve = done
	})

	let settled = false
	const settle = (result: 'finished' | 'cancelled') => {
		if (!settled) {
			settled = true
			resolve(result)
		}
	}

	// onAnimationCancel is always followed by onAnimationEnd — track it so the
	// end callback only commits the destination for a run that truly finished.
	let cancelled = false
	animator.setListener(
		new android.animation.Animator.AnimatorListener({
			onAnimationCancel() {
				cancelled = true
				settle('cancelled')
			},
			onAnimationEnd() {
				if (!cancelled) {
					// ViewPropertyAnimator leaves native props at the destination;
					// committing keeps the NativeScript property cache coherent.
					write(req.dest)
				}

				settle(cancelled ? 'cancelled' : 'finished')
			},
			onAnimationStart() {},
			onAnimationRepeat() {},
		}),
	)

	animator.start()

	return {
		finished,
		sample: () => ({
			opacity: view.getAlpha(),
			x: view.getTranslationX(),
			y: view.getTranslationY(),
			scaleX: view.getScaleX(),
			scaleY: view.getScaleY(),
			rotate: view.getRotation(),
		}),
		cancel() {
			animator.cancel()
		},
	}
}

// Platform animators drive the presentation while MotionValues track sampled
// state; interruption stays velocity-exact on the JS engine. Falls back to
// null anywhere the platform object is missing (tests, unknown targets).
export function delegatedRun(
	node: any,
	req: DelegatedRequest,
	write: (t: Target) => void,
): DelegatedRun | null {
	// Dispatch on platform-object presence — no @nativescript/core import, so
	// this module stays loadable in the object-driver test environment. Eases
	// that are not cubic-bezier-expressible stay on the JS engine.
	if (!isBezierEase(req.transition.ease)) {
		delegationStats().fallback++
		return null
	}

	const run =
		node.ios && platform.UIViewPropertyAnimator
			? iosRun(node, req, write)
			: platform.android?.animation && (node.nativeViewProtected ?? node.android)
				? androidRun(node, req, write)
				: null

	if (!run) {
		delegationStats().fallback++
		return null
	}

	return trackDelegatedRun(run)
}
