/** Candidate-app stub for `packages/ui/src/internal/keyboard/keyboard-overlay-host`
 *  — that module ships .mobile/.windows/.gtk leaves only; the web suffix chain
 *  cannot resolve it. BottomSheet is barrel-reachable but never mounts in the
 *  parity scenarios, so a shape-compatible inert host is sufficient here. */

export function createKeyboardOverlayHost(_panelAlignment: 'bottom' | 'stretch' = 'bottom'): {
	host: unknown
	panel: unknown
	bindKeyboard: () => () => void
} {
	return { host: {}, panel: {}, bindKeyboard: () => () => {} }
}

export const keyboardOverlayAnimation = () => ({
	enterFrom: { opacity: 0, duration: 180 },
	exitTo: { opacity: 0, duration: 140 },
})
