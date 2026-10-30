/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import './column-resize-handle.macos.css'
import { useCallback, useEffect, useRef, useState } from 'octane'
import { useKeyboard } from '../internal/keyboard/use-keyboard.macos'
import { usePan } from '../components/layout/pan.macos.tsrx'
import type { AppKitColumnResizeState, AppKitResizeScope } from './column-resize-state.macos'

export function AppKitColumnResizeHandle(props: {
	columnKey: string
	label: string
	width: number
	direction: 'ltr' | 'rtl'
	state: AppKitColumnResizeState
}) @{
	const view = useRef<NSView | null>(null),
		latest = useRef(props)

	latest.current = props
	const [measured, setMeasured] = useState(0),
		lastWidth = useRef(0)

	const measure = () => {
		latest.current.state.synchronize()
		const width = Number(view.current?.superview?.bounds.size.width)
		if (Number.isFinite(width) && width > 0 && Math.abs(lastWidth.current - width) > 0.5) {
			lastWidth.current = width
			setMeasured(width)
		}
	}

	const queued = useRef(false),
		alive = useRef(true)

	const queueMeasure = () => {
		if (queued.current) {
			return
		}

		queued.current = true
		void Promise.resolve().then(() => {
			queued.current = false
			if (alive.current && view.current) {
				measure()
			}
		})
	}

	const scope = (): AppKitResizeScope | undefined => {
		const target = view.current,
			current = latest.current,
			window = target?.window,
			direction = current.direction

		if (!target || !window || target.hiddenOrHasHiddenAncestor) {
			return
		}

		return {
			key: current.columnKey,
			view: target,
			width: Number(target.superview?.bounds.size.width ?? current.width),
			direction,
			valid: () =>
				view.current === target &&
				target.window === window &&
				!target.hiddenOrHasHiddenAncestor &&
				latest.current.columnKey === current.columnKey &&
				latest.current.direction === direction,
		}
	}

	const bind = useCallback((target: NSView | null) => {
		if (view.current && view.current !== target) {
			latest.current.state.cancel(view.current)
		}

		view.current = target
		alive.current = target !== null
	}, [])

	const { keyboardProps } = useKeyboard({
		onKeyDown: (event) => {
			if (
				event.defaultPrevented ||
				event.isComposing ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey
			) {
				return
			}

			const current = scope()
			if (current && latest.current.state.key(current, event.key)) {
				event.preventDefault()
				event.stopPropagation()
			}
		},
	})

	const onPan = usePan((event) => {
		const current = scope()
		if (!current) {
			if (view.current) {
				latest.current.state.cancel(view.current)
			}

			return
		}

		if (event.state === 'began') {
			view.current?.window?.makeFirstResponder(view.current)
			latest.current.state.begin(current)
			latest.current.state.move(current, event.dx)
		} else if (event.state === 'moved') {
			latest.current.state.move(current, event.dx)
		} else if (event.state === 'ended') {
			latest.current.state.end(current, event.dx)
		} else {
			latest.current.state.cancel(current.view)
		}
	})

	useEffect(() => {
		const target = view.current,
			parent = target?.superview,
			center = (globalThis as Record<string, any>).NSNotificationCenter?.defaultCenter

		measure()
		if (!target || !parent || !center?.addObserverForNameObjectQueueUsingBlock) {
			return
		}

		parent.postsFrameChangedNotifications = true
		const tokens: unknown[] = []
		let active = true,
			observedWindow = target.window

		try {
			const frame = center.addObserverForNameObjectQueueUsingBlock(
				'NSViewFrameDidChangeNotification',
				parent,
				null,
				() => {
					if (active && view.current === target) {
						queueMeasure()
					}
				},
			)

			if (frame != null) {
				tokens.push(frame)
			}

			const window = center.addObserverForNameObjectQueueUsingBlock(
				'NSWindowDidUpdateNotification',
				null,
				null,
				(note: { object: unknown }) => {
					if (
						active &&
						view.current === target &&
						(note.object === target.window || note.object === observedWindow)
					) {
						observedWindow = target.window
						queueMeasure()
					}
				},
			)

			if (window != null) {
				tokens.push(window)
			}
		} catch {
			console.warn('[macos-table] resize handle geometry observation unavailable')
		}

		return () => {
			active = false
			alive.current = false
			for (const token of tokens) {
				try {
					center.removeObserver(token)
				} catch {
					console.warn('[macos-table] resize observation cleanup failed')
				}
			}

			latest.current.state.cancel(target)
		}
	}, [])

	const range = props.state.limits(),
		width = measured || props.width

	const adjust = (amount: number) => {
		const current = scope()
		return current ? latest.current.state.step(current, amount) : false
	}

	<masonview
		ref={bind}
		className={[
			'vx-table-resize-appkit',
			props.state.active(props.columnKey) && 'vx-table-resize-appkit--active',
		]}
		{...keyboardProps}
		onPan={onPan}
		onLayoutChanged={queueMeasure}
		onTap={() => {
			const target = view.current
			if (target) {
				target.window?.makeFirstResponder(target)
				measure()
			}
		}}
		accessibilityRole="separator"
		accessibilityLabel={`Resize ${props.label}`}
		accessibilityHint="Use Left and Right to resize; Home and End select limits."
		accessibilityValue={String(width)}
		accessibilityValueDescription={`${Math.round(width)} points wide`}
		accessibilityMinValue={range.min}
		accessibilityMaxValue={Number.isFinite(range.max) ? range.max : Number.MAX_SAFE_INTEGER}
		onAccessibilityIncrement={() => adjust(10)}
		onAccessibilityDecrement={() => adjust(-10)}
		style={{
			left: props.direction === 'rtl' ? 0 : undefined,
			right: props.direction === 'ltr' ? 0 : undefined,
		}}
	>
		<masonview className="vx-table-resize-appkit-line" />
	</masonview>
}
