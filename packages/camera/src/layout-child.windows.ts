import type { CameraViewProps } from './props'

/** Windows twins of the layout-child helpers — the unsuffixed module
 *  resolves the platform escape bag through `isIOS`, which has no Windows
 *  branch. Pure helpers are re-declared here to keep divergence at the file
 *  boundary. */

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

export function applyEscapeProps(view: any, props: { windows?: any }): void {
	if (view && props.windows) {
		Object.assign(view, props.windows)
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
