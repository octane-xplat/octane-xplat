export type {
	LightboxMedia,
	LightboxMediaType,
	LightboxTapEvent,
	LightboxOptions,
	LightboxProps,
	LightboxRootProps,
	LightboxTriggerProps,
	UseLightboxOptions,
	UseLightboxReturn,
	UseLightboxState,
} from './props'

import { Lightbox as LightboxImpl } from './Lightbox.web.tsrx'
import { Backdrop, Close, Description, Next, Popup, Prev, Root, Slide, Title, Trigger, Viewport } from './root.web.tsrx'
import { Image } from './Image.web.tsrx'

export { useLightbox } from './use-lightbox.web.tsrx'
export { useLightboxState } from './root.web.tsrx'
export { Root, Trigger, Popup, Backdrop, Viewport, Slide, Image, Close, Prev, Next, Title, Description }

/** The convenience viewer with the headless parts as statics —
 *  `Lightbox.Root`, `Lightbox.Trigger`, …. */
export const Lightbox = Object.assign(LightboxImpl, {
	Root,
	Trigger,
	Popup,
	Backdrop,
	Viewport,
	Slide,
	Image,
	Close,
	Prev,
	Next,
	Title,
	Description,
}) as typeof LightboxImpl & {
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