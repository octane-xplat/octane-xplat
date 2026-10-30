/** @jsxImportSource @octane-xplat/jsx */
import './Pager.macos.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import { ScrollableArea, useDirection, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { cx } from '@octane-xplat/lib'
import type { PagerProps } from './props'
import { mergeStyle } from './style-merge'
import { layoutChildProps } from './layout-child'
import { createAppKitPagerState, type AppKitPagerFrame } from './pager-state.macos'
import { createAppKitPagerEvents } from './pager-scroll-events.macos'

/** Experimental NSScrollView paging. Eager page rendering; native input/AX remain unqualified. */
export function Pager(props: PagerProps): unknown @{
	const direction = useDirection(),
		area = useRef<ScrollableAreaHandle | null>(null),
		attached = useRef(false)

	const live = useRef({ props, direction })
	live.current = { props, direction }
	const [size, setSize] = useState({ width: 0, height: 0, page: 0 }),
		previous = useRef(size),
		[, rerender] = useState(0)

	const viewport = () => (area.current?.native ?? null) as Record<string, any> | null
	const frame = (): AppKitPagerFrame | null => {
		const view = viewport(),
			bounds = view?.contentView?.bounds,
			document = view?.documentView

		if (!view?.window || !bounds || !document) {
			return null
		}

		if (
			['hidden', 'hiddenOrHasHiddenAncestor'].some((key) =>
				Boolean(typeof view[key] === 'function' ? view[key]() : view[key]),
			)
		) {
			return null
		}

		const width = Number(bounds.size.width),
			height = Number(bounds.size.height),
			content = Number(document.frame.size.width),
			x = Number(bounds.origin.x)

		if (![width, height, content, x].every(Number.isFinite) || width <= 0 || height <= 0) {
			return null
		}

		const maximum = Math.max(0, content - width),
			physical = Math.max(0, Math.min(maximum, x))

		return {
			view,
			window: view.window,
			width,
			height,
			position: live.current.direction === 'rtl' ? maximum - physical : physical,
			ready: Math.abs(content - live.current.props.items.length * width) <= 1,
		}
	}

	const beforeWrite = useRef<() => void>(() => {}),
		userBusy = useRef<() => boolean>(() => false)

	const control = useMemo(
		() =>
			createAppKitPagerState({
				source: () => ({
					count: live.current.props.items.length,
					page: live.current.props.page,
					defaultPage: live.current.props.defaultPage,
					direction: live.current.direction,
				}),
				frame,
				busy: () => userBusy.current(),
				beforeWrite: () => beforeWrite.current(),
				write: (inline, animated) => {
					const workspace = (globalThis as Record<string, any>).NSWorkspace?.sharedWorkspace,
						value = workspace?.accessibilityDisplayShouldReduceMotion

					const reduced = Boolean(typeof value === 'function' ? value.call(workspace) : value)
					area.current?.scrollToOffset({ inline }, { animated: animated && !reduced })
				},
				report: (page) => {
					try {
						live.current.props.onPageChange?.(page)
					} finally {
						if (attached.current) {
							rerender((n) => n + 1)
						}
					}
				},
			}),
		[],
	)

	const measuring = useRef(false),
		queued = useRef(false)

	const measure = () => {
		if (!area.current || measuring.current) {
			return
		}

		measuring.current = true
		try {
			events.validate()
			const geometry = frame()
			control.synchronize()
			if (!area.current || !geometry) {
				return
			}

			const next = { width: geometry.width, height: geometry.height, page: control.selected() }
			if (
				next.width !== previous.current.width ||
				next.height !== previous.current.height ||
				next.page !== previous.current.page
			) {
				previous.current = next
				setSize(next)
			}
		} catch (error) {
			console.warn('[macos-pager] geometry synchronization failed', error)
		} finally {
			measuring.current = false
		}
	}

	const latestMeasure = useRef(measure)
	latestMeasure.current = measure
	const events = useMemo(
		() =>
			createAppKitPagerEvents({
				view: viewport,
				interaction: control.interacted,
				settle: control.settle,
				measure: () => latestMeasure.current(),
			}),
		[],
	)

	beforeWrite.current = events.cancel
	userBusy.current = events.busy
	const queueMeasure = () => {
		if (!queued.current) {
			queued.current = true
			void Promise.resolve().then(() => {
				queued.current = false
				if (area.current) {
					latestMeasure.current()
				}
			})
		}
	}

	const bind = useCallback((handle: ScrollableAreaHandle | null) => {
		if (area.current !== handle) {
			control.detach()
		}

		area.current = handle
		attached.current = !!handle
		const view = viewport()
		if (view) {
			view.hasHorizontalScroller = false
			view.hasVerticalScroller = false
		}

		events.bind(view)
		if (handle) {
			queueMeasure()
		}
	}, [])

	useLayoutEffect(() => {
		latestMeasure.current()
		queueMeasure()
	}, null)

	useEffect(() => {
		events.bind(viewport())
		return () => {
			attached.current = false
			events.dispose()
			area.current = null
			control.detach()
		}
	}, [])

	const layout = layoutChildProps({ ...props, style: undefined })

	@if (props.items.length) {
		<masonview
			id={props.id}
			className={cx('vx-pager', 'vx-pager--appkit', props.className)}
			style={mergeStyle(layout.style, props.style)}
			onLayoutChanged={queueMeasure}
			accessible={props.accessible}
			accessibilityRole={props.accessibilityRole ?? 'group'}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={
				props.accessibilityValue ?? `Page ${control.selected() + 1} of ${props.items.length}`
			}
			accessibilityState={props.accessibilityState}
			accessibilityLiveRegion={props.accessibilityLiveRegion}
		>
			<ScrollableArea
				ref={bind}
				axis="inline"
				className="vx-pager-viewport"
				style={{ width: '100%', height: '100%' }}
				label={props.accessibilityLabel}
			>
				<masonview
					className="vx-pager-track--appkit"
					onLayoutChanged={queueMeasure}
					style={{
						width: size.width ? size.width * props.items.length : undefined,
						height: size.height || undefined,
						flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
					}}
				>
					@for (const item of props.items; index i; key i) {
						<masonview
							className="vx-pager-page vx-pager-page--appkit"
							accessibilityRole="group"
							accessibilityLabel={`${i + 1} of ${props.items.length}`}
							style={{
								width: size.width || undefined,
								height: size.height || undefined,
								flexBasis: size.width || 'auto',
							}}
						>
							{props.renderItem(item, i)}
						</masonview>
					}
				</masonview>
			</ScrollableArea>
		</masonview>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
