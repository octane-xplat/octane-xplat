import { GridLayout } from '@nativescript/core'

/** Windows overlay host; software-keyboard occlusion is not yet integrated. */
export function createKeyboardOverlayHost(panelAlignment: 'bottom' | 'stretch' = 'bottom'): {
	host: GridLayout
	panel: GridLayout
	bindKeyboard: () => () => void
} {
	const host = new GridLayout()
	host.horizontalAlignment = 'stretch'
	host.verticalAlignment = 'stretch'
	host.isPassThroughParentEnabled = true
	const panel = new GridLayout()
	panel.horizontalAlignment = 'stretch'
	panel.verticalAlignment = panelAlignment
	host.addChild(panel)
	return { host, panel, bindKeyboard: () => (): void => {} }
}

/** @internal RootLayout owns the presentation animation. */
export const keyboardOverlayAnimation = () => ({
	enterFrom: { opacity: 0, duration: 180 },
	exitTo: { opacity: 0, duration: 140 },
})
