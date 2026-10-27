import type { UniversalComponent } from 'octane/universal'
import type {
	ClassValue,
	HostElement,
	LightboxMedia,
	LightboxOptions,
	LightboxProps,
	LightboxRootProps,
	LightboxTapEvent,
	LightboxTriggerProps,
	Renderable,
	StyleProp,
	UseLightboxOptions,
	UseLightboxReturn,
	UseLightboxState,
} from './props'

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

/** Props shared by the visual layer parts. */
export interface LightboxPartProps {
	children?: Renderable
	className?: ClassValue
	style?: StyleProp
}
export interface LightboxTriggerPartProps extends LightboxPartProps {
	index: number
}
export interface LightboxSlidePartProps extends LightboxPartProps {
	index: number
	onTap?: (event: LightboxTapEvent) => void
}
export interface LightboxImagePartProps extends LightboxPartProps {
	src?: string
	alt?: string
	srcSet?: string
	sizes?: string
}

export declare const Root: UniversalComponent<LightboxRootProps>
export declare const Trigger: UniversalComponent<LightboxTriggerPartProps>
export declare const Popup: UniversalComponent<LightboxPartProps>
export declare const Backdrop: UniversalComponent<LightboxPartProps>
export declare const Viewport: UniversalComponent<LightboxPartProps>
export declare const Slide: UniversalComponent<LightboxSlidePartProps>
export declare const Image: UniversalComponent<LightboxImagePartProps>
export declare const Close: UniversalComponent<LightboxPartProps>
export declare const Prev: UniversalComponent<LightboxPartProps>
export declare const Next: UniversalComponent<LightboxPartProps>
export declare const Title: UniversalComponent<LightboxPartProps>
export declare const Description: UniversalComponent<LightboxPartProps>

declare const LightboxBase: UniversalComponent<LightboxProps>
/** The convenience viewer with the headless parts as statics. */
export declare const Lightbox: typeof LightboxBase & {
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

export declare function useLightbox(options: UseLightboxOptions): UseLightboxReturn
export declare function useLightboxState<T extends LightboxMedia = LightboxMedia>(): UseLightboxState<T>
