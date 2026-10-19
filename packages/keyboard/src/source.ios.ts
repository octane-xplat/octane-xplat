import {
	NSObject,
	CADisplayLink,
	NSRunLoop,
	UIView,
	NSLayoutConstraint,
	NSNotificationCenter,
	NSOperationQueue,
} from '@octane-xplat/platform/ios'

import { isKeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { observeKeyboardDestination } from '@octane-xplat/ui/nativescript/keyboard'
import { createKeyboardMotion } from './motion'
import { nextKeyboardPosition } from './prediction'
import { keyboardNativeScope } from './native-scope'

let DisplayTarget: any
const displayTarget = () => {
	if (!DisplayTarget) {
		const interop = (globalThis as any).interop
		DisplayTarget = (NSObject as any).extend(
			{
				['tick:'](this: any, link: any) {
					this.onTick?.(link)
				},
			},
			{ exposedMethods: { 'tick:': { returns: interop.types.void, params: [CADisplayLink] } } },
		)
	}
	return DisplayTarget.new()
}

const rect = (value: any): KeyboardRect => ({
	x: value.origin.x,
	y: value.origin.y,
	width: value.size.width,
	height: value.size.height,
})

/** Own every guide, constraint and display-link target; never mutate a host guide. */
export const observeKeyboardMotion: KeyboardWindowSource<KeyboardWindowState> = (key, publish) => {
	const window = key as any
	const root = window.rootViewController?.view
	if (!root?.keyboardLayoutGuide?.respondsToSelector('setUsesBottomSafeArea:')) {
		return observeKeyboardDestination(key, publish)
	}
	const scope = keyboardNativeScope()
	try {
		const container = UIView.new()
		container.translatesAutoresizingMaskIntoConstraints = false
		container.userInteractionEnabled = false
		container.accessibilityElementsHidden = true
		root.addSubview(container)
		scope.defer(() => container.removeFromSuperview())
		const guide = container.keyboardLayoutGuide
		guide.usesBottomSafeArea = false
		const tracker = UIView.new()
		tracker.translatesAutoresizingMaskIntoConstraints = false
		tracker.userInteractionEnabled = false
		container.addSubview(tracker)
		const constraints = [
			container.leadingAnchor.constraintEqualToAnchor(root.leadingAnchor),
			container.trailingAnchor.constraintEqualToAnchor(root.trailingAnchor),
			container.topAnchor.constraintEqualToAnchor(root.topAnchor),
			container.bottomAnchor.constraintEqualToAnchor(root.bottomAnchor),
			tracker.leadingAnchor.constraintEqualToAnchor(container.leadingAnchor),
			tracker.trailingAnchor.constraintEqualToAnchor(container.trailingAnchor),
			tracker.bottomAnchor.constraintEqualToAnchor(guide.topAnchor),
			tracker.heightAnchor.constraintEqualToConstant(0),
		]

		scope.defer(() => NSLayoutConstraint.deactivateConstraints(constraints))
		NSLayoutConstraint.activateConstraints(constraints)
		root.layoutIfNeeded()
		// A newly constrained view starts at the guide's model destination. It
		// cannot measure a transition that began before it existed. Wait for a
		// native completion and matching presentation before advertising frames.
		let calibrated = false
		let confirmedFrame: KeyboardRect | null = null
		let bootstrapPhase: 'idle' | 'start' = 'idle'
		let coarseKey = ''
		const motion = createKeyboardMotion(
			(state) => {
				if (calibrated) {
					publish(state)
					return
				}
				const key = JSON.stringify([
					state.windowRect,
					state.targetFrame,
					bootstrapPhase,
					state.motion?.transitionId,
				])
				if (key === coarseKey) {
					return
				}
				coarseKey = key
				publish({
					...state,
					source: 'destination',
					currentFrame: null,
					bindingFrame: undefined,
					motion: state.motion && {
						...state.motion,
						phase: bootstrapPhase,
						nativeFrames: false,
						interactive: false,
					},
				})
			},
			{ interactive: true, floating: false },
		)

		let active = true
		scope.defer(() => {
			active = false
		})

		let moving = false
		let settled = 0
		let lastY = NaN
		let lastTimestamp = NaN
		let lastWidth = NaN
		let lastHeight = NaN
		let targetFrame: KeyboardRect | null = null
		const read = (link?: any) => {
			if (!active || container.window !== window) {
				return
			}
			const bounds = rect(window.bounds)
			const current = tracker.layer.presentationLayer()?.frame ?? tracker.frame
			const local = container.convertRectToView(current, window)
			const y = local.origin.y
			const frame = {
				x: bounds.x,
				y,
				width: bounds.width,
				height: Math.max(0, bounds.y + bounds.height - y),
			}
			if (!isKeyboardRect(bounds) || !isKeyboardRect(frame)) {
				return
			}
			const destination = rect(container.convertRectToView(guide.layoutFrame, window))
			if (!targetFrame) {
				targetFrame = destination
			}
			const justCalibrated =
				!calibrated &&
				confirmedFrame !== null &&
				Math.abs(y - confirmedFrame.y) < 0.5 &&
				Math.abs(destination.y - confirmedFrame.y) < 0.5
			if (justCalibrated) {
				calibrated = true
			}
			if (!moving && Number.isFinite(lastY) && Math.abs(lastY - y) > 0.1) {
				motion.begin(targetFrame)
				moving = true
			}
			// Stable reads do not wake consumers at display refresh rate.
			if (
				justCalibrated ||
				moving ||
				!Number.isFinite(lastY) ||
				Math.abs(lastY - y) > 0.01 ||
				lastWidth !== bounds.width ||
				lastHeight !== bounds.height
			) {
				const nextY =
					moving && link
						? nextKeyboardPosition({
								current: y,
								previous: lastY,
								elapsedMs: (link.timestamp - lastTimestamp) * 1000,
								nextMs: (link.targetTimestamp - link.timestamp) * 1000,
								target: targetFrame.y,
								top: bounds.y,
								bottom: bounds.y + bounds.height,
							})
						: y

				motion.measure(bounds, frame, targetFrame, {
					...frame,
					y: nextY,
					height: Math.max(0, bounds.y + bounds.height - nextY),
				})

				if (justCalibrated) {
					motion.end(true)
				}
			}
			if (moving) {
				settled = Math.abs(y - destination.y) < 0.5 && Math.abs(y - lastY) < 0.1 ? settled + 1 : 0
				if (settled >= 2) {
					moving = false
					motion.end()
				}
			}
			lastY = y
			lastTimestamp = link?.timestamp ?? NaN
			lastWidth = bounds.width
			lastHeight = bounds.height
		}

		read()
		const target = displayTarget()
		target.onTick = read
		const link = CADisplayLink.displayLinkWithTargetSelector(target, 'tick:')
		scope.defer(() => {
			target.onTick = undefined
			link.invalidate()
		})

		link.addToRunLoopForMode(NSRunLoop.mainRunLoop, 'kCFRunLoopCommonModes')
		const center = NSNotificationCenter.defaultCenter
		const token = center.addObserverForNameObjectQueueUsingBlock(
			UIKeyboardWillChangeFrameNotification,
			null,
			NSOperationQueue.mainQueue,
			(note: any) => {
				if (!active || (note.object?.coordinateSpace && note.object !== window.screen)) {
					return
				}
				const raw = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey)
				const value = typeof raw?.CGRectValue === 'function' ? raw.CGRectValue() : raw?.CGRectValue
				if (!value) {
					return
				}
				const local = window.screen?.coordinateSpace
					? window.convertRectFromCoordinateSpace(value, window.screen.coordinateSpace)
					: window.convertRectFromWindow(value, null)
				targetFrame = rect(local)
				bootstrapPhase = 'start'
				confirmedFrame = null
				const duration =
					Number(note.userInfo.objectForKey(UIKeyboardAnimationDurationUserInfoKey)) * 1000
				motion.begin(targetFrame, Number.isFinite(duration) ? duration : null)
				moving = true
				settled = 0
			},
		)

		scope.defer(() => center.removeObserver(token))
		const completion = center.addObserverForNameObjectQueueUsingBlock(
			UIKeyboardDidChangeFrameNotification,
			null,
			NSOperationQueue.mainQueue,
			(note: any) => {
				if (
					!active ||
					calibrated ||
					(note.object?.coordinateSpace && note.object !== window.screen)
				) {
					return
				}
				const raw = note.userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey)
				const value = typeof raw?.CGRectValue === 'function' ? raw.CGRectValue() : raw?.CGRectValue
				if (!value) {
					return
				}
				confirmedFrame = rect(
					window.screen?.coordinateSpace
						? window.convertRectFromCoordinateSpace(value, window.screen.coordinateSpace)
						: window.convertRectFromWindow(value, null),
				)
				targetFrame = confirmedFrame
			},
		)

		scope.defer(() => center.removeObserver(completion))
		return () => scope.release()
	} catch (error) {
		try {
			scope.release()
		} catch (cleanup) {
			throw new AggregateError([error, cleanup], 'Keyboard native attachment failed')
		}

		throw error
	}
}
