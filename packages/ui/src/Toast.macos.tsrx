/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useEffect, useRef } from 'octane'
import type { ToastProps, ToastContentRenderProps } from './props'
import { cx } from './cx'
import { Button } from './controls.macos.tsrx'
import { toastTiming } from './toast-store'

/** Timed notification card shared by inline and presented stacks. */
export function Toast(props: ToastProps) @{
	const timing = toastTiming(props)
	const onDismiss = useRef(props.onDismiss)
	onDismiss.current = props.onDismiss
	const view = useRef<any>(null)
	const dismissed = useRef(false)
	const dismiss = useCallback((reason: 'auto' | 'manual') => {
		if (dismissed.current) return
		dismissed.current = true
		onDismiss.current?.(reason)
	}, [])

	useEffect(() => {
		if (!timing.isAutoHide || props.isExiting) return
		let remaining = timing.autoHideDuration
		let last = Date.now()
		let hovered = false
		let timer: ReturnType<typeof setTimeout>
		const focused = () => {
			const responder = view.current?.window?.firstResponder
			for (const start of [responder, responder?.delegate]) {
				for (let current = start; current; current = current.superview) {
					if (current === view.current || current.isEqual?.(view.current)) return true
				}
			}

			return false
		}

		let paused = false
		const tick = () => {
			const now = Date.now()
			if (!paused) remaining -= now - last
			last = now
			paused = hovered || focused()
			if (remaining <= 0 && !paused) { dismiss('auto'); return }
			timer = setTimeout(tick, paused ? 100 : Math.min(100, Math.max(0, remaining)))
		}

		const detach = (globalThis as any).__xplatAppKit?.observeHover?.(view.current, {
			enter: () => { hovered = true }, exit: () => { hovered = false },
		})

		timer = setTimeout(tick, Math.min(100, remaining))
		return () => { clearTimeout(timer); detach?.() }
	}, [timing.isAutoHide, timing.autoHideDuration, props.isExiting, dismiss])

	const content: ToastContentRenderProps = {
		body: props.body, endContent: props.endContent, type: props.type ?? 'info', ...timing,
		dismiss: () => dismiss('manual'),
	}

	<flexboxlayout flexDirection="row" alignItems="center" id={props.id} ref={view}
		className={cx('vx-toast', props.type === 'error' && 'vx-toast--error', props.className)}
		style={{ opacity: props.isExiting ? 0 : 1, ...props.style }}>
		{props.renderContent ? props.renderContent(content) : (
			<flexboxlayout flexDirection="column" flexGrow={1} className="vx-toast-content">
				{typeof props.body === 'string' ? <label whiteSpace="normal">{props.body}</label> : props.body}
				{props.endContent}
			</flexboxlayout>
		)}
		{props.onDismiss != null && <Button accessibilityLabel="Dismiss notification" onPress={() => dismiss('manual')}>×</Button>}
	</flexboxlayout>
}
