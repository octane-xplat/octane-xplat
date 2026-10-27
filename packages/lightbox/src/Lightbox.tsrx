/** @jsxImportSource @nativescript-community/octane */
// Astryx convenience component: the default anatomy (close, prev/next,
// counter, caption) assembled from the headless parts.
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import type { ClassValue } from '@octane-xplat/ui'
import { cx } from '@octane-xplat/lib'
import type { LightboxProps } from './props'
import { Backdrop, Close, Description, Next, Popup, Prev, Root, Slide, Title, Trigger, useLightboxState, Viewport } from './root.tsrx'
import { Image } from './Image.tsrx'

function DefaultSlide(props: { index: number; hasAutoPlay: boolean }) @{
	const state = useLightboxState()
	const item = state.items[props.index]
	// Native video lands with the platform media leaf; images are the default.
	return <Image src={item?.src} alt={item?.alt} />
}

function Counter() @{
	const state = useLightboxState()
	if (state.count <= 1) return null
	return <label className="vx-lightbox-counter">{`${state.index + 1} of ${state.count}`}</label>
}

function Caption() @{
	const state = useLightboxState()
	const caption = state.item?.caption
	if (caption == null) return null
	return <label className="vx-lightbox-caption">{typeof caption === 'string' ? caption : (caption as never)}</label>
}

function LightboxBase(props: LightboxProps) @{
	return (
		<Root
			media={props.media}
			isOpen={props.isOpen}
			defaultOpen={props.defaultOpen}
			index={props.index}
			defaultIndex={props.defaultIndex}
			onOpenChange={props.onOpenChange}
			onIndexChange={props.onIndexChange}
			maxZoom={props.hasZoom === false ? 1 : props.maxZoom}
			hasWheelZoom={props.hasWheelZoom}
			hasBackdropDismiss={props.hasBackdropDismiss}
			triggerScroll={props.triggerScroll}
			transition={props.transition}
			finalFocusRef={props.finalFocusRef}
		>
			{props.children ?? (
				<>
					<Popup>
						<Backdrop />
						<Viewport>
							{props.media?.map((_, i) => (
								<Slide key={i} index={i}>
									<DefaultSlide index={i} hasAutoPlay={!!props.hasAutoPlay} />
								</Slide>
							))}
						</Viewport>
						<Close className="vx-lightbox-close"><Text>{'×'}</Text></Close>
						<Prev className="vx-lightbox-prev"><Text>{'‹'}</Text></Prev>
						<Next className="vx-lightbox-next"><Text>{'›'}</Text></Next>
						<Counter />
						<Caption />
					</Popup>
				</>
			)}
		</Root>
	)
}

export const Lightbox = Object.assign(LightboxBase, {
	Root, Trigger, Popup, Backdrop, Viewport, Slide, Image, Close, Prev, Next, Title, Description,
}) as typeof LightboxBase & {
	Root: typeof Root
	Trigger: typeof Trigger
	Popup: typeof Popup
	Backdrop: typeof Backdrop
	Viewport: typeof Viewport
	Slide: typeof Slide
	Image: typeof Image
	Close: typeof Close
	Prev: typeof Prev
	Next: typeof Next
	Title: typeof Title
	Description: typeof Description
}
