// keyboard-overlay-host — GTK leaf. X11 has no software-keyboard overlay to
// host — the OSK concept doesn't exist on the desktop, so the host/panel are
// inert. BottomSheet only takes this path for `presentation="bottom-sheet"`;
// the shared popover path never touches it. The shape matches the mobile
// leaf so the import resolves and renders stay honest no-ops.
export function createKeyboardOverlayHost(_panelAlignment: 'bottom' | 'stretch' = 'bottom'): { host: any; panel: any; bindKeyboard: () => () => void } {
	return { host: null as any, panel: null as any, bindKeyboard: () => () => {} }
}

/** @internal RootLayout fades its presentation container independently. */
export const keyboardOverlayAnimation = () => ({
	enterFrom: { opacity: 0, duration: 180 },
	exitTo: { opacity: 0, duration: 140 },
})
