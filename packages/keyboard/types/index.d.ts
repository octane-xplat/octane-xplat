import type { UniversalComponent } from 'octane/universal'
import type { KeyboardProviderProps } from './props.js'
import type { SoftwareKeyboardController } from './types.js'
import type { FocusedInputService } from './focus-types.js'

export type * from './types.js'
export type * from './props.js'
export type * from './focus-types.js'

/** Share native tracking across roots and existing UI keyboard consumers. */
export declare const KeyboardProvider: UniversalComponent<KeyboardProviderProps>
export declare const KeyboardController: SoftwareKeyboardController
/** Focus/selection geometry without collecting text contents. */
export declare const FocusedInputController: FocusedInputService

export type * from './scroll-types.js'
export declare const KeyboardScrollController: import('./scroll-types.js').KeyboardScrollService
export declare const KeyboardAwareScrollView: UniversalComponent<
	import('./props.js').KeyboardAwareScrollViewProps
>

export declare const KeyboardStickyView: UniversalComponent<
	import('./props.js').KeyboardStickyViewProps
>
