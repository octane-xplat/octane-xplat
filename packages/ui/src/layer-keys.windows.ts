import { Application } from '@nativescript/core'
import { Microsoft } from '@octane-xplat/platform/windows'

const model = (value: any) => value?.native ?? value
const element = (value: any) => model(value)?.nativeViewProtected ?? model(value)

function active(root: any): boolean {
	if (root?.IsHostVisible !== true) {
		return false
	}
	const input = Microsoft?.UI?.Input
	const id = root.ContentIslandEnvironment?.AppWindowId
	const activated = input?.InputActivationState?.Activated
	return (
		id != null &&
		activated != null &&
		input.InputActivationListener.GetForWindowId(id).State === activated
	)
}

/** Capture the declaring XamlRoot; restoration never activates another window. */
export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	let owner: any
	let initial: any
	try {
		// A supplied but unattached host must not fall back to the primary window.
		const source = host ?? getTarget?.() ?? Application.getRootView?.()
		owner = element(source)?.XamlRoot
		if (owner) {
			// Use the explicit metadata overload: older projections can bind the
			// zero-argument GetFocusedElement even when a root argument is supplied.
			initial = Microsoft?.UI?.Xaml?.Input?.FocusManager.GetFocusedElementWithRoot(owner)
		}
	} catch {
		return () => {}
	}

	return () => {
		try {
			if (!owner || !active(owner)) {
				return
			}

			const currentOwner = element(host)?.XamlRoot
			if (currentOwner && currentOwner !== owner) {
				return
			}

			const target = getTarget?.()
			if (model(target)?.isLoaded === false || model(target)?.isEnabled === false) {
				return
			}

			const native = target ? element(target) : initial
			const programmatic = Microsoft?.UI?.Xaml?.FocusState?.Programmatic
			if (
				native?.XamlRoot === owner &&
				native.IsLoaded !== false &&
				native.IsEnabled !== false &&
				typeof native.Focus === 'function' &&
				programmatic != null
			) {
				native.Focus(programmatic)
			}
		} catch {
			// Removed windows, missing projection and failed focus remain best effort.
		}
	}
}
