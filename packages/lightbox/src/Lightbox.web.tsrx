/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import { Icon, Pressable, Text } from '@octane-xplat/ui'
import type { ClassValue } from '@octane-xplat/ui'
import { cx } from '@octane-xplat/lib'
import type { LightboxMedia, LightboxProps } from './props'
import { Backdrop, Close, Description, Next, Popup, Prev, Root, Slide, Title, Trigger, useLightboxState, Viewport } from './root.web.tsrx'
import { Image } from './Image.web.tsrx'

const clampIndex = (i: number, count: number) => (count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1))

/** One slide of the default gallery: a video player for video items, the
 *  zoomable image otherwise. */
function DefaultSlide(props: { index: number; hasAutoPlay: boolean }) {
	const state = useLightboxState()
	const item = state.items[props.index]
	if (item?.type === 'video') {
		return (
			<video
				className="vx-lightbox-media vx-lightbox-video"
				src={item.src}
				controls
				autoPlay={props.hasAutoPlay}
				aria-label={item.alt}
				data-lightbox-ignore=""
				style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
			/>
		)
	}
	return <Image />
}

function Counter() {
	const state = useLightboxState()
	if (state.count <= 1) return null
	return (
		<div className="vx-lightbox-counter" aria-live="polite">
			{state.index + 1} of {state.count}
		</div>
	)
}

function Caption() {
	const state = useLightboxState()
	const caption = state.item?.caption
	if (caption == null) return null
	return (
		<div className="vx-lightbox-caption">
			{typeof caption === 'string' ? <Text>{caption}</Text> : (caption as never)}
		</div>
	)
}

/** Full-screen media viewer (Astryx `Lightbox`) — thumbnail morph, swipe
 *  paging, pinch/double-tap zoom, pull to dismiss. Built from the headless
 *  parts also exported as `Lightbox.Root`/`Trigger`/`Popup`/…. */
export function Lightbox(props: LightboxProps) {
	const [internal, setInternal] = useState(props.defaultIndex ?? 0)
	const count = props.media.length
	const index = clampIndex(props.index ?? internal, count)
	return (
		<Root
			media={props.media}
			isOpen={props.isOpen}
			index={props.index}
			defaultIndex={props.defaultIndex}
			onIndexChange={(i: number) => {
				const clamped = clampIndex(i, count)
				if (props.index == null) setInternal(clamped)
				if (clamped !== index) props.onIndexChange?.(clamped)
			}}
			onOpenChange={props.onOpenChange}
			hasZoom={props.hasZoom}
			hasWheelZoom={props.hasWheelZoom}
			hasBackdropDismiss={props.hasBackdropDismiss}
			maxZoom={props.maxZoom}
			triggerScroll={props.triggerScroll}
			transition={props.transition}
			finalFocusRef={props.finalFocusRef}
		>
			<Popup className={cx('vx-lightbox-layer', props.className)} style={props.style as Record<string, unknown>}>
				<Backdrop className="vx-lightbox-backdrop" />
				<Viewport>
					{props.media.map((item: LightboxMedia, i: number) => (
						<Slide key={item.src + i} index={i}>
							<DefaultSlide index={i} hasAutoPlay={props.hasAutoPlay ?? false} />
						</Slide>
					))}
				</Viewport>
				<Close className="vx-lightbox-close">
					<Icon name="xplat-close" />
				</Close>
				{count > 1 ? (
					<>
						<Prev className="vx-lightbox-prev">
							<Icon name="xplat-chevron-left" />
						</Prev>
						<Next className="vx-lightbox-next">
							<Icon name="xplat-chevron-right" />
						</Next>
					</>
				) : null}
				<Counter />
				<Caption />
			</Popup>
		</Root>
	)
}
