/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useEffect, useRef } from 'octane'
import type { ToastProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Text } from './Text'

const SWIPE_DISMISS_DIP = 44

/**
 * Toast surface (Astryx `Toast`), native leaf. Auto-hide timer; a
 * horizontal pan drags the card and releases-to-dismiss past the
 * threshold; `accessibilityLiveRegion` announces info politely and errors
 * assertively.
 */
export function Toast(props: ToastProps) @{
	const type = props.type ?? 'info'
	const autoHide = props.isAutoHide ?? type !== 'error'
	const duration = Math.max(0, props.autoHideDuration ?? 5000)
	const el = useRef<any>(null)
	const dismissed = useRef(false)
	const onDismiss = useRef(props.onDismiss)
	onDismiss.current = props.onDismiss

	const dismiss = (reason: 'auto' | 'manual' = 'auto') => {
		if (dismissed.current) {
			return
		}

		dismissed.current = true
		onDismiss.current?.(reason)
	}

	useEffect(() => {
		if (!autoHide) {
			return
		}

		const timer = setTimeout(() => dismiss('auto'), duration)
		return () => clearTimeout(timer)
	}, [autoHide, duration])

	useEffect(() => {
		const view = el.current
		if (!view?.on) {
			return
		}

		let dragging = false
		const onPan = (e: any) => {
			// GTK dispatches pan state as 'began'/'moved'/'ended'/'cancelled'
			// (GestureDrag), with cumulative dx/dy — not GestureStateTypes.
			if (e.state === 'began') {
				dragging = true
			} else if (e.state === 'moved' && dragging) {
				view.translateX = e.dx ?? e.deltaX ?? 0
				view.opacity = Math.max(0.3, 1 - Math.abs(view.translateX) / 160)
			} else if (e.state === 'ended' || e.state === 'cancelled') {
				dragging = false
				if (Math.abs(view.translateX) >= SWIPE_DISMISS_DIP) {
					dismiss('manual')
					return
				}

				// GTK view.animate implements translate definitions only — a
				// combined opacity key throws, so opacity resets directly.
				try {
					view.animate?.({ translate: { x: 0, y: 0 }, duration: 120 })
					view.opacity = 1
				} catch {
					view.translateX = 0
					view.opacity = 1
				}
			}
		}

		view.on('pan', onPan)
		return () => view.off?.('pan', onPan)
	}, [])

	<masonview
		ref={(v: any) => {
			el.current = v
			applyEscapeProps(v, props)
		}}
		id={props.id}
		className={cx(
			'vx-toast',
			`vx-toast--${type}`,
			props.isExiting && 'vx-toast--exiting',
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
	>
		{props.renderContent ? (
			props.renderContent({
				body: props.body,
				endContent: props.endContent,
				type,
				isAutoHide: autoHide,
				autoHideDuration: duration,
				dismiss: () => dismiss('manual'),
			})
		) : (
			<>
				<masonview
					className="vx-toast-body"
					style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}
				>
					{typeof props.body === 'string' ? <Text>{props.body}</Text> : props.body}
				</masonview>
				{props.endContent != null && (
					<masonview className="vx-toast-end" style={{ display: 'flex' }}>
						{props.endContent}
					</masonview>
				)}
			</>
		)}
	</masonview>
}
