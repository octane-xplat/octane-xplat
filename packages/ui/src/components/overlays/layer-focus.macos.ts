function flag(view: any, name: string, fallback = false): boolean {
	const value = view?.[name]
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}

function nativeView(target: any): any {
	return target?.native ?? target?.nativeViewProtected ?? target
}

function focusedView(window: any): any {
	const raw = window?.firstResponder,
		delegate = raw?.delegate
	const editor =
		typeof delegate?.currentEditor === 'function'
			? delegate.currentEditor()
			: delegate?.currentEditor
	return delegate?.window === window && editor === raw ? delegate : raw
}

/** Capture a stable owner; an explicit live target restores in its own window. */
export function captureAppKitLayerFocus(
	getTarget?: () => any,
	host?: any,
	native: () => Record<string, any> = () => globalThis,
) {
	const owner =
		nativeView(host)?.window ??
		nativeView(getTarget?.())?.window ??
		native().NSApplication?.sharedApplication?.keyWindow
	const initial = focusedView(owner)
	return () => {
		try {
			const requested = getTarget?.()
			// Explicit custom focus delegates retain caller-owned behavior; unlike a
			// native-backed handle, their attachment cannot be inspected here.
			if (
				typeof requested?.focus === 'function' &&
				!('native' in requested) &&
				!('nativeViewProtected' in requested) &&
				!('window' in requested)
			) {
				requested.focus()
				return
			}

			const target = nativeView(requested ?? initial),
				window = target?.window

			if (!target || !window || (!requested && window !== owner)) {
				return
			}

			if (
				flag(target, 'hidden') ||
				flag(target, 'hiddenOrHasHiddenAncestor') ||
				!flag(target, 'enabled', true) ||
				!flag(target, 'isEnabled', true)
			) {
				return
			}

			if (!flag(target, 'isAccessibilityEnabled', true) && !flag(target, 'canBecomeKeyView')) {
				return
			}

			// Set first responder only; never activate a window or synthesize input.
			window.makeFirstResponder?.(target)
		} catch (error) {
			console.warn('[macos-layer] focus restoration failed', error)
		}
	}
}
