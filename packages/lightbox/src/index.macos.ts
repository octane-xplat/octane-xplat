export type {
	LightboxMedia,
	LightboxMediaType,
	LightboxTapEvent,
	LightboxOptions,
	LightboxProps,
	LightboxRootProps,
	LightboxPartProps,
	LightboxTriggerPartProps,
	LightboxSlidePartProps,
	LightboxImagePartProps,
	LightboxThumbnailPartProps,
	LightboxTriggerProps,
	UseLightboxOptions,
	UseLightboxReturn,
	UseLightboxState,
} from './props'

const PLACEHOLDER = 'support is not implemented yet'

function unsupported(part: string): never {
	throw new Error(`@octane-xplat/lightbox: ${part} ${PLACEHOLDER}`)
}

/** The convenience viewer with the headless parts as statics. */
export const Lightbox = (() => unsupported('Lightbox')) as never
export const Root = (() => unsupported('Root')) as never
export const Trigger = (() => unsupported('Trigger')) as never
export const Popup = (() => unsupported('Popup')) as never
export const Backdrop = (() => unsupported('Backdrop')) as never
export const Viewport = (() => unsupported('Viewport')) as never
export const Slide = (() => unsupported('Slide')) as never
export const Image = (() => unsupported('Image')) as never
export const Close = (() => unsupported('Close')) as never
export const Prev = (() => unsupported('Prev')) as never
export const Next = (() => unsupported('Next')) as never
export const Title = (() => unsupported('Title')) as never
export const Description = (() => unsupported('Description')) as never
export const useLightbox = (): never => unsupported('useLightbox')
export const useLightboxState = (): never => unsupported('useLightboxState')

export const Thumbnails = (() => unsupported('Thumbnails')) as never
export const Thumbnail = (() => unsupported('Thumbnail')) as never
export const ThumbnailIndicator = (() => unsupported('ThumbnailIndicator')) as never
