/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'octane'
import { Pressable } from '@octane-xplat/ui'
import { cx } from '@octane-xplat/lib'
import './thumbnails.css'
import { useLightboxCtx } from './root.tsrx'
import { createThumbnailLayout } from './thumbnail-layout'
import type { LightboxPartProps, LightboxThumbnailPartProps } from './props'

interface ThumbnailsApi {
	register(index: number, host: any): () => void
	indicator(host: any): () => void
}

const ThumbnailsContext = createContext<ThumbnailsApi | null>(null)
const ThumbnailsProvider = ThumbnailsContext as unknown as (props: {
	value: ThumbnailsApi
	children?: unknown
}) => unknown

function useThumbnails() {
	const api = useContext(ThumbnailsContext)
	if (!api) {
		throw new Error(
			'Lightbox.Thumbnail and Lightbox.ThumbnailIndicator require Lightbox.Thumbnails.',
		)
	}

	return api
}

export function Thumbnails(props: LightboxPartProps): unknown {
	const ctx = useLightboxCtx()
	const ref = useRef<any>(null)
	const row = useRef<any>(null)
	const [layout] = useState(() =>
		createThumbnailLayout<any>({
			measure(host) {
				if (!row.current) {
					return null
				}

				const point = host.getLocationRelativeTo?.(row.current)
				const size = host.getActualSize?.()
				return point && size ? { x: point.x, y: point.y, w: size.width, h: size.height } : null
			},
			place(host, box) {
				// Avoid layout events for unchanged dimensions during a swipe.
				if (host.width !== box.w) {
					host.width = box.w
				}

				if (host.height !== box.h) {
					host.height = box.h
				}

				if (host.translateX !== box.x) {
					host.translateX = box.x
				}

				if (host.translateY !== box.y) {
					host.translateY = box.y
				}
			},
			center(box) {
				const strip = ref.current
				const width = strip?.getActualSize?.().width
				if (!width) {
					return
				}

				const offset = Math.max(
					0,
					Math.min(strip.scrollableWidth ?? Infinity, box.x + box.w / 2 - width / 2),
				)

				if (Math.abs((strip.horizontalOffset ?? 0) - offset) > 0.5) {
					strip.scrollToHorizontalOffset?.(offset, false)
				}
			},
		}),
	)

	const [api] = useState<ThumbnailsApi>(() => ({
		register(index, host) {
			const off = layout.register(index, host)
			host.on?.('layoutChanged', layout.remeasure)
			return () => {
				host.off?.('layoutChanged', layout.remeasure)
				off()
			}
		},
		indicator: layout.indicator,
	}))

	useLayoutEffect(() => {
		const strip = ref.current
		const track = row.current
		strip?.on?.('layoutChanged', layout.remeasure)
		track?.on?.('layoutChanged', layout.remeasure)
		layout.remeasure()
		layout.place(ctx.progress.get())
		const off = ctx.progress.on('change', layout.place)
		return () => {
			off()
			strip?.off?.('layoutChanged', layout.remeasure)
			track?.off?.('layoutChanged', layout.remeasure)
		}
	}, [layout, ctx.progress])

	return (
		<ThumbnailsProvider value={api}>
			<scrollview
				ref={ref}
				orientation="horizontal"
				scrollBarIndicatorVisible={false}
				id={props.id}
				testID={props.testID}
				className={cx('vx-lightbox-thumbnails', props.className)}
				style={props.style}
			>
				<masonview ref={row} className="vx-lightbox-thumbnails-row">
					{props.children}
				</masonview>
			</scrollview>
		</ThumbnailsProvider>
	)
}

export function Thumbnail(props: LightboxThumbnailPartProps): unknown {
	const ctx = useLightboxCtx()
	const api = useThumbnails()
	const ref = useRef<any>(null)
	useLayoutEffect(
		() => (ref.current ? api.register(props.index, ref.current) : undefined),
		[api, props.index],
	)

	return (
		<Pressable
			ref={ref}
			id={props.id}
			testID={props.testID}
			accessibilityLabel={`Show image ${props.index + 1}`}
			accessibilityState={{ selected: ctx.index === props.index }}
			className={cx('vx-lightbox-thumbnail', props.className)}
			style={props.style}
			onPress={() => {
				props.onPress?.(undefined)
				ctx.goTo(props.index)
			}}
		>
			{props.children}
		</Pressable>
	)
}

export function ThumbnailIndicator(props: LightboxPartProps): unknown {
	const api = useThumbnails()
	const ref = useRef<any>(null)
	useLayoutEffect(() => {
		if (!ref.current) {
			return
		}

		ref.current.isUserInteractionEnabled = false
		return api.indicator(ref.current)
	}, [api])

	return (
		<masonview
			ref={ref}
			id={props.id}
			testID={props.testID}
			accessible={false}
			className={cx('vx-lightbox-thumbnail-indicator', props.className)}
			style={props.style}
		>
			{props.children}
		</masonview>
	)
}
