import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'

/** Unsupported native contexts retain destination observation. */
export const observeKeyboardMotion: KeyboardWindowSource<KeyboardWindowState> | null = null
