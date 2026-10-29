import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'

/** @internal Neutral counterpart to native transformed-window measurements. */
export function measureKeyboardHost(_host: unknown): KeyboardRect | null {
	return null
}
