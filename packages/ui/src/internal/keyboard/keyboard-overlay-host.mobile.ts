import { GridLayout } from '@nativescript/core'
import { bindBottomInsetToKeyboard } from './keyboard-inset'

/** RootLayout owns host transforms; keyboard movement owns a separate child,
 * and detents own panel. RootLayout resets transforms even for opacity entrances. */
export function createKeyboardOverlayHost(panelAlignment: 'bottom' | 'stretch' = 'bottom'): {
	host: GridLayout
	panel: GridLayout
	bindKeyboard: () => () => void
} {
	const host = new GridLayout()
	host.horizontalAlignment = 'stretch'
	host.verticalAlignment = 'stretch'
	host.isPassThroughParentEnabled = true
	const keyboardHost = new GridLayout()
	keyboardHost.horizontalAlignment = 'stretch'
	keyboardHost.verticalAlignment = 'stretch'
	keyboardHost.isPassThroughParentEnabled = true
	host.addChild(keyboardHost)
	const panel = new GridLayout()
	panel.horizontalAlignment = 'stretch'
	panel.verticalAlignment = panelAlignment
	keyboardHost.addChild(panel)
	return { host, panel, bindKeyboard: (): (() => void) => bindBottomInsetToKeyboard(keyboardHost) }
}

/** @internal RootLayout fades its presentation container independently. */
export const keyboardOverlayAnimation = () => ({
	enterFrom: { opacity: 0, duration: 180 },
	exitTo: { opacity: 0, duration: 140 },
})
