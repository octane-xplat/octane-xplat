export type {
	LightboxMedia,
	LightboxMediaType,
	LightboxTapEvent,
	LightboxOptions,
	LightboxPartProps,
	LightboxProps,
	LightboxRootProps,
	LightboxTriggerPartProps,
	LightboxSlidePartProps,
	LightboxThumbnailPartProps,
	LightboxImagePartProps,
	LightboxTriggerProps,
	UseLightboxOptions,
	UseLightboxReturn,
	UseLightboxState,
} from './props'

export { Lightbox } from './Lightbox.tsrx'
export { useLightbox } from './use-lightbox.tsrx'
export {
	Root,
	Trigger,
	Popup,
	Backdrop,
	Viewport,
	Slide,
	Close,
	Prev,
	Next,
	Title,
	Description,
	useLightboxState,
} from './root.tsrx'
export { Image } from './Image.tsrx'

export { Thumbnails, Thumbnail, ThumbnailIndicator } from './thumbnails.tsrx'
