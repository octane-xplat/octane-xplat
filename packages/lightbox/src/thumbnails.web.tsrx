/** @jsxImportSource @octane-xplat/jsx/dom */
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import './thumbnails.web.css'
import { useLightboxCtx } from './root.web.tsrx'
import { createThumbnailLayout } from './thumbnail-layout'
import type { LightboxPartProps, LightboxThumbnailPartProps } from './props'

interface ThumbnailsApi {
	register(index: number, host: HTMLElement): () => void
	indicator(host: HTMLElement): () => void
}
const ThumbnailsContext = createContext<ThumbnailsApi | null>(null)


function useThumbnails() {
	const api = useContext(ThumbnailsContext)
	if (!api) {throw new Error('Lightbox.Thumbnail and Lightbox.ThumbnailIndicator require Lightbox.Thumbnails.')}
	return api
}

export function Thumbnails(props: LightboxPartProps) {
	const ctx = useLightboxCtx()
	const ref = useRef<HTMLDivElement | null>(null)
	const observer = useRef<ResizeObserver | null>(null)
	const [layout] = useState(() => createThumbnailLayout<HTMLElement>({
		measure(host) {
			const strip = ref.current
			if (!strip) {return null}
			const a = host.getBoundingClientRect()
			const b = strip.getBoundingClientRect()
			return { x: a.left - b.left - strip.clientLeft + strip.scrollLeft, y: a.top - b.top - strip.clientTop + strip.scrollTop, w: a.width, h: a.height }
		},
		place(host, box) {
			host.style.transform = `translate(${box.x}px, ${box.y}px)`
			host.style.width = `${box.w}px`
			host.style.height = `${box.h}px`
		},
		center(box) {
			if (ref.current) {ref.current.scrollLeft = box.x + box.w / 2 - ref.current.clientWidth / 2}
		},
	}))
	const [api] = useState<ThumbnailsApi>(() => ({
		register(index, host) {
			const off = layout.register(index, host)
			observer.current?.observe(host)
			return () => { observer.current?.unobserve(host); off() }
		},
		indicator: layout.indicator,
	}))
	useLayoutEffect(() => {
		const strip = ref.current
		if (!strip) {return}
		const resize = () => layout.remeasure()
		if (typeof ResizeObserver !== 'undefined') {
			observer.current = new ResizeObserver(resize)
			observer.current.observe(strip)
			for (const host of strip.querySelectorAll<HTMLElement>('[data-lightbox-thumbnail]')) {observer.current.observe(host)}
		}
		strip.addEventListener('load', resize, true)
		window.addEventListener('resize', resize)
		layout.remeasure()
		layout.place(ctx.progress.get())
		const off = ctx.progress.on('change', layout.place)
		return () => {
			off()
			observer.current?.disconnect()
			observer.current = null
			strip.removeEventListener('load', resize, true)
			window.removeEventListener('resize', resize)
		}
	}, [layout, ctx.progress])
	return <ThumbnailsContext value={api}>
		<div ref={ref} id={props.id} data-testid={props.testID} className={cx('vx-lightbox-thumbnails', props.className)} style={props.style}>{props.children as never}</div>
	</ThumbnailsContext>
}

export function Thumbnail(props: LightboxThumbnailPartProps) {
	const ctx = useLightboxCtx()
	const api = useThumbnails()
	const ref = useRef<HTMLButtonElement | null>(null)
	useLayoutEffect(() => ref.current ? api.register(props.index, ref.current) : undefined, [api, props.index])
	return <button ref={ref} type="button" id={props.id} data-testid={props.testID} data-lightbox-thumbnail=""
		aria-label={`Show image ${props.index + 1}`} aria-current={ctx.index === props.index || undefined}
		className={cx('vx-lightbox-thumbnail', props.className)} style={props.style}
		onClick={(event: MouseEvent) => { props.onPress?.(event); if (!event.defaultPrevented) ctx.goTo(props.index) }}>
		{props.children as never}
	</button>
}

export function ThumbnailIndicator(props: LightboxPartProps) {
	const api = useThumbnails()
	const ref = useRef<HTMLDivElement | null>(null)
	useLayoutEffect(() => ref.current ? api.indicator(ref.current) : undefined, [api])
	return <div ref={ref} id={props.id} data-testid={props.testID} aria-hidden="true"
		className={cx('vx-lightbox-thumbnail-indicator', props.className)} style={props.style}>{props.children as never}</div>
}
