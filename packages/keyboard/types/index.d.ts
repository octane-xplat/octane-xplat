import type { UniversalComponent } from 'octane/universal'
import type { KeyboardProviderProps } from './props.js'
import type { SoftwareKeyboardController } from './types.js'

export type * from './types.js'
export type * from './props.js'

/** Share native tracking across roots and existing UI keyboard consumers. */
export declare const KeyboardProvider: UniversalComponent<KeyboardProviderProps>
export declare const KeyboardController: SoftwareKeyboardController
