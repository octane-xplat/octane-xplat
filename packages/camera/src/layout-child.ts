import type { CameraViewProps } from './props'
import { isIOS } from '@nativescript/core'

/** NativeScript reads layout fields from a child view during parent layout. */
export function layoutChildProps(props: CameraViewProps): Record<string, any> {
	const result: Record<string, any> = {}
	for (const key of [
		'row',
		'col',
		'rowSpan',
		'colSpan',
		'dock',
		'left',
		'top',
		'flexGrow',
		'flexShrink',
		'alignSelf',
		'order',
	] as const) {
		if (props[key] !== undefined) {
			result[key] = props[key]
		}
	}

	return result
}

export function applyEscapeProps(view: any, props: { ios?: any; android?: any }): void {
	if (!view) {
		return
	}

	const bag = isIOS ? props.ios : props.android
	if (bag) {
		Object.assign(view, bag)
	}
}

const nativeRoles: Record<string, string> = {
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
	tab: 'button',
}

export function nativeAccessibilityRole(role?: string): string | undefined {
	return role ? nativeRoles[role] : undefined
}

export function nativeAccessibilityState(
	state?: CameraViewProps['accessibilityState'],
): string | undefined {
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
