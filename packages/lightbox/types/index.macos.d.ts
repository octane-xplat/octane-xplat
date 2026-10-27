import type { UniversalComponent } from 'octane/universal'
import type {
	LightboxMedia,
	LightboxOptions,
	LightboxPartProps,
	LightboxProps,
	LightboxRootProps,
	LightboxSlidePartProps,
	LightboxTapEvent,
	LightboxTriggerPartProps,
	LightboxTriggerProps,
	LightboxImagePartProps,
	UseLightboxOptions,
	UseLightboxReturn,
	UseLightboxState,
} from './props'

export type {
	LightboxPartProps,
	LightboxTriggerPartProps,
	LightboxSlidePartProps,
	LightboxImagePartProps,
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
