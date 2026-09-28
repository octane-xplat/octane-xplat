import { isAndroid, isIOS } from '@nativescript/core'
import type { Role } from './props'

/** Apply only the active device's escape bag after the primitive's own props. */
export function applyEscapeProps(view: any, props: { ios?: any; android?: any }): void {
	if (!view) {
		return
	}

	const bag = isIOS ? props.ios : isAndroid ? props.android : undefined
	if (bag) {
		Object.assign(view, bag)
	}
}

const NATIVE_ACCESSIBILITY_ROLES: Record<Role, string> = {
	button: 'button',
	link: 'link',
	search: 'search',
	image: 'image',
	heading: 'header',
	adjustable: 'adjustable',
	summary: 'summary',
	text: 'text',
	none: 'none',
	progressbar: 'progressBar',
	checkbox: 'checkbox',
	switch: 'switch',
	radio: 'radioButton',
	spinbutton: 'spinButton',
	// NativeScript has no tab role; a tab is still an actionable button and
	// its selected state is carried separately by accessibilityState.
	tab: 'button',
}

/** Translate the shared/ARIA spelling to NativeScript's narrower role enum. */
export function nativeAccessibilityRole(role?: Role): string | undefined {
	return role ? NATIVE_ACCESSIBILITY_ROLES[role] : undefined
}

/** NativeScript's AccessibilityState is a single enum value, unlike the
 *  web's independent ARIA booleans. Priority follows the strongest state. */
export function nativeAccessibilityState(state?: {
	disabled?: boolean
	selected?: boolean
	checked?: boolean
}): string | undefined {
	if (state?.disabled) {
		return 'disabled'
	}

	if (state?.selected) {
		return 'selected'
	}

	if (state?.checked === true) {
		return 'checked'
	}

	if (state?.checked === false) {
		return 'unchecked'
	}

	return undefined
}
