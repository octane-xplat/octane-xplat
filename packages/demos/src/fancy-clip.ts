/** Clip a marquee viewport to its bounds on native. The shared style
 *  contract is overflow-visible: iOS `clipsToBounds` defaults false and xplat
 *  restores that contract on Android by unclipping each ViewGroup on
 *  `loaded` (see escape-props). Registering our own `loaded` listener after
 *  the escape-props ref runs re-enables the platform clip for the one
 *  container that needs it; the immediate call covers refs attaching after
 *  load. Web clips with CSS overflow — the `.web` leaf is a no-op. */
export function clipMarquee(view: any): void {
	const apply = () => {
		if (view?.ios) {
			view.ios.clipsToBounds = true
		}

		const android = view?.android
		if (typeof android?.setClipChildren === 'function') {
			android.setClipChildren(true)
			android.setClipToPadding(true)
		}
	}

	view?.on?.('loaded', apply)
	apply()
}
